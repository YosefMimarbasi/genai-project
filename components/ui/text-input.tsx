"use client";

import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/cn";

/*
 * §8 input-labels        — a visible <label>, never placeholder-as-label.
 * §8 error-placement     — error renders directly below its own field.
 * §8 input-helper-text   — persistent helper text, not a placeholder.
 * §8 required-indicators — required fields marked, with a text equivalent
 *                          for screen readers rather than a bare asterisk.
 * §8 aria-live-errors    — Base UI's Field.Error carries role="alert".
 * §8 touch-friendly-input — 48px tall, above the 44px floor.
 * §6 readable-font-size  — 16px, so iOS does not auto-zoom on focus.
 */
export interface TextInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Field.Control>, "className"> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

export function TextInput({
  label,
  hint,
  error,
  required,
  className,
  inputClassName,
  ...props
}: TextInputProps) {
  return (
    <Field.Root className={cn("flex flex-col gap-2", className)}>
      <Field.Label className="ui-text text-sm font-semibold text-[var(--color-foreground)]">
        {label}
        {required ? (
          <>
            <span aria-hidden className="ml-0.5 text-[var(--color-primary)]">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Field.Label>

      <Field.Control
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          "ui-text h-12 w-full rounded-[var(--radius-md)] border-2 bg-[var(--color-card)] px-4",
          "text-base text-[var(--color-foreground)]",
          // Carved into the ground: in neumorphism a field reads as a
          // well, which is the inverse of the raised button beside it.
          "shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]",
          "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
          "placeholder:text-[var(--color-muted-foreground)]",
          // No focus:outline-none here. It used to sit on this line, and
          // because it matches :focus it also suppressed the global
          // :focus-visible ring, leaving a colour-only focus cue on a
          // control whose boundary is otherwise just a shadow.
          "focus:border-[var(--color-primary)]",
          error ? "border-[var(--color-destructive)]" : "border-[var(--color-border-strong)]",
          inputClassName
        )}
        {...props}
      />

      {hint && !error ? (
        <p className="ui-text text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}

      <Field.Error
        match={Boolean(error)}
        className="ui-text flex items-start gap-1.5 text-xs font-semibold text-[var(--color-destructive)]"
      >
        {/* §1 color-not-only — an icon carries the error too, not just red. */}
        <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 4.5h1.5v5h-1.5v-5Zm0 6.25h1.5v1.5h-1.5v-1.5Z" />
        </svg>
        {error}
      </Field.Error>
    </Field.Root>
  );
}
