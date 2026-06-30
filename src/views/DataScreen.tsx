import { useState } from "react";
import { parseImport } from "../lib/importer";
import { downloadText, exportText, replaceData, readFileText } from "../app/runtime";
import type { Envelope } from "../lib/types";
import { Confirm } from "../components/Confirm";

interface Props { onBack: () => void; onReplaced: (env: Envelope) => void; }

export function DataScreen({ onBack, onReplaced }: Props) {
  const [text, setText] = useState("");
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
    setText(content);
    tryParse(content);
  }

  function applyReplace() {
    if (!pending) return;
    replaceData(pending);
    onReplaced(pending);
  }

  return (
    <main className="wrap">
      <header className="bar"><button className="back" onClick={onBack}>‹ Data</button></header>

      <h2 className="sect">Export / backup</h2>
      <p className="muted small">Download your current data as a file you can keep or re-import.</p>
      <button className="datalink" onClick={() => downloadText("investor-tracker-backup.json", exportText())}>Download my data</button>

      <h2 className="sect">Import</h2>
      <p className="muted small">Load a data file (e.g. one prepared from your statements). This replaces current data — a backup is saved automatically first.</p>
      <input type="file" accept="application/json,.json" onChange={onFile} />
      <textarea className="paste" placeholder="…or paste data here" value={text} onChange={(e) => { setText(e.target.value); }} onBlur={() => text && tryParse(text)} />
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
