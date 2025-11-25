import React, { useCallback } from 'react';
import { ImageAsset } from '../types';

interface ImageUploadProps {
  label: string;
  image: ImageAsset | null;
  onImageChange: (image: ImageAsset | null) => void;
  required?: boolean;
  dragDropText: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, image, onImageChange, required, dragDropText }) => {
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,") to get raw base64
      const base64Data = base64String.split(',')[1];
      
      onImageChange({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  }, [onImageChange]);

  const handleRemove = useCallback(() => {
    onImageChange(null);
  }, [onImageChange]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      
      {!image ? (
        <div className="relative group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-900 transition-colors group-hover:border-indigo-500 group-hover:bg-slate-800 min-h-[160px]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-500 mb-2 group-hover:text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm text-slate-400 group-hover:text-indigo-300 text-center">
              {dragDropText}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-sm bg-slate-900 aspect-[3/4] group">
          <img 
            src={image.previewUrl} 
            alt={label} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={handleRemove}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform hover:scale-110 shadow-lg"
              title="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};