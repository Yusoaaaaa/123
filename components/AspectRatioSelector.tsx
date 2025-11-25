import React from 'react';
import { AspectRatioOption, ASPECT_RATIOS } from '../types';

interface AspectRatioSelectorProps {
  currentRatio: AspectRatioOption;
  onRatioChange: (ratio: AspectRatioOption) => void;
  titleLabel: string;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ 
  currentRatio, 
  onRatioChange, 
  titleLabel 
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300">{titleLabel}</label>
      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio}
            onClick={() => onRatioChange(ratio)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium border transition-all
              ${currentRatio === ratio
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'}
            `}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
};