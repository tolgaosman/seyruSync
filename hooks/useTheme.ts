"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "autocalc-theme";
export const DEFAULT_THEME: Theme = "dark";

/**
 * Tema, DOM'un kendisinde (`<html data-theme>`) yaşar — layout'taki
 * satır içi script bunu ilk boyamadan önce yazar, böylece yanlış temayla
 * bir kare bile görünmez. Hook o dış duruma abone olur.
 */

const subscribers = new Set<() => void>();

function currentTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

let snapshot: Theme = DEFAULT_THEME;

function subscribe(onStoreChange: () => void): () => void {
  subscribers.add(onStoreChange);
  snapshot = currentTheme();
  return () => {
    subscribers.delete(onStoreChange);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => DEFAULT_THEME;

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode — tema yine de bu oturumda çalışır */
  }
  snapshot = theme;
  subscribers.forEach((fn) => fn());
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const toggle = useCallback(() => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  }, []);

  return { theme, toggle, setTheme };
}
