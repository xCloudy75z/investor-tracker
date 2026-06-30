// src/lib/importer.ts — pure: turn JSON text into a validated, migrated Envelope.
import type { Envelope } from "./types";
import { validateEnvelope } from "./validate";
import { migrate } from "./store";

export type ImportResult =
  | { ok: true; envelope: Envelope }
  | { ok: false; errors: string[] };

export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${(e as Error).message}`] };
  }
  const result = validateEnvelope(raw);
  if (!result.ok) return { ok: false, errors: result.errors };
  // Safe to treat as Envelope now; migrate stamps the current schema.
  return { ok: true, envelope: migrate(raw as Envelope) };
}

/** Pretty-printed JSON for export/backup. */
export function serializeEnvelope(env: Envelope): string {
  return JSON.stringify(env, null, 2);
}
