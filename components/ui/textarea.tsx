import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className, id, ...props }, ref) => {
    const generatedId = `textarea-${label?.toLowerCase().replace(/\s+/g, "-") ?? "field"}`;
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-foreground)]">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-24 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm",
            "outline-none transition-colors duration-150 ease-[var(--ease-out-strong)]",
            "focus:border-[var(--color-accent)]",
            "placeholder:text-[var(--color-muted)]",
            className
          )}
          {...props}
        />
        {hint ? <p className="text-xs text-[var(--color-muted)]">{hint}</p> : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
