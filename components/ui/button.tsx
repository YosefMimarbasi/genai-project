import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/*
 * Flat rectangles, zero radius, no shadow — per the `pentagram` recipe.
 * Press feedback is scale(0.97) at 160ms: buttons must feel like the
 * interface heard the user (emil-design-eng / apple-design §1).
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-bold tracking-[0.02em] whitespace-nowrap",
    "transition-[transform,background-color,color,border-color] duration-[160ms] ease-[var(--ease-out-strong)]",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
  ],
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-accent)] text-[var(--color-ground)] hover:bg-[var(--color-accent-hover)]",
        secondary:
          "border border-[var(--color-ink)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-ground)]",
        ghost: "text-[var(--color-ink)] hover:bg-[color-mix(in_oklab,var(--color-ink)_8%,transparent)]",
        danger: "bg-[var(--color-danger)] text-[var(--color-ground)] hover:bg-[var(--color-accent-hover)]",
      },
      size: {
        sm: "h-8 px-3 text-[0.8125rem]",
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
