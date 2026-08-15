import { useEffect, useState } from "react";
import { MODULES, PROJECTS, ROLE_META } from "./data";
import type { Role, ViewKey } from "./data";
import { AppProvider, useApp } from "./store";
import type { Toast } from "./store";
import { Avatar, Icon, LiveClock, Reveal, Toggle } from "./ui";
import { Dashboard } from "./views/Dashboard";
import { GanttView, SCurveView } from "./views/Planner";
import { GeoView } from "./views/Geo";
import { ApprovalsView } from "./views/Approvals";
import { LibraryView, ModuleView } from "./views/Modules";
import { SearchPanel } from "./views/Search";

// ───────────────────────── nav config ─────────────────────────

const NAV: { group: string; items: { v: ViewKey; icon: string; label: string }[] }[] = [
  { group: "Command", items: [{ v: "dashboard", icon: "grid", label: "Dashboard" }] },
  { group: "Planning", items: [{ v: "gantt", icon: "gantt", label: "Gantt Chart" }, { v: "scurve", icon: "curve", label: "S-Curve" }] },
  { group: "Field", items: [{ v: "geo", icon: "pin", label: "Geo-Tagging" }] },
  { group: "Governance", items: [{ v: "approvals", icon: "shield", label: "Approvals" }] },
  { group: "Library", items: [{ v: "modules", icon: "layers", label: "Modules" }, { v: "search", icon: "search", label: "Search" }] },
];

const VIEW_TITLE: Record<ViewKey, string> = {
  dashboard: "Dashboard", gantt: "Gantt Chart", scurve: "S-Curve", geo: "Geo-Tagging",
  approvals: "Approvals", modules: "Module Registry", module: "Module", search: "Enterprise Search",
};

function useBreakpoint() {
  const [bp, setBp] = useState<"MOBILE" | "TABLET" | "LAPTOP">("LAPTOP");
  useEffect(() => {
    const calc = () => setBp(window.innerWidth < 768 ? "MOBILE" : window.innerWidth < 1280 ? "TABLET" : "LAPTOP");
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return bp;
}

// ───────────────────────── access gate ─────────────────────────

const BOOT_LINES = [
  "> mounting opsdeck kernel .......... ok",
  "> local node · sqlite attach ....... ok",
  "> sync gateway handshake ........... 42 ms",
  "> geo index · sector 07 ............ 8 waypoints",
  "> approval gate .................... armed",
  "> s-curve recompute ................ 6 projects",
];

function AccessGate() {
  const app = useApp();
  const roles: Role[] = ["admin", "client", "inspector"];
  return (
    <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
      {/* brand / radar side */}
      <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-line/60 bg-[#0b1220]/60">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 grid place-items-center border border-amberx/60 text-amberx">
              <Icon name="layers" size={18} />
            </div>
            <div>
              <div className="font-display font-bold text-xl tracking-[0.08em]">OPSDECK</div>
              <div className="microlabel">operations control platform</div>
            </div>
          </div>
          <h1 className="font-display font-bold text-[34px] xl:text-[40px] leading-[1.08] mt-10 max-w-md">
            One deck for the field, the client and the <span className="text-amberx">gate</span>.
          </h1>
          <p className="text-[13.5px] text-mist leading-relaxed mt-4 max-w-md">
            Dashboards, Gantt and S-curve planning, geo-tagged waypoints and a single approval
            authority — offline-first, role-scoped, ledger-grade.
          </p>
        </div>

        <div className="flex items-center gap-10">
          {/* radar */}
          <div className="relative w-[150px] h-[150px] flex-none rounded-full border border-line2 overflow-hidden bg-[#0c1424]">
            {[30, 55, 80].map((p) => (
              <div key={p} className="absolute rounded-full border border-line/80" style={{ inset: `${(100 - p) / 2}%` }} />
            ))}
            <div className="absolute inset-0 sweep" style={{ background: "conic-gradient(from 0deg, rgba(255,178,36,0.35), transparent 70deg)" }} />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-amberx" style={{ top: "30%", left: "62%", boxShadow: "0 0 8px #ffb224" }} />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-tealx" style={{ top: "58%", left: "34%", boxShadow: "0 0 8px #2fd6c3" }} />
            <div className="absolute w-1 h-1 rounded-full bg-blux" style={{ top: "44%", left: "48%" }} />
            <div className="absolute inset-0 grid place-items-center"><div className="w-1.5 h-1.5 rounded-full bg-fog" /></div>
          </div>
          {/* boot log */}
          <div className="font-mono text-[10.5px] leading-[2.1] text-dim">
            {BOOT_LINES.map((l, i) => (
              <div key={i} className="bootline" style={{ animationDelay: `${0.25 + i * 0.3}s` }}>{l}</div>
            ))}
            <div className="bootline text-amberx" style={{ animationDelay: `${0.25 + BOOT_LINES.length * 0.3}s` }}>
              &gt; awaiting clearance<span className="blinkc">▌</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["offline-first node", "vercel-ready", "mobile · tablet · laptop", "3 clearance tiers"].map((t) => (
            <span key={t} className="chip !cursor-default">{t}</span>
          ))}
        </div>
      </div>

      {/* clearance selection */}
      <div className="flex items-center p-6 sm:p-10 xl:p-14">
        <div className="w-full max-w-lg mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 grid place-items-center border border-amberx/60 text-amberx"><Icon name="layers" size={16} /></div>
            <span className="font-display font-bold text-lg tracking-[0.08em]">OPSDECK</span>
          </div>
          <div className="microlabel mb-2">clearance selection</div>
          <h2 className="font-display font-bold text-[24px] text-fog tracking-wide">Choose your console</h2>
          <p className="text-[12.5px] text-mist mt-1.5 mb-6">Each tier sees a different deck — scope, tools and authority follow the badge.</p>

          <div className="space-y-3">
            {roles.map((r, i) => {
              const meta = ROLE_META[r];
              return (
                <Reveal key={r} delay={i * 90}>
                  <button onClick={() => app.setRole(r)}
                    className="group w-full text-left panel p-4 sm:p-5 flex items-center gap-4 cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
                    style={{ borderLeft: `3px solid ${meta.accent}`, transitionProperty: "transform, border-color, background" }}>
                    <Avatar initials={meta.initials} accent={meta.accent} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-display font-semibold text-[15.5px] text-fog group-hover:text-amberx transition-colors">{meta.label}</span>
                        <span className="font-mono text-[9px] tracking-[0.14em] px-1.5 py-0.5 border" style={{ color: meta.accent, borderColor: `${meta.accent}55` }}>{meta.clearance}</span>
                      </div>
                      <p className="text-[11.5px] text-mist leading-snug mt-1.5">{meta.blurb}</p>
                      <div className="font-mono text-[9px] text-dim tracking-wider uppercase mt-1.5">{meta.persona} · {meta.org}</div>
                    </div>
                    <Icon name="arrowR" size={17} className="text-dim group-hover:text-amberx group-hover:translate-x-1 transition-all flex-none" />
                  </button>
                </Reveal>
              );
            })}
          </div>

          <p className="font-mono text-[9.5px] text-dim tracking-wider uppercase mt-6 leading-relaxed">
            demo environment · state persists on device · switch tier any time from the topbar
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── shell pieces ─────────────────────────

function NavList({ collapsed, onNav }: { collapsed: boolean; onNav?: () => void }) {
  const app = useApp();
  const current = app.view === "module" ? "modules" : app.view;
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-4">
      {NAV.map((g) => (
        <div key={g.group}>
          {!collapsed && <div className="microlabel px-2 mb-1.5">{g.group}</div>}
          <div className="space-y-0.5">
            {g.items.map((it) => {
              const active = current === it.v;
              return (
                <button key={it.v} onClick={() => { app.nav(it.v); onNav?.(); }} title={it.label}
                  className={`w-full flex items-center gap-2.5 px-2.5 h-9 text-[12.5px] transition-colors cursor-pointer relative ${active ? "text-amberx bg-amberx/8" : "text-mist hover:text-fog hover:bg-pane2/50"}`}>
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-amberx" style={{ boxShadow: "0 0 8px #ffb224" }} />}
                  <Icon name={it.icon} size={15} className={active ? "text-amberx" : "text-dim"} />
                  {!collapsed && <span className="truncate">{it.label}</span>}
                  {!collapsed && it.v === "approvals" && app.pendingCount > 0 && (
                    <span className="ml-auto font-mono text-[9.5px] tnum px-1.5 py-0.5 bg-redx/15 text-redx border border-redx/40">{app.pendingCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const app = useApp();
  const bp = useBreakpoint();
  const [confirmReset, setConfirmReset] = useState(false);
  const meta = ROLE_META[app.role ?? "admin"];
  return (
    <div className="border-t border-line p-3 space-y-3">
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2`}>
        {!collapsed && <Toggle on={app.offline} onChange={app.toggleOffline} label={app.offline ? "offline node" : "online relay"} />}
        {collapsed && <button onClick={app.toggleOffline} title="toggle offline node"><Icon name={app.offline ? "wifioff" : "wifi"} size={16} className={app.offline ? "text-amberx" : "text-grnx"} /></button>}
        {!collapsed && (
          <span className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-wider text-dim border border-line px-1.5 py-1 uppercase" title="adaptive layout tier">
            <Icon name={bp === "MOBILE" ? "menu" : bp === "TABLET" ? "columns" : "grid"} size={10} />{bp}
          </span>
        )}
      </div>
      <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
        <Avatar initials={meta.initials} accent={meta.accent} />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="text-[11.5px] text-fog font-medium truncate">{meta.persona}</div>
            <div className="font-mono text-[8.5px] tracking-wider text-dim uppercase">{meta.clearance}</div>
          </div>
        )}
      </div>
      {!collapsed && (
        <button className="w-full text-center font-mono text-[8.5px] tracking-[0.14em] uppercase text-dim hover:text-redx transition-colors cursor-pointer"
          onClick={() => { if (confirmReset) app.reset(); else { setConfirmReset(true); window.setTimeout(() => setConfirmReset(false), 2600); } }}>
          {confirmReset ? "click again to wipe demo state" : "reset demo data"}
        </button>
      )}
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const app = useApp();
  const [roleOpen, setRoleOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const meta = ROLE_META[app.role ?? "admin"];
  const modName = app.view === "module" ? MODULES.find((m) => m.id === app.moduleId)?.name ?? "Module" : "";
  const notifs = [
    ...(app.role === "admin" && app.pendingCount > 0 ? [{ icon: "shield", text: `${app.pendingCount} approval${app.pendingCount > 1 ? "s" : ""} waiting at the gate`, t: "now", color: "#ffb224" }] : []),
    ...(app.offline ? [{ icon: "wifioff", text: `Offline node active · ${app.syncQueue.length} ops queued`, t: "now", color: "#ff5d55" }] : []),
    { icon: "pin", text: "ST-04 Ridgeline wind hold lifted — drone survey can resume", t: "22m", color: "#2fd6c3" },
    { icon: "gantt", text: "Block window B2 confirmed with Port Authority", t: "1h", color: "#58a6ff" },
    { icon: "curve", text: "Nightly S-curve recompute complete — 0 anomalies", t: "8h", color: "#94a4c0" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-3 sm:px-5 h-[54px]">
        <button className="lg:hidden btn !h-8 !px-2" onClick={onMenu} aria-label="menu"><Icon name="menu" size={15} /></button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="microlabel hidden sm:block">opsdeck /</span>
          <span className="font-display font-semibold text-[14px] text-fog tracking-wide truncate">
            {VIEW_TITLE[app.view]}{modName && <span className="text-dim font-normal"> · {modName}</span>}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {/* sync status */}
          <span className={`hidden md:flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] uppercase border px-2 h-7 ${app.offline ? "border-amberx/50 text-amberx bg-amberx/5" : "border-line text-dim"}`}>
            <span className={`led ${app.offline ? "led-amber" : "led-grn"} led-live`} />
            {app.offline ? `local · q${app.syncQueue.length}` : "synced"}
          </span>

          <button className="btn !h-8 !px-2.5" onClick={() => app.nav("search")} title="enterprise search">
            <Icon name="search" size={14} />
          </button>

          {/* bell */}
          <div className="relative">
            <button className="btn !h-8 !px-2.5 relative" onClick={() => { setBellOpen((v) => !v); setRoleOpen(false); }} title="notifications">
              <Icon name="bell" size={14} />
              {notifs.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 grid place-items-center bg-redx text-ink font-mono text-[8px] font-bold">{notifs.length}</span>}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-10 w-[300px] panel panel-hot shadow-2xl shadow-black/60 z-50">
                <div className="microlabel px-3.5 py-2.5 border-b border-line">signal feed</div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.map((n, i) => (
                    <div key={i} className="flex gap-2.5 px-3.5 py-2.5 border-b border-line/40 last:border-0 rowline">
                      <span className="w-1.5 h-1.5 mt-1.5 flex-none" style={{ background: n.color }} />
                      <div className="min-w-0"><p className="text-[11.5px] text-mist leading-snug">{n.text}</p>
                        <span className="font-mono text-[8.5px] text-dim tracking-wider uppercase">{n.t} ago</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* role switch */}
          <div className="relative">
            <button className="flex items-center gap-2 h-8 px-2 border border-line hover:border-line2 transition-colors cursor-pointer"
              onClick={() => { setRoleOpen((v) => !v); setBellOpen(false); }}>
              <Avatar initials={meta.initials} accent={meta.accent} />
              <span className="hidden sm:block text-left leading-tight">
                <span className="block text-[11px] text-fog font-medium">{meta.persona}</span>
                <span className="block font-mono text-[8px] tracking-wider uppercase" style={{ color: meta.accent }}>{meta.clearance}</span>
              </span>
              <Icon name="chevD" size={11} className="text-dim hidden sm:block" />
            </button>
            {roleOpen && (
              <div className="absolute right-0 top-10 w-[250px] panel panel-hot shadow-2xl shadow-black/60 z-50">
                <div className="microlabel px-3.5 py-2.5 border-b border-line">switch clearance tier</div>
                {(Object.keys(ROLE_META) as Role[]).map((r) => (
                  <button key={r} onClick={() => { app.setRole(r); setRoleOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rowline cursor-pointer text-left">
                    <Avatar initials={ROLE_META[r].initials} accent={ROLE_META[r].accent} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] text-fog">{ROLE_META[r].label}</span>
                      <span className="block font-mono text-[8.5px] tracking-wider uppercase text-dim">{ROLE_META[r].clearance}</span>
                    </span>
                    {app.role === r && <Icon name="check" size={13} className="text-amberx" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden xl:block pl-1"><LiveClock /></div>
        </div>
      </div>

      {app.offline && (
        <div className="flex items-center justify-center gap-2.5 px-4 py-1.5 bg-amberx/10 border-t border-amberx/30">
          <Icon name="wifioff" size={13} className="text-amberx" />
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-amberx">
            offline server node · {app.syncQueue.length} op{app.syncQueue.length === 1 ? "" : "s"} queued · reconnect to flush
          </span>
          <button className="btn !h-6 !px-2 !text-[9px] ml-2" onClick={app.toggleOffline}>reconnect</button>
        </div>
      )}
    </header>
  );
}

function Toasts() {
  const { toasts } = useApp();
  const tone: Record<Toast["tone"], [string, string]> = {
    ok: ["#43d9a3", "check"], warn: ["#ffb224", "alert"], err: ["#ff5d55", "x"], info: ["#58a6ff", "radio"],
  };
  return (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2 w-[290px] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const [c, ic] = tone[t.tone];
        return (
          <div key={t.id} className="toast-in panel flex items-center gap-2.5 px-3.5 py-3" style={{ borderColor: `${c}66` }}>
            <Icon name={ic} size={14} className="flex-none" />
            <span className="text-[12px] text-fog leading-snug">{t.msg}</span>
            <span className="w-1.5 h-1.5 ml-auto flex-none led" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
          </div>
        );
      })}
    </div>
  );
}

function Current() {
  const { view, moduleId } = useApp();
  switch (view) {
    case "gantt": return <GanttView />;
    case "scurve": return <SCurveView />;
    case "geo": return <GeoView />;
    case "approvals": return <ApprovalsView />;
    case "modules": return <LibraryView />;
    case "module": return <ModuleView id={moduleId ?? MODULES[0].id} />;
    case "search": return <div className="panel p-4 sm:p-6"><SearchPanel /></div>;
    default: return <Dashboard />;
  }
}

// ───────────────────────── root ─────────────────────────

function Shell() {
  const app = useApp();
  const bp = useBreakpoint();
  const collapsed = bp === "TABLET";
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { setDrawer(false); }, [app.view, app.moduleId]);

  if (!app.role) {
    return (
      <>
        <div className="noise-layer" />
        <AccessGate />
        <Toasts />
      </>
    );
  }

  return (
    <div className="relative z-10 min-h-screen">
      <div className="noise-layer" />

      {/* desktop / tablet sidebar */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 z-50 flex-col border-r border-line bg-[#0b1220]/92 backdrop-blur-md ${collapsed ? "w-16" : "w-[230px]"}`}>
        <button className="flex items-center gap-2.5 px-4 h-[54px] border-b border-line cursor-pointer" onClick={() => app.nav("dashboard")}>
          <span className="w-7 h-7 grid place-items-center border border-amberx/60 text-amberx flex-none"><Icon name="layers" size={14} /></span>
          <span className={`${collapsed ? "hidden" : "block"} text-left leading-tight`}>
            <span className="block font-display font-bold text-[14px] tracking-[0.08em] text-fog">OPSDECK</span>
            <span className="block font-mono text-[7.5px] tracking-[0.2em] text-dim uppercase">control platform</span>
          </span>
        </button>
        <NavList collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] flex flex-col border-r border-line bg-[#0b1220]">
            <div className="flex items-center justify-between px-4 h-[54px] border-b border-line">
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 grid place-items-center border border-amberx/60 text-amberx"><Icon name="layers" size={14} /></span>
                <span className="font-display font-bold text-[14px] tracking-[0.08em]">OPSDECK</span>
              </span>
              <button className="btn !h-7 !px-2" onClick={() => setDrawer(false)}><Icon name="x" size={13} /></button>
            </div>
            <NavList collapsed={false} onNav={() => setDrawer(false)} />
            <SidebarFooter collapsed={false} />
          </aside>
        </div>
      )}

      <div className={collapsed ? "md:pl-16" : "md:pl-[230px]"}>
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="px-3 sm:px-5 lg:px-7 py-5 lg:py-7 max-w-[1460px] mx-auto">
          <Current />
          <footer className="mt-10 pt-5 border-t border-line/60 flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-dim">opsdeck v3.1 · edge node sector-07 · offline-first</span>
            <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-dim">{PROJECTS.length} projects · {MODULES.length} modules · vercel-ready</span>
          </footer>
        </main>
      </div>

      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
