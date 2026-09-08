"use client";

import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/cn";

/*
 * Inputs are carved into the ground rather than raised: a well reads as
 * something you put content into. The error state adds a red ring on top
 * of the inset, because a shadow change alone is not a perceivable error
 * signal.
 */
export interface TextInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Field.Control>, "className"> {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
}

export function TextInput({
  label,
  hint,
  error,
  className,
  inputClassName,
  ...props
}: TextInputProps) {
  return (
    <Field.Root className={cn("flex flex-col gap-2", className)}>
      <Field.Label className="label text-[var(--color-gray)]">{label}</Field.Label>
      <Field.Control
        className={cn(
          "neu-pressed h-12 rounded-[var(--radius-md)] px-4 text-sm text-[var(--color-ink)]",
          "outline-none transition-shadow duration-150 ease-[var(--ease-out-strong)]",
          "placeholder:text-[color-mix(in_oklab,var(--color-gray)_70%,transparent)]",
          "focus:ring-2 focus:ring-[var(--color-accent)]",
          error && "ring-2 ring-[var(--color-danger)]",
          inputClassName
        )}
        {...props}
      />
      {hint && !error ? <p className="text-xs text-[var(--color-gray)]">{hint}</p> : null}
      <Field.Error match={Boolean(error)} className="text-xs font-semibold text-[var(--color-danger)]">
        {error}
      </Field.Error>
    </Field.Root>
  );
}
