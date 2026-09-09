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
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="ui-text text-sm font-semibold text-[var(--color-foreground)]"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          aria-describedby={hintId}
          className={cn(
 "ui-text min-h-28 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-border-strong)]",
 "bg-[var(--color-card)] px-4 py-3 text-base text-[var(--color-foreground)]",
 "transition-[border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
 "placeholder:text-[var(--color-muted-foreground)]",
 "focus:border-[var(--color-primary)] focus:outline-none",
            className
          )}
          {...props}
        />
        {hint ? (
          <p id={hintId} className="ui-text text-xs text-[var(--color-muted-foreground)]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
