import { cn } from "@/lib/utils";

const palette = [
  { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-200" },
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-200" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700", ring: "ring-fuchsia-200" },
  { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200" }
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(name: string, surname?: string) {
  const a = name?.trim()?.[0] ?? "";
  const b = surname?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "·";
}

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base"
};

export function Avatar({
  name,
  surname,
  size = "md",
  className,
  showRing = false
}: {
  name: string;
  surname?: string;
  size?: Size;
  className?: string;
  showRing?: boolean;
}) {
  const key = `${name}${surname ?? ""}`;
  const color = palette[hash(key) % palette.length];
  const initials = getInitials(name, surname);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide",
        color.bg,
        color.text,
        sizeClass[size],
        showRing && `ring-2 ring-offset-2 ring-offset-background ${color.ring}`,
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
