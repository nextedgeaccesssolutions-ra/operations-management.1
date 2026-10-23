import { useMemo } from "react";
import { MODULES, PROJECTS, ROLE_META, ROLE_SCOPE, TASKS, timeAgo } from "../data";
import type { Role } from "../data";
import { GanttLegend } from "../charts";
import { Donut, Icon, Progress, Reveal, SectionHead, Spark, Stat, StatusPill } from "../ui";
import { MiniBars } from "../charts";
import { useApp } from "../store";

const TAG_COLOR: Record<string, string> = {
  field: "#ffb224", sync: "#2fd6c3", eng: "#58a6ff", approval: "#ff5d55",
  qa: "#43d9a3", plan: "#94a4c0", data: "#2fd6c3", geo: "#ffb224", auth: "#e7edf8",
};

export function Dashboard() {
  const app = useApp();
  const role: Role = app.role ?? "admin";
  const meta = ROLE_META[role];
  const scope = ROLE_SCOPE[role];
  const projects = PROJECTS.filter((p) => scope.includes(p.code));
  const avg = Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length);
  const sitesOnline = app.sites.filter((s) => s.status !== "offline").length;

  const kpis = useMemo(() => {
    if (role === "admin") return [
      { label: "Projects under command", value: `${projects.length}`, sub: "2 amber · 1 red", accent: "#ffb224", spark: [3, 4, 4, 5, 5, 6, 6] },
      { label: "Pending approvals", value: `${app.pendingCount}`, sub: "SLA 24 h", accent: "#ff5d55", spark: [2, 4, 3, 5, 4, 3, app.pendingCount] },
      { label: "Open risks on matrix", value: "5", sub: "2 in red band", accent: "#ffb224", spark: [7, 6, 6, 5, 6, 5, 5] },
      { label: "Field nodes online", value: `${sitesOnline}/${app.sites.length}`, sub: "1 offline · 1 pending tag", accent: "#2fd6c3", spark: [6, 7, 7, 8, 7, 8, sitesOnline] },
    ];
    if (role === "client") return [
      { label: "Portfolio progress", value: `${avg}%`, sub: "+4 pts this week", accent: "#2fd6c3", spark: [52, 58, 61, 66, 70, 72, avg] },
      { label: "On-time projects", value: `${projects.filter((p) => p.status === "on-track").length}/${projects.length}`, sub: "plan variance +1.2 pts", accent: "#43d9a3", spark: [1, 1, 2, 2, 2, 2, 2] },
      { label: "My open requests", value: `${app.approvals.filter((a) => a.role === "client" && a.status === "pending").length}`, sub: "avg decision 6 h", accent: "#ffb224", spark: [0, 1, 1, 2, 1, 2, 1] },
      { label: "Next milestone", value: "T+9d", sub: projects[0]?.nextMilestone ?? "—", accent: "#58a6ff", spark: [9, 9, 8, 8, 7, 7, 6] },
    ];
    return [
      { label: "Assigned inspections", value: `${TASKS.filter((t) => t.who === "inspector" && scope.includes(t.prj) && t.prog < 100).length}`, sub: "3 sites this week", accent: "#58a6ff", spark: [6, 5, 7, 6, 8, 7, 7] },
      { label: "Steps locked · 7d", value: "63", sub: "runbook compliance 100%", accent: "#43d9a3", spark: [40, 44, 51, 49, 58, 60, 63] },
      { label: "Open NCRs", value: "3", sub: "1 awaiting re-test", accent: "#ff5d55", spark: [5, 5, 4, 4, 3, 4, 3] },
      { label: "Sync queue", value: app.offline ? `${app.syncQueue.length}` : "0", sub: app.offline ? "queued for uplink" : "all evidence synced", accent: "#2fd6c3", spark: [0, 2, 1, 3, 2, 1, app.offline ? Math.max(1, app.syncQueue.length) : 0] },
    ];
  }, [role, projects, app.pendingCount, app.approvals, app.offline, app.syncQueue.length, scope, avg, sitesOnline]);

  const quick: string[] =
    role === "admin"
      ? ["operations:risk-assessment", "operations:change-request", "operations:compliance-tracking", "data:build-dashboard"]
      : role === "client"
        ? ["operations:status-report", "operations:change-request", "data:analyze", "product-management:roadmap-update"]
        : ["operations:runbook", "engineering:deploy-checklist", "productivity:update", "pdf-viewer:fill-form"];

  const perfBars =
    role === "admin"
      ? [
          { label: "Change requests", value: 8, color: "#ffb224" },
          { label: "Open NCRs", value: 3, color: "#ff5d55" },
          { label: "Compliance items", value: 3, color: "#58a6ff" },
          { label: "Geo tags pending", value: app.sites.filter((s) => s.status === "pending").length, color: "#2fd6c3" },
          { label: "Docs in review", value: 5, color: "#94a4c0" },
        ]
      : role === "client"
        ? [
            { label: "Schedule variance +", value: 4, color: "#43d9a3", suffix: " pts" },
            { label: "Cost variance −", value: 2, color: "#ffb224", suffix: " pts" },
            { label: "Milestones next 30 d", value: 3, color: "#58a6ff" },
            { label: "Reports pending", value: 1, color: "#94a4c0" },
          ]
        : [
            { label: "Torque verifications", value: 14, color: "#ffb224" },
            { label: "Drone survey strings", value: 9, color: "#58a6ff" },
            { label: "Sampling points", value: 7, color: "#2fd6c3" },
            { label: "Runbook step-locks", value: 63, color: "#43d9a3" },
          ];

  return (
    <div className="space-y-6">
      {/* header strip */}
      <Reveal>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="microlabel mb-1.5 flex items-center gap-2">
              <span className="led led-live" style={{ background: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }} />
              {meta.clearance} · {meta.org}
            </div>
            <h1 className="font-display font-bold text-[26px] sm:text-[30px] leading-tight tracking-wide">
              {role === "admin" ? "Command Overview" : role === "client" ? "Portfolio Overview" : "Field Console"}
            </h1>
            <p className="text-[13px] text-mist mt-1.5 max-w-xl">
              {role === "admin"
                ? "All governed operations, live. Approvals queue is the single gate for edits, deletes and geo-tag authority."
                : role === "client"
                  ? "Your projects, earned-value truth and request pipeline — scoped to your clearance."
                  : "Today's inspection queue, site sync state and step-locked procedures for your sector."}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {quick.slice(0, 2).map((id) => {
              const mod = MODULES.find((x) => x.id === id)!;
              return (
                <button key={id} className="btn" onClick={() => app.nav("module", id)}>
                  <Icon name={mod.icon} size={13} className="text-amberx" />{mod.name}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k, i) => <Stat key={k.label} delay={i * 70} {...k} />)}
      </div>

      {/* projects + role queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Reveal className="lg:col-span-7">
          <div className="panel p-4 sm:p-5 h-full">
            <SectionHead kicker="governed delivery" title="Project Health" right={
              <button className="chip" onClick={() => app.nav("gantt")}><Icon name="gantt" size={11} /> open gantt</button>
            } />
            <div className="space-y-1">
              {projects.map((p) => (
                <button key={p.code} onClick={() => app.nav("gantt")}
                  className="rowline w-full text-left px-2.5 py-3 border border-transparent hover:border-line grid grid-cols-[1fr_auto] sm:grid-cols-[92px_1fr_90px_76px_auto] items-center gap-x-4 gap-y-1.5 group cursor-pointer">
                  <span className="font-mono text-[11px] tracking-wider" style={{ color: p.color }}>{p.code}</span>
                  <span className="col-span-2 sm:col-span-1">
                    <span className="block text-[13px] text-fog font-medium truncate group-hover:text-amberx transition-colors">{p.name}</span>
                    <span className="block font-mono text-[9.5px] text-dim tracking-wider uppercase mt-0.5">{p.client}</span>
                  </span>
                  <span className="hidden sm:block"><Progress value={p.progress} color={p.color} /></span>
                  <span className="hidden sm:flex justify-end"><Spark values={p.trend} color={p.color} w={64} hgt={22} /></span>
                  <span className="flex items-center gap-2 justify-end col-span-2 sm:col-span-1">
                    <span className="font-mono text-[11px] tnum text-mist">{p.progress}%</span>
                    <StatusPill s={p.status} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={90}>
          <div className="panel p-4 sm:p-5 h-full">
            {role === "admin" ? (
              <>
                <SectionHead kicker="single gate" title="Approval Queue" right={
                  <button className="chip" onClick={() => app.nav("approvals")}>all</button>
                } />
                <div className="space-y-2">
                  {app.approvals.filter((a) => a.status === "pending").slice(0, 4).map((a) => (
                    <div key={a.id} className="border border-line bg-[#0d1526] px-3 py-2.5 flex items-center gap-3 group hover:border-line2 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] text-fog font-medium truncate">{a.title}</div>
                        <div className="font-mono text-[9.5px] text-dim tracking-wider uppercase mt-0.5">
                          {a.type} · {a.requester} · {timeAgo(a.ts)}
                        </div>
                      </div>
                      <button className="btn btn-grn !h-7 !px-2" title="Approve"
                        onClick={() => { app.decide(a.id, "approved", "Approved from dashboard."); app.toast(`Approved · ${a.title}`, "ok"); }}>
                        <Icon name="check" size={12} />
                      </button>
                      <button className="btn btn-danger !h-7 !px-2" title="Reject"
                        onClick={() => { app.decide(a.id, "rejected", "Rejected from dashboard."); app.toast(`Rejected · ${a.title}`, "err"); }}>
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ))}
                  {app.pendingCount === 0 && <div className="microlabel py-6 text-center">queue clear — no pending gates</div>}
                </div>
              </>
            ) : role === "client" ? (
              <>
                <SectionHead kicker="governance trail" title="My Requests" right={
                  <button className="chip" onClick={() => app.nav("approvals")}>track</button>
                } />
                <div className="space-y-2">
                  {app.approvals.filter((a) => a.role === "client").slice(0, 4).map((a) => (
                    <div key={a.id} className="border border-line bg-[#0d1526] px-3 py-2.5 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] text-fog font-medium truncate">{a.title}</div>
                        <div className="font-mono text-[9.5px] text-dim tracking-wider uppercase mt-0.5">{a.type} · {timeAgo(a.ts)}</div>
                      </div>
                      <StatusPill s={a.status} />
                    </div>
                  ))}
                </div>
                <div className="mt-4 border border-dashed border-line px-3 py-3">
                  <div className="microlabel mb-2">upcoming milestones</div>
                  {projects.map((p) => (
                    <div key={p.code} className="flex items-center justify-between py-1.5 border-b border-line/40 last:border-0">
                      <span className="text-[12px] text-mist">{p.nextMilestone}</span>
                      <span className="font-mono text-[10.5px] tnum" style={{ color: p.color }}>{p.milestoneDate}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHead kicker="today · sector 07" title="Inspection Queue" right={
                  <button className="chip" onClick={() => app.nav("geo")}><Icon name="pin" size={11} /> map</button>
                } />
                <div className="space-y-2">
                  {TASKS.filter((t) => t.who === "inspector" && scope.includes(t.prj) && t.prog < 100).slice(0, 4).map((t) => (
                    <div key={t.id} className="border border-line bg-[#0d1526] px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] text-fog font-medium truncate">{t.name}</span>
                        <span className="font-mono text-[10px] text-dim">{t.prj}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1"><Progress value={t.prog} color="#58a6ff" h={4} /></div>
                        <span className="font-mono text-[10.5px] tnum text-blux">{t.prog}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`mt-4 px-3 py-3 border flex items-center gap-3 ${app.offline ? "border-amberx/50 bg-amberx/5" : "border-line bg-[#0d1526]"}`}>
                  <Icon name={app.offline ? "wifioff" : "wifi"} size={16} className={app.offline ? "text-amberx" : "text-grnx"} />
                  <div>
                    <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-fog">{app.offline ? "Offline node" : "Uplink live"}</div>
                    <div className="text-[11px] text-dim mt-0.5">{app.offline ? `${app.syncQueue.length} ops queued on device` : "evidence syncing in real time"}</div>
                  </div>
                  <button className="btn ml-auto !h-7" onClick={app.toggleOffline}>{app.offline ? "reconnect" : "go offline"}</button>
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>

      {/* performance + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Reveal className="lg:col-span-7">
          <div className="panel p-4 sm:p-5 h-full">
            <SectionHead kicker={role === "admin" ? "command metrics" : role === "client" ? "earned value" : "field output"} title="Performance Strip" />
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Donut value={avg} color={meta.accent} label="complete" />
              <div className="flex-1 w-full">
                <MiniBars items={perfBars} />
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-line/60">
              <GanttLegend />
            </div>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={90}>
          <div className="panel p-4 sm:p-5 h-full">
            <SectionHead kicker="control log" title="Live Activity" right={
              <span className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.15em] text-grnx uppercase"><span className="led led-grn led-live" /> streaming</span>
            } />
            <div className="space-y-0.5 max-h-[380px] overflow-y-auto pr-1">
              {app.activity.slice(0, 12).map((a) => (
                <div key={a.id} className="flex gap-3 py-2 border-b border-line/40 last:border-0 rowline px-1.5">
                  <span className="mt-1.5 w-1.5 h-1.5 flex-none" style={{ background: TAG_COLOR[a.tag] ?? "#94a4c0" }} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-mist leading-snug"><span className="text-fog font-medium">{a.who}</span> — {a.text}</p>
                    <div className="font-mono text-[9px] text-dim tracking-wider uppercase mt-0.5">{a.tag} · {timeAgo(a.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
