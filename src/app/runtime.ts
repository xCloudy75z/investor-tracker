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

// --- Sync from a link (fetch the latest data from a URL) ---

const SYNC_KEY = "investor-app:syncUrl";

/** The saved sync link (empty string if none). */
export function getSyncUrl(): string {
  return window.localStorage.getItem(SYNC_KEY) ?? "";
}

/** Persist the sync link. */
export function setSyncUrl(url: string): void {
  window.localStorage.setItem(SYNC_KEY, url.trim());
}

/** Fetch raw JSON text from the sync URL (cache-busted, bypassing the SW cache). */
export async function fetchSync(url: string): Promise<string> {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
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

// --- Worth history (for the value-over-time chart) ---
import type { HistoryPoint } from "../lib/chart";

const HISTORY_KEY = "investor-app:history";

export function getHistory(): HistoryPoint[] {
  try { return JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryPoint[]; }
  catch { return []; }
}

/** Record today's total worth (one point per day; keeps the last ~180 days). */
export function recordWorth(worthBase: number): void {
  const today = new Date().toISOString().slice(0, 10);
  const hist = getHistory().filter((p) => p.date !== today);
  hist.push({ date: today, worthBase });
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-180)));
}

// --- Live price (Baraka SPUS auto-price; MVP client-side) ---
import type { LivePrice } from "../lib/price";

const LIVE_PRICE_KEY = "investor-app:livePrice";
// MVP: owner's free Twelve Data key (client-side, personal tool; ships in the public bundle by design).
const TWELVE_DATA_KEY = "a2622d32d8bc4020a558c675eb15b163";

export function getLivePrice(): LivePrice | null {
  try { const s = window.localStorage.getItem(LIVE_PRICE_KEY); return s ? (JSON.parse(s) as LivePrice) : null; }
  catch { return null; }
}

export function setLivePrice(lp: LivePrice): void {
  window.localStorage.setItem(LIVE_PRICE_KEY, JSON.stringify(lp));
}

/** Fetch SPUS's latest price from Twelve Data. Throws on any error (caller swallows). */
export async function fetchSpusPrice(): Promise<LivePrice> {
  const res = await fetch(`https://api.twelvedata.com/quote?symbol=SPUS&apikey=${TWELVE_DATA_KEY}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { close?: string; datetime?: string; status?: string; message?: string };
  if (data.status === "error" || !data.close) throw new Error(`Twelve Data: ${data.message ?? "no price"}`);
  return { symbol: "SPUS", priceMinor: Math.round(parseFloat(data.close) * 100), asOf: data.datetime ?? "", fetchedAt: new Date().toISOString() };
}
