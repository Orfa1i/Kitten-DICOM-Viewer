import React from 'react';

interface AccuracyGaugeProps {
  score: number; // e.g. 98.6
  size?: number;
}

export const AccuracyGauge: React.FC<AccuracyGaugeProps> = ({ score = 98.6, size = 170 }) => {
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active Vibrant Green Progress Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#00BF63"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        {/* Inner Border Line */}
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth / 2}
          stroke="#1F1F1F"
          strokeWidth="1.5"
          fill="transparent"
        />
        {/* Outer Border Line */}
        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2}
          stroke="#1F1F1F"
          strokeWidth="1.5"
          fill="transparent"
        />
      </svg>

      {/* Center Accuracy Percentage Typography */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="font-display font-extrabold text-[24px] text-zinc-900 tracking-tight">
          {score.toFixed(1)} %
        </span>
      </div>

      {/* Right Notch / Marker Line as seen in screenshot */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[3px] bg-white rounded-full z-10"
        style={{ right: strokeWidth / 4 }}
      />
    </div>
  );
};
