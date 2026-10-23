import { useRef, useState } from "react";
import { PH_REGIONS, ROLE_META } from "../data";
import type { PhRegion, PhSite, SiteStatus } from "../data";
import { Icon, SectionHead, StatusPill } from "../ui";
import { useApp } from "../store";

const STATUS_COLOR: Record<SiteStatus, string> = {
  active: "#43d9a3", attention: "#ffb224", pending: "#58a6ff", offline: "#ff5d55",
};

const ISLANDS: string[] = [
  // Luzon
  "M 150 28 C 170 30 186 42 192 58 C 197 72 190 84 196 96 C 202 108 214 112 210 126 C 206 140 192 142 184 152 C 176 162 178 172 166 174 C 152 176 148 164 138 158 C 126 151 114 152 108 140 C 102 128 110 118 106 106 C 102 92 92 84 98 70 C 104 56 118 52 124 42 C 130 33 138 27 150 28 Z",
  // Mindoro
  "M 96 176 C 106 172 116 178 118 188 C 120 198 110 206 100 204 C 90 202 86 190 90 182 C 92 178 94 177 96 176 Z",
  // Marinduque
  "M 126 178 C 132 176 136 182 133 187 C 130 192 122 190 122 184 C 122 181 124 179 126 178 Z",
  // Palawan
  "M 78 210 C 82 206 88 208 88 214 C 88 224 80 232 74 242 C 68 252 64 262 56 272 C 48 282 44 292 36 300 C 30 306 22 306 20 298 C 19 292 24 288 28 282 C 36 270 40 258 48 246 C 56 234 62 224 70 216 C 73 212 75 212 78 210 Z",
  // Panay
  "M 88 224 C 100 218 112 224 114 234 C 116 244 108 252 98 252 C 88 252 80 244 82 234 C 83 229 85 226 88 224 Z",
  // Negros
  "M 112 252 C 120 246 130 250 132 260 C 134 272 128 284 120 286 C 112 288 106 278 108 266 C 109 259 110 255 112 252 Z",
  // Cebu
  "M 138 236 C 143 233 147 237 146 243 C 145 254 143 264 141 274 C 140 280 134 281 132 275 C 130 268 133 258 134 248 C 135 242 135 238 138 236 Z",
  // Bohol
  "M 152 262 C 160 258 168 262 168 270 C 168 277 160 281 153 279 C 146 277 146 267 152 262 Z",
  // Leyte
  "M 168 224 C 175 220 181 226 180 236 C 179 246 176 256 170 258 C 164 260 160 250 162 240 C 163 232 165 227 168 224 Z",
  // Samar
  "M 176 198 C 184 192 194 196 195 206 C 196 215 190 222 182 222 C 174 222 170 212 172 204 C 173 200 174 199 176 198 Z",
  // Masbate
  "M 140 196 C 148 192 156 196 155 203 C 154 209 146 212 140 209 C 135 206 135 199 140 196 Z",
  // Mindanao
  "M 150 292 C 162 286 176 290 186 298 C 196 306 206 306 214 314 C 222 322 226 334 220 344 C 214 354 202 352 196 360 C 190 368 192 378 182 382 C 172 386 164 378 154 378 C 144 378 138 386 128 382 C 118 378 118 368 110 362 C 102 356 92 356 88 346 C 84 336 90 328 88 318 C 86 308 92 300 102 296 C 112 292 118 300 128 298 C 136 296 142 295 150 292 Z",
];

function regionForPoint(x: number, y: number): PhRegion {
  if (x < 92 && y > 205) return "PALAWAN";
  if (y < 178) return "LUZON";
  if (y < 285) return "VISAYAS";
  return "MINDANAO";
}

function coordsForPoint(x: number, y: number) {
  const lat = 19 - (y / 400) * 14;
  const lng = 117 + (x / 300) * 10;
  return { lat: `${lat.toFixed(4)}° N`, lng: `${lng.toFixed(4)}° E` };
}

export function PhMap() {
  const app = useApp();
  const role = app.role ?? "admin";
  const meta = ROLE_META[role];
  const isAdmin = role === "admin";
  const isClient = role === "client";
  const svgRef = useRef<SVGSVGElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<PhRegion | "ALL">("ALL");
  const [dropping, setDropping] = useState(false);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [form, setForm] = useState({ name: "", type: "Survey", region: "LUZON" as PhRegion, note: "" });
  const [confirmDel, setConfirmDel] = useState(false);

  const sites = app.phSites.filter((s) => regionFilter === "ALL" || s.region === regionFilter);
  const selected = app.phSites.find((s) => s.id === selectedId) ?? null;

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dropping || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 300);
    const y = Math.round(((e.clientY - r.top) / r.height) * 400);
    if (x < 4 || x > 296 || y < 4 || y > 396) return;
    setDraft({ x, y });
    setForm((f) => ({ ...f, region: regionForPoint(x, y) }));
  };

  const submitDrop = () => {
    if (!draft || !form.name.trim()) return;
    const nextNum = Math.max(14, ...app.phSites.map((s) => parseInt(s.code.slice(3), 10) || 14)) + 1;
    const code = `PH-${String(nextNum).padStart(2, "0")}`;
    const c = coordsForPoint(draft.x, draft.y);
    const site: PhSite = {
      id: `phx${nextNum}`, code, name: form.name.trim(), region: form.region,
      x: draft.x, y: draft.y, lat: c.lat, lng: c.lng, type: form.type,
      status: isAdmin ? "active" : "pending", inspector: meta.persona,
      lastSync: app.offline ? "queued" : "just now", cache: app.offline,
      note: form.note.trim() || "New geo-tag drop.",
    };
    app.addPh(site);
    if (!isAdmin) {
      app.submit({
        type: "geo-tag", title: `Approve waypoint ${code} · ${site.name}`, target: `ph-network:${code}`,
        requester: meta.persona, role,
        summary: `Geo-tag dropped on the PH network at ${c.lat}, ${c.lng} (${form.region}). Lands as PENDING and activates only after L5 sign-off.`,
      });
    }
    app.log(`Dropped geo-tag ${code} · ${site.name} at ${c.lat}, ${c.lng}${app.offline ? " (offline, queued)" : ""}`, "geo");
    app.toast(isAdmin ? `Geo-tag ${code} registered` : `${code} dropped — pending admin approval`, isAdmin ? "ok" : "info");
    setDraft(null); setDropping(false); setConfirmDel(false);
    setForm({ name: "", type: "Survey", region: "LUZON", note: "" });
    setSelectedId(site.id);
  };

  const counts = (["active", "attention", "pending", "offline"] as SiteStatus[]).map(
    (st) => ({ st, n: app.phSites.filter((x) => x.status === st).length }),
  );

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="field / geo-tagging · republic of the philippines"
        title="PH Geo Network"
        right={
          <div className="flex flex-wrap items-center gap-1.5">
            {counts.map(({ st, n }) => (
              <span key={st} className="chip !cursor-default">
                <span className="w-1.5 h-1.5" style={{ background: STATUS_COLOR[st] }} />{st} {n}
              </span>
            ))}
            {!isClient && (
              <button className={`btn !h-7 ml-1 ${dropping ? "btn-danger" : "btn-pri"}`}
                onClick={() => { setDropping((v) => !v); setDraft(null); }}>
                <Icon name={dropping ? "x" : "plus"} size={12} /> {dropping ? "cancel drop" : "drop geo-tag"}
              </button>
            )}
          </div>
        }
      />

      {app.offline && (
        <div className="panel border-amberx/50 bg-amberx/5 px-3.5 py-2.5 flex items-center gap-2.5 text-[12px] text-amberx">
          <Icon name="wifioff" size={14} />
          OFFLINE NODE — new tags and edits are written to the device outbox and reconcile on next uplink.
          <span className="ml-auto font-mono text-[10px] tracking-wider">{app.syncQueue.length} ops queued</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* map */}
        <div className="lg:col-span-8">
          <div className="panel p-3 sm:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2 px-1">
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-dim flex items-center gap-2">
                <Icon name="pin" size={13} className="text-amberx" />
                {dropping ? "select drop point on the archipelago" : "wgs-84 · luzon / visayas / mindanao / palawan"}
              </div>
              <div className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] uppercase">
                <span className={`led ${app.offline ? "led-amber" : "led-grn"} led-live`} />
                <span className={app.offline ? "text-amberx" : "text-grnx"}>{app.offline ? "local cache" : "live uplink"}</span>
              </div>
            </div>

            <div className="relative border border-line bg-[#0a1220] overflow-hidden">
              <svg ref={svgRef} viewBox="0 0 300 400" className="w-full h-auto block select-none"
                onClick={onSvgClick} style={{ cursor: dropping ? "crosshair" : "default" }}>
                {/* graticule */}
                {[50, 100, 150, 200, 250].map((x) => (
                  <g key={`v${x}`}>
                    <line x1={x} y1="0" x2={x} y2="400" stroke="#1e2b47" strokeWidth="0.5" strokeDasharray="2 4" />
                    <text x={x + 2} y="9" fontSize="6" fill="#5d6d8b" fontFamily="IBM Plex Mono, monospace">{Math.round(117 + (x / 300) * 10)}°E</text>
                  </g>
                ))}
                {[50, 100, 150, 200, 250, 300, 350].map((y) => (
                  <g key={`h${y}`}>
                    <line x1="0" y1={y} x2="300" y2={y} stroke="#1e2b47" strokeWidth="0.5" strokeDasharray="2 4" />
                    <text x="3" y={y - 2} fontSize="6" fill="#5d6d8b" fontFamily="IBM Plex Mono, monospace">{(19 - (y / 400) * 14).toFixed(0)}°N</text>
                  </g>
                ))}

                {/* islands */}
                {ISLANDS.map((d, i) => (
                  <path key={i} d={d} fill="#141e33" stroke="#2e4066" strokeWidth="1" />
                ))}

                {/* region labels */}
                <text x="150" y="98" fontSize="7.5" fill="#3d4f73" fontFamily="IBM Plex Mono, monospace" letterSpacing="2.5" textAnchor="middle">LUZON</text>
                <text x="132" y="245" fontSize="6.5" fill="#3d4f73" fontFamily="IBM Plex Mono, monospace" letterSpacing="2" textAnchor="middle">VISAYAS</text>
                <text x="155" y="336" fontSize="7.5" fill="#3d4f73" fontFamily="IBM Plex Mono, monospace" letterSpacing="2.5" textAnchor="middle">MINDANAO</text>
                <text x="46" y="252" fontSize="6" fill="#3d4f73" fontFamily="IBM Plex Mono, monospace" letterSpacing="1.6" textAnchor="middle" transform="rotate(-54 46 252)">PALAWAN</text>

                {/* compass + scale */}
                <g transform="translate(272,30)">
                  <circle r="11" fill="none" stroke="#2e4066" strokeWidth="0.8" />
                  <path d="M0 -8 L3 4 L0 1.5 L-3 4 Z" fill="#ffb224" />
                  <text x="0" y="-14" fontSize="6.5" fill="#94a4c0" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">N</text>
                </g>
                <g transform="translate(14,382)">
                  <line x1="0" y1="0" x2="42" y2="0" stroke="#5d6d8b" strokeWidth="1" />
                  <line x1="0" y1="-3" x2="0" y2="3" stroke="#5d6d8b" strokeWidth="1" />
                  <line x1="42" y1="-3" x2="42" y2="3" stroke="#5d6d8b" strokeWidth="1" />
                  <text x="21" y="-5" fontSize="6" fill="#5d6d8b" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">≈ 200 km</text>
                </g>

                {/* pins */}
                {sites.map((s) => {
                  const c = STATUS_COLOR[s.status];
                  const sel = s.id === selectedId;
                  return (
                    <g key={s.id} transform={`translate(${s.x},${s.y})`} onClick={(e) => { e.stopPropagation(); setSelectedId(s.id); setDraft(null); }}
                      style={{ cursor: "pointer" }}>
                      {sel && <circle r="9" fill="none" stroke={c} strokeWidth="1" />}
                      {(sel || s.status === "attention") && <circle className="svgping" r="6" fill={c} opacity="0.45" />}
                      <circle r="4.4" fill={c} stroke="#0a101d" strokeWidth="1.3" />
                      {s.status === "offline" && <circle r="7" fill="none" stroke="#ff5d55" strokeWidth="0.8" strokeDasharray="2 2" />}
                      {s.status === "pending" && <circle r="7" fill="none" stroke="#58a6ff" strokeWidth="0.8" strokeDasharray="2 2" />}
                      <text x="8" y="2.6" fontSize="6.5" fill={sel ? "#e7edf8" : "#94a4c0"} fontFamily="IBM Plex Mono, monospace">{s.code}</text>
                    </g>
                  );
                })}

                {/* drop ghost */}
                {draft && (
                  <g transform={`translate(${draft.x},${draft.y})`}>
                    <circle className="svgping" r="7" fill="#ffb224" opacity="0.5" />
                    <circle r="4.4" fill="none" stroke="#ffb224" strokeWidth="1.3" strokeDasharray="2.5 2" />
                    <line x1="-11" y1="0" x2="-5" y2="0" stroke="#ffb224" strokeWidth="0.8" />
                    <line x1="5" y1="0" x2="11" y2="0" stroke="#ffb224" strokeWidth="0.8" />
                    <line x1="0" y1="-11" x2="0" y2="-5" stroke="#ffb224" strokeWidth="0.8" />
                    <line x1="0" y1="5" x2="0" y2="11" stroke="#ffb224" strokeWidth="0.8" />
                  </g>
                )}
              </svg>

              <div className="absolute bottom-2 right-2 font-mono text-[8.5px] tracking-[0.18em] text-dim uppercase bg-[#0a1220]/80 px-2 py-1 border border-line">
                ph grid · opsdeck geo
              </div>
            </div>

            {/* region filter */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 px-1">
              <span className="microlabel mr-1">region</span>
              {(["ALL", ...PH_REGIONS] as const).map((r) => (
                <button key={r} className={`chip ${regionFilter === r ? "chip-on" : ""}`} onClick={() => setRegionFilter(r)}>{r}</button>
              ))}
              <span className="microlabel ml-auto">{sites.length} waypoints</span>
            </div>
          </div>
        </div>

        {/* side panel */}
        <div className="lg:col-span-4 space-y-3">
          {draft ? (
            <div className="panel panel-hot p-4">
              <div className="microlabel mb-3 flex items-center gap-2">
                <span className="led led-amber led-live" /> new waypoint · {coordsForPoint(draft.x, draft.y).lat}, {coordsForPoint(draft.x, draft.y).lng}
              </div>
              <div className="space-y-2.5">
                <input className="input" placeholder="Waypoint name" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
                <div className="grid grid-cols-2 gap-2.5">
                  <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    {["Survey", "Substation", "Refinery", "Bridge", "Water", "Wind", "Solar", "Depot", "Node", "Marine"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <select className="select" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value as PhRegion }))}>
                    {PH_REGIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <textarea className="textarea !min-h-16" placeholder="Field note…" value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 mt-3.5">
                <button className="btn" onClick={() => { setDraft(null); setDropping(false); }}>cancel</button>
                <button className="btn btn-pri" disabled={!form.name.trim()} onClick={submitDrop}>
                  <Icon name="pin" size={12} /> drop tag
                </button>
              </div>
              {!isAdmin && <p className="text-[10.5px] text-dim mt-2.5 leading-relaxed">L4 drops land as <span className="text-blux">PENDING</span> and route to the admin approval gate before activation.</p>}
            </div>
          ) : selected ? (
            <div className="panel p-4">
              <button className="microlabel hover:text-amberx transition-colors cursor-pointer mb-2.5 flex items-center gap-1" onClick={() => setSelectedId(null)}>
                <Icon name="chev" size={11} className="rotate-180" /> all waypoints
              </button>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display font-semibold text-[15.5px] text-fog leading-snug">{selected.name}</div>
                  <div className="font-mono text-[9.5px] tracking-wider text-dim uppercase mt-1">
                    {selected.code} · {selected.region} · {selected.type}
                  </div>
                </div>
                <StatusPill s={selected.status} />
              </div>

              <div className="mt-3.5 border border-line bg-[#0b1322] px-3 py-2.5 font-mono text-[11px] text-tealx tnum flex items-center gap-2">
                <Icon name="pin" size={12} /> {selected.lat} &nbsp;·&nbsp; {selected.lng}
              </div>

              <div className="mt-3 space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-dim">Inspector</span><span className="text-mist">{selected.inspector}</span></div>
                <div className="flex justify-between"><span className="text-dim">Last sync</span><span className="text-mist">{selected.lastSync}</span></div>
                <div className="flex justify-between items-center"><span className="text-dim">Device cache</span>
                  <span className={`flex items-center gap-1.5 ${selected.cache ? "text-grnx" : "text-dim"}`}>
                    <span className={`led ${selected.cache ? "led-grn" : "led-dim"}`} />{selected.cache ? "cached" : "cloud only"}
                  </span>
                </div>
                {selected.report && (
                  <div className="flex justify-between items-center"><span className="text-dim">Linked report</span>
                    <button className="font-mono text-[11px] text-amberx hover:text-fog transition-colors cursor-pointer" onClick={() => app.nav("reports")}>
                      {selected.report} ↗
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[12px] text-mist leading-relaxed mt-3 border-t border-line/60 pt-3">{selected.note}</p>

              {!isClient && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {isAdmin ? (
                    <>
                      <select className="select !w-36 !h-8" value={selected.status}
                        onChange={(e) => { app.updatePh(selected.id, { status: e.target.value as SiteStatus }); app.log(`PH waypoint ${selected.code} set to ${e.target.value}`, "geo"); app.toast(`${selected.code} → ${e.target.value}`); }}>
                        {(["active", "attention", "pending", "offline"] as SiteStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className={`btn btn-danger !h-8 ${confirmDel ? "!bg-redx/25" : ""}`}
                        onClick={() => {
                          if (!confirmDel) { setConfirmDel(true); return; }
                          app.removePh(selected.id);
                          app.log(`Removed PH waypoint ${selected.code} (L5 authority)`, "geo");
                          app.toast(`${selected.code} removed`, "err");
                          setSelectedId(null); setConfirmDel(false);
                        }}>
                        <Icon name="trash" size={12} /> {confirmDel ? "confirm" : "remove"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn !h-8" onClick={() => { app.updatePh(selected.id, { status: "attention" }); app.toast(`${selected.code} flagged for attention`); app.log(`Flagged PH waypoint ${selected.code} for attention`, "field"); }}>
                        <Icon name="alert" size={12} /> flag attention
                      </button>
                      <button className="btn !h-8" onClick={() => {
                        app.submit({ type: "edit", title: `Edit waypoint ${selected.code}`, target: `ph-network:${selected.code}`, requester: meta.persona, role, summary: `Requesting edit rights on ${selected.name} (${selected.lat}, ${selected.lng}).` });
                        app.toast("Edit request routed to admin gate", "info");
                      }}>
                        <Icon name="edit" size={12} /> request edit
                      </button>
                      <button className="btn btn-pri !h-8" onClick={() => { setSelectedId(null); app.nav("reports"); }}>
                        <Icon name="clip" size={12} /> file report
                      </button>
                    </>
                  )}
                </div>
              )}
              {isClient && <p className="microlabel mt-4">read-only · geo authority is held by L5 command</p>}
            </div>
          ) : (
            <div className="panel p-4">
              <div className="microlabel mb-3">waypoint registry · {sites.length}</div>
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {sites.map((s) => (
                  <button key={s.id} onClick={() => setSelectedId(s.id)}
                    className="rowline w-full text-left px-2.5 py-2 border border-transparent hover:border-line flex items-center gap-2.5 cursor-pointer">
                    <span className="w-2 h-2 flex-none" style={{ background: STATUS_COLOR[s.status], boxShadow: `0 0 6px ${STATUS_COLOR[s.status]}88` }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] text-fog truncate">{s.name}</span>
                      <span className="block font-mono text-[9px] text-dim tracking-wider uppercase mt-0.5">{s.code} · {s.region} · {s.lat}</span>
                    </span>
                    <Icon name="chev" size={11} className="text-dim flex-none" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="panel p-3.5">
            <div className="microlabel mb-2">sync doctrine</div>
            <ul className="text-[11.5px] text-mist space-y-1.5 leading-relaxed">
              <li className="flex gap-2"><span className="text-amberx font-mono">01</span> Every drop writes to the device ledger first — online or not.</li>
              <li className="flex gap-2"><span className="text-amberx font-mono">02</span> Offline operations queue with watermarks and merge on uplink.</li>
              <li className="flex gap-2"><span className="text-amberx font-mono">03</span> Non-L5 tags land <span className="text-blux">PENDING</span> until the admin gate approves.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
