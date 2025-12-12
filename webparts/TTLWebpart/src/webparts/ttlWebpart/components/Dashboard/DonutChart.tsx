import * as React from "react";

export interface DonutChartProps {
  total: number;
  available: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const DonutChart: React.FC<DonutChartProps> = ({
  total,
  available,
  size = 120,
  strokeWidth = 12,
  label,
}) => {
  const targetPercent = Math.min(100, Math.round((available / total) * 100));

  const [animatedPercent, setAnimatedPercent] = React.useState(0);
  const prevPercentRef = React.useRef(0);

  React.useEffect(() => {
    const start = prevPercentRef.current;
    const end = targetPercent;
    const duration = 600;
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const value = start + (end - start) * progress;
      setAnimatedPercent(Math.round(value));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevPercentRef.current = targetPercent;
  }, [targetPercent]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (animatedPercent / 100) * circumference;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle
            r={radius}
            fill="transparent"
            stroke="#eee"
            strokeWidth={strokeWidth}
          />
          <circle
            r={radius}
            fill="transparent"
            stroke="#2f8183"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform="rotate(-90)"
          />
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontWeight: 700,
          fontSize: size * 0.14,
        }}
      >
        {animatedPercent}%
      </div>
    </div>
  );
};

export default DonutChart;
