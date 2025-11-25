
import { GoogleGenAI } from "@google/genai";
import { ImageAsset, PoseOption, AspectRatioOption, CameraViewOption, ReferenceType } from '../types';

const BASE_PROMPT = `
You are an AI Virtual Try-On and Fashion Image Generator.

Inputs:
1) Model image (required) – identity and base pose.
2) Clothing image – may contain one or multiple outfits.
3) Optional: user_clothing_selection (text describing which clothing item in the Clothing image to use).
4) Optional: background (image or preset).
5) Optional: pose / camera / reference images.
6) Optional: accessories request.
7) Optional: STYLE REQUEST (text), describing the desired image style:
   {style_request}

GLOBAL RULES (ALWAYS):
- Preserve the model's exact identity: same face, facial features, hairstyle, makeup, skin tone and body proportions.
- Preserve the model's pose unless a clear pose change or pose reference is provided.
- Keep anatomy realistic: no extra limbs, no warped shoulders, chest, neck or arms.
- Preserve the original aspect ratio and framing of the model image as much as possible. Do NOT zoom into the face or crop out body parts.
- Never use identity, pose or background from the Clothing image.

CLOTHING SELECTION:
- The Clothing image may contain multiple outfits.
- Use ONLY the item described by {user_clothing_selection}. If this text is empty, choose the most centered and most visible item.
- Do NOT mix elements from different garments.
- Do NOT invent a brand new outfit. Clothing must come strictly from the Clothing image.

CLOTHING FITTING:
- Attach the garment to shoulders, torso and arms following correct anatomy.
- Sleeves must wrap the upper arm and forearm naturally. Do NOT fuse sleeves into the torso or armpit.
- If sleeve placement cannot be inferred confidently, automatically convert the garment to a clean sleeveless version instead of generating distorted sleeves.
- Replace the model's original top with the selected clothing item instead of merging them.

ACCESSORIES (OPTIONAL):
- Add accessories only if requested (e.g. cat ears, choker, earrings, bracelets, rings, lace gloves, glasses).
- Integrate accessories with correct attachment points (earlobe, neck, hair) and realistic shadows.
- Do NOT let accessories deform the face or body.
- If an accessory would cause artifacts, silently skip it.

ACCESSORIES CONTROL (OPTIONAL):
The user may request accessories using text or reference images.
Accessories include: earrings, necklaces, chokers, bracelets, rings, belts, hair pins, cat ears, bunny ears, horns, glasses, colored contact lenses, beauty marks, body chains, stockings, thigh straps, lace gloves, and similar fashion add-ons.

Rules:
- Accessories must NOT override the model's identity. 
- Do NOT change the model's body shape, face shape, or ear shape.
- Do NOT generate accessories that replace or cover the face unnaturally.
- When adding accessories, integrate them naturally with realistic lighting and shadows.
- Earrings must attach to the ear lobe. Do NOT attach earrings to hair or cheeks.
- Necklaces / chokers must sit correctly around the neck without merging into the skin.
- Hair accessories must follow the hair flow and direction.
- If a reference image is provided, copy only the accessory style — NOT the face, hairstyle, lighting, or identity of the reference person.
- Do NOT add random accessories unless specifically requested.

FAIL-SAFE FOR ACCESSORIES:
If the accessory placement would cause distortion, ignore that accessory automatically rather than producing artifacts.

BACKGROUND & CAMERA:
- If no background is provided → keep the original.
- If a background image/preset is given → replace the background cleanly.
- If camera view is specified (front, selfie, beauty close-up, etc.), adjust only the perspective and framing, without changing the pose or face orientation unless explicitly requested.

STYLE CONTROL:
The user style request is:
{style_request}

Generate a hyper-realistic fashion photo of the model wearing the selected clothing.

ADAPTIVE RULES  
Automatically analyze the input model image and adapt to its environment:
- If selfie: maintain selfie perspective, natural arm position, and camera distance.
- If studio portrait: maintain studio framing, soft background, and controlled shadows.
- If full body photo: retain proportions and pose without distortion.
- If sitting or non-standard pose: keep pose exactly, fit clothing naturally to body posture.

REALISM TARGET  
85–90% realism — real but aesthetically enhanced.
Skin realism with visible pores, soft uneven tones, micro-shadows around eyes, nose, lips and jawline.  
NO plastic smoothness, NO porcelain doll effect, NO airbrush beauty filter.

EYES  
Natural look with irregular highlights, mild moisture, and emotional nuance.
No overly glossy, glassy, or perfect anime eyes.

CLOTHING RENDER  
Extract only the garment from the clothing image if it contains a person.
Remove the clothing model's face, hair, accessories and hands.
Match the lighting, shadows, sharpness, contrast, color temperature, and noise of the outfit to the model's environment.
Add realistic fabric tension, folds, and contact shadows around shoulders, underarms, chest and waist.

LIGHTING  
Read lighting direction from the input model image and replicate it on the outfit.
If unclear, use soft indoor lighting with mild falloff and natural shadows.
No HDR or cinematic highlight that exposes AI artifacts.

TEXTURE & SHARPNESS  
Match skin, hair and fabric resolutions to avoid mismatches.
If any part looks too sharp or too smooth compared to the rest of the image, reduce sharpening by 5–10% and add mild natural grain.

BACKGROUND ADAPTATION  
If a background image is provided, integrate lighting and color tones consistently.
If no background is provided, reuse original background of the model image.

FAILSAFE  
If realism drops or the image looks synthetic, automatically:
- increase micro-shadow contrast,
- add faint surface grain,
- soften high-sharp edges at 2%,
- reinforce tactile texture of fabric and hair.

Overall goal: the output must look like a real photographed image, not an AI render.

CRITICAL QUALITY STANDARDS:
- ANATOMY CHECK: Ensure exactly 2 arms, 5 fingers per hand. NO extra limbs.
- SKIN CHECK: Skin must look real, with pores and texture. NO plastic smoothness.
- CLOTHING CHECK: Do not merge clothing into skin. Edges must be distinct.
- ARTIFACT CHECK: NO melting, NO blurring, NO watercolor effect.

OUTPUT:
- Produce exactly ONE final high-resolution image.
- Prioritize in this order if conflicts happen:
  1) Identity
  2) Pose
  3) Anatomy
  4) Clothing correctness
  5) Background
  6) Lighting
  7) Style
`;

export const generateTryOn = async (
  modelImage: ImageAsset,
  clothingImage: ImageAsset | null,
  style: string,
  pose: PoseOption,
  cameraView: CameraViewOption,
  aspectRatio: AspectRatioOption,
  customInstruction: string,
  clothingDescription: string,
  backgroundImage?: ImageAsset | null,
  backgroundPreset?: string | null,
  referenceImage?: ImageAsset | null,
  referenceType?: ReferenceType
): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct the specific instruction based on user selection
    const clothingSelectionText = clothingDescription && clothingDescription.trim().length > 0 
      ? clothingDescription 
      : "the most prominent and central clothing item";

    const styleRequestText = style && style.trim().length > 0
      ? style
      : "Realistic high-quality fashion photography";

    let prompt = BASE_PROMPT
      .replace("{user_clothing_selection}", clothingSelectionText)
      .replace("{style_request}", styleRequestText);

    prompt += `\nConfiguration:\n`;
    prompt += `- Pose: ${pose}\n`;
    prompt += `- Camera View: ${cameraView}\n`;
    
    // Handle Aspect Ratio logic in prompt
    if (aspectRatio === "Original") {
      prompt += `- Aspect Ratio: Preserve the original aspect ratio and framing of the Model Photo. No zoom, no crop, no stretch.\n`;
    } else {
      prompt += `- Aspect Ratio: Generate the image in ${aspectRatio} aspect ratio. Adjust framing naturally to fit.\n`;
    }

    if (customInstruction && customInstruction.trim().length > 0) {
      prompt += `- Additional Custom User Instructions: ${customInstruction}\n`;
    }

    // Dynamic Image Indexing
    let imageIndex = 1;
    let backgroundIndex = -1;
    let referenceIndex = -1;

    prompt += `\nInput Images:\n`;
    prompt += `${imageIndex}. Model Photo (Reference for identity and pose)\n`;
    imageIndex++;

    if (clothingImage) {
      prompt += `${imageIndex}. Clothing Photo (Item to wear)\n`;
      imageIndex++;
    } else {
      prompt += `- Clothing: No clothing reference photo provided. `;
      if (clothingDescription && clothingDescription.trim().length > 0) {
        prompt += `Generate clothing based on description: "${clothingDescription}".\n`;
      } else {
        prompt += `Keep the original clothing from the Model Photo or improve its rendering based on style.\n`;
      }
    }

    if (backgroundImage) {
      backgroundIndex = imageIndex;
      prompt += `${imageIndex}. Background Photo\n`;
      imageIndex++;
      prompt += `- Background: Use the provided background image (Image ${backgroundIndex}). Replace the original background cleanly.\n`;
    } else if (backgroundPreset) {
      prompt += `- Background: Use the '${backgroundPreset}' background preset.\n`;
    } else {
      prompt += `- Background: Keep the original background from the model photo.\n`;
    }

    if (referenceImage && referenceType) {
      referenceIndex = imageIndex;
      prompt += `${imageIndex}. Reference Photo (${referenceType})\n`;
      imageIndex++;
      prompt += `- Reference Image Provided (Image ${referenceIndex}): Use this image specifically as a ${referenceType.toUpperCase()} REFERENCE.\n`;
      prompt += `  Follow the global rules for reference images strictly.\n`;
    }

    const parts: any[] = [
      { text: prompt }, // Placeholder, prompt will be updated at the end
      {
        inlineData: {
          mimeType: modelImage.mimeType,
          data: modelImage.base64,
        },
      },
    ];

    if (clothingImage) {
      parts.push({
        inlineData: {
          mimeType: clothingImage.mimeType,
          data: clothingImage.base64,
        },
      });
    }

    if (backgroundImage) {
      parts.push({
        inlineData: {
          mimeType: backgroundImage.mimeType,
          data: backgroundImage.base64,
        },
      });
    }

    if (referenceImage) {
      parts.push({
        inlineData: {
          mimeType: referenceImage.mimeType,
          data: referenceImage.base64,
        },
      });
    }

    // Recency bias enforcement
    prompt += `\nFINAL QUALITY CHECK BEFORE GENERATION:\n`;
    prompt += `- Check hands: 5 fingers per hand.\n`;
    prompt += `- Check face: Must be identical to Model Photo.\n`;
    
    if (clothingImage) {
      prompt += `- Check clothing: Only use the item described as "${clothingSelectionText}". IGNORE the person in the clothing photo.\n`;
      prompt += `\nCLOTHING IMAGE INTERPRETATION (MANDATORY)\n`;
      prompt += `The Clothing slot may contain a photo of a person wearing the desired outfit.\n`;
      prompt += `In this case, DO NOT reuse the person, face, hair, skin, body shape, pose or background from the Clothing image.\n`;
      prompt += `Extract ONLY the outfit (dress/top) from the Clothing image and apply it to the Model.\n`;
      prompt += `If the Clothing image contains a full-body model, treat that person as a mannequin only. Ignore their face, hair, skin and background completely.\n`;
      prompt += `Never replace the identity or background of the Model with anything from the Clothing image.\n`;
    }

    prompt += `\nPlease generate the final image now.`;
    
    // Update the text part with the full constructed prompt
    parts[0] = { text: prompt };

    // Prepare config
    const config: any = {};
    if (aspectRatio !== "Original") {
      config.imageConfig = {
        aspectRatio: aspectRatio
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: config
    });

    // Parse response for image
    if (response.candidates) {
      const candidate = response.candidates[0];
      
      // Safety Check Logic
      if (candidate.finishReason === 'SAFETY') {
         throw new Error("The generation was blocked by safety filters. Please try a different prompt or image.");
      }
      if (candidate.finishReason === 'RECITATION') {
         throw new Error("The generation was blocked due to recitation/copyright concerns.");
      }

      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    // If no image found, check text for error or description
    if (response.text) {
      console.warn("Model returned text instead of image:", response.text);
      throw new Error(`The model returned text instead of an image. This usually means it refused the request: "${response.text}"`);
    }

    throw new Error("No image generated. The response was empty.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Propagate the specific error message if available
    if (error.message) {
        throw error;
    }
    throw new Error("An unexpected connection error occurred.");
  }
};
