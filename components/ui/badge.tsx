import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#063b28] text-white hover:bg-[#0a4d35]",
        secondary:
          "border-transparent bg-[#f0eee6] text-[#111814] hover:bg-[#e5e2d8]",
        destructive:
          "border-transparent bg-[#b84a32] text-white hover:bg-[#a13b25]",
        outline: "border-[#e2dec5] text-[#111814] bg-white/50",
        barem1: "bg-[#e3ece6] text-[#1c4430] border-[#c8dcd0]",
        barem2: "bg-[#f6f0e3] text-[#624a1e] border-[#e6d6b6]",
        barem3: "bg-[#faebe4] text-[#7a3219] border-[#f2cbbe]",
        barem4: "bg-[#fce8e4] text-[#8c2219] border-[#f7c2b9]",
        optimal: "bg-[#d9e8de] text-[#0d4829] border-transparent font-bold",
        sand: "bg-[#f0eee6] text-[#4a3a25] border-[#e2dec5]",
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
