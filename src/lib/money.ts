// src/lib/money.ts
// All amounts are integer MINOR units (e.g. USD cents, AED fils). Never floats in storage.

/** Parse a decimal string (max 2dp) into integer minor units. */
export function toMinor(decimal: string): number {
  const trimmed = decimal.trim();
  const neg = trimmed.startsWith("-");
  const [whole, frac = ""] = trimmed.replace("-", "").split(".");
  const fracPadded = (frac + "00").slice(0, 2);
  const minor = Number(whole) * 100 + Number(fracPadded);
  return neg ? -minor : minor;
}

/** Format integer minor units as a plain 2dp decimal string. */
export function fromMinor(minor: number): string {
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${neg ? "-" : ""}${whole}.${frac}`;
}

/** Convert native minor units to base minor units at `rate` (base per native), rounded to nearest minor unit. */
export function convert(nativeMinor: number, rate: number): number {
  return Math.round(nativeMinor * rate);
}

/** Display format: grouped thousands + 2dp + currency suffix. */
export function formatMoney(minor: number, ccy: string): string {
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = whole.toLocaleString("en-US");
  return `${neg ? "-" : ""}${grouped}.${frac} ${ccy}`;
}
