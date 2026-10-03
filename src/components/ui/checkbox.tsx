import * as React from "react";
import { cn } from "@/lib/utils";

/** Checkbox nativo estilizado: color de acento primario y foco visible. */
export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-5 shrink-0 cursor-pointer rounded border border-border accent-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";

/**
 * Checkbox con etiqueta clicable. El padding del label garantiza un objetivo
 * táctil de 44px (accesibilidad móvil).
 */
export function CheckboxField({
  children,
  className,
  inputClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  children?: React.ReactNode;
  inputClassName?: string;
}) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 py-2", className)}>
      <Checkbox className={inputClassName} {...props} />
      {children ? <span className="text-sm leading-6 text-foreground">{children}</span> : null}
    </label>
  );
}
