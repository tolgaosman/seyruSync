import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { BAREM_PALETTE } from "@/lib/theme";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
  {
    variants: {
      variant: {
        default: "border-accent/30 bg-accent/15 text-ink",
        secondary: "border-line bg-fill-2 text-ink-2",
        destructive: "border-danger/30 bg-danger/12 text-danger",
        success: "border-success/30 bg-success/12 text-success",
        warn: "border-warn/30 bg-warn/12 text-warn",
        info: "border-info/30 bg-info/12 text-info",
        outline: "border-line text-ink-2",
        barem1: BAREM_PALETTE[1].badge,
        barem2: BAREM_PALETTE[2].badge,
        barem3: BAREM_PALETTE[3].badge,
        barem4: BAREM_PALETTE[4].badge,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
