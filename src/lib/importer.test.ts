import { describe, it, expect } from "vitest";
import { parseImport, serializeEnvelope } from "./importer";
import type { Envelope } from "./types";

function env(): Envelope {
  return {
    schemaVersion: 1,
    settings: { baseCcy: "AED", peg: 3.6725, fxRateNow: 3.68, lastView: "current" },
    accounts: [{ id: "a1", broker: "sarwa", label: "Sarwa", baseCcy: "AED", holdingsCcy: "USD", roundStartDate: "2026-01-01" }],
    cashflows: [], holdings: [], snapshots: [], purification: []
  };
}

describe("importer", () => {
  it("round-trips serialize -> parse", () => {
    const text = serializeEnvelope(env());
    const r = parseImport(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.envelope.accounts[0].id).toBe("a1");
  });

  it("fails clearly on invalid JSON", () => {
    const r = parseImport("{ not json ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/JSON/i);
  });

  it("fails on structurally invalid envelope (surfaces validation errors)", () => {
    const r = parseImport(JSON.stringify({ schemaVersion: 1 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
  });

  it("migrates an older payload to the current schema", () => {
    const old = { ...env(), schemaVersion: 0 };
    const r = parseImport(JSON.stringify(old));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.envelope.schemaVersion).toBe(1);
  });
});
