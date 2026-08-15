import { useMemo, useState } from "react";
import { PROJECTS, ROLE_SCOPE, SCURVES, TASKS, portfolioCurve, timeAgo } from "../data";
import type { Role } from "../data";
import { GanttChart, GanttLegend, SCurveChart } from "../charts";
import { Icon, Reveal, SectionHead, StatusPill } from "../ui";
import { useApp } from "../store";

function useRole(): Role {
  const { role } = useApp();
  return role ?? "admin";
}

// ───────────────────────── GANTT VIEW ─────────────────────────

export function GanttView() {
  const role = useRole();
  const scope = ROLE_SCOPE[role];
  const [sel, setSel] = useState<string>("ALL");

  const codes = sel === "ALL" ? scope : [sel];
  const tasks = useMemo(() => TASKS.filter((t) => codes.includes(t.prj)), [codes.join(",")]); // eslint-disable-line
  const done = tasks.filter((t) => t.prog === 100 && !t.ms).length;
  const active = tasks.filter((t) => t.prog > 0 && t.prog < 100 && !t.ms).length;
  const ms = tasks.filter((t) => t.ms).length;
  const fieldDays = tasks.filter((t) => !t.ms).reduce((s, t) => s + t.dur, 0);

  return (
    <div className="space-y-5">
      <SectionHead
        kicker={`planning / gantt · ${role} scope`}
        title="Delivery Timeline"
        right={
          <div className="flex flex-wrap gap-1.5">
            <button className={`chip ${sel === "ALL" ? "chip-on" : ""}`} onClick={() => setSel("ALL")}>All in scope</button>
            {scope.map((c) => {
              const p = PROJECTS.find((x) => x.code === c)!;
              return (
                <button key={c} className={`chip ${sel === c ? "chip-on" : ""}`} onClick={() => setSel(c)} title={p.name}>
                  <span className="w-1.5 h-1.5" style={{ background: p.color }} />{c}
                </button>
              );
            })}
          </div>
        }
      />

      <Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          {[
            ["Tasks in view", `${tasks.length}`],
            ["Complete", `${done}`],
            ["In flight", `${active}`],
            ["Milestones", `${ms}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#0d1526] px-4 py-3">
              <div className="microlabel">{k}</div>
              <div className="font-display font-bold text-xl tnum text-fog mt-1">{v}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 text-mist text-[12px]">
              <Icon name="gantt" size={15} className="text-amberx" />
              <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase">{fieldDays} scheduled work-days · window −32d → +46d</span>
            </div>
            <div className="font-mono text-[10.5px] text-dim tracking-wider uppercase flex items-center gap-1.5">
              <Icon name="user" size={12} /> scoped to {role} clearance
            </div>
          </div>
          <GanttChart tasks={tasks} />
          <GanttLegend />
        </div>
      </Reveal>
    </div>
  );
}

// ───────────────────────── S-CURVE VIEW ─────────────────────────

export function SCurveView() {
  const role = useRole();
  const scope = ROLE_SCOPE[role];
  const isAdmin = role === "admin";
  const [sel, setSel] = useState<string>(isAdmin ? "PORTFOLIO" : scope[0]);

  const data = useMemo(
    () => (sel === "PORTFOLIO" ? portfolioCurve(scope) : SCURVES[sel]),
    [sel, scope],
  );
  const prj = PROJECTS.find((p) => p.code === sel);
  const accent = prj?.color ?? "#ffb224";
  const label = sel === "PORTFOLIO" ? "Portfolio" : prj?.name ?? sel;
  const lastSync = Date.now() - 18 * 60_000;

  return (
    <div className="space-y-5">
      <SectionHead
        kicker={`planning / earned value · ${role} scope`}
        title="Progress S-Curve"
        right={
          <div className="flex flex-wrap gap-1.5">
            {isAdmin && (
              <button className={`chip ${sel === "PORTFOLIO" ? "chip-on" : ""}`} onClick={() => setSel("PORTFOLIO")}>
                <Icon name="layers" size={11} /> Portfolio
              </button>
            )}
            {scope.map((c) => {
              const p = PROJECTS.find((x) => x.code === c)!;
              return (
                <button key={c} className={`chip ${sel === c ? "chip-on" : ""}`} onClick={() => setSel(c)}>
                  <span className="w-1.5 h-1.5" style={{ background: p.color }} />{c}
                </button>
              );
            })}
          </div>
        }
      />

      <Reveal>
        <div className="panel p-4 sm:p-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
            <div>
              <div className="microlabel mb-1">{sel === "PORTFOLIO" ? "aggregate of 6 governed projects" : sel}</div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-display font-semibold text-lg text-fog">{label}</h3>
                {prj && <StatusPill s={prj.status} />}
              </div>
            </div>
            <div className="text-right font-mono text-[10.5px] text-dim leading-relaxed tracking-wider">
              <div className="flex items-center gap-1.5 justify-end"><span className="led led-teal led-live" /> RECOMPUTED {timeAgo(lastSync).toUpperCase()}</div>
              <div>WEEKLY EARNED-VALUE ROLLUP</div>
            </div>
          </div>
          <SCurveChart data={data} accent={accent} name={label} />
        </div>
      </Reveal>

      {prj && (
        <Reveal delay={100}>
          <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
            {[
              ["NEXT MILESTONE", prj.nextMilestone, prj.milestoneDate],
              ["DELIVERY MANAGER", prj.manager, "owner of forecast"],
              ["FIELD INSPECTOR", prj.inspector, "evidence sign-off"],
            ].map(([k, v, s]) => (
              <div key={k} className="bg-[#0d1526] px-4 py-3.5">
                <div className="microlabel">{k}</div>
                <div className="text-[14px] text-fog font-medium mt-1.5">{v}</div>
                <div className="font-mono text-[10px] text-dim mt-0.5 tracking-wider uppercase">{s}</div>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
