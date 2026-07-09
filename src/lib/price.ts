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
