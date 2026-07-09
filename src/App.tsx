import { useEffect, useState } from "react";
import "./App.css";
import { load, recordWorth, now, getLivePrice, setLivePrice, fetchSpusPrice } from "./app/runtime";
import { applyLivePrice, shouldRefetch, type LivePrice } from "./lib/price";
import { seedEnvelope } from "./lib/seed";
import { portfolioStanding, type View } from "./lib/calc";
import type { Envelope } from "./lib/types";
import { Home } from "./views/Home";
import { Broker } from "./views/Broker";
import { DataScreen } from "./views/DataScreen";
import { Costs } from "./views/Costs";
import { BottomNav, type Tab } from "./components/BottomNav";

type Route = { name: "home" } | { name: "broker"; id: string } | { name: "data" } | { name: "costs" };

function worthOf(e: Envelope): number {
  return portfolioStanding(
    e.accounts.map((account) => ({ account, flows: e.cashflows, holdings: e.holdings, fxRateNow: e.settings.fxRateNow, view: "current" as View }))
  ).worthBase;
}

export function App() {
  const [env, setEnv] = useState<Envelope | null>(null);
  const [live, setLive] = useState<LivePrice | null>(() => getLivePrice());
  const [refreshState, setRefreshState] = useState<"idle" | "updating" | "done" | "error">("idle");
  const [view, setView] = useState<View>("current");
  const [route, setRoute] = useState<Route>({ name: "home" });

  useEffect(() => {
    let e = load();
    if (e.accounts.length === 0) { e = seedEnvelope(); }
    setEnv(e);
    recordWorth(worthOf(applyLivePrice(e, getLivePrice(), now())));
    if (shouldRefetch(getLivePrice(), now())) {
      fetchSpusPrice().then((lp) => { setLivePrice(lp); setLive(lp); }).catch(() => {});
    }
  }, []);

  const refreshPrice = () => {
    setRefreshState("updating");
    fetchSpusPrice()
      .then((lp) => { setLivePrice(lp); setLive(lp); setRefreshState("done"); setTimeout(() => setRefreshState("idle"), 1800); })
      .catch(() => { setRefreshState("error"); setTimeout(() => setRefreshState("idle"), 1800); });
  };

  if (!env) return <main className="wrap">Loading…</main>;

  const shown = applyLivePrice(env, live, now());

  const activeTab: Tab = route.name === "costs" ? "costs" : route.name === "data" ? "data" : "home";

  let content;
  if (route.name === "broker") {
    const account = shown.accounts.find((a) => a.id === route.id);
    content = account
      ? <Broker env={shown} account={account} view={view} setView={setView} onBack={() => setRoute({ name: "home" })} />
      : <Home env={shown} view={view} setView={setView} live={live} onRefreshPrice={refreshPrice} refreshState={refreshState} onOpenBroker={(id) => setRoute({ name: "broker", id })} />;
  } else if (route.name === "data") {
    content = <DataScreen onReplaced={(e) => { setEnv(e); recordWorth(worthOf(applyLivePrice(e, getLivePrice(), now()))); setRoute({ name: "home" }); }} />;
  } else if (route.name === "costs") {
    content = <Costs env={shown} />;
  } else {
    content = <Home env={shown} view={view} setView={setView} live={live} onRefreshPrice={refreshPrice} refreshState={refreshState} onOpenBroker={(id) => setRoute({ name: "broker", id })} />;
  }

  return (
    <>
      {content}
      <BottomNav active={activeTab} onNavigate={(t) => setRoute({ name: t } as Route)} />
    </>
  );
}
