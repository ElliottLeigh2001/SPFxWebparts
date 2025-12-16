import * as React from "react";
import budgetStyles from "./Budgets.module.scss";

export interface DonutChartProps {
  total: number;
  available: number;
  pending: number;
  size?: number;
  strokeWidth?: number;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

const DonutChart: React.FC<DonutChartProps> = ({
  total,
  available,
  pending,
  size = 120,
  strokeWidth = 12,
}) => {
  // Percentages
  const greenPercent = clamp((pending / total) * 100);
  const orangePercent = clamp(
    ((available - pending) / total) * 100
  );
  const greyPercent = clamp(
    ((total - available) / total) * 100
  );

  // Animation
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const duration = 700;
    const start = performance.now();

    const animate = (time: number) => {
      const p = clamp((time - start) / duration);
      setProgress(p);

      if (p < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [greenPercent, orangePercent, greyPercent]);

  // SVG math
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const greenDash = (greenPercent / 100) * circumference * progress;
  const orangeDash = (orangePercent / 100) * circumference * progress;
  const greyDash = (greyPercent / 100) * circumference * progress;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size}>
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
          <circle
            r={radius}
            fill="transparent"
            stroke="#e5e5e5"
            strokeWidth={strokeWidth}
            strokeDasharray={`${greyDash} ${circumference}`}
            strokeDashoffset={-(greenDash + orangeDash)}
          />

          <circle
            r={radius}
            fill="transparent"
            stroke="#50bec0ff"
            strokeWidth={strokeWidth}
            strokeDasharray={`${orangeDash} ${circumference}`}
            strokeDashoffset={-greenDash}
          />

          <circle
            r={radius}
            fill="transparent"
            stroke="#2f8183"
            strokeWidth={strokeWidth}
            strokeDasharray={`${greenDash} ${circumference}`}
          />
        </g>
      </svg>

      {pending !== available && (
      <div
        className={budgetStyles.donutPercentageAvailable}
      >
        {Math.round((available / total) * 100)}%
      </div>
      )}
        <div
        className={`${pending === available ? budgetStyles.donutPercentagePendingLarge : budgetStyles.donutPercentagePending}`}
        >
          {Math.round((pending / total) * 100)}%
        </div>
    </div>
  );
};

export default DonutChart;
