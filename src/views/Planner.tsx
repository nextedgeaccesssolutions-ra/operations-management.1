import { useMemo, useState } from "react";
import { PROJECTS, ROLE_SCOPE, TASKS, getCurve, portfolioCurve, timeAgo } from "../data";
import type { Role, Task } from "../data";
import { GanttChart, GanttLegend, SCurveChart } from "../charts";
import { Icon, Reveal, SectionHead, StatusPill } from "../ui";
import { useApp } from "../store";

function useRole(): Role {
  const { role } = useApp();
  return role ?? "admin";
}

// ───────────────────────── GANTT VIEW ─────────────────────────

export function GanttView() {
  const app = useApp();
  const role = useRole();
  const scope = ROLE_SCOPE[role];
  const isAdmin = role === "admin";
  const canEdit = role !== "client";
  const [sel, setSel] = useState<string>("ALL");
  const [editMode, setEditMode] = useState(false);
  const [selTask, setSelTask] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ start: number; dur: number; prog: number }>({ start: 0, dur: 1, prog: 0 });

  const codes = sel === "ALL" ? scope : [sel];
  const tasks = useMemo(
    () => TASKS.filter((t) => codes.includes(t.prj)).map((t) => (app.taskEdits[t.id] ? { ...t, ...app.taskEdits[t.id] } : t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codes.join(","), app.taskEdits],
  );
  const done = tasks.filter((t) => t.prog === 100 && !t.ms).length;
  const active = tasks.filter((t) => t.prog > 0 && t.prog < 100 && !t.ms).length;
  const ms = tasks.filter((t) => t.ms).length;
  const fieldDays = tasks.filter((t) => !t.ms).reduce((s, t) => s + t.dur, 0);

  const task: Task | null = tasks.find((t) => t.id === selTask) ?? null;
  const pending = selTask ? app.pendingTaskEdits[selTask] : undefined;

  const pick = (id: string) => {
    setSelTask(id);
    const t = TASKS.find((x) => x.id === id)!;
    const merged = { ...t, ...(app.taskEdits[id] ?? {}) };
    setDraft({ start: merged.start, dur: merged.dur, prog: merged.prog });
  };

  const dirty = task ? draft.start !== task.start || draft.dur !== task.dur || draft.prog !== task.prog : false;

  const submitEdit = () => {
    if (!task) return;
    const patch: { start?: number; dur?: number; prog?: number } = {};
    if (draft.start !== task.start) patch.start = draft.start;
    if (!task.ms && draft.dur !== task.dur) patch.dur = draft.dur;
    if (draft.prog !== task.prog) patch.prog = draft.prog;
    if (!Object.keys(patch).length) return;
    app.applyTaskEdit(task.id, patch);
    app.log(`${isAdmin ? "Applied" : "Proposed"} gantt edit on ${task.id}`, "plan");
  };

  return (
    <div className="space-y-5">
      <SectionHead
        kicker={`planning / gantt · ${role} scope`}
        title="Delivery Timeline"
        right={
          <div className="flex flex-wrap gap-1.5">
            {canEdit && (
              <button className={`chip ${editMode ? "chip-on" : ""}`} onClick={() => { setEditMode((v) => !v); if (editMode) setSelTask(null); }}>
                <Icon name="edit" size={11} /> {editMode ? "editing · click a bar" : "edit mode"}
              </button>
            )}
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

      {editMode && task && (
        <Reveal>
          <div className="panel panel-hot p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="microlabel mb-1 flex items-center gap-2">
                  task editor · {task.id}
                  {pending && <span className="chip !cursor-default !text-amberx !border-amberx/50"><span className="led led-amber led-live" /> pending at gate</span>}
                </div>
                <div className="text-[15px] font-semibold text-fog">{task.name}</div>
                <div className="font-mono text-[10px] text-dim tracking-wider uppercase mt-1">
                  {task.prj} · owner {task.owner}{task.ms ? " · milestone (duration locked)" : ""}
                </div>
              </div>
              <button className="btn !h-8" onClick={() => setSelTask(null)}><Icon name="x" size={12} /> close</button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="microlabel block mb-1.5">start offset (days from today)</label>
                <input type="number" className="input" value={draft.start}
                  onChange={(e) => setDraft((d) => ({ ...d, start: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="microlabel block mb-1.5">duration (work-days)</label>
                <input type="number" min={1} className="input" value={draft.dur} disabled={task.ms}
                  onChange={(e) => setDraft((d) => ({ ...d, dur: Math.max(1, Number(e.target.value)) }))} />
              </div>
              <div>
                <label className="microlabel block mb-1.5 flex justify-between">
                  <span>progress</span><span className="text-amberx tnum">{draft.prog}%</span>
                </label>
                <input type="range" min={0} max={100} step={5} value={draft.prog} className="w-full accent-[#ffb224] mt-2.5"
                  onChange={(e) => setDraft((d) => ({ ...d, prog: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
              <div className="font-mono text-[10px] text-dim tracking-wider uppercase">
                {dirty
                  ? <>Δ start {task.start} → <span className="text-amberx">{draft.start}</span>{!task.ms && <> · dur {task.dur} → <span className="text-amberx">{draft.dur}</span></>} · prog {task.prog} → <span className="text-amberx">{draft.prog}%</span></>
                  : "no changes yet — adjust the fields above"}
              </div>
              <div className="flex gap-2">
                {pending && (
                  <button className="btn !h-8" onClick={() => { app.withdraw(pending.approvalId); app.toast("Gantt proposal withdrawn", "info"); }}>
                    withdraw proposal
                  </button>
                )}
                <button className={`btn ${isAdmin ? "btn-pri" : "btn-teal"} !h-8`} disabled={!dirty || !!pending} onClick={submitEdit}>
                  <Icon name={isAdmin ? "check" : "send"} size={12} />
                  {isAdmin ? "apply · L5" : pending ? "awaiting gate" : "submit to gate"}
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={80}>
        <div className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 text-mist text-[12px]">
              <Icon name="gantt" size={15} className="text-amberx" />
              <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase">{fieldDays} scheduled work-days · window −32d → +46d</span>
            </div>
            <div className="font-mono text-[10.5px] text-dim tracking-wider uppercase flex items-center gap-1.5">
              <Icon name="user" size={12} /> scoped to {role} clearance
              {Object.keys(app.taskEdits).length > 0 && <span className="text-amberx">· {Object.keys(app.taskEdits).length} applied edit{Object.keys(app.taskEdits).length > 1 ? "s" : ""}</span>}
            </div>
          </div>
          <GanttChart tasks={tasks} onSelect={editMode ? pick : undefined} selectedId={editMode ? selTask : null} />
          <GanttLegend />
          {canEdit && !editMode && (
            <p className="mt-3 font-mono text-[9.5px] tracking-wider text-dim uppercase">
              {isAdmin ? "L5 · enable edit mode to reschedule tasks — applies instantly" : "L4 · enable edit mode to propose reschedules — routed to the L5 gate"}
            </p>
          )}
        </div>
      </Reveal>
    </div>
  );
}

// ───────────────────────── S-CURVE VIEW ─────────────────────────

export function SCurveView() {
  const app = useApp();
  const role = useRole();
  const scope = ROLE_SCOPE[role];
  const isAdmin = role === "admin";
  const canEdit = role !== "client";
  const [sel, setSel] = useState<string>(isAdmin ? "PORTFOLIO" : scope[0]);
  const [certDraft, setCertDraft] = useState<number | null>(null);

  const data = useMemo(
    () => (sel === "PORTFOLIO" ? portfolioCurve(scope, app.curveEdits) : getCurve(sel, app.curveEdits)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, scope, app.curveEdits],
  );
  const prj = PROJECTS.find((p) => p.code === sel);
  const accent = prj?.color ?? "#ffb224";
  const label = sel === "PORTFOLIO" ? "Portfolio" : prj?.name ?? sel;
  const lastSync = Date.now() - 18 * 60_000;

  const certified = sel !== "PORTFOLIO" ? app.curveEdits[sel] : undefined;
  const pending = sel !== "PORTFOLIO" ? app.pendingCurveEdits[sel] : undefined;
  const base = prj?.progress ?? 0;
  const draft = certDraft ?? certified ?? base;

  const submitCert = () => {
    if (sel === "PORTFOLIO" || draft === (certified ?? base)) return;
    app.applyCurveEdit(sel, draft);
    app.log(`${isAdmin ? "Certified" : "Proposed certification for"} ${sel} at ${draft}%`, "plan");
  };

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
                <button key={c} className={`chip ${sel === c ? "chip-on" : ""}`} onClick={() => { setSel(c); setCertDraft(null); }}>
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
                {certified != null && <span className="chip !cursor-default !text-grnx !border-grnx/50">certified {certified}%</span>}
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

      {canEdit && sel !== "PORTFOLIO" && prj && (
        <Reveal delay={80}>
          <div className={`panel p-4 sm:p-5 ${isAdmin ? "panel-hot" : ""}`}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3.5">
              <div>
                <div className="microlabel mb-1 flex items-center gap-2">
                  curve certification
                  {pending && <span className="chip !cursor-default !text-amberx !border-amberx/50"><span className="led led-amber led-live" /> pending · {pending.patch}%</span>}
                  {certified != null && !pending && <span className="chip !cursor-default !text-grnx !border-grnx/50">live</span>}
                </div>
                <div className="text-[14px] font-semibold text-fog">Certify earned progress — {prj.code}</div>
              </div>
              {pending && (
                <button className="btn !h-8" onClick={() => { app.withdraw(pending.approvalId); app.toast("Certification withdrawn", "info"); }}>
                  withdraw
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
              <div>
                <label className="microlabel block mb-1.5 flex justify-between max-w-sm">
                  <span>certified completion</span>
                  <span className="tnum" style={{ color: accent }}>{draft}% <span className="text-dim">· baseline {base}%</span></span>
                </label>
                <input type="range" min={0} max={100} step={1} value={draft} disabled={!!pending}
                  className="w-full max-w-sm" style={{ accentColor: accent }}
                  onChange={(e) => setCertDraft(Number(e.target.value))} />
                <p className="font-mono text-[9.5px] tracking-wider text-dim uppercase mt-2">
                  {isAdmin
                    ? "L5 · curve recomputes instantly on apply"
                    : "L4 · certification routes to the L5 gate — curve holds until countersigned"}
                </p>
              </div>
              <button className={`btn ${isAdmin ? "btn-pri" : "btn-teal"} !h-9`} disabled={!!pending || draft === (certified ?? base)} onClick={submitCert}>
                <Icon name={isAdmin ? "check" : "send"} size={12} />
                {isAdmin ? "certify · L5" : pending ? "awaiting gate" : "submit certification"}
              </button>
            </div>
          </div>
        </Reveal>
      )}

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
