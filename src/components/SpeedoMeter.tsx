import React from 'react';

interface SpeedoMeterProps {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  unit?: string;
}

export const SpeedoMeter: React.FC<SpeedoMeterProps> = ({ value, maxValue, label, color, unit = '' }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const angle = (percentage / 100) * 180 - 90;

  const getColorByPercentage = () => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const needleColor = color || getColorByPercentage();

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="33%" stopColor="#f59e0b" />
              <stop offset="66%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />

          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={`url(#gradient-${label})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
          />

          <circle cx="100" cy="90" r="8" fill="#374151" />

          <line
            x1="100"
            y1="90"
            x2="100"
            y2="30"
            stroke={needleColor}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle} 100 90)`}
            style={{ transition: 'transform 1s ease-out' }}
          />

          <circle cx="100" cy="90" r="6" fill={needleColor} />
        </svg>

        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: needleColor }}>
              {value}{unit}
            </div>
            <div className="text-xs text-gray-500">of {maxValue}{unit}</div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">{percentage.toFixed(0)}% Performance</div>
      </div>
    </div>
  );
};
