import * as React from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Marca el campo como obligatorio: añade un asterisco visible + texto para lectores de pantalla. */
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-foreground",
        className
      )}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span aria-hidden="true" className="text-destructive">
            {" "}
            *
          </span>
          <span className="sr-only"> (obligatorio)</span>
        </>
      ) : null}
    </label>
  );
}
