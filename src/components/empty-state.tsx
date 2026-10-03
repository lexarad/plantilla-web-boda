import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text: string;
}

export function EmptyState({ icon: Icon, title, text }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-border/60 bg-card/60">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 scale-150 rounded-full bg-primary/6 blur-xl" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-6" />
          </div>
        </div>
        <h3 className="font-display text-2xl text-foreground/80">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
