import React from 'react';
import { AppMode } from '../types';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  labels: Record<AppMode, string>;
  descriptions: Record<AppMode, string>;
  titleLabel: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  currentMode, 
  onModeChange,
  labels,
  descriptions,
  titleLabel
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">{titleLabel}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(Object.values(AppMode) as AppMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`
              px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200
              ${currentMode === mode 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}
            `}
          >
            {labels[mode]}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {descriptions[currentMode]}
      </p>
    </div>
  );
};