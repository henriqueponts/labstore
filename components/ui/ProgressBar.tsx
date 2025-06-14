
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  colorClass?: string; // Tailwind background color class, e.g., 'bg-blue-500'
  heightClass?: string; // Tailwind height class, e.g., 'h-2'
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  colorClass = 'bg-unifafibe_blue',
  heightClass = 'h-2.5',
  label
}) => {
  const validProgress = Math.min(100, Math.max(0, progress));

  return (
    <div>
      {label && <p className="text-sm text-unifafibe_gray-dark mb-1">{label} ({validProgress}%)</p>}
      <div className={`w-full bg-unifafibe_gray-light rounded-full ${heightClass} dark:bg-gray-700`}>
        <div
          className={`${colorClass} ${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${validProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
