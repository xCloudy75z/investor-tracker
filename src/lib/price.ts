// src/lib/price.ts — pure live-price overlay + staleness/throttle. `now` is injected (no clock reads).
import type { Envelope } from "./types";

export interface LivePrice {
  symbol: string;
  priceMinor: number; // USD cents
  asOf: string;       // provider's exchange timestamp
  fetchedAt: string;  // ISO time we fetched it
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;
}

export function isStale(live: LivePrice, now: string, maxStaleDays = 3): boolean {
  return daysBetween(live.fetchedAt, now) > maxStaleDays;
}

export function shouldRefetch(live: LivePrice | null, now: string, minIntervalMinutes = 60): boolean {
  if (!live) return true;
  return daysBetween(live.fetchedAt, now) * 24 * 60 > minIntervalMinutes;
}

/** Overlay `priceMinor × quantity` onto the holding matching `live.symbol`. Pure.
 *  Returns the SAME env reference when there is nothing to apply (null/stale/no match). */
export function applyLivePrice(env: Envelope, live: LivePrice | null, now: string, maxStaleDays = 3): Envelope {
  if (!live || isStale(live, now, maxStaleDays)) return env;
  if (!env.holdings.some((h) => h.symbol === live.symbol)) return env;
  const holdings = env.holdings.map((h) =>
    h.symbol === live.symbol ? { ...h, currentValueNative: Math.round(live.priceMinor * h.quantity) } : h
  );
  return { ...env, holdings };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Human relative time from an ISO timestamp to `now` (injected). */
export function relativeTime(iso: string, now: string): string {
  const secs = Math.floor((new Date(now).getTime() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
