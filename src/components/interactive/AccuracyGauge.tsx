import React, { useMemo } from 'react';

interface AccuracyGaugeProps {
  score: number; // 0 to 100
  size?: number;
}

export const AccuracyGauge: React.FC<AccuracyGaugeProps> = ({ score = 0, size = 180 }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth - 16) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  // Generate 24 calibrated precision ticks around the gauge
  const ticks = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 360) / 24;
      const isMajor = i % 6 === 0;
      const tickRadiusOuter = radius + strokeWidth / 2 + 5;
      const tickRadiusInner = tickRadiusOuter - (isMajor ? 4 : 2);
      const rad = (angle * Math.PI) / 180;

      const x1 = center + tickRadiusInner * Math.cos(rad);
      const y1 = center + tickRadiusInner * Math.sin(rad);
      const x2 = center + tickRadiusOuter * Math.cos(rad);
      const y2 = center + tickRadiusOuter * Math.sin(rad);

      const isActive = (i / 24) * 100 <= score;

      return { x1, y1, x2, y2, isMajor, isActive };
    });
  }, [center, radius, strokeWidth, score]);

  const statusInfo = useMemo(() => {
    if (score >= 95) return { text: 'High Confidence', color: '#00E676', bg: 'rgba(0, 230, 118, 0.12)', border: 'rgba(0, 230, 118, 0.3)' };
    if (score >= 80) return { text: 'Optimal Match', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    if (score >= 50) return { text: 'Moderate Confidence', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
    if (score > 0) return { text: 'Low Confidence', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
    return { text: 'Awaiting Scan', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.12)', border: 'rgba(156, 163, 175, 0.25)' };
  }, [score]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Precision Circular Instrument */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
          <defs>
            {/* Emerald to Cyan Gradient */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E676" />
              <stop offset="60%" stopColor="#00C853" />
              <stop offset="100%" stopColor="#00B0FF" />
            </linearGradient>

            {/* Glowing Drop Shadow Filter */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Calibration Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius + strokeWidth / 2 + 7}
            stroke="#E5E7EB"
            strokeWidth="1"
            fill="transparent"
            strokeDasharray="2 4"
            className="opacity-70"
          />

          {/* Calibrated Radial Ticks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isActive ? '#00C853' : '#D1D5DB'}
              strokeWidth={t.isMajor ? 1.5 : 1}
              strokeLinecap="round"
              className="transition-colors duration-500"
            />
          ))}

          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Inner Inset Track Border */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            stroke="#E5E7EB"
            strokeWidth="1"
            fill="transparent"
          />

          {/* Active Glowing Gradient Arc */}
          {score > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              filter="url(#gaugeGlow)"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Inner Accent Core Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 - 4}
            stroke="#F9FAFB"
            strokeWidth="1"
            fill="#FFFFFF"
            className="shadow-xs"
          />
        </svg>

        {/* Center Display Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline justify-center">
            <span className="font-display font-extrabold text-[28px] text-zinc-900 tracking-tight leading-none">
              {score.toFixed(1)}
            </span>
            <span className="font-display font-bold text-[14px] text-zinc-500 ml-1">
              %
            </span>
          </div>

          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 mt-1">
            AI Precision
          </span>
        </div>
      </div>

      {/* Dynamic Status Badge Below Gauge */}
      <div 
        className="mt-1 px-3 py-1 rounded-full flex items-center gap-1.5 border transition-all duration-300 shadow-2xs"
        style={{ backgroundColor: statusInfo.bg, borderColor: statusInfo.border }}
      >
        <span 
          className="w-2 h-2 rounded-full animate-pulse" 
          style={{ backgroundColor: statusInfo.color }}
        />
        <span 
          className="text-[11.5px] font-semibold tracking-wide"
          style={{ color: statusInfo.color === '#9CA3AF' ? '#6B7280' : statusInfo.color }}
        >
          {statusInfo.text}
        </span>
      </div>
    </div>
  );
};
