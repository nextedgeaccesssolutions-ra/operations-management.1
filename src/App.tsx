import { useEffect, useMemo, useState } from "react";
import { AppProvider, useApp } from "./store";
import { CREDENTIALS, NAV_FOR, PORTALS, ROLE_META } from "./data";
import type { Role, ViewKey } from "./data";
import { Avatar, Icon, LiveClock } from "./ui";
import { Dashboard } from "./views/Dashboard";
import { GanttView, SCurveView } from "./views/Planner";
import { GeoView } from "./views/Geo";
import { ApprovalsView } from "./views/Approvals";
import { LibraryView, ModuleView } from "./views/Modules";
import { SearchPanel } from "./views/Search";
import { SettingsView } from "./views/Settings";
import { ReportsView } from "./views/Reports";

// ───────────────────────── responsive adapter ─────────────────────────

type BP = "MOBILE" | "TABLET" | "LAPTOP";
function useBreakpoint(): BP {
  const [bp, setBp] = useState<BP>("LAPTOP");
  useEffect(() => {
    const calc = () => setBp(window.innerWidth < 768 ? "MOBILE" : window.innerWidth < 1200 ? "TABLET" : "LAPTOP");
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return bp;
}

// ───────────────────────── login · separate portals ─────────────────────────

const BOOT_LINES = [
  "[boot] opsdeck kernel v4.2.1 — edge relay mesh",
  "[auth] clearance broker online · 3 portals registered",
  "[sync] conflict scorer armed · policy=manual-merge",
  "[geo ] waypoint index warm · 8 sites · 1 pending tag",
  "[gate] approval state machine listening · SLA 24 h",
  "[node] field unit 07 heartbeat · 4 min",
  "[net ] uplink nominal · TLS 1.3 · latency 38 ms",
  "[led ] all subsystems green — awaiting credentials",
];

function BootTicker() {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(BOOT_LINES.length);
      return;
    }
    const t = window.setInterval(() => setN((v) => (v >= BOOT_LINES.length ? v : v + 1)), 380);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="font-mono text-[10.5px] leading-relaxed text-dim space-y-1">
      {BOOT_LINES.slice(0, n).map((l, i) => (
        <div key={l} className={`bootline ${i === n - 1 ? "text-mist" : ""}`}>{l}</div>
      ))}
      {n >= BOOT_LINES.length && (
        <div className="text-amberx">▌ awaiting operator credentials<span className="blinkc">_</span></div>
      )}
    </div>
  );
}

function LoginScreen() {
  const app = useApp();
  const [sel, setSel] = useState<Role>("admin");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const portal = PORTALS[sel];
  const meta = ROLE_META[sel];
  const cred = CREDENTIALS[sel];

  const bump = () => setShakeKey((k) => k + 1);

  const doLogin = () => {
    if (checking) return;
    if (!user.trim() || !pass.trim()) {
      setErr("Enter both operator ID and passphrase.");
      bump();
      return;
    }
    setChecking(true);
    setErr(null);
    window.setTimeout(() => {
      const ok = app.login(user, pass);
      setChecking(false);
      if (!ok) {
        setErr(`ACCESS DENIED — credentials rejected for the ${portal.name}.`);
        bump();
      }
    }, 620);
  };

  const autofill = () => {
    setUser(cred.user);
    setPass(cred.pass);
    setErr(null);
  };

  return (
    <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* left — system identity */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-line overflow-hidden">
        <div className="pointer-events-none absolute -right-28 top-1/3 w-[440px] h-[440px] rounded-full border border-line/70">
          <div className="absolute inset-6 rounded-full border border-line/50" />
          <div className="absolute inset-16 rounded-full border border-line/40" />
          <div className="sweep absolute inset-0 rounded-full"
            style={{ background: "conic-gradient(from 0deg, rgba(255,178,36,0.13), transparent 24%)" }} />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 grid place-items-center border border-amberx/60 text-amberx"
              style={{ boxShadow: "0 0 22px rgba(255,178,36,.18)" }}>
              <Icon name="layers" size={19} />
            </span>
            <div>
              <div className="font-display font-bold text-[22px] tracking-[0.18em] text-fog leading-none">OPSDECK</div>
              <div className="microlabel mt-1">operations control platform</div>
            </div>
          </div>
          <h1 className="font-display font-semibold text-[30px] xl:text-[36px] leading-[1.12] tracking-wide text-fog mt-10 max-w-md">
            One ledger.
            <br />
            <span className="text-amberx">Three portals.</span>
            <br />
            Zero blind spots.
          </h1>
          <p className="text-[13px] text-mist leading-relaxed mt-4 max-w-md">
            Command, Client and Field consoles share the same approval gate, geo evidence and
            offline-sync ledger — each scoped to its clearance.
          </p>
        </div>

        <div className="relative max-w-md">
          <BootTicker />
          <div className="flex items-center gap-5 mt-6 pt-4 border-t border-line/60">
            <span className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] text-mist uppercase">
              <span className="led led-grn led-live" /> uplink
            </span>
            <span className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] text-mist uppercase">
              <span className="led led-amber led-live" /> nodes 7/8
            </span>
            <span className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] text-mist uppercase">
              <span className="led led-teal led-live" /> gate SLA 24 h
            </span>
            <span className="ml-auto"><LiveClock /></span>
          </div>
        </div>
      </div>

      {/* right — portal selector + credentials */}
      <div className="flex flex-col justify-center px-5 sm:px-10 py-10">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <span className="w-9 h-9 grid place-items-center border border-amberx/60 text-amberx">
            <Icon name="layers" size={16} />
          </span>
          <div>
            <div className="font-display font-bold text-[17px] tracking-[0.18em] text-fog leading-none">OPSDECK</div>
            <div className="microlabel mt-0.5">operations control platform</div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="microlabel mb-3">select access portal</div>
          <div className="space-y-2 mb-7">
            {(Object.keys(PORTALS) as Role[]).map((r) => {
              const p = PORTALS[r];
              const m = ROLE_META[r];
              const on = r === sel;
              return (
                <button key={r} onClick={() => { setSel(r); setErr(null); }}
                  className="w-full flex items-center gap-3.5 p-3 border text-left transition-all duration-200 cursor-pointer"
                  style={on
                    ? { borderColor: `${m.accent}88`, background: `${m.accent}0d`, boxShadow: `0 0 26px ${m.accent}12` }
                    : { borderColor: "var(--color-line)", background: "#0d1526" }}>
                  <span className="w-9 h-9 grid place-items-center border flex-none transition-colors"
                    style={{ color: on ? m.accent : "#5d6d8b", borderColor: on ? `${m.accent}55` : "var(--color-line)", background: on ? `${m.accent}10` : "transparent" }}>
                    <Icon name={p.icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold text-[14px] tracking-wide text-fog">{p.name}</span>
                      <span className="chip !cursor-default !h-5" style={{ color: m.accent, borderColor: `${m.accent}55` }}>{p.tag}</span>
                    </span>
                    <span className="block text-[11px] text-dim mt-1 leading-snug">{m.clearance} · {m.persona} — {p.desc}</span>
                  </span>
                  <Icon name="chev" size={14} className={on ? "text-amberx" : "text-dim"} />
                </button>
              );
            })}
          </div>

          <div key={shakeKey} className={shakeKey ? "form-shake" : ""}>
            <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} className="space-y-3.5">
              <div>
                <label className="microlabel block mb-1.5" htmlFor="ops-id">operator ID</label>
                <input id="ops-id" className="input !h-11 font-mono" placeholder={cred.user} autoComplete="username"
                  value={user} onChange={(e) => { setUser(e.target.value); setErr(null); }} />
              </div>
              <div>
                <label className="microlabel block mb-1.5" htmlFor="ops-pass">passphrase</label>
                <input id="ops-pass" type="password" className="input !h-11 font-mono" placeholder="••••••••••" autoComplete="current-password"
                  value={pass} onChange={(e) => { setPass(e.target.value); setErr(null); }} />
              </div>

              {err && (
                <div className="border border-redx/50 bg-redx/8 px-3 py-2.5 flex items-center gap-2.5">
                  <Icon name="alert" size={14} className="text-redx flex-none" />
                  <span className="font-mono text-[11px] tracking-wide text-redx">{err}</span>
                </div>
              )}

              <button type="submit" className="btn btn-pri w-full !h-11 !text-[12px]" disabled={checking}>
                {checking
                  ? <><span className="led led-live" style={{ background: "#131007" }} /> verifying clearance…</>
                  : <><Icon name="lock" size={13} /> enter {portal.tag} portal</>}
              </button>
            </form>
          </div>

          <div className="mt-5 border border-dashed border-line px-3.5 py-3 flex items-center gap-3 flex-wrap">
            <span className="microlabel">demo key</span>
            <code className="font-mono text-[11px] text-mist">{cred.hint}</code>
            <button className="btn !h-7 ml-auto" onClick={autofill}>
              <Icon name="zap" size={11} className="text-amberx" /> autofill
            </button>
          </div>

          <div className="microlabel text-center mt-6">
            sessions persist on this node · sign out to lock the portal
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── shell ─────────────────────────

function OfflineBanner() {
  const app = useApp();
  if (!app.offline) return null;
  return (
    <div className="border-b border-amberx/40 bg-amberx/8 px-3 sm:px-5 py-2 flex items-center gap-3 flex-wrap">
      <Icon name="wifioff" size={14} className="text-amberx" />
      <span className="font-mono text-[10.5px] tracking-[0.13em] uppercase text-amberx">
        offline node · {app.syncQueue.length} op{app.syncQueue.length === 1 ? "" : "s"} queued
      </span>
      <button className="btn btn-teal !h-7 ml-auto" onClick={app.toggleOffline}>
        <Icon name="sync" size={11} /> restore uplink
      </button>
    </div>
  );
}

function NavList({ collapsed }: { collapsed: boolean }) {
  const app = useApp();
  const role = app.role!;
  const items = NAV_FOR[role];
  const gatedSettings = role !== "admin" ? Object.keys(app.pendingSettings).length : 0;

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
      {!collapsed && <div className="microlabel px-3 mb-2">{PORTALS[role].tag} navigation</div>}
      {items.map((it) => {
        const active = app.view === it.view || (it.view === "modules" && app.view === "module");
        const badge = it.view === "approvals" ? app.pendingCount : it.view === "settings" ? gatedSettings : 0;
        return (
          <button key={it.view} onClick={() => app.nav(it.view)} title={collapsed ? it.label : undefined}
            className={`w-full flex items-center gap-3 px-3 h-10 text-[12.5px] transition-all duration-150 cursor-pointer border-l-2 ${
              active
                ? "border-l-amberx bg-amberx/8 text-amberx"
                : "border-l-transparent text-mist hover:text-fog hover:bg-pane2/50 hover:border-l-line2"}`}>
            <Icon name={it.icon} size={16} className={active ? "text-amberx" : "text-dim"} />
            {!collapsed && <span className="truncate flex-1 text-left">{it.label}</span>}
            {!collapsed && badge > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 border border-amberx/50 text-amberx bg-amberx/10 tnum">{badge}</span>
            )}
            {collapsed && badge > 0 && <span className="absolute ml-4 -mt-4 w-1.5 h-1.5 bg-amberx rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const app = useApp();
  const role = app.role!;
  const meta = ROLE_META[role];
  return (
    <div className="border-t border-line p-3 space-y-2.5">
      {!collapsed && (
        <div className="flex items-center gap-2.5">
          <Avatar initials={meta.initials} accent={meta.accent} />
          <div className="min-w-0 leading-tight">
            <div className="text-[12px] text-fog truncate">{meta.persona}</div>
            <div className="font-mono text-[8.5px] tracking-wider text-dim uppercase">{meta.clearance} · {meta.org}</div>
          </div>
        </div>
      )}
      <div className={`flex ${collapsed ? "flex-col" : "justify-between"} items-center gap-2`}>
        {!collapsed && (
          <button className="chip" onClick={app.reset} title="Reset demo data on this node">
            <Icon name="sync" size={11} /> reset
          </button>
        )}
        <button className="btn btn-danger !h-8 w-full" onClick={app.logout} title="Sign out of this portal">
          <Icon name="out" size={12} /> {!collapsed && "sign out"}
        </button>
      </div>
    </div>
  );
}

function NotifDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp();
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/55" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[70] w-[320px] max-w-[92vw] border-l border-line bg-deep overflow-y-auto">
        <div className="flex items-center justify-between px-4 h-[54px] border-b border-line">
          <span className="microlabel">control feed</span>
          <button className="btn !h-7 !px-2" onClick={onClose}><Icon name="x" size={12} /></button>
        </div>
        <div className="p-3 space-y-1">
          {app.activity.slice(0, 18).map((a) => (
            <div key={a.id} className="border border-line/60 bg-[#0d1526] px-3 py-2.5 rowline">
              <div className="text-[12px] text-mist leading-snug"><span className="text-fog font-medium">{a.who}</span> — {a.text}</div>
              <div className="font-mono text-[9px] text-dim tracking-wider uppercase mt-1">{a.tag} · {new Date(a.ts).toLocaleTimeString("en-GB", { hour12: false })}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Toasts() {
  const app = useApp();
  const tone: Record<string, string> = {
    ok: "border-grnx/50 text-grnx", warn: "border-amberx/50 text-amberx",
    err: "border-redx/50 text-redx", info: "border-blux/50 text-blux",
  };
  const icon: Record<string, string> = { ok: "check", warn: "alert", err: "alert", info: "radio" };
  return (
    <div className="fixed bottom-4 right-4 z-[90] space-y-2 w-[300px] max-w-[90vw]">
      {app.toasts.map((t) => (
        <div key={t.id} className={`toast-in border bg-deep/95 backdrop-blur px-3.5 py-3 flex items-center gap-2.5 ${tone[t.tone]}`}>
          <Icon name={icon[t.tone]} size={14} />
          <span className="text-[12px] text-fog leading-snug">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

function Shell() {
  const app = useApp();
  const role = app.role!;
  const meta = ROLE_META[role];
  const portal = PORTALS[role];
  const bp = useBreakpoint();
  const collapsed = bp === "TABLET";
  const [drawer, setDrawer] = useState(false);
  const [notif, setNotif] = useState(false);
  useEffect(() => { setDrawer(false); }, [app.view, app.moduleId]);

  const curLabel = useMemo(() => {
    const map: Record<ViewKey, string> = {
      dashboard: "Dashboard", gantt: "Gantt Planner", scurve: "S-Curve", geo: "Geo Map",
      approvals: "Approval Gate", modules: "Modules", module: "Module Workspace",
      search: "Enterprise Search", settings: "Platform Settings",
      reports: "Inspection Reports",
    };
    return map[app.view];
  }, [app.view]);

  const sidebarInner = (
    <>
      <button className="flex items-center gap-2.5 px-4 h-[54px] border-b border-line cursor-pointer" onClick={() => app.nav("dashboard")}>
        <span className="w-7 h-7 grid place-items-center border border-amberx/60 text-amberx flex-none"><Icon name="layers" size={14} /></span>
        <span className={`${collapsed ? "hidden" : "block"} text-left leading-tight`}>
          <span className="font-display font-bold text-[14px] tracking-[0.16em] text-fog">OPSDECK</span>
          <span className="block font-mono text-[8px] tracking-[0.14em] text-dim uppercase">ops control</span>
        </span>
      </button>
      <NavList collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </>
  );

  return (
    <div className="relative z-10 min-h-screen">
      {/* mobile drawer */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[250px] flex flex-col border-r border-line bg-deep">
            <button className="absolute right-2 top-3 btn !h-7 !px-2" onClick={() => setDrawer(false)}><Icon name="x" size={12} /></button>
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* tablet + laptop sidebar */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 z-50 flex-col border-r border-line bg-[#0b1220]/92 backdrop-blur-md ${collapsed ? "w-16" : "w-[230px]"}`}>
        {sidebarInner}
      </aside>

      <div className={collapsed ? "md:pl-16" : "md:pl-[230px]"}>
        <header className="sticky top-0 z-40 h-[54px] border-b border-line bg-ink/85 backdrop-blur-md flex items-center gap-3 px-3 sm:px-5">
          <button className="md:hidden btn !h-8 !px-2" onClick={() => setDrawer(true)}><Icon name="menu" size={15} /></button>
          <span className="chip !cursor-default" style={{ color: meta.accent, borderColor: `${meta.accent}55`, background: `${meta.accent}0d` }}>
            <Icon name={portal.icon} size={11} /> {portal.tag}
          </span>
          <span className="font-display font-semibold text-[12.5px] tracking-[0.13em] uppercase text-fog hidden sm:block">{portal.name}</span>
          <span className="microlabel hidden lg:block">/ {curLabel}</span>

          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            <button
              className={`hidden md:flex chip !cursor-default ${app.offline ? "!text-amberx !border-amberx/50" : "!text-grnx !border-grnx/40"}`}
              onClick={app.toggleOffline} title="Toggle offline node">
              <span className={`led led-live ${app.offline ? "led-amber" : "led-grn"}`} />
              {app.offline ? `offline · ${app.syncQueue.length}` : "online"}
            </button>
            <button className="relative btn !h-8 !px-2.5" onClick={() => setNotif(true)} title="Control feed">
              <Icon name="bell" size={14} />
              {app.pendingCount > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 grid place-items-center bg-amberx text-[8px] font-mono text-[#131007]">{app.pendingCount}</span>}
            </button>
            <div className="hidden sm:block"><LiveClock /></div>
            <Avatar initials={meta.initials} accent={meta.accent} />
          </div>
        </header>

        <OfflineBanner />

        <main className="p-3 sm:p-5 lg:p-7 max-w-[1460px] mx-auto">
          {app.view === "dashboard" && <Dashboard />}
          {app.view === "gantt" && <GanttView />}
          {app.view === "scurve" && <SCurveView />}
          {app.view === "geo" && <GeoView />}
          {app.view === "approvals" && <ApprovalsView />}
          {app.view === "settings" && <SettingsView />}
          {app.view === "reports" && <ReportsView />}
          {app.view === "modules" && <LibraryView />}
          {app.view === "module" && app.moduleId && <ModuleView id={app.moduleId} />}
          {app.view === "search" && <SearchPanel />}
        </main>

        <footer className="border-t border-line mt-6 px-5 py-4 flex items-center gap-3 flex-wrap">
          <span className="microlabel">opsdeck v4.2.1</span>
          <span className="microlabel">· {portal.name} · {meta.clearance}</span>
          <span className="ml-auto flex items-center gap-2 microlabel">
            <span className={`led led-live ${app.offline ? "led-amber" : "led-grn"}`} />
            {app.offline ? "local node · queue armed" : "online · edge relay eu-west"}
          </span>
        </footer>
      </div>

      <NotifDrawer open={notif} onClose={() => setNotif(false)} />
      <Toasts />
      <div className="noise-layer" />
    </div>
  );
}

function Root() {
  const app = useApp();
  return (
    <>
      {app.role ? <Shell /> : (
        <>
          <LoginScreen />
          <Toasts />
          <div className="noise-layer" />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
