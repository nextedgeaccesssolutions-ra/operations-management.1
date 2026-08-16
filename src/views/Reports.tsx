import { useState } from "react";
import { ROLE_META, timeAgo } from "../data";
import { Empty, Icon, Reveal, SectionHead, StatusPill } from "../ui";
import { useApp } from "../store";
import type { Report } from "../store";

const now = Date.now();
const h = 3600_000;

const SEED: Report[] = [
  { id: "r1", ref: "IR-2212", site: "Davao Datacenter Uptime Audit", siteCode: "PH-10", type: "Uptime audit", inspector: "M. Osei", ts: now - 2 * h, result: "pass", coords: "7.0730° N · 125.6120° E", queued: false, summary: "Generator bank 2 load test passed at 92% rated. ATS transfer measured 11.4 s, within the 15 s spec. Cold-aisle delta 1.8 °C across rows A–F. Two minor findings logged, none blocking." },
  { id: "r2", ref: "IR-2210", site: "Tacloban Wind Corridor", siteCode: "PH-09", type: "Met-mast survey", inspector: "R. Vance", ts: now - 9 * h, result: "pass", coords: "11.2430° N · 125.0040° E", queued: false, summary: "Monthly mean 6.8 m/s at 80 m hub height. Guy-wire tension within band on all three anchors. Typhoon shutdown drill executed and timed at 4 m 12 s." },
  { id: "r3", ref: "IR-2208", site: "Iloilo Water District Intake", siteCode: "PH-06", type: "QA sampling", inspector: "M. Osei", ts: now - 26 * h, result: "pass", coords: "10.7200° N · 122.5450° E", queued: false, summary: "Intake screen differential pressure 0.12 bar — normal. Chlorination residual 0.6 mg/L at farthest tap. Chain-of-custody forms countersigned and uploaded." },
  { id: "r4", ref: "IR-2204", site: "Clark Solar Array · Block C", siteCode: "PH-02", type: "Thermal sweep", inspector: "M. Osei", ts: now - 40 * h, result: "attention", coords: "15.1860° N · 120.5580° E", queued: false, summary: "String combiner audits 62/80 complete. Thermal cam found 3 hot-spot modules on C-7 above 18 °C delta — flagged for replacement. String derating 4.1% MTD." },
  { id: "r5", ref: "IR-2201", site: "Bataan Refinery Turnaround", siteCode: "PH-01", type: "Turnaround inspection", inspector: "R. Vance", ts: now - 54 * h, result: "pass", coords: "14.6530° N · 120.2840° E", queued: false, summary: "Exchanger bundle E-14 pull completed without incident. Torque records verified 14/14. Hot-work permit PTW-2210 remains open; gas test logged at 06:00 and 14:00." },
  { id: "r6", ref: "IR-2197", site: "Manila Bay Reclamation Survey", siteCode: "PH-03", type: "Bathymetry", inspector: "R. Vance", ts: now - 76 * h, result: "fail", coords: "14.5740° N · 120.9710° E", queued: false, summary: "Bathymetry delta +0.4 m at stake R-118 exceeds the ±0.25 m tolerance. Hydrography re-shoot required on the next calm-sea window. Fill placement paused at grid 12." },
  { id: "r7", ref: "IR-2193", site: "Cebu–Mactan Bridge Bearings", siteCode: "PH-07", type: "Structural monitoring", inspector: "R. Vance", ts: now - 98 * h, result: "attention", coords: "10.3090° N · 123.9470° E", queued: false, summary: "Elastomeric bearing B-12 shear deformation 9 mm — above the 8 mm watch threshold, below 12 mm action limit. Weekly monitoring set; next reading due in 6 days." },
];

const RESULT_COLOR: Record<Report["result"], string> = { pass: "#43d9a3", attention: "#ffb224", fail: "#ff5d55" };
const TYPES = ["Turnaround inspection", "QA sampling", "Thermal sweep", "Met-mast survey", "Structural monitoring", "Bathymetry", "Uptime audit", "NDT survey"];

export function ReportsView() {
  const app = useApp();
  const role = app.role ?? "admin";
  const meta = ROLE_META[role];
  const isAdmin = role === "admin";
  const isClient = role === "client";

  const [sel, setSel] = useState<string | null>("IR-2212");
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState<"all" | Report["result"] | "queued">("all");
  const [form, setForm] = useState({ siteId: "ph01", type: TYPES[0], result: "pass" as Report["result"], summary: "" });

  const all = [...app.reports, ...SEED];
  const list = all.filter((r) => {
    if (filter === "all") return true;
    if (filter === "queued") return r.queued;
    return r.result === filter;
  });
  const selected = all.find((r) => r.ref === sel) ?? null;

  const fileReport = () => {
    const site = app.phSites.find((x) => x.id === form.siteId);
    if (!site || !form.summary.trim()) return;
    const num = 2212 + app.reports.length + 1;
    const ref = `IR-${num}`;
    const report: Report = {
      id: `rx${num}`, ref, site: site.name, siteCode: site.code, type: form.type,
      inspector: meta.persona, ts: Date.now(), result: form.result,
      coords: `${site.lat} · ${site.lng}`, queued: app.offline,
      summary: form.summary.trim(),
    };
    app.addReport(report);
    if (!isAdmin) {
      app.submit({
        type: "report-approval", title: `Approve inspection report ${ref}`, target: `report:${ref}`,
        requester: meta.persona, role,
        summary: `${form.type} on ${site.name} (${site.code}). Result: ${form.result.toUpperCase()}. Requires L5 countersign before release to the client portal.`,
      });
    }
    app.toast(app.offline ? `${ref} saved to device outbox — will sync on uplink` : isAdmin ? `${ref} filed to control` : `${ref} filed — routed to admin countersign`, app.offline ? "warn" : "ok");
    setForm({ siteId: "ph01", type: TYPES[0], result: "pass", summary: "" });
    setComposing(false);
    setSel(ref);
  };

  const chips: { k: typeof filter; label: string; n: number }[] = [
    { k: "all", label: "All", n: all.length },
    { k: "pass", label: "Pass", n: all.filter((r) => r.result === "pass").length },
    { k: "attention", label: "Attention", n: all.filter((r) => r.result === "attention").length },
    { k: "fail", label: "Fail", n: all.filter((r) => r.result === "fail").length },
    { k: "queued", label: "Queued", n: all.filter((r) => r.queued).length },
  ];

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="field evidence · geo-tagged inspection reports"
        title="Inspection Reports"
        right={
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((c) => (
              <button key={c.k} className={`chip ${filter === c.k ? "chip-on" : ""}`} onClick={() => setFilter(c.k)}>
                {c.label} <span className="opacity-70">·{c.n}</span>
              </button>
            ))}
            {!isClient && (
              <button className="btn btn-pri !h-7 ml-1" onClick={() => { setComposing((v) => !v); setSel(null); }}>
                <Icon name={composing ? "x" : "plus"} size={12} /> {composing ? "close" : "file report"}
              </button>
            )}
          </div>
        }
      />

      {app.offline && (
        <div className="panel border-amberx/50 bg-amberx/5 px-3.5 py-2.5 flex items-center gap-2.5 text-[12px] text-amberx">
          <Icon name="wifioff" size={14} />
          OFFLINE NODE — filed reports carry a <span className="font-mono text-[10px] border border-amberx/50 px-1">QUEUED</span> flag and reconcile to control on next uplink.
          <span className="ml-auto font-mono text-[10px] tracking-wider">{app.syncQueue.length} ops queued</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* list */}
        <div className="lg:col-span-7">
          {list.length === 0 && <Empty text={`no ${filter === "all" ? "" : filter + " "}reports on this node`} />}
          <div className="space-y-2.5">
            {list.map((r, i) => (
              <Reveal key={r.ref} delay={i * 35}>
                <button onClick={() => { setSel(r.ref); setComposing(false); }}
                  className={`panel w-full text-left p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${sel === r.ref ? "panel-hot" : ""}`}
                  style={{ transitionProperty: "transform, border-color" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] text-amberx tracking-wider">{r.ref}</span>
                        <span className="text-[13.5px] font-semibold text-fog truncate">{r.site}</span>
                        {r.queued && (
                          <span className="chip !cursor-default !text-amberx !border-amberx/50 !bg-amberx/10 !h-5">
                            <span className="led led-amber led-live" /> queued
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[9.5px] text-dim tracking-wider uppercase mt-1">
                        {r.siteCode} · {r.type} · {r.inspector} · {timeAgo(r.ts)}
                      </div>
                    </div>
                    <span className="flex-none inline-flex items-center gap-1.5 px-2 h-[21px] text-[9.5px] font-mono tracking-[0.14em] uppercase border"
                      style={{ color: RESULT_COLOR[r.result], borderColor: `${RESULT_COLOR[r.result]}55`, background: `${RESULT_COLOR[r.result]}12` }}>
                      {r.result}
                    </span>
                  </div>
                  <p className="text-[12px] text-mist leading-relaxed mt-2 line-clamp-2">{r.summary}</p>
                  <div className="flex items-center gap-1.5 mt-2.5 font-mono text-[10px] text-tealx tnum">
                    <Icon name="pin" size={11} /> {r.coords}
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>

        {/* side */}
        <div className="lg:col-span-5 space-y-3">
          {composing ? (
            <div className="panel panel-hot p-4 sm:p-5">
              <div className="microlabel mb-3 flex items-center gap-2">
                <span className="led led-amber led-live" /> new inspection report · geo-tag auto-attached
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="microlabel block mb-1.5">ph waypoint</label>
                  <select className="select" value={form.siteId} onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value }))}>
                    {app.phSites.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="microlabel block mb-1.5">type</label>
                    <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="microlabel block mb-1.5">result</label>
                    <select className="select" value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value as Report["result"] }))}>
                      <option value="pass">pass</option>
                      <option value="attention">attention</option>
                      <option value="fail">fail</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="microlabel block mb-1.5">findings summary</label>
                  <textarea className="textarea" placeholder="Measurements, deviations, evidence refs…"
                    value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
                </div>
                {(() => {
                  const s = app.phSites.find((x) => x.id === form.siteId);
                  return s ? (
                    <div className="border border-line bg-[#0b1322] px-3 py-2 font-mono text-[10.5px] text-tealx tnum flex items-center gap-2">
                      <Icon name="pin" size={12} /> {s.lat} · {s.lng} — {s.region}
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="btn" onClick={() => setComposing(false)}>discard</button>
                <button className="btn btn-pri" disabled={!form.summary.trim()} onClick={fileReport}>
                  <Icon name="clip" size={12} /> {app.offline ? "file to outbox" : "file report"}
                </button>
              </div>
              {!isAdmin && <p className="text-[10.5px] text-dim mt-2.5 leading-relaxed">Reports from the field route to the admin gate for countersign before client release.</p>}
            </div>
          ) : selected ? (
            <div className="panel p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[11px] text-amberx tracking-wider">{selected.ref}</div>
                  <div className="font-display font-semibold text-[16px] text-fog mt-0.5 leading-snug">{selected.site}</div>
                  <div className="font-mono text-[9.5px] text-dim tracking-wider uppercase mt-1">
                    {selected.siteCode} · {selected.type} · {selected.inspector} · {timeAgo(selected.ts)}
                  </div>
                </div>
                <StatusPill s={selected.result} />
              </div>

              <div className="mt-3.5 border border-line bg-[#0b1322] px-3 py-2.5 font-mono text-[11px] text-tealx tnum flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Icon name="pin" size={12} /> {selected.coords}</span>
                <button className="font-mono text-[9.5px] tracking-wider text-amberx hover:text-fog transition-colors cursor-pointer uppercase" onClick={() => app.nav("geo")}>
                  open ph map
                </button>
              </div>

              <p className="text-[12.5px] text-mist leading-relaxed mt-3.5">{selected.summary}</p>

              <div className="mt-4 border-t border-line/60 pt-3 space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-dim">Geo-tag attached</span><span className="text-grnx flex items-center gap-1.5"><span className="led led-grn" /> verified</span></div>
                <div className="flex justify-between"><span className="text-dim">Sync state</span>
                  <span className={selected.queued ? "text-amberx" : "text-mist"}>{selected.queued ? "device outbox · pending uplink" : "reconciled to control"}</span>
                </div>
                <div className="flex justify-between"><span className="text-dim">Chain of custody</span><span className="text-mist">signed · sha-pinned</span></div>
              </div>

              {isAdmin && (
                <div className="mt-4">
                  <label className="microlabel block mb-1.5">adjudicate result</label>
                  <select className="select !w-44" value={selected.result}
                    onChange={(e) => { app.toast(`${selected.ref} result set to ${e.target.value}`); app.log(`Adjudicated report ${selected.ref} → ${e.target.value}`, "approval"); setSel(null); }}>
                    {(["pass", "attention", "fail"] as const).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <p className="text-[10px] text-dim mt-1.5">L5 adjudication is written straight to the audit ledger.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="panel p-5">
              <div className="microlabel mb-3">evidence doctrine</div>
              <ul className="text-[12px] text-mist space-y-2 leading-relaxed">
                <li className="flex gap-2.5"><span className="text-amberx font-mono">01</span> Every report carries a verified geo-tag from the PH waypoint registry.</li>
                <li className="flex gap-2.5"><span className="text-amberx font-mono">02</span> Filed offline, reports sit in the device outbox with a QUEUED flag until uplink.</li>
                <li className="flex gap-2.5"><span className="text-amberx font-mono">03</span> Field results require L5 countersign before they reach the client portal.</li>
              </ul>
              <button className="btn mt-4 w-full" onClick={() => app.nav("geo")}>
                <Icon name="pin" size={12} /> open ph geo network
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
