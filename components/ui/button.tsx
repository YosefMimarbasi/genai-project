import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/*
 * Neumorphic buttons: raised at rest, physically pressed in on :active.
 * The extrusion communicates "this is pressable"; it never communicates
 * *state*, which is why the primary variant is a solid Cornell Red fill
 * rather than a shadow difference.
 *
 * focus-visible keeps a solid high-contrast outline. A soft shadow ring
 * is the usual neumorphic focus treatment and it is not perceivable
 * enough to be the only focus indicator.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold whitespace-nowrap",
    "rounded-[var(--radius-md)]",
    "transition-[transform,box-shadow,background-color,color] duration-[160ms] ease-[var(--ease-out-strong)]",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-accent)]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-accent)] text-white",
          "shadow-[5px_5px_12px_var(--neu-dark),-5px_-5px_12px_var(--neu-light)]",
          "hover:bg-[var(--color-accent-hover)]",
          "active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-3px_-3px_7px_rgba(255,255,255,0.15)]",
        ],
        secondary: [
          "neu-e2 text-[var(--color-ink)]",
          "hover:text-[var(--color-accent)]",
          "active:shadow-[inset_3px_3px_7px_var(--neu-dark),inset_-3px_-3px_7px_var(--neu-light)]",
        ],
        ghost: [
          "text-[var(--color-gray)]",
          "hover:text-[var(--color-ink)]",
          "active:shadow-[inset_2px_2px_5px_var(--neu-dark),inset_-2px_-2px_5px_var(--neu-light)]",
        ],
        danger: [
          "bg-[var(--color-danger)] text-white",
          "shadow-[5px_5px_12px_var(--neu-dark),-5px_-5px_12px_var(--neu-light)]",
          "hover:bg-[var(--color-accent-hover)]",
          "active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-3px_-3px_7px_rgba(255,255,255,0.15)]",
        ],
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{ animationDuration: "600ms" }}
            aria-hidden
          />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
