import { cn } from "@/lib/utils";

type Slice = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({
  data,
  size = 180,
  thickness = 28,
  centerLabel,
  centerValue,
  className
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <div className={cn("inline-flex items-center justify-center text-sm text-muted-foreground", className)}>
        Sin datos
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={thickness} className="stroke-muted/40" />
        {data.map((slice, index) => {
          const fraction = slice.value / total;
          const length = fraction * circumference;
          const offset = -cumulative;
          cumulative += length;
          return (
            <circle
              key={slice.label + index}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              strokeWidth={thickness}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ stroke: slice.color }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerValue ? (
          <span className="font-display text-2xl leading-none">{centerValue}</span>
        ) : null}
        {centerLabel ? (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {centerLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
