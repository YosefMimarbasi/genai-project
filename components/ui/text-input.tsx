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

export function TextInput({ label, hint, error, className, inputClassName, ...props }: TextInputProps) {
  return (
    <Field.Root className={cn("flex flex-col gap-1.5", className)}>
      <Field.Label className="text-sm font-medium text-[var(--color-foreground)]">
        {label}
      </Field.Label>
      <Field.Control
        className={cn(
          "h-10 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm",
          "outline-none transition-colors duration-150 ease-[var(--ease-out-strong)]",
          "focus:border-[var(--color-accent)]",
          "placeholder:text-[var(--color-muted)]",
          error && "border-[var(--color-danger)]",
          inputClassName
        )}
        {...props}
      />
      {hint && !error ? <p className="text-xs text-[var(--color-muted)]">{hint}</p> : null}
      <Field.Error match={Boolean(error)} className="text-xs text-[var(--color-danger)]">
        {error}
      </Field.Error>
    </Field.Root>
  );
}
