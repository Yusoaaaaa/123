
export interface ImageAsset {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GenerationResult {
  imageUrl?: string;
  text?: string;
}

export const PRESETS = [
  "studio",
  "runway",
  "bedroom",
  "nightclub",
  "aesthetic",
  "cyber",
  "school"
];

export const POSES = [
  "keep same pose",
  "standing",
  "turn left 30°",
  "turn right 30°",
  "fashion pose 1",
  "fashion pose 2"
] as const;

export type PoseOption = typeof POSES[number];

export const CAMERA_VIEWS = [
  "front view",
  "30° turned left",
  "30° turned right",
  "top-down view",
  "low angle view",
  "selfie angle",
  "studio lookbook angle",
  "half-body shot",
  "full-body shot"
] as const;

export type CameraViewOption = typeof CAMERA_VIEWS[number];

export const ASPECT_RATIOS = [
  "Original",
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9"
] as const;

export type AspectRatioOption = typeof ASPECT_RATIOS[number];

export const REFERENCE_TYPES = [
  "Pose",
  "Camera Angle",
  "Background",
  "Lighting",
  "Fashion Style",
  "Accessories"
] as const;

export type ReferenceType = typeof REFERENCE_TYPES[number];

export type Language = 'en' | 'vi';

export const STYLE_PRESETS = [
  "Realistic shop product fashion photo",
  "High-end fashion studio lookbook",
  "Cinematic film still with soft film grain",
  "Professional portrait photography with bokeh",
  "High quality anime cel shading",
  "Vintage 90s aesthetic",
  "Cyberpunk neon lighting",
  "Soft pastel dreamcore"
];

export enum AppMode {
  Standard = 'Standard',
  Professional = 'Professional',
  Creative = 'Creative'
}
