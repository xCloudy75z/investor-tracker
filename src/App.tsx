import { useEffect, useState } from "react";
import "./App.css";
import { load, recordWorth } from "./app/runtime";
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
  const [view, setView] = useState<View>("current");
  const [route, setRoute] = useState<Route>({ name: "home" });

  useEffect(() => {
    let e = load();
    if (e.accounts.length === 0) { e = seedEnvelope(); }
    setEnv(e);
    recordWorth(worthOf(e));
  }, []);

  if (!env) return <main className="wrap">Loading…</main>;

  const activeTab: Tab = route.name === "costs" ? "costs" : route.name === "data" ? "data" : "home";

  let content;
  if (route.name === "broker") {
    const account = env.accounts.find((a) => a.id === route.id);
    content = account
      ? <Broker env={env} account={account} view={view} setView={setView} onBack={() => setRoute({ name: "home" })} />
      : <Home env={env} view={view} setView={setView} onOpenBroker={(id) => setRoute({ name: "broker", id })} />;
  } else if (route.name === "data") {
    content = <DataScreen onReplaced={(e) => { setEnv(e); recordWorth(worthOf(e)); setRoute({ name: "home" }); }} />;
  } else if (route.name === "costs") {
    content = <Costs env={env} />;
  } else {
    content = <Home env={env} view={view} setView={setView} onOpenBroker={(id) => setRoute({ name: "broker", id })} />;
  }

  return (
    <>
      {content}
      <BottomNav active={activeTab} onNavigate={(t) => setRoute({ name: t } as Route)} />
    </>
  );
}
