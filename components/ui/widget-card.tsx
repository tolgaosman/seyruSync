"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type DataSource = "live" | "fallback" | "cached" | "loading";

/** Canlı / yedek veri rozeti — iki widget'ta da birebir aynıydı */
export function DataSourceBadge({ source }: { source: DataSource }) {
  if (source === "loading") {
    return <span className="skeleton inline-block h-4 w-20 rounded-full" />;
  }
  if (source === "live") {
    return (
      <Badge variant="success" className="px-2 py-0 text-[10px]">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" />
        Canlı Veri
      </Badge>
    );
  }
  return (
    <Badge variant="warn" className="px-2 py-0 text-[10px]">
      <AlertTriangle className="h-2.5 w-2.5" />
      Yedek
    </Badge>
  );
}

interface WidgetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon: React.ReactNode;
  source: DataSource;
  lastUpdated: string;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  children: React.ReactNode;
}

/**
 * Piyasa verisi widget'larının ortak kabuğu:
 * başlık + yenile butonu · içerik · kaynak rozeti + son güncelleme.
 */
export function WidgetCard({
  title,
  icon,
  source,
  lastUpdated,
  isLoading = false,
  error,
  onRefresh,
  children,
  className,
  ...props
}: WidgetCardProps) {
  return (
    <Card className={cn("flex flex-col", className)} {...props}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="text-accent-2">{icon}</span>
          {title}
        </h3>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title={`${title} — yenile`}
            aria-label={`${title} verilerini yenile`}
            className="rounded-lg p-1.5 text-ink-3 transition-colors duration-200 hover:bg-fill-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        )}
      </div>

      <div className="flex-1">{children}</div>

      {error && (
        <div className="flex items-center gap-2 border-t border-warn/25 bg-warn/10 px-4 py-2 text-[11px] text-warn">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="flex-1">Veri alınamadı — yedek değerler gösteriliyor.</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-line bg-fill px-4 py-2 text-[10px] text-ink-3">
        <DataSourceBadge source={source} />
        <span className="tnum font-medium">Son Güncelleme: {lastUpdated}</span>
      </div>
    </Card>
  );
}
