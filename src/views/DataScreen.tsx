import { useState } from "react";
import { parseImport } from "../lib/importer";
import { downloadText, exportText, replaceData, readFileText, forceUpdate } from "../app/runtime";
import type { Envelope } from "../lib/types";
import { Confirm } from "../components/Confirm";

interface Props { onBack: () => void; onReplaced: (env: Envelope) => void; }

export function DataScreen({ onBack, onReplaced }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Envelope | null>(null);

  function tryParse(src: string) {
    const r = parseImport(src);
    if (!r.ok) { setError(r.errors.join("; ")); setPending(null); return; }
    setError(null); setPending(r.envelope);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await readFileText(file);
    tryParse(content);
  }

  function applyReplace() {
    if (!pending) return;
    replaceData(pending);
    onReplaced(pending);
  }

  const [updating, setUpdating] = useState(false);
  const [check, setCheck] = useState<string | null>(null);

  async function checkForUpdates() {
    setCheck("Checking…");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("no version file");
      const data = await res.json() as { version?: string };
      if (data.version && data.version === __APP_VERSION__) setCheck(`latest:✓ You're on the latest version.`);
      else setCheck(`update:Update available (latest: ${data.version ?? "?"}). Tap "Update app" below.`);
    } catch {
      setCheck("info:Couldn't check — make sure you're online.");
    }
  }

  return (
    <main className="wrap">
      <header className="appbar"><button className="back" onClick={onBack}>‹ Settings &amp; data</button></header>

      <h2 className="sect">App</h2>
      <p className="verline">Version <b>{__APP_VERSION__}</b></p>
      <p className="muted small">This is when this version was released (UAE time), not the current time.</p>
      <button className="datalink" onClick={checkForUpdates} style={{ marginTop: 10 }}>Check for updates</button>
      {check && (
        <p className={check.startsWith("latest:") ? "okmsg" : check.startsWith("update:") ? "err" : "muted small"}>
          {check.replace(/^(latest|update|info):/, "")}
        </p>
      )}
      <p className="muted small">Updating gets the latest version without reinstalling — your saved data is kept.</p>
      <button className="datalink" disabled={updating} onClick={() => { setUpdating(true); forceUpdate(); }}>
        {updating ? "Updating…" : "Update app to latest version"}
      </button>

      <h2 className="sect">Export / backup</h2>
      <p className="muted small">Download your current data as a file you can keep or re-import.</p>
      <button className="datalink" onClick={() => downloadText("investor-tracker-backup.json", exportText())}>Download my data</button>

      <h2 className="sect">Import</h2>
      <p className="muted small">Load the data file I prepare from your statements. This replaces current data — a backup is saved automatically first.</p>
      <label className="datalink" style={{ textAlign: "center", cursor: "pointer" }}>
        Choose data file…
        <input type="file" accept="application/json,.json" onChange={onFile} style={{ display: "none" }} />
      </label>
      {error && <p className="err">{error}</p>}
      {pending && <p className="okmsg">Looks valid: {pending.accounts.length} account(s), {pending.cashflows.length} cash flows, {pending.holdings.length} holdings.</p>}
      {pending && <ConfirmGate onApply={applyReplace} />}
    </main>
  );
}

function ConfirmGate({ onApply }: { onApply: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <button className="datalink danger" onClick={() => setAsking(true)}>Replace my data with this</button>
      {asking && <Confirm message="Replace current data with the imported file? Your current data is backed up first." onConfirm={onApply} onCancel={() => setAsking(false)} />}
    </>
  );
}
