// src/app/runtime.ts — the ONLY module allowed to touch platform non-determinism.
import { loadEnvelope, saveEnvelope, type StorageLike } from "../lib/store";
import type { Envelope } from "../lib/types";

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
