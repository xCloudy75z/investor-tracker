// src/lib/store.ts
import type { Envelope, Settings } from "./types";

export const CURRENT_SCHEMA = 1;
export const STORAGE_KEY = "investor-app:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultSettings(): Settings {
  return { baseCcy: "AED", peg: 3.6725, fxRateNow: 3.683, lastView: "current" };
}

export function emptyEnvelope(): Envelope {
  return {
    schemaVersion: CURRENT_SCHEMA,
    settings: defaultSettings(),
    accounts: [], cashflows: [], holdings: [], snapshots: [], purification: []
  };
}

/** Bring any older payload up to the current schema. Extend as versions grow. */
export function migrate(env: Envelope): Envelope {
  let next = { ...env };
  if (next.schemaVersion < 1) {
    next = { ...next, settings: { ...defaultSettings(), ...next.settings }, schemaVersion: 1 };
  }
  next.schemaVersion = CURRENT_SCHEMA;
  return next;
}

export function loadEnvelope(storage: StorageLike): Envelope {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyEnvelope();
  return migrate(JSON.parse(raw) as Envelope);
}

export function saveEnvelope(storage: StorageLike, env: Envelope): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(env));
}
