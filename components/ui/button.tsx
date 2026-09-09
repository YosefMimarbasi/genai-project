import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/*
 * §2 touch-target-size — every size meets the 44px minimum, including sm.
 * §2 loading-buttons  — disabled + spinner while async work is in flight.
 * §4 primary-action   — one primary per screen; secondary is subordinate.
 * §7 duration-timing  — 220ms, inside the 150-300ms micro band.
 * §7 scale-feedback   — 0.97 press, restored on release.
 */
const buttonVariants = cva(
  [
 "ui-text inline-flex items-center justify-center gap-2",
 "font-semibold whitespace-nowrap cursor-pointer select-none",
 "rounded-[var(--radius-md)]",
 "transition-[transform,background-color,color,border-color,box-shadow]",
 "duration-[var(--dur-base)] ease-[var(--ease-out)]",
 "active:scale-[0.97]",
    // §8 disabled-states — reduced opacity + not-allowed + no pointer events.
 "disabled:pointer-events-none disabled:opacity-45",
 "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]",
  ],
  {
    variants: {
      variant: {
        primary:
 "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-1)] hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-2)]",
        // The energetic accent. Ink on lime is 13:1, so it stays legible.
        accent:
 "bg-[var(--color-primary)] text-[var(--color-on-accent)] shadow-[var(--shadow-1)] hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-2)]",
        secondary:
 "border-2 border-[var(--color-foreground)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)]",
        ghost:
 "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        destructive:
 "bg-[var(--color-destructive)] text-[var(--color-on-destructive)] hover:brightness-110",
      },
      size: {
        // min-h-11 = 44px, the floor for every size.
        sm: "min-h-11 px-4 text-sm",
        md: "min-h-12 px-5 text-[0.9375rem]",
        lg: "min-h-14 px-8 text-base",
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
