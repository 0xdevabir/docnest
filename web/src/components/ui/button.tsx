import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white shadow-glow-sm hover:bg-brand-400 hover:shadow-glow-md active:scale-[0.98]",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface hover:border-brand-500/50 active:scale-[0.98]",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-surface active:scale-[0.98]",
        link: "text-brand-400 underline-offset-4 hover:underline hover:text-brand-300",
        gradient:
          "relative overflow-hidden text-white shadow-glow-sm active:scale-[0.98]",
        secondary:
          "bg-surface border border-border text-foreground hover:border-brand-500/40 hover:bg-surface-raised active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {variant === "gradient" ? (
          <>
            <span className="absolute inset-0 bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-400" />
            <span className="absolute inset-0 bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-400 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-70" />
            <span className="relative">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
