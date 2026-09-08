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
      <div className="flex flex-col gap-2">
        {label ? (
          <label htmlFor={inputId} className="label text-[var(--color-gray)]">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-24 border bg-[var(--color-paper)] px-3 py-2.5 text-sm text-[var(--color-ink)]",
            "border-[color-mix(in_oklab,var(--color-rule)_25%,transparent)]",
            "outline-none transition-colors duration-150 ease-[var(--ease-out-strong)]",
            "focus:border-[var(--color-accent)]",
            "placeholder:text-[color-mix(in_oklab,var(--color-gray)_70%,transparent)]",
            className
          )}
          {...props}
        />
        {hint ? <p className="text-xs text-[var(--color-gray)]">{hint}</p> : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
