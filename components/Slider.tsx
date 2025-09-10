
import React from 'react';

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({ id, label, min, max, value, onChange, unit }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-sm font-medium text-bunker-600 dark:text-bunker-300 whitespace-nowrap">{label}</label>
      <div className="flex items-center gap-2 w-full">
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className="w-full h-2 bg-bunker-200 rounded-lg appearance-none cursor-pointer dark:bg-bunker-700"
        />
        <span className="text-sm font-mono text-bunker-500 dark:text-bunker-400 w-12 text-center">{value}{unit}</span>
      </div>
    </div>
  );
};
