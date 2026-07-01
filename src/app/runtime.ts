// src/app/runtime.ts — the ONLY module allowed to touch platform non-determinism.
import { loadEnvelope, saveEnvelope, STORAGE_KEY, type StorageLike } from "../lib/store";
import type { Envelope } from "../lib/types";
import { serializeEnvelope } from "../lib/importer";

const browserStorage: StorageLike = {
  getItem: (k) => window.localStorage.getItem(k),
  setItem: (k, v) => window.localStorage.setItem(k, v)
};

export function load(): Envelope {
  return loadEnvelope(browserStorage);
}

export function save(env: Envelope): void {
  saveEnvelope(browserStorage, env);
}

export const now = (): string => new Date().toISOString();
export const newId = (): string => crypto.randomUUID();

// --- Theme (dark/light) ---

export type Theme = "dark" | "light";
const THEME_KEY = "investor-app:theme";

/** Read the saved theme (defaults to "dark") and apply it to <html data-theme>. */
export function loadTheme(): Theme {
  const saved = window.localStorage.getItem(THEME_KEY);
  const theme: Theme = saved === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  return theme;
}

/** Set + persist the theme, applying it to <html data-theme> immediately. */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
}

// --- Data file helpers (non-pure: DOM + Date) ---

const BACKUP_KEY = "investor-app:lastBackup";

/** Trigger a browser download of text as a file. */
export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read a File object's text contents. */
export function readFileText(file: File): Promise<string> {
  return file.text();
}

/** Snapshot current data into a backup slot, then save the new envelope. */
export function replaceData(env: Envelope): void {
  const current = window.localStorage.getItem(STORAGE_KEY);
  if (current) window.localStorage.setItem(BACKUP_KEY, current);
  save(env);
}

/** Current data serialized for export/backup download. */
export function exportText(): string {
  return serializeEnvelope(load());
}

/** Force the installed PWA to fetch the latest deployed version: unregister the
 *  service worker, clear its caches, then reload from the network. The user's
 *  saved data (localStorage) is NOT touched — only the cached app shell. */
export async function forceUpdate(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    window.location.reload();
  }
}
