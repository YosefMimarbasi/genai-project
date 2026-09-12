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
 * §7 modal-motion — the popup scales from its trigger via
 *   --transform-origin, giving the open a spatial cause.
 * §7 duration-timing — 220ms, inside the micro band.
 * §2 touch-target-size — 48px trigger, 44px+ options.
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
      {label ? (
        <span className="ui-text text-sm font-semibold text-[var(--color-foreground)]">
          {label}
        </span>
      ) : null}
      <BaseSelect.Root
        items={options}
        value={value ?? null}
        onValueChange={(next) => next && onValueChange?.(next as string)}
      >
        <BaseSelect.Trigger
          className={cn(
          "ui-text flex h-12 cursor-pointer items-center justify-between gap-2",
          "rounded-[var(--radius-md)] border-2 border-[var(--color-border-strong)]",
          "bg-[var(--color-card)] px-4 text-base text-[var(--color-foreground)]",
          // Raised at rest like a button, because it opens something;
          // pressed while the popup is open, so the trigger visibly stays
          // held down for as long as the menu is up.
          "shadow-[5px_5px_12px_var(--neu-dark),-5px_-5px_12px_var(--neu-light)]",
          "data-[popup-open]:shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]",
          "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
          "hover:border-[var(--color-foreground)] active:scale-[0.99]",
          "data-[popup-open]:border-[var(--color-primary)]",
          "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-ring)]"
          )}
        >
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon aria-hidden>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={8} className="z-[var(--z-popover)]">
            <BaseSelect.Popup
              className={cn(
          // e3 stated directly rather than .surface plus an overriding
          // shadow utility: a popup is the highest thing on the page and
          // should say so, not arrive there by cascade accident.
          "neu-e3 rounded-[var(--radius-lg)] min-w-[var(--anchor-width)] overflow-hidden p-1.5",
 "origin-[var(--transform-origin)]",
 "transition-[transform,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)]",
                // Never from scale(0) — nothing appears out of nothing.
 "data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0",
 "data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0"
              )}
            >
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
 "ui-text flex min-h-11 cursor-pointer items-center justify-between gap-3",
 "rounded-[var(--radius-sm)] px-3 text-[0.9375rem] outline-none",
 "transition-colors duration-[var(--dur-fast)]",
 "data-[highlighted]:bg-[var(--color-primary)] data-[highlighted]:text-[var(--color-on-primary)]"
                    )}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator aria-hidden>
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="m3 8 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
