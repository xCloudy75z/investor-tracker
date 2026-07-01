import { costByAccount, costTotal } from "../lib/costs";
import { formatMoney } from "../lib/money";
import type { Envelope } from "../lib/types";

const LABEL: Record<string, string> = { sarwa: "Sarwa", baraka: "Baraka", etoro: "eToro" };

export function Costs({ env, onBack }: { env: Envelope; onBack: () => void }) {
  const total = costTotal(env);
  const rows = costByAccount(env);
  const byId = (id: string) => env.accounts.find((a) => a.id === id);

  return (
    <main className="wrap">
      <header className="appbar"><button className="back" onClick={onBack}>‹ Fees &amp; FX</button></header>

      <section className="hero">
        <div className="hcap">What it has cost you</div>
        <div className="num hstand neg">{formatMoney(total.totalBase, "AED")}</div>
        <div className="hsplit">
          <div><div className="l">Fees paid</div><div className="num v">{formatMoney(total.feesBase, "AED")}</div></div>
          <div><div className="l">FX spread</div><div className="num v">{formatMoney(total.fxDragBase, "AED")}</div></div>
        </div>
      </section>

      <p className="muted small" style={{ margin: "14px 4px" }}>
        “FX spread” is the AED you lost to your bank’s exchange rate versus the market peg — on every deposit and withdrawal. It’s a real, usually-hidden cost.
      </p>

      <div className="sect">By broker</div>
      <div className="box">
        {rows.map((r) => {
          const acc = byId(r.accountId);
          return (
            <div className="row" key={r.accountId}>
              <div className="hn">{acc ? (LABEL[acc.broker] ?? acc.label) : r.accountId}</div>
              <div className="r">{formatMoney(r.totalBase, "AED")}
                <span className="muted"> · fees {formatMoney(r.feesBase, "AED")} · FX {formatMoney(r.fxDragBase, "AED")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
