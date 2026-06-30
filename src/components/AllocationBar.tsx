import type { Holding } from "../lib/types";

const PALETTE = ["#3a6ea5", "#5a86b8", "#2f7a4d", "#b8860b", "#9a907f", "#7a5c9e", "#b4462f"];

export function AllocationBar({ holdings }: { holdings: Holding[] }) {
  const total = holdings.reduce((s, h) => s + h.currentValueNative, 0);
  if (total <= 0) return null;
  return (
    <div className="bar" role="img" aria-label="allocation">
      {holdings.map((h, i) => (
        <span key={h.id} style={{ width: `${(h.currentValueNative / total) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
      ))}
    </div>
  );
}
