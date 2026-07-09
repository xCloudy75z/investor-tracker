// src/lib/validate.ts — pure structural + referential validation for an imported envelope.
import type { Envelope } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const TOP_ARRAYS = ["accounts", "cashflows", "holdings", "snapshots", "purification"] as const;

export function validateEnvelope(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof value !== "object" || value === null) {
    return { ok: false, errors: ["Envelope is not an object"] };
  }
  const env = value as Partial<Envelope>;

  if (typeof env.schemaVersion !== "number") errors.push("Missing or invalid schemaVersion");
  if (typeof env.settings !== "object" || env.settings === null) errors.push("Missing settings");

  for (const key of TOP_ARRAYS) {
    if (!Array.isArray((env as Record<string, unknown>)[key])) {
      errors.push(`Missing or invalid array: ${key}`);
    }
  }
  // If structure is broken, stop before referential checks.
  if (errors.length > 0) return { ok: false, errors };

  // Every row must be a non-null object, else the referential checks below would
  // throw on a malformed element. An import gate must answer {ok:false}, never crash.
  for (const key of TOP_ARRAYS) {
    const arr = (env as Record<string, unknown>)[key] as unknown[];
    if (arr.some((row) => typeof row !== "object" || row === null)) {
      errors.push(`Array ${key} contains a non-object row`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  const accountIds = new Set((env.accounts ?? []).map((a) => a.id));
  for (const a of env.accounts ?? []) {
    if (typeof a.roundStartDate !== "string" || a.roundStartDate.trim() === "") {
      errors.push(`Account ${a.id} is missing roundStartDate`);
    }
  }
  for (const f of env.cashflows ?? []) {
    if (!accountIds.has(f.accountId)) errors.push(`Cashflow ${f.id} references unknown account ${f.accountId}`);
  }
  for (const h of env.holdings ?? []) {
    if (!accountIds.has(h.accountId)) errors.push(`Holding ${h.id} references unknown account ${h.accountId}`);
  }
  for (const s of env.snapshots ?? []) {
    if (!accountIds.has(s.accountId)) errors.push(`Snapshot ${s.id} references unknown account ${s.accountId}`);
  }
  for (const p of env.purification ?? []) {
    if (!accountIds.has(p.accountId)) errors.push(`Purification ${p.id} references unknown account ${p.accountId}`);
  }

  return { ok: errors.length === 0, errors };
}
