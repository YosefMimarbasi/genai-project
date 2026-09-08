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
            "neu-pressed min-h-28 rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-ink)]",
            "outline-none transition-shadow duration-150 ease-[var(--ease-out-strong)]",
            "placeholder:text-[color-mix(in_oklab,var(--color-gray)_70%,transparent)]",
            "focus:ring-2 focus:ring-[var(--color-accent)]",
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
