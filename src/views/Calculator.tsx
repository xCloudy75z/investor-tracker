import { useState } from "react";
import { breakeven, LANE_PRESETS, type Lane } from "../lib/breakeven";
import { formatMoney, toMinor } from "../lib/money";

export function Calculator() {
  const [depositStr, setDepositStr] = useState("5000");
  const [gainStr, setGainStr] = useState("20");
  const [laneId, setLaneId] = useState("cheap");
  const [customFxStr, setCustomFxStr] = useState("1.0");
  const [customFeeStr, setCustomFeeStr] = useState("0");

  const depositMinor = Math.max(0, toMinor(depositStr || "0"));
  const gainPct = Number(gainStr) || 0;

  const activeLane: Lane =
    laneId === "custom"
      ? {
          id: "custom", label: "Custom", hint: "your own rate",
          fxInPct: Number(customFxStr) || 0, fxOutPct: Number(customFxStr) || 0,
          flatFeeMinor: Math.max(0, toMinor(customFeeStr || "0")),
        }
      : LANE_PRESETS.find((l) => l.id === laneId)!;

  const res = breakeven(depositMinor, gainPct, activeLane);
  const pos = res.netProfitMinor >= 0;
  const compare = LANE_PRESETS.map((l) => ({ lane: l, r: breakeven(depositMinor, gainPct, l) }));
  const g = Math.round(gainPct * 10) / 10;

  return (
    <main className="wrap">
      <h1 className="h1 rise d1">What would I actually net?</h1>
      <p className="muted small rise d1" style={{ margin: "0 4px 16px" }}>
        A +{g}% gain isn’t +{g}% in your pocket — you pay the FX spread going in <i>and</i> out,
        plus any flat fee. Try a what-if below.
      </p>

      <div className="box rise d2">
        <label className="calclab">How much would you put in?</label>
        <div className="calcfield">
          <input className="linkinput" inputMode="decimal" value={depositStr}
            onChange={(e) => setDepositStr(e.target.value)} aria-label="Deposit amount in AED" />
          <span className="calcunit">AED</span>
        </div>
        <label className="calclab" style={{ marginTop: 12 }}>Gain you expect</label>
        <div className="calcfield">
          <input className="linkinput" inputMode="decimal" value={gainStr}
            onChange={(e) => setGainStr(e.target.value)} aria-label="Expected gain percent" />
          <span className="calcunit">%</span>
        </div>
      </div>

      <h2 className="sect">Funding lane</h2>
      <div className="lanesel rise d3">
        {LANE_PRESETS.map((l) => (
          <button key={l.id} className={`lanebtn ${laneId === l.id ? "on" : ""}`} onClick={() => setLaneId(l.id)}>
            <b>{l.label}</b><span>{l.hint}</span>
          </button>
        ))}
        <button className={`lanebtn ${laneId === "custom" ? "on" : ""}`} onClick={() => setLaneId("custom")}>
          <b>Custom</b><span>enter your own rate</span>
        </button>
      </div>
      {laneId === "custom" && (
        <div className="box rise" style={{ marginTop: 10 }}>
          <label className="calclab">FX spread each way</label>
          <div className="calcfield">
            <input className="linkinput" inputMode="decimal" value={customFxStr}
              onChange={(e) => setCustomFxStr(e.target.value)} aria-label="Custom FX spread percent" />
            <span className="calcunit">%</span>
          </div>
          <label className="calclab" style={{ marginTop: 12 }}>Flat withdrawal fee</label>
          <div className="calcfield">
            <input className="linkinput" inputMode="decimal" value={customFeeStr}
              onChange={(e) => setCustomFeeStr(e.target.value)} aria-label="Custom flat fee in AED" />
            <span className="calcunit">AED</span>
          </div>
        </div>
      )}

      <section className="hero rise d4" style={{ marginTop: 18 }}>
        <div className="hcap">Your actual profit</div>
        <div className={`num hstand ${pos ? "pos" : "neg"}`}>{formatMoney(res.netProfitMinor, "AED")}</div>
        <span className={`pct ${pos ? "pos" : "neg"}`}>
          {pos ? "▴" : "▾"} {Math.abs(res.netProfitPct).toFixed(1)}% of what you put in
        </span>
        <div className="hsplit">
          <div><div className="l">Break-even</div><div className="num v">+{res.breakEvenPct.toFixed(1)}%</div></div>
          <div><div className="l">Lost to costs</div><div className="num v">{formatMoney(res.totalCostMinor, "AED")}</div></div>
        </div>
      </section>

      <h2 className="sect">Step by step</h2>
      <div className="box">
        <div className="row noborder"><div className="muted">You put in</div><div className="r num">{formatMoney(depositMinor, "AED")}</div></div>
        <div className="row noborder"><div className="muted">After deposit FX (−{activeLane.fxInPct}%)</div><div className="r num">{formatMoney(res.afterDepositMinor, "AED")}</div></div>
        <div className="row noborder"><div className="muted">After {g >= 0 ? "+" : ""}{g}% gain</div><div className="r num">{formatMoney(res.grownMinor, "AED")}</div></div>
        <div className="row noborder"><div className="muted">You get back (−{activeLane.fxOutPct}% FX{activeLane.flatFeeMinor ? " − fee" : ""})</div><div className="r num">{formatMoney(res.receivedMinor, "AED")}</div></div>
        <div className="row noborder tbtop"><div><b>Net profit</b></div><div className={`r num ${pos ? "pos" : "neg"}`}><b>{formatMoney(res.netProfitMinor, "AED")}</b></div></div>
      </div>

      <h2 className="sect">Same what-if, every lane</h2>
      <div className="box">
        {compare.map(({ lane, r }) => (
          <div className="row noborder" key={lane.id}>
            <div>{lane.label} <span className="muted small">· break-even +{r.breakEvenPct.toFixed(1)}%</span></div>
            <div className={`r num ${r.netProfitMinor >= 0 ? "pos" : "neg"}`}>
              {formatMoney(r.netProfitMinor, "AED")} <span className="muted small">({r.netProfitPct >= 0 ? "+" : ""}{r.netProfitPct.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>

      <p className="muted small" style={{ margin: "16px 4px 0" }}>
        The dirham is pegged to the dollar (3.6725), so there’s no currency-swing risk here — the only
        FX cost is your bank or broker’s spread, charged both when you fund and when you withdraw.
        eToro figures are estimates, and copy-trading adds the spreads of every trade you copy.
      </p>
    </main>
  );
}
