"use client";

import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/cn";

export interface TextInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Field.Control>, "className"> {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
}

/*
 * Label set in the tiny precise uppercase used for all metadata in this
 * system — the recipe pins captions and field labels to the grid in small
 * type rather than making them compete with content.
 */
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
          "h-11 border bg-[var(--color-paper)] px-3 text-sm text-[var(--color-ink)]",
          "outline-none transition-colors duration-150 ease-[var(--ease-out-strong)]",
          "border-[color-mix(in_oklab,var(--color-rule)_25%,transparent)]",
          "focus:border-[var(--color-accent)]",
          "placeholder:text-[color-mix(in_oklab,var(--color-gray)_70%,transparent)]",
          error && "border-[var(--color-danger)]",
          inputClassName
        )}
        {...props}
      />
      {hint && !error ? <p className="text-xs text-[var(--color-gray)]">{hint}</p> : null}
      <Field.Error match={Boolean(error)} className="text-xs font-medium text-[var(--color-danger)]">
        {error}
      </Field.Error>
    </Field.Root>
  );
}
