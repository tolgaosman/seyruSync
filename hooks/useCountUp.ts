"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Bir sayıyı 0'dan (veya önceki değerden) hedefe doğru animasyonla sayar.
 * Sadece sunum katmanı — hesaplanan değeri değiştirmez.
 *
 * Not: animasyon sırasında basamak sayısı değiştiği için sonuç her zaman
 * `.tnum` (tabular-nums) bir öğe içinde gösterilmelidir, yoksa yerleşim titrer.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    // Hareket azaltma açıksa süre 0 — ilk karede doğrudan hedefe oturur.
    const duration = prefersReducedMotion() ? 0 : durationMs;
    const start = performance.now();

    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + delta * eased;
      setValue(t === 1 ? target : current);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}
