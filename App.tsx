
import React, { useState, useCallback } from 'react';
import { ImageAsset, PoseOption, AspectRatioOption, CameraViewOption, PRESETS, Language, ReferenceType, REFERENCE_TYPES, STYLE_PRESETS } from './types';
import { TRANSLATIONS } from './constants/translations';
import { ImageUpload } from './components/ImageUpload';
import { StyleSelector } from './components/StyleSelector';
import { PoseSelector } from './components/PoseSelector';
import { CameraViewSelector } from './components/CameraViewSelector';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { ZoomableImage } from './components/ZoomableImage';
import { generateTryOn } from './services/geminiService';

export const App: React.FC = () => {
  // Localization
  const [lang, setLang] = useState<Language>('vi'); // Default to VI based on context
  const t = TRANSLATIONS[lang];

  // Inputs
  const [modelImage, setModelImage] = useState<ImageAsset | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageAsset | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<ImageAsset | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageAsset | null>(null);
  
  // Settings
  const [style, setStyle] = useState<string>("Realistic shop product fashion photo");
  const [pose, setPose] = useState<PoseOption>("keep same pose");
  const [cameraView, setCameraView] = useState<CameraViewOption>("front view");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("Original");
  const [referenceType, setReferenceType] = useState<ReferenceType>("Pose");
  
  // Text Inputs
  const [customInstruction, setCustomInstruction] = useState("");
  const [clothingDescription, setClothingDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  // State (History based)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Zoom State
  const [isZoomed, setIsZoomed] = useState(false);

  // Derived state
  const currentImage = historyIndex >= 0 ? history[historyIndex] : null;

  const handleGenerate = async () => {
    if (!modelImage) {
      setError(lang === 'vi' ? "Vui lòng tải lên ảnh người mẫu." : "Please upload a model photo.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateTryOn(
        modelImage,
        clothingImage,
        style,
        pose,
        cameraView,
        aspectRatio,
        customInstruction,
        clothingDescription,
        backgroundImage,
        selectedPreset,
        referenceImage,
        referenceType
      );
      
      if (result) {
        setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          return [...newHistory, result];
        });
        setHistoryIndex(prev => prev + 1);
      } else {
        setError(lang === 'vi' ? "Không thể tạo ảnh. Vui lòng thử lại." : "Failed to generate image. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || (lang === 'vi' ? "Đã xảy ra lỗi không mong muốn." : "An unexpected error occurred."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = useCallback(() => {
    setModelImage(null);
    setClothingImage(null);
    setBackgroundImage(null);
    setReferenceImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setSelectedPreset(null);
    setCustomInstruction("");
    setClothingDescription("");
    setPose("keep same pose");
    setCameraView("front view");
    setAspectRatio("Original");
    setReferenceType("Pose");
    setStyle("Realistic shop product fashion photo");
    setIsZoomed(false);
  }, []);

  const handleUndo = useCallback(() => {
    if (!isGenerating && historyIndex > -1) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex, isGenerating]);

  const handleRedo = useCallback(() => {
    if (!isGenerating && historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length, isGenerating]);

  // Use the result as the new model image
  const handleUseAsModel = useCallback(() => {
    if (!currentImage) return;

    try {
      // Convert base64 string to Blob/File logic
      // currentImage format is "data:image/png;base64,....."
      const arr = currentImage.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return;
      
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      const file = new File([u8arr], `generated-look-${Date.now()}.png`, { type: mime });
      const newImageAsset: ImageAsset = {
        file,
        previewUrl: currentImage, // Data URL works as preview URL
        base64: arr[1], // Raw base64 part
        mimeType: mime
      };

      setModelImage(newImageAsset);
      // Optional: Clear clothing image if users want to start fresh with new model
      // setClothingImage(null); 
    } catch (e) {
      console.error("Failed to convert image", e);
      setError(lang === 'vi' ? "Lỗi khi chuyển đổi ảnh." : "Failed to process image.");
    }
  }, [currentImage, lang]);


  const handlePresetChange = (preset: string) => {
    if (selectedPreset === preset) {
      setSelectedPreset(null);
    } else {
      setSelectedPreset(preset);
      setBackgroundImage(null);
    }
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'vi' : 'en');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Zoom Modal Overlay */}
      {isZoomed && currentImage && (
        <ZoomableImage 
          src={currentImage} 
          alt="Generated Look" 
          onClose={() => setIsZoomed(false)}
          zoomHint={t.zoomHint}
        />
      )}

      {/* Header - Compact */}
      <header className="bg-slate-900 border-b border-slate-800 h-14 flex-none z-50">
        <div className="w-full h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              N
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              {t.appTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {lang === 'en' ? '🇺🇸 EN' : '🇻🇳 VI'}
            </button>
            <button 
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white font-medium px-2 py-1"
            >
              {t.newProject}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Inputs & Settings (Scrollable) */}
        <div className="w-[450px] flex-none bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* Composition Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                {t.composition}
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <ImageUpload 
                  label={t.modelLabel} 
                  image={modelImage} 
                  onImageChange={setModelImage} 
                  dragDropText={t.upload.clickOrDrop}
                  required 
                />
                <div className="flex flex-col gap-2">
                  <ImageUpload 
                    label={t.clothingLabel} 
                    image={clothingImage} 
                    onImageChange={setClothingImage} 
                    dragDropText={t.upload.clickOrDrop}
                    // Not required anymore
                  />
                </div>
              </div>
              
              {/* Clothing Description Field */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  {t.clothingDescLabel}
                </label>
                <input 
                  type="text"
                  value={clothingDescription}
                  onChange={(e) => setClothingDescription(e.target.value)}
                  placeholder={t.clothingDescPlaceholder}
                  className="w-full text-xs p-2.5 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-900 text-slate-200 placeholder-slate-600"
                />
              </div>

              <div className="p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
                 <p className="text-[11px] leading-relaxed text-indigo-300">
                   <strong>Tip:</strong> {lang === 'vi' ? 'Bạn có thể tải lên ảnh người mẫu đang mặc trang phục bạn muốn. AI sẽ tự động tách trang phục đó ra.' : 'You can upload a photo of a model wearing the outfit you want. The AI will automatically extract just the clothing.'}
                 </p>
              </div>

              {/* Background and Reference Section */}
              <div className="pt-2 space-y-4">
                {/* Background */}
                <div>
                  <ImageUpload 
                    label={t.backgroundLabel} 
                    image={backgroundImage} 
                    onImageChange={(img) => {
                      setBackgroundImage(img);
                      if (img) setSelectedPreset(null);
                    }} 
                    dragDropText={t.upload.clickOrDrop}
                  />
                  
                  <div className="mt-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t.backgroundPresets}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESETS.map(preset => (
                        <button
                          key={preset}
                          onClick={() => handlePresetChange(preset)}
                          className={`
                            text-[11px] px-2.5 py-1 rounded-full border transition-colors capitalize
                            ${selectedPreset === preset 
                              ? 'bg-indigo-600 text-white border-indigo-600' 
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'}
                          `}
                          disabled={!!backgroundImage}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Reference Image */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300">{t.referenceLabel}</label>
                  </div>
                  
                  <ImageUpload 
                    label="" 
                    image={referenceImage} 
                    onImageChange={setReferenceImage} 
                    dragDropText={t.upload.clickOrDrop}
                  />

                  {referenceImage && (
                    <div className="mt-2">
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        {t.referenceTypeLabel}
                      </label>
                      <select
                        value={referenceType}
                        onChange={(e) => setReferenceType(e.target.value as ReferenceType)}
                        className="w-full text-xs p-2.5 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-900 text-slate-200"
                      >
                        {REFERENCE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {t.referenceTypes?.[type] || type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-5 pt-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                {t.fineTuning}
              </h2>

              <StyleSelector
                currentStyle={style}
                onStyleChange={setStyle}
                titleLabel={t.imageStyle}
                placeholder={t.imageStylePlaceholder}
                presetsTitle={t.stylePresets}
                presets={STYLE_PRESETS}
              />
              
              <PoseSelector 
                currentPose={pose} 
                onPoseChange={setPose} 
                labels={t.poses}
                titleLabel={t.targetPose}
                helperText={t.poseHelp}
              />

              <CameraViewSelector 
                currentView={cameraView} 
                onViewChange={setCameraView} 
                labels={t.cameraViews}
                titleLabel={t.cameraView}
                helperText={t.cameraViewHelp}
              />

              <AspectRatioSelector 
                currentRatio={aspectRatio}
                onRatioChange={setAspectRatio}
                titleLabel={t.aspectRatio}
              />

              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-2">
                  {t.customInstructions}
                </label>
                <textarea
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder={t.customInstructionsPlaceholder}
                  className="w-full text-sm p-3 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[80px] resize-y bg-slate-950 text-slate-200 placeholder-slate-600"
                />
              </div>
            </div>
          </div>
          
          {/* Sticky Generate Button */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
             <div className="mb-2">
                 <p className="text-xs text-center text-slate-500">
                   {modelImage 
                     ? <span className="text-emerald-500 font-medium flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t.readyToGenerate}</span> 
                     : t.uploadToContinue}
                 </p>
             </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !modelImage}
              className={`
                w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                ${isGenerating || !modelImage
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 hover:shadow-xl border border-transparent'}
              `}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.processing}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.003c-.384.297-.791.575-1.227.825l-2.518 1.438c-.732.418-1.662-.058-1.734-.9l-.097-1.112c-.028-.315-.178-.602-.42-.813l-1.096-.953c-.668-.581-.505-1.663.295-2.007l2.245-.962c.292-.125.506-.382.562-.694l.276-1.546c.144-.809 1.137-1.1 1.668-.488l1.014 1.168c.21.242.513.38.833.38h2.268c.88 0 1.356 1.028.786 1.697l-1.18 1.385c-.2.235-.265.553-.176.85l.5 1.67c.25.835-.587 1.596-1.365 1.24l-1.984-.907a1.125 1.125 0 00-1.367.32l-2.364 3.04a.75.75 0 01-1.136.054l-1.84-1.84a.75.75 0 01.054-1.136l3.04-2.364a1.125 1.125 0 00.32-1.367l-.907-1.985c-.356-.777.406-1.614 1.24-1.364l1.67.5c.296.088.615.023.85-.177l1.385-1.18c.67-.57 1.697-.094 1.697.786v2.268c0 .32.138.623.38.833l1.168 1.014c.612.53.321 1.524-.488 1.668l-1.546.276c-.312.056-.569.27-.694.562l-.962 2.245c-.344.801-1.426.964-2.007.296l-.953-1.096a1.125 1.125 0 00-.813-.42l-1.112-.097c-.842-.072-1.318-1.002-.9-1.734l1.438-2.518a3.738 3.738 0 00.825-1.227z" clipRule="evenodd" />
                  </svg>
                  {t.generateLook}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Stage: Output Display */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-8 border-l border-slate-800">
          
          {/* Canvas Area */}
          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-[1400px]">
            
             {/* History Controls (Floating) */}
             {history.length > 0 && (
                <div className="absolute top-0 right-0 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full border border-slate-700 shadow-xl transition-all">
                  <button 
                    onClick={handleUndo}
                    disabled={historyIndex < 0 || isGenerating}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title={t.undo}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <span className="text-sm font-semibold text-slate-300 px-2 min-w-[3.5rem] text-center tabular-nums select-none">
                    {historyIndex > -1 ? historyIndex + 1 : 0} / {history.length}
                  </span>

                  <button 
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1 || isGenerating}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title={t.redo}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

            {/* Error Message */}
            {error && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-900/50 text-red-200 px-6 py-4 rounded-xl text-sm border border-red-800 z-50 animate-fade-in shadow-xl max-w-lg w-full text-center backdrop-blur-md">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 font-bold text-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    {t.error}
                  </div>
                  <p className="opacity-90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Display Logic */}
            {!currentImage && !isGenerating && (
              <div className="text-center p-12 max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800">
                <div className="w-20 h-20 bg-slate-800 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{t.readyToCreate}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {t.readyToCreateDesc}
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center z-40 rounded-3xl">
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-indigo-400 font-bold mt-6 text-xl animate-pulse">{t.designingLook}</p>
                <p className="text-slate-400 text-sm mt-2 font-medium">{t.applyingSettings}</p>
              </div>
            )}

            {currentImage && (
              <div className="w-full h-full flex items-center justify-center relative group">
                <img 
                  src={currentImage} 
                  alt="Generated Look" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-in border border-slate-800"
                  onClick={() => setIsZoomed(true)}
                />
                
                {/* Controls Overlay */}
                <div className="absolute bottom-6 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 border border-slate-700 shadow-xl">
                   <button
                      onClick={() => setIsZoomed(true)}
                      className="text-slate-200 hover:text-indigo-300 transition-colors p-2"
                      title={t.zoomIn}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                      </svg>
                   </button>
                   
                   <div className="w-px h-4 bg-slate-600"></div>

                   <button
                      onClick={handleUseAsModel}
                      className="text-slate-200 hover:text-indigo-300 transition-colors p-2 flex items-center gap-1.5 font-medium text-sm"
                      title={t.useAsModel}
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      {t.useAsModel}
                   </button>

                   <div className="w-px h-4 bg-slate-600"></div>
                   
                   <a 
                      href={currentImage} 
                      download={`nano-lookbook-output-${historyIndex + 1}.png`}
                      className="text-slate-200 font-medium text-sm flex items-center gap-2 hover:text-indigo-300 transition-colors py-2 pr-2"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      {t.downloadImage}
                   </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
