import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#063b28] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#063b28] text-white hover:bg-[#0a4d35] shadow-sm",
        destructive: "bg-[#b84a32] text-white hover:bg-[#a13b25]",
        outline:
          "border border-[#e5e2d8] bg-white hover:bg-[#f6f5f0] text-[#111814]",
        secondary: "bg-[#f0eee6] text-[#111814] hover:bg-[#e5e2d8]",
        sand: "bg-[#e5d8c5] text-[#3a2e1d] hover:bg-[#dad0bc] shadow-sm",
        ghost: "hover:bg-[#f0eee6] text-[#555d57]",
        link: "text-[#063b28] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9 rounded-lg",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
