// src/lib/chart.ts — pure: turn a worth-history series into SVG path strings.
export interface HistoryPoint { date: string; worthBase: number; }

export interface ChartGeometry { line: string; area: string; min: number; max: number; }

export function chartGeometry(points: HistoryPoint[], w: number, h: number, pad: number): ChartGeometry {
  if (points.length === 0) return { line: "", area: "", min: 0, max: 0 };
  const vals = points.map((p) => p.worthBase);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((p.worthBase - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const lastX = xy[xy.length - 1][0].toFixed(1);
  const firstX = xy[0][0].toFixed(1);
  const area = `${line} L${lastX} ${(h - pad).toFixed(1)} L${firstX} ${(h - pad).toFixed(1)} Z`;
  return { line, area, min, max };
}
