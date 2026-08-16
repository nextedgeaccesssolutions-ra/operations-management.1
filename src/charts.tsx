import { useId, useMemo, useRef, useState } from "react";
import { addDays, fmtShort, GANTT_WINDOW, PROJECTS } from "./data";
import type { SCurveData, Task, TaskKind } from "./data";

// ───────────────────────── GANTT ─────────────────────────

const DAY_W = 13;
const ROW_H = 38;
const LABEL_W = 224;

const KIND_COLOR: Record<TaskKind, string> = {
  field: "#ffb224", eng: "#58a6ff", qa: "#2fd6c3", docs: "#5d6d8b",
};
export const KIND_LABEL: Record<TaskKind, string> = {
  field: "Field work", eng: "Engineering", qa: "QA / inspection", docs: "Documentation",
};

export function GanttChart({ tasks, onSelect, selectedId }: {
  tasks: Task[]; onSelect?: (id: string) => void; selectedId?: string | null;
}) {
  const today = useMemo(() => new Date(), []);
  const win = GANTT_WINDOW;
  const width = LABEL_W + win.days * DAY_W;
  const todayIdx = -win.start;
  const winStart = addDays(today, win.start);

  const ticks = useMemo(() => {
    const out: { idx: number; label: string }[] = [];
    const d0 = new Date(winStart);
    const dow = (d0.getDay() + 6) % 7; // 0 = Monday
    for (let i = (7 - dow) % 7; i < win.days; i += 7) {
      out.push({ idx: i, label: fmtShort(addDays(winStart, i)) });
    }
    return out;
  }, [winStart, win.days]);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="relative" style={{ width }}>
        {/* header */}
        <div className="relative h-9 border-b border-line" style={{ marginLeft: LABEL_W }}>
          {ticks.map((tk) => (
            <div key={tk.idx} className="absolute top-0 h-full border-l border-line/70 pl-1.5 flex items-center"
              style={{ left: tk.idx * DAY_W }}>
              <span className="font-mono text-[9.5px] tracking-wider text-dim uppercase whitespace-nowrap">{tk.label}</span>
            </div>
          ))}
          <div className="absolute top-0 h-full flex items-center" style={{ left: todayIdx * DAY_W - 26 }}>
            <span className="font-mono text-[9px] tracking-[0.15em] text-amberx bg-amberx/10 border border-amberx/50 px-1.5 py-0.5">TODAY</span>
          </div>
        </div>

        {/* rows */}
        <div className="relative">
          {tasks.map((task) => {
            const prj = PROJECTS.find((p) => p.code === task.prj);
            const left = (task.start - win.start) * DAY_W;
            const wd = Math.max(task.ms ? 0 : 1, task.dur) * DAY_W;
            const isSel = selectedId === task.id;
            return (
              <div key={task.id} onClick={onSelect ? () => onSelect(task.id) : undefined}
                className={`rowline relative flex border-b group ${isSel ? "bg-amberx/6" : "border-line/40"} ${onSelect ? "cursor-pointer" : ""}`}
                style={{ height: ROW_H, boxShadow: isSel ? "inset 2px 0 0 #ffb224" : undefined }}>
                <div className="sticky left-0 z-[6] flex items-center gap-2 px-3 border-r border-line bg-[#0e1626]/95 backdrop-blur-sm shrink-0"
                  style={{ width: LABEL_W }}>
                  <span className="w-1.5 h-1.5 flex-none" style={{ background: prj?.color ?? "#94a4c0" }} />
                  <span className={`truncate text-[12px] transition-colors ${isSel ? "text-amberx font-medium" : "text-mist group-hover:text-fog"}`} title={task.name}>{task.name}</span>
                </div>
                <div className="relative flex-none" style={{ width: win.days * DAY_W }}>
                  {ticks.map((tk) => (
                    <span key={tk.idx} className="absolute top-0 bottom-0 border-l border-line/40" style={{ left: tk.idx * DAY_W }} />
                  ))}
                  {task.ms ? (
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[11px] h-[11px] rotate-45 border-2 z-[2]"
                      style={{ left, borderColor: "#e7edf8", background: "#0f1729", boxShadow: "0 0 10px rgba(231,237,248,.35)" }} />
                  ) : (
                    <div className="absolute top-1/2 -translate-y-1/2 h-[13px] border z-[2] cursor-default"
                      style={{ left, width: wd, background: `${KIND_COLOR[task.kind]}30`, borderColor: `${KIND_COLOR[task.kind]}88` }}>
                      <div className="h-full transition-all duration-700" style={{ width: `${task.prog}%`, background: KIND_COLOR[task.kind], boxShadow: `0 0 10px ${KIND_COLOR[task.kind]}55` }} />
                      {/* tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                        <div className="panel panel-hot px-3 py-2 min-w-[190px] shadow-xl shadow-black/50">
                          <div className="font-mono text-[9px] tracking-[0.15em] text-dim uppercase">{task.id} · {task.prj}</div>
                          <div className="text-[12px] text-fog font-medium mt-0.5">{task.name}</div>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px] text-mist">
                            <span>OWNER</span><span className="text-fog text-right">{task.owner}</span>
                            <span>WINDOW</span><span className="text-fog text-right">{fmtShort(addDays(today, task.start))} → {fmtShort(addDays(today, task.start + task.dur))}</span>
                            <span>PROGRESS</span><span className="text-right" style={{ color: KIND_COLOR[task.kind] }}>{task.prog}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* today line */}
          <div className="absolute top-0 bottom-0 w-px bg-amberx/80 pointer-events-none z-[5]"
            style={{ left: LABEL_W + todayIdx * DAY_W, boxShadow: "0 0 8px rgba(255,178,36,.6)" }} />
        </div>
      </div>
    </div>
  );
}

export function GanttLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
      {(Object.keys(KIND_COLOR) as TaskKind[]).map((k) => (
        <span key={k} className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-dim">
          <span className="w-3 h-[7px] border" style={{ background: `${KIND_COLOR[k]}30`, borderColor: `${KIND_COLOR[k]}88` }} />
          {KIND_LABEL[k]}
        </span>
      ))}
      <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-dim">
        <span className="w-[9px] h-[9px] rotate-45 border-2 border-fog bg-pane inline-block" /> Milestone
      </span>
    </div>
  );
}

// ───────────────────────── S-CURVE ─────────────────────────

export function SCurveChart({ data, accent = "#ffb224", name }: { data: SCurveData; accent?: string; name: string }) {
  const gid = useId().replace(/[:]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const W = 760, H = 330, padL = 46, padR = 18, padT = 20, padB = 30;
  const { weeks, planned, actual, forecast, curWeek } = data;
  const x = (w: number) => padL + (w / weeks) * (W - padL - padR);
  const y = (v: number) => padT + ((100 - v) / 100) * (H - padT - padB);

  const planPath = planned.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const actPts = actual.map((v, i) => (v == null ? null : [x(i), y(v)] as const)).filter(Boolean) as (readonly [number, number])[];
  const actPath = actPts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const fcPts = forecast.map((v, i) => (v == null ? null : [x(i), y(v)] as const)).filter(Boolean) as (readonly [number, number])[];
  const fcPath = fcPts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const areaPath = actPts.length
    ? `${actPath} L${actPts[actPts.length - 1][0].toFixed(1)},${y(0).toFixed(1)} L${actPts[0][0].toFixed(1)},${y(0).toFixed(1)} Z`
    : "";

  const planNow = planned[curWeek];
  const actNow = actual[curWeek] ?? 0;
  const variance = +(actNow - planNow).toFixed(1);
  const spi = planNow > 0 ? (actNow / planNow).toFixed(2) : "—";
  const fcEnd = forecast[weeks] ?? 0;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const w = Math.round(((px - padL) / (W - padL - padR)) * weeks);
    setHover(Math.max(0, Math.min(weeks, w)));
  };

  return (
    <div>
      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block cursor-crosshair"
          onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#1e2b47" strokeWidth="1" strokeDasharray={v === 0 ? "" : "3 5"} />
              <text x={padL - 9} y={y(v) + 3.5} textAnchor="end" fontSize="9.5" fill="#5d6d8b" fontFamily="IBM Plex Mono, monospace">{v}%</text>
            </g>
          ))}
          {Array.from({ length: weeks + 1 }, (_, w) => w).filter((w) => w % 2 === 0).map((w) => (
            <g key={w}>
              <line x1={x(w)} x2={x(w)} y1={padT} y2={H - padB} stroke="#1e2b47" strokeWidth="1" opacity="0.6" />
              <text x={x(w)} y={H - padB + 15} textAnchor="middle" fontSize="9.5" fill="#5d6d8b" fontFamily="IBM Plex Mono, monospace">W{w}</text>
            </g>
          ))}

          {areaPath && <path d={areaPath} fill={`url(#g${gid})`} />}
          <path d={planPath} fill="none" stroke="#94a4c0" strokeWidth="1.6" strokeDasharray="7 5" opacity="0.85" />
          {fcPath && <path d={fcPath} fill="none" stroke="#2fd6c3" strokeWidth="1.8" strokeDasharray="2 5" strokeLinecap="round" />}
          {actPath && <path d={actPath} fill="none" stroke={accent} strokeWidth="2.6" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${accent}88)` }} />}

          {/* data date */}
          <line x1={x(curWeek)} x2={x(curWeek)} y1={padT - 4} y2={H - padB} stroke={accent} strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
          <text x={x(curWeek)} y={padT - 8} textAnchor="middle" fontSize="8.5" fill={accent} fontFamily="IBM Plex Mono, monospace" letterSpacing="1.5">DATA DATE</text>

          {/* actual marker at data date */}
          {actual[curWeek] != null && (
            <circle cx={x(curWeek)} cy={y(actual[curWeek]!)} r="4.2" fill="#0f1729" stroke={accent} strokeWidth="2.4" />
          )}

          {/* hover */}
          {hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="#e7edf8" strokeWidth="1" opacity="0.35" />
              <circle cx={x(hover)} cy={y(planned[hover])} r="3.4" fill="#94a4c0" />
              {actual[hover] != null && <circle cx={x(hover)} cy={y(actual[hover]!)} r="3.8" fill={accent} />}
              {forecast[hover] != null && hover !== curWeek && <circle cx={x(hover)} cy={y(forecast[hover]!)} r="3.4" fill="#2fd6c3" />}
            </g>
          )}
        </svg>

        {hover != null && (
          <div className="absolute top-2 right-2 panel panel-hot px-3 py-2 pointer-events-none font-mono text-[10.5px] leading-relaxed min-w-[148px]"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,.45)" }}>
            <div className="text-dim tracking-[0.15em] text-[9px]">WEEK {hover} · {name}</div>
            <div className="text-mist">PLAN <span className="text-fog float-right tnum ml-3">{planned[hover]}%</span></div>
            <div className="text-mist">{hover <= curWeek ? "ACT " : "FCST"}
              <span className="float-right tnum ml-3" style={{ color: hover <= curWeek ? accent : "#2fd6c3" }}>
                {(hover <= curWeek ? actual[hover] : forecast[hover]) ?? "—"}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* legend + readouts */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2 items-center">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-dim"><span className="w-4 border-t-2 border-dashed border-mist inline-block" /> Planned</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-dim"><span className="w-4 border-t-[3px] inline-block" style={{ borderColor: accent }} /> Actual</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-dim"><span className="w-4 border-t-2 border-dotted border-tealx inline-block" /> Forecast</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-line border border-line mt-4">
        {[
          ["PLAN @ DATA", `${planNow}%`, "#94a4c0"],
          ["ACTUAL", `${actNow}%`, accent],
          ["VARIANCE", `${variance > 0 ? "+" : ""}${variance} pts`, variance >= 0 ? "#43d9a3" : "#ff5d55"],
          ["SPI", spi, variance >= 0 ? "#43d9a3" : "#ff5d55"],
          ["FCST @ COMPLETION", `${Math.round(fcEnd)}%`, "#2fd6c3"],
        ].map(([k, v, c]) => (
          <div key={k as string} className="bg-[#0d1526] px-3 py-2.5">
            <div className="microlabel">{k}</div>
            <div className="font-display font-semibold text-[15px] tnum mt-1" style={{ color: c as string }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────── mini horizontal bars ─────────────────────────

export function MiniBars({ items, max }: { items: { label: string; value: number; color: string; suffix?: string }[]; max?: number }) {
  const mx = max ?? Math.max(...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[11.5px] text-mist">{it.label}</span>
            <span className="font-mono text-[11px] tnum text-fog">{it.value}{it.suffix ?? ""}</span>
          </div>
          <div className="h-[7px] bg-[#0b1322] border border-line overflow-hidden">
            <div className="h-full transition-all duration-700" style={{ width: `${(it.value / mx) * 100}%`, background: it.color, boxShadow: `0 0 8px ${it.color}44` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
