import React from 'react';
import { PoseOption, POSES } from '../types';

interface PoseSelectorProps {
  currentPose: PoseOption;
  onPoseChange: (pose: PoseOption) => void;
  labels: Record<string, string>;
  titleLabel: string;
  helperText: string;
}

export const PoseSelector: React.FC<PoseSelectorProps> = ({ 
  currentPose, 
  onPoseChange, 
  labels,
  titleLabel,
  helperText 
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300">{titleLabel}</label>
      <div className="relative">
        <select
          value={currentPose}
          onChange={(e) => onPoseChange(e.target.value as PoseOption)}
          className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        >
          {POSES.map((pose) => (
            <option key={pose} value={pose}>
              {labels[pose] || pose}
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