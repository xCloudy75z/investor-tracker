import { accountStanding, portfolioStanding, type View } from "../lib/calc";
import { formatMoney } from "../lib/money";
import type { Envelope } from "../lib/types";

interface Props {
  env: Envelope;
  view: View;
  setView: (v: View) => void;
  onOpenBroker: (id: string) => void;
  onOpenData: () => void;
}

export function Home({ env, view, setView, onOpenBroker, onOpenData }: Props) {
  const fx = env.settings.fxRateNow;
  const inputs = env.accounts.map((account) => ({ account, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view }));
  const total = portfolioStanding(inputs);
  const pos = total.standingBase >= 0;

  return (
    <main className="wrap">
      <header className="bar">
        <span>All brokers</span>
        <div className="toggle">
          <button className={view === "current" ? "on" : ""} onClick={() => setView("current")}>Current round</button>
          <button className={view === "all" ? "on" : ""} onClick={() => setView("all")}>All-time</button>
        </div>
      </header>

      <section className="hero">
        <div className="cell"><div className="lab">In</div><div className="big">{formatMoney(total.capitalBase, "AED")}</div></div>
        <div className="cell"><div className="lab">Worth now</div><div className="big">{formatMoney(total.worthBase, "AED")}</div></div>
        <div className="cell"><div className="lab">Standing</div>
          <div className={`big ${pos ? "pos" : "neg"}`}>{formatMoney(total.standingBase, "AED")}</div>
          <div className={`sub ${pos ? "pos" : "neg"}`}>{(total.standingPct * 100).toFixed(1)}%</div>
        </div>
      </section>

      <h2 className="sect">Per broker</h2>
      {env.accounts.map((account) => {
        const r = accountStanding({ account, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view });
        const up = r.standingBase >= 0;
        return (
          <button className="card cardbtn" key={account.id} onClick={() => onOpenBroker(account.id)}>
            <div className="nm">{account.label}</div>
            <div className="vals">
              <div className="w">{formatMoney(r.worthBase, "AED")}</div>
              <div className={`p ${up ? "pos" : "neg"}`}>{formatMoney(r.standingBase, "AED")} · {(r.standingPct * 100).toFixed(1)}%</div>
            </div>
          </button>
        );
      })}

      <button className="datalink" onClick={onOpenData}>Import / Export data</button>
    </main>
  );
}
