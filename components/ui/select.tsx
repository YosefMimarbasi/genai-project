"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | null;
  onValueChange?: (value: string) => void;
  className?: string;
}

// Popup scales in from the trigger (origin-aware, per emil-design-eng),
// not from center — center scaling is reserved for modals, which have no
// single trigger to anchor to.
export function Select({ label, placeholder, options, value, onValueChange, className }: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
      ) : null}
      <BaseSelect.Root
        items={options}
        value={value ?? null}
        onValueChange={(next) => next && onValueChange?.(next as string)}
      >
        <BaseSelect.Trigger
          className={cn(
            "flex h-10 items-center justify-between gap-2 rounded-[var(--radius-control)]",
            "border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm",
            "transition-colors duration-150 ease-[var(--ease-out-strong)]",
            "data-[popup-open]:border-[var(--color-accent)]",
            "active:scale-[0.99]"
          )}
        >
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon className="text-[var(--color-muted)]">▾</BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6} className="z-50">
            <BaseSelect.Popup
              className={cn(
                "min-w-[var(--anchor-width)] overflow-hidden rounded-[var(--radius-card)]",
                "border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg",
                "origin-[var(--transform-origin)]",
                "transition-[transform,opacity] duration-[180ms] ease-[var(--ease-out-strong)]",
                "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                "data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
              )}
            >
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-[calc(var(--radius-control)-2px)] px-2.5 py-2 text-sm",
                      "data-[highlighted]:bg-[var(--color-accent-subtle)]",
                      "outline-none"
                    )}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="text-[var(--color-accent)]">
                      ✓
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
