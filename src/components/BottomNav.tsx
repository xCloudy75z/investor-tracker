export type Tab = "home" | "costs" | "data";

export function BottomNav({ active, onNavigate }: { active: Tab; onNavigate: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      <button className={`tab ${active === "home" ? "on" : ""}`} onClick={() => onNavigate("home")} aria-label="Dashboard">
        <svg viewBox="0 0 24 24"><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>
        Dashboard
      </button>
      <button className={`tab ${active === "costs" ? "on" : ""}`} onClick={() => onNavigate("costs")} aria-label="Fees and FX">
        <svg viewBox="0 0 24 24"><path d="M19 5 5 19" /><circle cx="7.5" cy="7.5" r="2.2" /><circle cx="16.5" cy="16.5" r="2.2" /></svg>
        Fees &amp; FX
      </button>
      <button className={`tab ${active === "data" ? "on" : ""}`} onClick={() => onNavigate("data")} aria-label="Settings">
        <svg viewBox="0 0 24 24"><path d="M4 7h10" /><path d="M18 7h2" /><circle cx="16" cy="7" r="2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="8" cy="17" r="2" /></svg>
        Settings
      </button>
    </nav>
  );
}
