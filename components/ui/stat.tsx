import * as React from "react";
import { cn } from "@/lib/utils";

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  /** Değeri vurgular — kart içindeki ana sayı için */
  emphasis?: boolean;
  /** Değer ve ikon için renk sınıfı, ör. "text-barem2" */
  accentClassName?: string;
}

/**
 * Tek tip istatistik kutucuğu.
 * Vergi kartlarındaki 4 kutu, header pill'leri ve kur çevirici sonuçları
 * bu desenden gelir — daha önce her biri elle farklı stillenmişti.
 */
export function Stat({
  icon,
  label,
  value,
  unit,
  hint,
  emphasis = false,
  accentClassName,
  className,
  ...props
}: StatProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-fill p-3 transition-colors duration-200 hover:bg-fill-2",
        className
      )}
      {...props}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon && (
          <span className={cn("shrink-0 text-ink-3", accentClassName)}>
            {icon}
          </span>
        )}
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-3">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "tnum font-bold leading-tight text-ink",
          emphasis ? "text-xl sm:text-2xl" : "text-lg",
          accentClassName
        )}
      >
        {value}
        {unit && (
          <span className="ml-1 text-sm font-medium opacity-70">{unit}</span>
        )}
      </p>
      {hint && <p className="mt-1 text-[11px] text-ink-3">{hint}</p>}
    </div>
  );
}
