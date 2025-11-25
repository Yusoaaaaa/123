import React from 'react';
import { CameraViewOption, CAMERA_VIEWS } from '../types';

interface CameraViewSelectorProps {
  currentView: CameraViewOption;
  onViewChange: (view: CameraViewOption) => void;
  labels: Record<string, string>;
  titleLabel: string;
  helperText: string;
}

export const CameraViewSelector: React.FC<CameraViewSelectorProps> = ({ 
  currentView, 
  onViewChange, 
  labels,
  titleLabel,
  helperText 
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300">{titleLabel}</label>
      <div className="relative">
        <select
          value={currentView}
          onChange={(e) => onViewChange(e.target.value as CameraViewOption)}
          className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        >
          {CAMERA_VIEWS.map((view) => (
            <option key={view} value={view}>
              {labels[view] || view}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {helperText}
      </p>
    </div>
  );
};