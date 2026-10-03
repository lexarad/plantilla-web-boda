import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning";

const toneColors: Record<Tone, { stroke: string; text: string; trail: string }> = {
  primary: { stroke: "stroke-primary", text: "text-primary", trail: "stroke-primary/15" },
  success: { stroke: "stroke-success", text: "text-success", trail: "stroke-success/20" },
  warning: { stroke: "stroke-warning", text: "text-warning", trail: "stroke-warning/20" }
};

export function ProgressRing({
  value,
  total,
  label,
  sublabel,
  tone = "primary",
  size = 96,
  thickness = 8,
  className
}: {
  value: number;
  total: number;
  label?: string;
  sublabel?: string;
  tone?: Tone;
  size?: number;
  thickness?: number;
  className?: string;
}) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.max(0, Math.min(Math.round((value / safeTotal) * 100), 100));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const colors = toneColors[tone];

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            className={colors.trail}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-700 ease-out", colors.stroke)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-display text-2xl leading-none tabular-nums", colors.text)}>{pct}%</span>
          {sublabel ? <span className="mt-1 text-[10px] font-medium text-muted-foreground">{sublabel}</span> : null}
        </div>
      </div>
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      ) : null}
    </div>
  );
}
