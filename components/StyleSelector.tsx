
import React from 'react';

interface StyleSelectorProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
  titleLabel: string;
  placeholder: string;
  presetsTitle: string;
  presets: string[];
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  currentStyle, 
  onStyleChange,
  titleLabel,
  placeholder,
  presetsTitle,
  presets
}) => {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-slate-300">{titleLabel}</label>
      
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{presetsTitle}</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => onStyleChange(preset)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 text-left
                ${currentStyle === preset 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30' 
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'}
              `}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={currentStyle}
        onChange={(e) => onStyleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm p-3 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[80px] resize-y bg-slate-950 text-slate-200 placeholder-slate-600"
      />
    </div>
  );
};