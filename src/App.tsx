import { useEffect, useState } from "react";
import "./App.css";
import { load, loadTheme } from "./app/runtime";
import { seedEnvelope } from "./lib/seed";
import type { View } from "./lib/calc";
import type { Envelope } from "./lib/types";
import { Home } from "./views/Home";
import { Broker } from "./views/Broker";
import { DataScreen } from "./views/DataScreen";

type Route = { name: "home" } | { name: "broker"; id: string } | { name: "data" };

export function App() {
  const [env, setEnv] = useState<Envelope | null>(null);
  const [view, setView] = useState<View>("current");
  const [route, setRoute] = useState<Route>({ name: "home" });

  useEffect(() => {
    loadTheme();
    let e = load();
    if (e.accounts.length === 0) { e = seedEnvelope(); }
    setEnv(e);
  }, []);

  if (!env) return <main className="wrap">Loading…</main>;

  if (route.name === "broker") {
    const account = env.accounts.find((a) => a.id === route.id);
    // If the account exists, show it; otherwise fall through to Home (no setState during render).
    if (account) {
      return <Broker env={env} account={account} view={view} setView={setView} onBack={() => setRoute({ name: "home" })} />;
    }
  }
  if (route.name === "data") {
    return <DataScreen onBack={() => setRoute({ name: "home" })} onReplaced={(e) => { setEnv(e); setRoute({ name: "home" }); }} />;
  }
  return <Home env={env} view={view} setView={setView} onOpenBroker={(id) => setRoute({ name: "broker", id })} onOpenData={() => setRoute({ name: "data" })} />;
}
