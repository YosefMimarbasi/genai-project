import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/*
 * Neumorphic buttons.
 *
 * The press is the whole point of the style: raised at rest, pushed into
 * the ground on :active, which is the inset shadow pair. Combined with the
 * 0.97 scale it reads as a physical key rather than a rectangle that
 * changes colour.
 *
 * WCAG 1.4.11 wants 3:1 for the visual boundary of a control, and a
 * shadow has no contrast ratio. Filled variants satisfy it through the
 * fill itself (primary 5.37:1, destructive 6.56:1 against the ground).
 * Ground-coloured variants have no fill to rely on, so secondary keeps a
 * literal border. Ghost is deliberately exempt: it is only ever used
 * beside a stronger control, never as the sole action.
 *
 * §2 touch-target-size — every size meets 44px, including sm.
 * §2 loading-buttons  — disabled + spinner while async work is in flight.
 * §7 duration-timing  — 220ms, inside the 150-300ms micro band.
 */
const RAISED = "shadow-[5px_5px_12px_var(--neu-dark),-5px_-5px_12px_var(--neu-light)]";
const RAISED_HOVER =
  "hover:shadow-[9px_9px_22px_var(--neu-dark),-9px_-9px_22px_var(--neu-light)]";
const PRESSED =
  "active:shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]";

const buttonVariants = cva(
  [
    "ui-text inline-flex items-center justify-center gap-2",
    "font-semibold whitespace-nowrap cursor-pointer select-none",
    "rounded-[var(--radius-md)]",
    "transition-[transform,background-color,color,border-color,box-shadow]",
    "duration-[var(--dur-base)] ease-[var(--ease-out)]",
    "active:scale-[0.97]",
    // §8 disabled-states — reduced opacity, no pointer events, and the
    // extrusion flattened, so a dead control does not still look pressable.
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
    "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-ring)]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-primary)] text-[var(--color-on-primary)]",
          RAISED,
          RAISED_HOVER,
          "hover:bg-[var(--color-primary-hover)]",
          PRESSED,
        ],
        // Ink on lime is 12.74:1. This previously read
        // bg-[var(--color-primary)] — an artifact of an earlier
        // find-and-replace that silently turned every accent button red.
        accent: [
          "bg-[var(--color-accent)] text-[var(--color-on-accent)]",
          RAISED,
          RAISED_HOVER,
          "hover:bg-[var(--color-accent-hover)]",
          PRESSED,
        ],
        // The classic neumorphic control: the ground itself, extruded.
        secondary: [
          "bg-[var(--color-card)] text-[var(--color-foreground)]",
          "border-2 border-[var(--color-border-strong)]",
          RAISED,
          RAISED_HOVER,
          "hover:border-[var(--color-foreground)]",
          PRESSED,
        ],
        ghost:
          "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] active:scale-[0.97]",
        destructive: [
          "bg-[var(--color-destructive)] text-[var(--color-on-destructive)]",
          RAISED,
          RAISED_HOVER,
          "hover:brightness-110",
          PRESSED,
        ],
      },
      size: {
        // min-h-11 = 44px, the floor for every size.
        sm: "min-h-11 px-5 text-sm",
        md: "min-h-12 px-6 text-[0.9375rem]",
        lg: "min-h-14 px-9 text-base",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", full: false },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, full }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ animationDuration: "600ms" }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";
