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

/*
 * Popup scales in from the trigger via `--transform-origin`, not from
 * center — center scaling is reserved for modals, which have no trigger to
 * anchor to (emil-design-eng, apple-design §7). 180ms sits inside the
 * 150–250ms dropdown band; anything near 400ms reads as sluggish.
 */
export function Select({
  label,
  placeholder,
  options,
  value,
  onValueChange,
  className,
}: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? <span className="label text-[var(--color-gray)]">{label}</span> : null}
      <BaseSelect.Root
        items={options}
        value={value ?? null}
        onValueChange={(next) => next && onValueChange?.(next as string)}
      >
        <BaseSelect.Trigger
          className={cn(
            "flex h-11 items-center justify-between gap-2",
            "border border-[color-mix(in_oklab,var(--color-rule)_25%,transparent)]",
            "bg-[var(--color-paper)] px-3 text-sm text-[var(--color-ink)]",
            "transition-[transform,border-color] duration-150 ease-[var(--ease-out-strong)]",
            "data-[popup-open]:border-[var(--color-accent)]",
            "active:scale-[0.99]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          )}
        >
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon className="text-[var(--color-gray)]">▾</BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4} className="z-50">
            <BaseSelect.Popup
              className={cn(
                "min-w-[var(--anchor-width)] overflow-hidden",
                "border border-[var(--color-ink)] bg-[var(--color-paper)] p-0",
                "origin-[var(--transform-origin)]",
                "transition-[transform,opacity] duration-[180ms] ease-[var(--ease-out-strong)]",
                // Never scale from 0 — nothing in the real world appears
                // from nothing.
                "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
                "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0"
              )}
            >
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm",
                      "data-[highlighted]:bg-[var(--color-accent)] data-[highlighted]:text-[var(--color-ground)]",
                      "outline-none"
                    )}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator>✓</BaseSelect.ItemIndicator>
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
