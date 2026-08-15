import { useEffect, useRef, useState } from "react";
import {
  ANALYZER, BUILDER_WIDGETS, CAPACITY, CHECKLISTS, COMPLIANCE, DIFF_LINES, DOCS,
  OPTIMIZATION, RISKS_SEED, ROADMAP, ROLE_META, ROLE_SCOPE, TOKENS,
  VALIDATIONS, VENDORS, KANBAN_SEED,
} from "../data";
import type { ModuleDef, Risk } from "../data";
import { Empty, Icon, Progress, Reveal, Spark, StatusPill } from "../ui";
import { MiniBars } from "../charts";
import { useApp } from "../store";
import { SearchPanel } from "./Search";

// ─────────── helpers ───────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="microlabel block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─────────── change request form ───────────

function FormWS({ mod }: { mod: ModuleDef }) {
  const app = useApp();
  const role = app.role ?? "client";
  const scope = ROLE_SCOPE[role];
  const [f, setF] = useState({ prj: scope[0], priority: "normal", title: "", desc: "" });
  const mine = app.approvals.filter((a) => a.type === "change-request").slice(0, 5);

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="project">
            <select className="select" value={f.prj} onChange={(e) => setF((x) => ({ ...x, prj: e.target.value }))}>
              {scope.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="priority">
            <select className="select" value={f.priority} onChange={(e) => setF((x) => ({ ...x, priority: e.target.value }))}>
              {["routine", "normal", "urgent", "safety-critical"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <Field label="change title">
          <input className="input" placeholder="What is changing?" value={f.title}
            onChange={(e) => setF((x) => ({ ...x, title: e.target.value }))} />
        </Field>
        <Field label="impact statement">
          <textarea className="textarea" placeholder="Scope, schedule and safety impact; rollback plan…"
            value={f.desc} onChange={(e) => setF((x) => ({ ...x, desc: e.target.value }))} />
        </Field>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={() => setF((x) => ({ ...x, title: "", desc: "" }))}>clear</button>
          <button className="btn btn-pri" disabled={!f.title.trim()}
            onClick={() => {
              app.submit({
                type: "change-request", title: f.title.trim(), target: `${f.prj} / ${mod.id}`,
                requester: ROLE_META[role].persona, role,
                summary: `[${f.priority}] ${f.desc.trim() || "No impact statement provided."}`,
              });
              app.toast(role === "admin" ? "Change request auto-approved · L5" : "Change request routed to gate", role === "admin" ? "ok" : "info");
              setF((x) => ({ ...x, title: "", desc: "" }));
            }}>
            <Icon name="send" size={12} /> raise change
          </button>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="microlabel mb-2">recent change requests</div>
        <div className="space-y-1.5">
          {mine.map((a) => (
            <div key={a.id} className="border border-line bg-[#0d1526] px-3 py-2 flex items-center gap-2.5">
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] text-fog truncate">{a.title}</span>
                <span className="block font-mono text-[9px] text-dim uppercase tracking-wider mt-0.5">{a.target}</span>
              </span>
              <StatusPill s={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────── checklist (runbook / deploy / a11y) ───────────

function ChecklistWS({ mod }: { mod: ModuleDef }) {
  const app = useApp();
  const steps = CHECKLISTS[mod.id] ?? [];
  const checks = app.checks[mod.id] ?? Array<boolean>(steps.length).fill(false);
  const done = checks.filter(Boolean).length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-2xl tnum text-fog">{pct}%</span>
          <span className="font-mono text-[10px] tracking-wider uppercase text-dim">{done}/{steps.length} steps locked</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40"><Progress value={pct} color={pct === 100 ? "#43d9a3" : "#ffb224"} /></div>
          <button className="btn !h-8" onClick={() => { steps.forEach((_, i) => checks[i] && app.toggleCheck(mod.id, i, steps.length)); app.toast("Checklist reset"); }}>
            <Icon name="sync" size={12} /> reset
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {steps.map((s, i) => {
          const on = checks[i];
          return (
            <button key={i} onClick={() => app.toggleCheck(mod.id, i, steps.length)}
              className={`rowline w-full flex items-start gap-3 px-3 py-2.5 border text-left cursor-pointer transition-colors ${on ? "border-grnx/30 bg-grnx/5" : "border-line bg-[#0d1526] hover:border-line2"}`}>
              <span className={`mt-0.5 w-[18px] h-[18px] grid place-items-center border flex-none transition-colors ${on ? "bg-grnx border-grnx text-ink" : "border-line2 text-transparent"}`}>
                <Icon name="check" size={11} sw={2.4} />
              </span>
              <span className="flex-1">
                <span className={`block text-[13px] leading-snug transition-colors ${on ? "text-dim line-through" : "text-fog"}`}>
                  <span className="font-mono text-[10px] text-dim mr-2">{String(i + 1).padStart(2, "0")}</span>{s}
                </span>
              </span>
              {on && <span className="font-mono text-[9px] text-grnx tracking-wider uppercase mt-1">locked</span>}
            </button>
          );
        })}
      </div>
      {pct === 100 && (
        <div className="mt-4 border border-grnx/40 bg-grnx/8 px-4 py-3 flex items-center gap-3">
          <Icon name="shield" size={16} className="text-grnx" />
          <span className="text-[13px] text-grnx">Procedure complete — completion record queued to the ledger{app.offline ? " (offline)" : ""}.</span>
        </div>
      )}
    </div>
  );
}

// ─────────── vendor review table ───────────

function VendorWS() {
  const app = useApp();
  const isAdmin = app.role === "admin";
  const [rows, setRows] = useState(VENDORS);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[560px]">
        <thead><tr className="border-b border-line">
          {["vendor", "category", "score", "status"].map((hd) => <th key={hd} className="microlabel px-3 py-2.5 font-normal">{hd}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((v, i) => (
            <tr key={v.name} className="rowline border-b border-line/40">
              <td className="px-3 py-3 text-[13px] text-fog font-medium">{v.name}</td>
              <td className="px-3 py-3 text-[12px] text-mist">{v.cat}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-24"><Progress value={v.score * 10} color={v.score >= 8 ? "#43d9a3" : v.score >= 7 ? "#ffb224" : "#ff5d55"} h={4} /></div>
                  <span className="font-mono text-[11px] tnum text-fog">{v.score.toFixed(1)}</span>
                </div>
              </td>
              <td className="px-3 py-3">
                {isAdmin ? (
                  <select className="select !h-7 !w-28 !text-[11px]" value={v.status}
                    onChange={(e) => { setRows((r) => r.map((x, j) => (j === i ? { ...x, status: e.target.value } : x))); app.toast(`${v.name} → ${e.target.value}`); }}>
                    {["Qualified", "Review", "Hold"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : <StatusPill s={v.status} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-mono text-[10px] text-dim tracking-wider uppercase mt-3">score = quality × on-time × safety · trailing 12 months</p>
    </div>
  );
}

// ─────────── meters (capacity + optimization) ───────────

function MeterWS({ mod }: { mod: ModuleDef }) {
  if (mod.id === "operations:capacity-plan") {
    return (
      <div className="space-y-4">
        {CAPACITY.map((c) => {
          const pct = Math.round((c.alloc / c.cap) * 100);
          return (
            <div key={c.team}>
              <div className="flex justify-between items-baseline mb-1.5 flex-wrap gap-1">
                <span className="text-[13px] text-fog font-medium">{c.team}</span>
                <span className="font-mono text-[10.5px] tnum text-mist">{c.alloc}h / {c.cap}h · <span className={pct > 92 ? "text-redx" : pct > 80 ? "text-amberx" : "text-grnx"}>{pct}%</span></span>
              </div>
              <div className="relative h-[12px] bg-[#0b1322] border border-line overflow-hidden">
                <div className="absolute inset-y-0 left-0 transition-all duration-700"
                  style={{ width: `${pct}%`, background: pct > 92 ? "#ff5d55" : pct > 80 ? "#ffb224" : "#43d9a3", opacity: 0.85 }} />
                <div className="absolute inset-y-0 w-px bg-fog/60" style={{ left: "85%" }} title="sustainable ceiling" />
              </div>
              <div className="font-mono text-[9.5px] text-dim tracking-wider uppercase mt-1">{c.note} · ceiling marker at 85%</div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {OPTIMIZATION.map((o) => {
        const saved = Math.round((1 - o.after / o.before) * 100);
        return (
          <div key={o.stage}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[13px] text-fog font-medium">{o.stage}</span>
              <span className="font-mono text-[10.5px] text-grnx">−{saved}% time</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-[9px] bg-[#0b1322] border border-line flex-1 overflow-hidden">
                  <div className="h-full bg-dim/60" style={{ width: `${(o.before / 95) * 100}%` }} />
                </div>
                <span className="font-mono text-[10px] text-dim tnum w-20 text-right">{o.before} {o.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-[9px] bg-[#0b1322] border border-line flex-1 overflow-hidden">
                  <div className="h-full bg-tealx transition-all duration-700" style={{ width: `${(o.after / 95) * 100}%`, boxShadow: "0 0 8px #2fd6c344" }} />
                </div>
                <span className="font-mono text-[10px] text-tealx tnum w-20 text-right">{o.after} {o.unit}</span>
              </div>
            </div>
          </div>
        );
      })}
      <p className="font-mono text-[10px] text-dim tracking-wider uppercase pt-1">grey = baseline W22 · teal = optimized W31</p>
    </div>
  );
}

// ─────────── document workspace ───────────

function DocWS({ mod }: { mod: ModuleDef }) {
  const app = useApp();
  const doc = DOCS[mod.id];
  if (!doc) return <Empty text="document not found in vault" />;
  return (
    <div className="grid lg:grid-cols-[190px_1fr] gap-5">
      <div className="hidden lg:block">
        <div className="microlabel mb-2">outline</div>
        <div className="space-y-1 border-l border-line">
          {doc.sections.map((s, i) => (
            <a key={i} href={`#sec-${i}`} className="block pl-3 py-1 text-[11.5px] text-dim hover:text-amberx transition-colors border-l border-transparent hover:border-amberx -ml-px">{s.h}</a>
          ))}
        </div>
        <button className="btn w-full mt-4" onClick={() => { app.log(`Logged revision on ${mod.name} (${doc.rev})`, "plan"); app.toast("Revision logged to ledger"); }}>
          <Icon name="edit" size={12} /> log revision
        </button>
      </div>
      <div>
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          <h3 className="font-display font-semibold text-lg text-fog">{doc.title}</h3>
          <span className="chip !cursor-default">{doc.rev}</span>
          <span className="chip !cursor-default"><Icon name="lock" size={10} /> checksum pinned</span>
        </div>
        <div className="space-y-5">
          {doc.sections.map((s, i) => (
            <Reveal key={i} delay={i * 50}>
              <section id={`sec-${i}`}>
                <h4 className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-amberx mb-2">{String(i + 1).padStart(2, "0")} · {s.h}</h4>
                {s.p && <p className="text-[13.5px] text-mist leading-relaxed">{s.p}</p>}
                {s.bullets && (
                  <ul className="space-y-1.5">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="text-[13px] text-mist leading-relaxed flex gap-2.5">
                        <span className="text-amberx mt-[3px] flex-none"><Icon name="chev" size={11} /></span>{b}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────── toggles (compliance / validation) ───────────

function TogglesWS({ mod }: { mod: ModuleDef }) {
  const app = useApp();
  const role = app.role ?? "client";
  const isAdmin = role === "admin";

  if (mod.id === "operations:compliance-tracking") {
    const [rows, setRows] = useState(COMPLIANCE);
    const ok = rows.filter((r) => r.status === "ok").length;
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-display font-bold text-2xl tnum text-fog">{Math.round((ok / rows.length) * 100)}%</span>
          <span className="font-mono text-[10px] tracking-wider uppercase text-dim">register compliant · {ok}/{rows.length}</span>
          <div className="w-36 ml-auto"><Progress value={(ok / rows.length) * 100} color="#43d9a3" /></div>
        </div>
        <div className="space-y-1">
          {rows.map((r, i) => (
            <div key={r.code} className="rowline flex items-center gap-3 px-3 py-2.5 border border-line bg-[#0d1526]">
              <span className="font-mono text-[10.5px] text-dim w-14">{r.code}</span>
              <span className="flex-1 text-[12.5px] text-mist">{r.title}</span>
              <StatusPill s={r.status} />
              <button className="btn !h-7 !px-2.5" onClick={() => {
                if (isAdmin) {
                  setRows((x) => x.map((y, j) => (j === i ? { ...y, status: y.status === "ok" ? "open" : "ok" } : y)));
                  app.log(`Flipped ${r.code} → ${r.status === "ok" ? "open" : "compliant"}`, "qa");
                  app.toast(`${r.code} updated`);
                } else {
                  app.submit({ type: "edit", title: `Flip ${r.code}: ${r.title}`, target: mod.id, requester: ROLE_META[role].persona, role, summary: `Requesting status change from ${r.status} after evidence review.` });
                  app.toast("Status change routed to admin gate", "info");
                }
              }}>{isAdmin ? "flip" : "request flip"}</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const [rows, setRows] = useState(VALIDATIONS);
  const open = rows.filter((r) => r.status === "open").length;
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="font-mono text-[10px] tracking-wider uppercase text-dim">last sync batch · 02:00 UTC ·</span>
        <span className={`chip !cursor-default ${open ? "" : "chip-on"}`}>{open ? `${open} findings open` : "batch clean"}</span>
      </div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="rowline flex items-center gap-3 px-3 py-2.5 border border-line bg-[#0d1526] flex-wrap">
            <span className="flex-1 min-w-[220px]">
              <span className="block text-[12.5px] text-fog font-medium">{r.name}</span>
              <span className="block text-[11.5px] text-dim mt-0.5">{r.issue}</span>
            </span>
            <StatusPill s={r.sev} />
            {r.status === "open" ? (
              <button className="btn !h-7 !px-2.5" onClick={() => {
                setRows((x) => x.map((y, j) => (j === i ? { ...y, status: "ok" } : y)));
                app.log(`Resolved validation finding: ${r.name}`, "data");
                app.toast("Finding resolved");
              }}>resolve</button>
            ) : <Icon name="check" size={14} className="text-grnx" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────── risk matrix ───────────

function heat(l: number, i: number) {
  const s = l * i;
  if (s >= 16) return "#ff5d55";
  if (s >= 9) return "#ffb224";
  if (s >= 4) return "#58a6ff";
  return "#2fd6c3";
}

function MatrixWS() {
  const app = useApp();
  const [risks, setRisks] = useState<Risk[]>(RISKS_SEED);
  const [selId, setSelId] = useState<string>(RISKS_SEED[0].id);
  const [name, setName] = useState("");
  const sel = risks.find((r) => r.id === selId);

  return (
    <div className="grid lg:grid-cols-[1fr_270px] gap-5">
      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="font-mono text-[10px] tracking-wider uppercase text-dim">
            {sel ? <>moving <span className="text-amberx">{sel.name}</span> — click a cell to re-score</> : "select a risk"}
          </span>
        </div>
        <div className="grid grid-cols-[26px_repeat(5,1fr)] gap-1">
          <div />
          {[1, 2, 3, 4, 5].map((l) => <div key={l} className="text-center font-mono text-[9px] text-dim pb-1">L{l}</div>)}
          {[5, 4, 3, 2, 1].map((i) => (
            <RowOfCells key={i} i={i} risks={risks} selId={selId}
              onPick={(id) => setSelId(id)}
              onDrop={(l) => {
                if (!sel) return;
                setRisks((rs) => rs.map((r) => (r.id === sel.id ? { ...r, l, i } : r)));
                app.log(`Re-scored risk “${sel.name}” → L${l}/I${i} (${heat(l, i) === "#ff5d55" ? "red band" : "matrix"})`, "plan");
                app.toast(`Risk re-scored · L${l} × I${i}`);
              }} />
          ))}
          <div />
          <div className="col-span-5 text-center font-mono text-[9px] text-dim tracking-[0.2em] uppercase pt-1">likelihood →</div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input className="input !h-8 flex-1" placeholder="New risk title…" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-pri !h-8" disabled={!name.trim()} onClick={() => {
            const id = `rk${Date.now()}`;
            setRisks((rs) => [...rs, { id, name: name.trim(), l: 2, i: 2, owner: ROLE_META[app.role ?? "admin"].persona }]);
            setSelId(id); setName("");
            app.toast("Risk added at L2/I2");
          }}><Icon name="plus" size={12} /></button>
        </div>
      </div>
      <div>
        <div className="microlabel mb-2">register · sorted by heat</div>
        <div className="space-y-1.5">
          {[...risks].sort((a, b) => b.l * b.i - a.l * a.i).map((r) => (
            <button key={r.id} onClick={() => setSelId(r.id)}
              className={`w-full text-left border px-3 py-2.5 transition-colors cursor-pointer ${selId === r.id ? "border-amberx/60 bg-amberx/5" : "border-line bg-[#0d1526] hover:border-line2"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-fog font-medium truncate">{r.name}</span>
                <span className="font-mono text-[10px] tnum" style={{ color: heat(r.l, r.i) }}>{r.l * r.i}</span>
              </div>
              <div className="font-mono text-[9px] text-dim uppercase tracking-wider mt-1">L{r.l} · I{r.i} · {r.owner}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RowOfCells({ i, risks, selId, onPick, onDrop }: {
  i: number; risks: Risk[]; selId: string;
  onPick: (id: string) => void; onDrop: (l: number) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-center font-mono text-[9px] text-dim">I{i}</div>
      {[1, 2, 3, 4, 5].map((l) => {
        const here = risks.filter((r) => r.l === l && r.i === i);
        const c = heat(l, i);
        return (
          <button key={l} onClick={() => onDrop(l)}
            className="min-h-[52px] border border-line p-1 flex flex-wrap content-start gap-1 transition-all hover:border-fog/50 cursor-pointer"
            style={{ background: `${c}12` }}>
            {here.map((r) => (
              <span key={r.id} onClick={(e) => { e.stopPropagation(); onPick(r.id); }}
                className="text-[9px] font-mono px-1.5 py-0.5 border cursor-pointer truncate max-w-full"
                style={{ color: c, borderColor: `${c}66`, background: selId === r.id ? `${c}22` : "#0c1424" }}>
                {r.name.length > 18 ? r.name.slice(0, 17) + "…" : r.name}
              </span>
            ))}
          </button>
        );
      })}
    </>
  );
}

// ─────────── PDF viewer ───────────

function PdfWS({ mod }: { mod: ModuleDef }) {
  const app = useApp();
  const fill = mod.id === "pdf-viewer:fill-form";
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [ann, setAnn] = useState(true);
  const [f, setF] = useState({ holder: "", company: "", permit: "PTW-", date: "", iso: false, gas: false, sign: "" });

  return (
    <div className="grid lg:grid-cols-[1fr_240px] gap-4">
      <div>
        {/* toolbar */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <button className="btn !h-8 !px-2.5" onClick={() => setPage(1)} disabled={page === 1}>‹</button>
          <span className="font-mono text-[10.5px] text-mist tnum">page {page}/2</span>
          <button className="btn !h-8 !px-2.5" onClick={() => setPage(2)} disabled={page === 2}>›</button>
          <span className="w-px h-5 bg-line mx-1" />
          <button className="btn !h-8 !px-2.5" onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}>−</button>
          <span className="font-mono text-[10.5px] text-mist tnum w-11 text-center">{Math.round(zoom * 100)}%</span>
          <button className="btn !h-8 !px-2.5" onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.15).toFixed(2)))}>+</button>
          {!fill && (
            <button className={`chip !h-8 ${ann ? "chip-on" : ""}`} onClick={() => setAnn((a) => !a)}>
              <Icon name="edit" size={11} /> annotations
            </button>
          )}
          <button className="btn !h-8 ml-auto" onClick={() => { app.log(`Exported ${mod.name} · PDF/A`, "data"); app.toast("Export queued to vault"); }}>
            <Icon name="download" size={12} /> export
          </button>
        </div>

        {/* page */}
        <div className="border border-line bg-[#0b1322] p-3 sm:p-6 overflow-x-auto">
          <div className="mx-auto transition-transform duration-300 origin-top" style={{ transform: `scale(${zoom})`, maxWidth: 620 }}>
            <div className="bg-[#e8ecf4] text-[#182238] px-7 py-8 shadow-2xl shadow-black/50" style={{ minHeight: 460 }}>
              {page === 1 ? (
                <>
                  <div className="flex items-start justify-between border-b-2 border-[#182238] pb-3">
                    <div>
                      <div className="font-display font-bold text-[17px] tracking-wide">PERMIT TO WORK</div>
                      <div className="font-mono text-[9.5px] tracking-[0.18em] text-[#5a6784] mt-0.5">OPSDECK GOVERNED DOCUMENT · FORM 7A</div>
                    </div>
                    <div className="text-right font-mono text-[10px] leading-relaxed text-[#5a6784]">
                      PERMIT No.<br /><span className="text-[#182238] font-semibold">{fill ? (f.permit || "PTW-____") : "PTW-118"}</span>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3.5 text-[12px]">
                    {fill ? (
                      <>
                        <label className="block"><span className="font-mono text-[9.5px] tracking-[0.15em] text-[#5a6784] uppercase">permit holder</span>
                          <input className="mt-1 w-full border-b-2 border-[#182238] bg-transparent outline-none py-1 text-[13px] font-medium" value={f.holder} placeholder="Full name"
                            onChange={(e) => setF((x) => ({ ...x, holder: e.target.value }))} /></label>
                        <label className="block"><span className="font-mono text-[9.5px] tracking-[0.15em] text-[#5a6784] uppercase">company / crew</span>
                          <input className="mt-1 w-full border-b-2 border-[#182238] bg-transparent outline-none py-1 text-[13px] font-medium" value={f.company} placeholder="e.g. Crew Delta"
                            onChange={(e) => setF((x) => ({ ...x, company: e.target.value }))} /></label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="block"><span className="font-mono text-[9.5px] tracking-[0.15em] text-[#5a6784] uppercase">permit no.</span>
                            <input className="mt-1 w-full border-b-2 border-[#182238] bg-transparent outline-none py-1 font-mono text-[12px]" value={f.permit}
                              onChange={(e) => setF((x) => ({ ...x, permit: e.target.value }))} /></label>
                          <label className="block"><span className="font-mono text-[9.5px] tracking-[0.15em] text-[#5a6784] uppercase">date of issue</span>
                            <input className="mt-1 w-full border-b-2 border-[#182238] bg-transparent outline-none py-1 font-mono text-[12px]" value={f.date} placeholder="DD/MM/YYYY"
                              onChange={(e) => setF((x) => ({ ...x, date: e.target.value }))} /></label>
                        </div>
                        <div className="pt-2 space-y-2">
                          {[
                            ["iso", "Isolations verified against live board and proved dead at TP-3"],
                            ["gas", "Atmosphere test passed — O₂ 20.9%, LEL 0%, H₂S nil"],
                          ].map(([k, label]) => (
                            <label key={k} className="flex items-start gap-2.5 cursor-pointer">
                              <input type="checkbox" className="mt-0.5 accent-[#182238]" checked={(f as never)[k]}
                                onChange={(e) => setF((x) => ({ ...x, [k]: e.target.checked }) as never)} />
                              <span className="text-[11.5px] leading-snug">{label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="pt-3">
                          <span className="font-mono text-[9.5px] tracking-[0.15em] text-[#5a6784] uppercase">holder signature (type to sign)</span>
                          <input className="mt-1 w-full border-2 border-dashed border-[#5a6784] bg-[#f3f5f9] outline-none px-3 py-2 font-display italic text-[15px]" value={f.sign} placeholder="Sign here"
                            onChange={(e) => setF((x) => ({ ...x, sign: e.target.value }))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="leading-relaxed">This permit authorizes the works described below subject to the isolations, precautions and step-locked runbook recorded on the OPSDECK ledger. The permit remains live until closed out by the issuer or auto-suspended after a sanction-for-test deviation.</p>
                        <div className="border border-[#182238] divide-y divide-[#c3cad9]">
                          {[["Location", "Northgate Substation · Bay 3 (ST-01)"], ["Work description", "HV bushing replacement and torque verification"], ["Isolations", "Feeder N-G3 racked out, locked 3/3, proved dead TP-3"], ["Validity", "07:00 – 19:00 · day shift only"], ["Runbook", "operations:runbook v2.3 · step-lock enforced"]].map(([k, v]) => (
                            <div key={k} className="grid grid-cols-[120px_1fr] text-[11.5px]">
                              <span className="font-mono text-[9.5px] tracking-wider uppercase text-[#5a6784] px-2.5 py-2 border-r border-[#c3cad9] flex items-center">{k}</span>
                              <span className={`px-2.5 py-2 ${ann && k === "Isolations" ? "bg-[#ffe9b0]" : ""}`}>{v}</span>
                            </div>
                          ))}
                        </div>
                        {ann && (
                          <p className="text-[10.5px] text-[#8a6d00] bg-[#fff3cd] border-l-4 border-[#d9a400] px-2.5 py-1.5">
                            ▸ R. Vance: “Torque spec pending revision CR — verify 210 N·m before Bay 4.”
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono text-[9.5px] tracking-[0.18em] text-[#5a6784] uppercase border-b-2 border-[#182238] pb-2">page 2 · close-out section</div>
                  <div className="mt-5 space-y-3 text-[12px]">
                    <p className="leading-relaxed">On completion, the holder confirms the work area is clear, tools are removed, the crew is withdrawn and the installation is left in the state recorded below. The issuer then returns the permit to the control ledger.</p>
                    {[
                      "Work complete as described ☐ / part complete ☐",
                      "All locks removed · count verified 3/3 ☐",
                      "Housekeeping complete, barriers removed ☐",
                      "Installation returned to: standby ☐ / service ☐ / isolated ☐",
                    ].map((row) => (
                      <div key={row} className={`border-b border-[#c3cad9] pb-2 text-[11.5px] ${ann && row.startsWith("All locks") ? "bg-[#ffe9b0] px-1" : ""}`}>{row}</div>
                    ))}
                    <div className="pt-4 grid grid-cols-2 gap-6">
                      <div><div className="border-b-2 border-[#182238] h-10" /><div className="font-mono text-[9px] tracking-wider uppercase text-[#5a6784] mt-1">holder close-out</div></div>
                      <div><div className="border-b-2 border-[#182238] h-10 flex items-end px-1">{!fill && <span className="font-display italic text-[14px] text-[#182238]/70">A. Kessler</span>}</div><div className="font-mono text-[9px] tracking-wider uppercase text-[#5a6784] mt-1">issuer signature</div></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* side */}
      <div className="space-y-3">
        <div className="panel p-4">
          <div className="microlabel mb-2.5">document</div>
          <div className="font-mono text-[11px] space-y-2">
            <div className="flex justify-between"><span className="text-dim">FORMAT</span><span className="text-fog">PDF/A-2b</span></div>
            <div className="flex justify-between"><span className="text-dim">SIZE</span><span className="text-fog">214 KB</span></div>
            <div className="flex justify-between"><span className="text-dim">PAGES</span><span className="text-fog">2</span></div>
            <div className="flex justify-between"><span className="text-dim">CHECKSUM</span><span className="text-tealx">pinned ✓</span></div>
            <div className="flex justify-between"><span className="text-dim">MODE</span><span className="text-amberx">{fill ? "fill & sign" : "read-only"}</span></div>
          </div>
        </div>
        {fill ? (
          <div className="panel p-4">
            <div className="microlabel mb-2.5">form state</div>
            <div className="space-y-1.5 text-[11.5px]">
              <div className="flex justify-between"><span className="text-dim">Holder</span><span className={f.holder ? "text-grnx" : "text-redx"}>{f.holder || "empty"}</span></div>
              <div className="flex justify-between"><span className="text-dim">Company</span><span className={f.company ? "text-grnx" : "text-redx"}>{f.company || "empty"}</span></div>
              <div className="flex justify-between"><span className="text-dim">Isolation</span><span className={f.iso ? "text-grnx" : "text-redx"}>{f.iso ? "checked" : "unchecked"}</span></div>
              <div className="flex justify-between"><span className="text-dim">Gas test</span><span className={f.gas ? "text-grnx" : "text-redx"}>{f.gas ? "checked" : "unchecked"}</span></div>
              <div className="flex justify-between"><span className="text-dim">Signed</span><span className={f.sign ? "text-grnx" : "text-redx"}>{f.sign ? "yes" : "no"}</span></div>
            </div>
            <button className="btn btn-pri w-full mt-3.5"
              disabled={!f.holder || !f.iso || !f.sign}
              onClick={() => {
                app.submit({ type: "edit", title: `Submit signed permit ${f.permit}`, target: "pdf-viewer:fill-form", requester: ROLE_META[app.role ?? "client"].persona, role: app.role ?? "client", summary: `Holder ${f.holder} (${f.company}). Both safety gates checked, signed “${f.sign}”.` });
                app.toast("Signed permit submitted to gate", "info");
              }}>
              <Icon name="send" size={12} /> submit signed form
            </button>
          </div>
        ) : (
          <div className="panel p-4">
            <div className="microlabel mb-2.5">annotations · 2</div>
            <div className="space-y-2 text-[11.5px] text-mist leading-relaxed">
              <p className="border-l-2 border-amberx pl-2.5">§1 Isolations — torque spec cross-check note (R. Vance)</p>
              <p className="border-l-2 border-tealx pl-2.5">§2 Close-out — lock count witness photo linked</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────── code review diff ───────────

function DiffWS() {
  const app = useApp();
  const [verdict, setVerdict] = useState<"" | "approved" | "changes">("");
  const adds = DIFF_LINES.filter((l) => l.k === "add").length;
  const dels = DIFF_LINES.filter((l) => l.k === "del").length;
  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="font-mono text-[11px] text-fog">validators/frame.py</span>
        <span className="chip !cursor-default !text-grnx !border-grnx/40">+{adds}</span>
        <span className="chip !cursor-default !text-redx !border-redx/40">−{dels}</span>
        <span className="font-mono text-[10px] text-dim uppercase tracking-wider ml-auto">PR #248 · telemetry harness</span>
      </div>
      <div className="border border-line bg-[#0b1322] overflow-x-auto font-mono text-[11.5px] leading-[1.9]">
        {DIFF_LINES.map((l, i) => (
          <div key={i} className={`flex px-0 whitespace-pre ${l.k === "add" ? "bg-grnx/8 text-grnx" : l.k === "del" ? "bg-redx/8 text-redx/90" : "text-mist"}`}>
            <span className="w-10 flex-none text-right pr-3 text-dim select-none border-r border-line/50 py-0.5">{i + 140}</span>
            <span className="w-6 flex-none text-center select-none py-0.5">{l.k === "add" ? "+" : l.k === "del" ? "−" : " "}</span>
            <span className="pr-4 py-0.5">{l.n}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {verdict === "" ? (
          <>
            <button className="btn btn-grn" onClick={() => { setVerdict("approved"); app.log("Approved PR #248 (quarantine + reason codes)", "eng"); app.toast("Review recorded · approved"); }}>
              <Icon name="check" size={12} /> approve
            </button>
            <button className="btn btn-danger" onClick={() => { setVerdict("changes"); app.log("Requested changes on PR #248", "eng"); app.toast("Changes requested", "warn"); }}>
              <Icon name="edit" size={12} /> request changes
            </button>
          </>
        ) : (
          <span className={`chip !cursor-default ${verdict === "approved" ? "!text-grnx !border-grnx/50" : "!text-amberx !border-amberx/50"}`}>
            {verdict === "approved" ? "approved · merged to main" : "changes requested · author notified"}
          </span>
        )}
        <span className="font-mono text-[10px] text-dim uppercase tracking-wider ml-auto">2 reviewers assigned</span>
      </div>
    </div>
  );
}

// ─────────── design tokens ───────────

function TokensWS() {
  const app = useApp();
  return (
    <div className="space-y-6">
      <div>
        <div className="microlabel mb-2.5">palette · click to copy hex</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TOKENS.palette.map((c) => (
            <button key={c.hex} className="border border-line text-left group cursor-pointer hover:border-line2 transition-colors"
              onClick={() => { navigator.clipboard?.writeText(c.hex).catch(() => undefined); app.toast(`${c.name} · ${c.hex} copied`); }}>
              <div className="h-12" style={{ background: c.hex }} />
              <div className="px-2 py-1.5">
                <div className="text-[10.5px] text-fog font-medium truncate">{c.name}</div>
                <div className="font-mono text-[9px] text-dim group-hover:text-amberx transition-colors">{c.hex}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="microlabel mb-2.5">type scale · chakra petch + ibm plex</div>
        <div className="space-y-1">
          {TOKENS.type.map((t) => (
            <div key={t.label} className="border border-line bg-[#0d1526] px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <span className={t.cls}>Field control tower</span>
              <span className="font-mono text-[9.5px] text-dim uppercase tracking-wider">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="microlabel mb-2.5">spacing scale</div>
        <div className="flex items-end gap-3 flex-wrap">
          {TOKENS.spacing.map((s) => (
            <div key={s} className="text-center">
              <div className="bg-tealx/25 border border-tealx/50 mx-auto" style={{ width: s * 2, height: s * 2 }} />
              <div className="font-mono text-[9px] text-dim mt-1.5">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────── dashboard builder ───────────

function BuilderWS() {
  const app = useApp();
  const [widgets, setWidgets] = useState(BUILDER_WIDGETS);
  const on = widgets.filter((w) => w.on).map((w) => w.id);
  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-4">
      <div>
        <div className="microlabel mb-2">widget blocks</div>
        <div className="space-y-1">
          {widgets.map((w, i) => (
            <button key={w.id} onClick={() => setWidgets((x) => x.map((y, j) => (j === i ? { ...y, on: !y.on } : y)))}
              className={`w-full flex items-center gap-2.5 border px-3 py-2.5 text-left cursor-pointer transition-colors ${w.on ? "border-amberx/50 bg-amberx/5" : "border-line bg-[#0d1526] hover:border-line2"}`}>
              <span className={`w-3.5 h-3.5 grid place-items-center border ${w.on ? "bg-amberx border-amberx text-ink" : "border-line2 text-transparent"}`}>
                <Icon name="check" size={9} sw={2.6} />
              </span>
              <span className={`text-[12.5px] ${w.on ? "text-fog" : "text-dim"}`}>{w.name}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-pri w-full mt-3" onClick={() => { app.log(`Published dashboard layout [${on.join(", ")}]`, "data"); app.toast("Dashboard published to role default"); }}>
          <Icon name="send" size={12} /> publish layout
        </button>
      </div>
      <div className="border border-dashed border-line2 p-3 bg-[#0b1322]/60">
        <div className="microlabel mb-2.5">live preview · {on.length} blocks</div>
        {on.length === 0 && <Empty text="enable widget blocks to compose" />}
        <div className="grid sm:grid-cols-2 gap-3">
          {on.includes("kpi") && (
            <div className="panel p-3 sm:col-span-2">
              <div className="grid grid-cols-3 gap-2">
                {[["68%", "PRJ-014"], ["41%", "PRJ-021"], ["82%", "PRJ-027"]].map(([v, l]) => (
                  <div key={l} className="text-center"><div className="font-display font-bold text-lg tnum text-fog">{v}</div><div className="font-mono text-[8.5px] text-dim tracking-wider">{l}</div></div>
                ))}
              </div>
            </div>
          )}
          {on.includes("scurve") && (
            <div className="panel p-3"><div className="microlabel mb-2">s-curve</div><Spark values={[2, 6, 14, 28, 46, 63, 78, 88]} color="#ffb224" w={180} hgt={48} /></div>
          )}
          {on.includes("gantt") && (
            <div className="panel p-3"><div className="microlabel mb-2">gantt strip</div>
              <div className="space-y-1.5">
                {[[8, 46, "#ffb224"], [22, 38, "#58a6ff"], [40, 30, "#2fd6c3"]].map(([l, w, c], i) => (
                  <div key={i} className="h-[7px] bg-[#0b1322] border border-line relative overflow-hidden">
                    <div className="absolute inset-y-0" style={{ left: `${l}%`, width: `${w}%`, background: c as string, opacity: 0.8 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {on.includes("map") && (
            <div className="panel p-3"><div className="microlabel mb-2">geo map</div>
              <svg viewBox="0 0 100 40" className="w-full">
                <rect width="100" height="40" fill="#0c1424" />
                {[[20, 12], [55, 26], [80, 10], [40, 32]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" fill={i === 1 ? "#ffb224" : "#2fd6c3"} opacity="0.85" />)}
              </svg>
            </div>
          )}
          {on.includes("alerts") && (
            <div className="panel p-3"><div className="microlabel mb-2">alert rail</div>
              {[["B2 possession risk", "#ff5d55"], ["ST-08 node offline", "#ffb224"]].map(([t, c]) => (
                <div key={t as string} className="flex items-center gap-2 py-1 text-[11px] text-mist"><span className="led" style={{ background: c as string }} />{t}</div>
              ))}
            </div>
          )}
          {on.includes("activity") && (
            <div className="panel p-3"><div className="microlabel mb-2">activity</div>
              <div className="text-[11px] text-mist space-y-1">
                <p>R. Vance — torque sweep 14/14</p><p>SYSTEM — S-curve recompute OK</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────── analyzer ───────────

function AnalyzerWS() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
        {ANALYZER.kpis.map((k) => (
          <div key={k.label} className="bg-[#0d1526] px-3.5 py-3">
            <div className="microlabel">{k.label}</div>
            <div className="font-display font-bold text-xl tnum text-fog mt-1">{k.value}</div>
            <div className="font-mono text-[9.5px] text-tealx mt-0.5">{k.delta}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <div className="microlabel mb-2.5">cycle time by stage · days</div>
          <MiniBars items={ANALYZER.bars.map((b, i) => ({ label: b.stage, value: b.days, suffix: " d", color: ["#ffb224", "#58a6ff", "#2fd6c3", "#43d9a3", "#94a4c0", "#ff5d55"][i] }))} max={2.5} />
        </div>
        <div>
          <div className="microlabel mb-2.5">auto-insights</div>
          <div className="space-y-2">
            {ANALYZER.insights.map((ins, i) => (
              <p key={i} className="text-[12.5px] text-mist leading-relaxed border border-line bg-[#0d1526] px-3 py-2.5 flex gap-2.5">
                <Icon name="zap" size={13} className="text-amberx flex-none mt-0.5" />{ins}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── context extractor ───────────

const SAMPLE = `Site note 04/08/2025 — torque sweep at ST-01 complete (14/14). Megger IR 1.4 GΩ @ 5 kV.
Awaiting CR-2231 decision from A. Kessler (a.kessler@opsdeck.io) before Bay 4. Crane standby cost $1,240.50 MTD, +18% vs baseline.
Gas test 05/08: LEL 0%, O2 20.9%. PTW-118 closes 19:00. Variance now 2.8% on SP-7.`;

function ExtractorWS() {
  const app = useApp();
  const [text, setText] = useState(SAMPLE);
  const [out, setOut] = useState<{ dates: string[]; codes: string[]; emails: string[]; amounts: string[]; pcts: string[] } | null>(null);

  const run = () => {
    const dates = [...text.matchAll(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g)].map((x) => x[0]);
    const codes = [...new Set([...text.matchAll(/\b[A-Z]{2,5}-\d{1,5}[A-Z]?\b/g)].map((x) => x[0]))];
    const emails = [...new Set([...text.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map((x) => x[0]))];
    const amounts = [...text.matchAll(/\$\s?\d[\d,]*(?:\.\d+)?/g)].map((x) => x[0]);
    const pcts = [...new Set([...text.matchAll(/\d+(?:\.\d+)?\s?%/g)].map((x) => x[0]))];
    setOut({ dates, codes, emails, amounts, pcts });
    app.log("Context extraction run · field note batch", "data");
  };

  const groups: [string, string[], string][] = out
    ? [["dates", out.dates, "#2fd6c3"], ["asset / doc codes", out.codes, "#ffb224"], ["emails", out.emails, "#58a6ff"], ["amounts", out.amounts, "#43d9a3"], ["percentages", out.pcts, "#94a4c0"]]
    : [];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div>
        <Field label="raw text input">
          <textarea className="textarea font-mono !text-[11.5px] !leading-relaxed" style={{ minHeight: 220 }} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 mt-3">
          <button className="btn" onClick={() => { setText(""); setOut(null); }}>clear</button>
          <button className="btn btn-pri" onClick={run} disabled={!text.trim()}><Icon name="zap" size={12} /> extract context</button>
        </div>
      </div>
      <div>
        <div className="microlabel mb-2.5">extracted entities</div>
        {!out && <Empty text="run extraction to populate the entity map" />}
        {out && (
          <div className="space-y-3.5">
            {groups.map(([label, items, color]) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-1.5 h-1.5" style={{ background: color }} />
                  <span className="font-mono text-[9.5px] tracking-[0.15em] uppercase text-dim">{label}</span>
                  <span className="font-mono text-[9.5px] text-fog tnum">×{items.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.length === 0 && <span className="text-[11px] text-dim italic">none detected</span>}
                  {items.map((it, i) => (
                    <span key={i} className="font-mono text-[10.5px] px-2 py-1 border tnum" style={{ color, borderColor: `${color}55`, background: `${color}0d` }}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────── session timer ───────────

function TimerWS() {
  const app = useApp();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [intent, setIntent] = useState("Torque verification sweep · Bay 4");
  const [sessions, setSessions] = useState<{ label: string; secs: number }[]>([{ label: "Runbook step-lock · Bay 3", secs: 46 * 60 }]);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (running) tick.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (tick.current) window.clearInterval(tick.current); };
  }, [running]);

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="panel panel-hot p-6 flex flex-col items-center justify-center text-center">
        <div className="microlabel mb-3">{running ? "session live" : "ready"}</div>
        <div className="font-mono font-semibold text-[44px] sm:text-[54px] tnum tracking-wider text-fog" style={{ textShadow: running ? "0 0 24px rgba(255,178,36,.35)" : undefined }}>
          {fmt(elapsed)}
        </div>
        <div className="text-[12px] text-mist mt-2 max-w-[260px]">{intent}</div>
        <div className="flex gap-2 mt-6">
          <button className={`btn ${running ? "btn-danger" : "btn-pri"}`} onClick={() => setRunning((r) => !r)}>
            <Icon name={running ? "x" : "zap"} size={12} /> {running ? "pause" : elapsed ? "resume" : "start"}
          </button>
          <button className="btn" disabled={elapsed === 0} onClick={() => {
            setSessions((s) => [{ label: intent, secs: elapsed }, ...s]);
            app.log(`Session logged · ${fmt(elapsed)} on “${intent}”`, "field");
            app.toast("Session logged to ledger");
            setElapsed(0); setRunning(false);
          }}><Icon name="flag" size={12} /> log session</button>
        </div>
      </div>
      <div>
        <Field label="session intent">
          <input className="input" value={intent} onChange={(e) => setIntent(e.target.value)} />
        </Field>
        <div className="microlabel mt-4 mb-2">logged today</div>
        <div className="space-y-1.5">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between border border-line bg-[#0d1526] px-3 py-2.5">
              <span className="text-[12.5px] text-mist truncate">{s.label}</span>
              <span className="font-mono text-[11px] tnum text-amberx ml-3">{fmt(s.secs)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────── daily update ───────────

function UpdateWS() {
  const app = useApp();
  const role = app.role ?? "inspector";
  const scope = ROLE_SCOPE[role];
  const [f, setF] = useState({ prj: scope[0], pct: 60, good: "", block: "" });
  return (
    <div className="max-w-xl space-y-3">
      <Field label="project">
        <select className="select" value={f.prj} onChange={(e) => setF((x) => ({ ...x, prj: e.target.value }))}>
          {scope.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label={`progress today · ${f.pct}%`}>
        <input type="range" min={0} max={100} step={5} value={f.pct} className="w-full accent-[#ffb224]"
          onChange={(e) => setF((x) => ({ ...x, pct: +e.target.value }))} />
      </Field>
      <Field label="completed">
        <input className="input" placeholder="e.g. torque sweep 14/14, megger logged" value={f.good} onChange={(e) => setF((x) => ({ ...x, good: e.target.value }))} />
      </Field>
      <Field label="blockers">
        <textarea className="textarea" placeholder="What is in the way? (leave blank if clear)" value={f.block} onChange={(e) => setF((x) => ({ ...x, block: e.target.value }))} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <button className="btn btn-pri" onClick={() => {
          app.log(`Daily update · ${f.prj} at ${f.pct}%${f.good ? ` — ${f.good}` : ""}${f.block ? ` · blocked: ${f.block}` : ""}`, "field");
          app.toast("Update posted to control feed");
          setF((x) => ({ ...x, good: "", block: "" }));
        }}><Icon name="send" size={12} /> post update</button>
      </div>
    </div>
  );
}

// ─────────── kanban ───────────

const COLS: [string, string][] = [["backlog", "Backlog"], ["inprogress", "In progress"], ["review", "Review"], ["done", "Done"]];

function KanbanWS() {
  const app = useApp();
  const [board, setBoard] = useState(KANBAN_SEED);
  const move = (col: string, id: string, dir: -1 | 1) => {
    const idx = COLS.findIndex(([k]) => k === col);
    const to = COLS[idx + dir]?.[0];
    if (!to) return;
    setBoard((b) => {
      const card = b[col].find((c) => c.id === id)!;
      app.log(`Sprint card moved → ${COLS[idx + dir][1]}: ${card.title}`, "plan");
      return { ...b, [col]: b[col].filter((c) => c.id !== id), [to]: [...b[to], card] };
    });
  };
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {COLS.map(([key, label], ci) => (
        <div key={key} className="border border-line bg-[#0d1526]/70 p-2.5">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-mist">{label}</span>
            <span className="font-mono text-[10px] text-dim tnum">{board[key].length}</span>
          </div>
          <div className="space-y-2 min-h-[80px]">
            {board[key].map((c) => (
              <div key={c.id} className="border border-line bg-pane p-2.5 group hover:border-line2 transition-colors">
                <div className="text-[12px] text-fog leading-snug">{c.title}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 border border-line2 text-dim uppercase tracking-wider">{c.tag} · {c.pts}pt</span>
                  <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn !h-6 !px-1.5" disabled={ci === 0} onClick={() => move(key, c.id, -1)}>‹</button>
                    <button className="btn !h-6 !px-1.5" disabled={ci === COLS.length - 1} onClick={() => move(key, c.id, 1)}>›</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────── roadmap timeline ───────────

function TimelineWS() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {ROADMAP.map((q, qi) => (
        <div key={q.q} className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="font-display font-bold text-lg text-fog">{q.q}</span>
            <span className="flex-1 h-px bg-line" />
            <span className="font-mono text-[9px] text-dim tracking-wider uppercase">{qi === 0 ? "current" : qi === 1 ? "next" : "horizon"}</span>
          </div>
          <div className="space-y-2">
            {q.items.map((it) => (
              <div key={it.name} className="border border-line bg-[#0d1526] px-3 py-2.5 flex items-center justify-between gap-2">
                <span className="text-[12.5px] text-mist">{it.name}</span>
                <StatusPill s={it.state} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────── dispatcher ───────────

export function ModuleWorkspace({ mod }: { mod: ModuleDef }) {
  switch (mod.ws) {
    case "form": return <FormWS mod={mod} />;
    case "checklist": return <ChecklistWS mod={mod} />;
    case "vendor": return <VendorWS />;
    case "meter": return <MeterWS mod={mod} />;
    case "doc": return <DocWS mod={mod} />;
    case "toggles": return <TogglesWS mod={mod} />;
    case "matrix": return <MatrixWS />;
    case "pdf": return <PdfWS mod={mod} />;
    case "diff": return <DiffWS />;
    case "tokens": return <TokensWS />;
    case "builder": return <BuilderWS />;
    case "analyzer": return <AnalyzerWS />;
    case "extractor": return <ExtractorWS />;
    case "searchws": return <SearchPanel />;
    case "timer": return <TimerWS />;
    case "updateform": return <UpdateWS />;
    case "kanban": return <KanbanWS />;
    case "timeline": return <TimelineWS />;
    default: return <Empty text="workspace not provisioned" />;
  }
}
