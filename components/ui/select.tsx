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
 * Trigger is raised (pressable), popup is raised above the ground. The
 * popup scales in from the trigger via `--transform-origin`, not from
 * centre — centre scaling is reserved for modals, which have no trigger to
 * anchor to. 180ms sits inside the 150-250ms dropdown band.
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
            "neu-raised flex h-12 items-center justify-between gap-2",
            "rounded-[var(--radius-md)] px-4 text-sm text-[var(--color-ink)]",
            "transition-[transform,box-shadow,color] duration-[160ms] ease-[var(--ease-out-strong)]",
            "active:scale-[0.99]",
            "data-[popup-open]:shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]",
            "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-accent)]"
          )}
        >
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon className="text-[var(--color-gray)]">▾</BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={10} className="z-50">
            <BaseSelect.Popup
              className={cn(
                "neu-raised min-w-[var(--anchor-width)] overflow-hidden",
                "rounded-[var(--radius-md)] p-2",
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
                      "flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)]",
                      "px-3 py-2.5 text-sm outline-none",
                      "transition-colors duration-100",
                      "data-[highlighted]:bg-[var(--color-accent)] data-[highlighted]:text-white"
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
