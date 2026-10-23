import { useMemo, useState } from "react";
import { ROLE_META } from "../data";
import type { GeoSite, SiteStatus } from "../data";
import { Icon, Reveal, SectionHead, StatusPill } from "../ui";
import { uid, useApp } from "../store";
import { PhMap } from "./PhMap";

const STATUS_COLOR: Record<SiteStatus, string> = {
  active: "#43d9a3", attention: "#ffb224", pending: "#58a6ff", offline: "#ff5d55",
};

function coordFor(x: number, y: number): { lat: string; lng: string } {
  return {
    lat: `${(51.505 - y * 0.00087).toFixed(4)}° N`,
    lng: `${(-0.092 + x * 0.0021).toFixed(4)}° ${x * 0.0021 - 0.092 < 0 ? "W" : "E"}`,
  };
}

export function GeoView() {
  const app = useApp();
  const role = app.role ?? "admin";
  const isAdmin = role === "admin";
  const [tab, setTab] = useState<"sector" | "ph">("sector");
  const [sel, setSel] = useState<string | null>(app.sites[0]?.id ?? null);
  const [placing, setPlacing] = useState(false);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<{ name: string; type: string }>({ name: "", type: "Field" });
  const [confirmDel, setConfirmDel] = useState(false);
  const [editName, setEditName] = useState<string>("");
  const [editStatus, setEditStatus] = useState<SiteStatus>("active");

  const site = useMemo(() => app.sites.find((s) => s.id === sel) ?? null, [app.sites, sel]);

  const selectSite = (s: GeoSite) => {
    setSel(s.id);
    setConfirmDel(false);
    setEditName(s.name);
    setEditStatus(s.status);
  };

  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!placing) return;
    const svg = e.currentTarget;
    const r = svg.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
    const y = +(((e.clientY - r.top) / r.height) * 62).toFixed(1);
    const c = coordFor(x, y);
    const code = `ST-${String(app.sites.length + 1).padStart(2, "0")}`;
    const meta = ROLE_META[role];
    app.addSite({
      id: uid(), code, name: draft.name.trim() || `Waypoint ${code}`, x, y, ...c,
      type: draft.type, status: isAdmin ? "active" : "pending",
      inspector: meta.persona, lastSync: "just now", cache: app.offline,
      note: isAdmin ? "Registered from command console." : "Field drop — awaiting admin approval.",
    });
    if (!isAdmin) {
      app.submit({
        type: "geo-tag", title: `Add waypoint ${code} · ${draft.name.trim() || "unnamed"}`,
        target: "geo-tagging map", requester: meta.persona, role,
        summary: `Coordinates ${c.lat}, ${c.lng} captured ${app.offline ? "offline (queued)" : "on-site"}. Type: ${draft.type}.`,
      });
    } else {
      app.log(`Registered geo-tag ${code} at ${c.lat}, ${c.lng}`, "geo");
    }
    app.toast(isAdmin ? `Geo-tag ${code} registered` : `Waypoint dropped — routed to admin approval`, isAdmin ? "ok" : "info");
    setPlacing(false);
    setDraft({ name: "", type: "Field" });
    setGhost(null);
  };

  const onMapMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!placing) return;
    const r = e.currentTarget.getBoundingClientRect();
    setGhost({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 62 });
  };

  const counts = (["active", "attention", "pending", "offline"] as SiteStatus[]).map((st) => ({
    st, n: app.sites.filter((s) => s.status === st).length,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button className={`chip ${tab === "sector" ? "chip-on" : ""}`} onClick={() => setTab("sector")}>
          <Icon name="grid" size={11} /> Sector Grid 07
        </button>
        <button className={`chip ${tab === "ph" ? "chip-on" : ""}`} onClick={() => setTab("ph")}>
          <Icon name="pin" size={11} /> PH Network
        </button>
        <span className="microlabel ml-1.5">two theatres · one geo ledger</span>
      </div>

      {tab === "ph" ? <PhMap /> : <>
      <SectionHead
        kicker="field / geo-tagging · sector 07"
        title="Location Grid"
        right={
          <div className="flex flex-wrap gap-1.5">
            {counts.map(({ st, n }) => (
              <span key={st} className="chip !cursor-default">
                <span className="w-1.5 h-1.5" style={{ background: STATUS_COLOR[st] }} />{st} {n}
              </span>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* map */}
        <Reveal className="lg:col-span-8">
          <div className="panel p-3 sm:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3 px-1">
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-dim flex items-center gap-2">
                <Icon name="pin" size={13} className="text-amberx" />
                {placing ? "select drop point on grid" : "sector 07 · 1 km grid"}
              </div>
              <div className="flex gap-2">
                {placing ? (
                  <button className="btn !h-8" onClick={() => { setPlacing(false); setGhost(null); }}><Icon name="x" size={12} /> cancel</button>
                ) : (
                  <button className="btn btn-pri !h-8" onClick={() => setPlacing(true)}>
                    <Icon name="plus" size={12} /> drop geo-tag
                  </button>
                )}
              </div>
            </div>

            {placing && (
              <div className="mb-3 grid sm:grid-cols-[1fr_130px] gap-2 px-1">
                <input className="input !h-9" placeholder="Waypoint name (e.g. Calder Bridge east pier)"
                  value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} autoFocus />
                <select className="select !h-9" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}>
                  {["Field", "Substation", "Depot", "Plant", "Facility", "Yard", "Warehouse"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div className={`border border-line relative ${placing ? "cursor-crosshair" : ""}`}>
              <svg viewBox="0 0 100 62" className="w-full h-auto block" onClick={onMapClick} onMouseMove={onMapMove}
                onMouseLeave={() => setGhost(null)}>
                <defs>
                  <pattern id="gg" width="5" height="5" patternUnits="userSpaceOnUse">
                    <path d="M5 0H0V5" fill="none" stroke="#1e2b47" strokeWidth="0.18" />
                  </pattern>
                  <radialGradient id="terr" cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#16213a" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0c1424" />
                  </radialGradient>
                </defs>
                <rect width="100" height="62" fill="url(#terr)" />
                <rect width="100" height="62" fill="url(#gg)" />
                {/* terrain */}
                <path d="M0 44 Q14 38 24 43 T48 40 T70 46 T100 41 V62 H0 Z" fill="#101b31" opacity="0.85" />
                <path d="M60 0 L78 0 Q74 10 80 16 Q86 22 82 30 L70 26 Q64 14 60 0 Z" fill="#131f38" opacity="0.7" />
                <path d="M8 8 Q18 4 26 10 Q32 15 27 22 Q18 26 11 20 Q6 14 8 8 Z" fill="#131f38" opacity="0.6" />
                {/* river */}
                <path d="M0 30 Q18 26 30 32 T58 30 T100 34" fill="none" stroke="#58a6ff" strokeWidth="1.1" opacity="0.22" />
                {/* roads */}
                <path d="M10 62 L34 30 L52 26 L74 8" fill="none" stroke="#2e4066" strokeWidth="0.5" strokeDasharray="2 1.2" opacity="0.8" />
                <path d="M0 52 L40 47 L64 50 L100 44" fill="none" stroke="#2e4066" strokeWidth="0.4" opacity="0.7" />
                {/* sector labels */}
                <text x="3" y="6" fontSize="2.6" fill="#5d6d8b" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.6">SECTOR 07 · 1KM GRID</text>
                <text x="97" y="60" fontSize="2.2" fill="#5d6d8b" fontFamily="IBM Plex Mono, monospace" textAnchor="end" letterSpacing="0.4">51.44°N — 51.51°N</text>

                {/* ghost crosshair */}
                {placing && ghost && (
                  <g pointerEvents="none">
                    <line x1={ghost.x - 3} x2={ghost.x + 3} y1={ghost.y} y2={ghost.y} stroke="#ffb224" strokeWidth="0.3" />
                    <line x1={ghost.x} x2={ghost.x} y1={ghost.y - 3} y2={ghost.y + 3} stroke="#ffb224" strokeWidth="0.3" />
                    <circle cx={ghost.x} cy={ghost.y} r="1.6" fill="none" stroke="#ffb224" strokeWidth="0.3" strokeDasharray="0.8 0.6" />
                  </g>
                )}

                {/* markers */}
                {app.sites.map((s) => {
                  const c = STATUS_COLOR[s.status];
                  const activeSel = sel === s.id;
                  return (
                    <g key={s.id} transform={`translate(${s.x} ${s.y})`} className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); if (!placing) selectSite(s); }}>
                      {(s.status === "attention" || s.status === "pending") && (
                        <circle r="2.4" fill="none" stroke={c} strokeWidth="0.35" className="svgping" />
                      )}
                      {activeSel && <circle r="3.6" fill="none" stroke={c} strokeWidth="0.3" strokeDasharray="1 0.7" />}
                      <circle r="2.1" fill="#0c1424" stroke={c} strokeWidth="0.45"
                        strokeDasharray={s.status === "pending" ? "0.9 0.6" : undefined} />
                      <circle r="0.75" fill={c} style={{ filter: `drop-shadow(0 0 1.5px ${c})` }} />
                      <text y="4.8" textAnchor="middle" fontSize="2.1" fill={activeSel ? "#e7edf8" : "#5d6d8b"}
                        fontFamily="IBM Plex Mono, monospace" letterSpacing="0.2">{s.code}</text>
                    </g>
                  );
                })}
              </svg>

              {/* offline strip */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-line bg-[#0d1526]">
                <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-dim">
                  {app.offline ? "offline node · drops queue locally" : "live uplink · drops sync immediately"}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] uppercase">
                  <span className={`led ${app.offline ? "led-amber" : "led-grn"} led-live`} />
                  <span className={app.offline ? "text-amberx" : "text-grnx"}>{app.offline ? "local" : "online"}</span>
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* detail */}
        <Reveal className="lg:col-span-4" delay={90}>
          <div className="panel p-4 sm:p-5 h-full">
            {site ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.16em] text-dim uppercase">{site.code} · {site.type}</div>
                    <h3 className="font-display font-semibold text-[16px] text-fog mt-1 leading-snug">{site.name}</h3>
                  </div>
                  <StatusPill s={site.status} />
                </div>

                <div className="mt-4 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-line/50 pb-2"><span className="text-dim">LAT</span><span className="text-fog tnum">{site.lat}</span></div>
                  <div className="flex justify-between border-b border-line/50 pb-2"><span className="text-dim">LNG</span><span className="text-fog tnum">{site.lng}</span></div>
                  <div className="flex justify-between border-b border-line/50 pb-2"><span className="text-dim">INSPECTOR</span><span className="text-fog">{site.inspector}</span></div>
                  <div className="flex justify-between border-b border-line/50 pb-2"><span className="text-dim">LAST SYNC</span><span className="text-fog">{site.lastSync}</span></div>
                  <div className="flex justify-between border-b border-line/50 pb-2">
                    <span className="text-dim">DEVICE CACHE</span>
                    <span className={site.cache ? "text-tealx" : "text-redx"}>{site.cache ? "cached ✓".replace("✓", "OK") : "none"}</span>
                  </div>
                </div>

                <p className="text-[12px] text-mist leading-relaxed mt-3.5 border-l-2 border-line2 pl-3">{site.note}</p>

                {isAdmin ? (
                  <div className="mt-5 space-y-3">
                    <div className="microlabel">admin edit · saved to ledger</div>
                    <input className="input !h-9" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <select className="select !h-9" value={editStatus} onChange={(e) => setEditStatus(e.target.value as SiteStatus)}>
                      {(["active", "attention", "pending", "offline"] as SiteStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button className="btn btn-pri flex-1"
                        onClick={() => {
                          app.updateSite(site.id, { name: editName.trim() || site.name, status: editStatus });
                          app.log(`Edited geo-tag ${site.code} (${editStatus})`, "geo");
                          app.toast(`Geo-tag ${site.code} updated`);
                        }}>
                        <Icon name="check" size={12} /> save
                      </button>
                      {!confirmDel ? (
                        <button className="btn btn-danger" onClick={() => setConfirmDel(true)}><Icon name="trash" size={12} /></button>
                      ) : (
                        <button className="btn btn-danger"
                          onClick={() => {
                            app.removeSite(site.id);
                            app.log(`Deleted geo-tag ${site.code} · ${site.name}`, "geo");
                            app.toast(`Geo-tag ${site.code} deleted`, "err");
                            setSel(app.sites.find((s) => s.id !== site.id)?.id ?? null);
                            setConfirmDel(false);
                          }}>
                          confirm delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 border border-dashed border-line px-3 py-3 text-[11.5px] text-dim leading-relaxed">
                    Edits and deletes on registered waypoints require <span className="text-amberx">L5 admin authority</span>. Use “drop geo-tag” to propose a new waypoint — it routes to the approval gate.
                  </div>
                )}
              </div>
            ) : (
              <div className="microlabel py-10 text-center">select a waypoint on the grid</div>
            )}
          </div>
        </Reveal>
      </div>

      {/* site register table */}
      <Reveal delay={120}>
        <div className="panel overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-line">
                {["code", "waypoint", "type", "coordinates", "inspector", "sync", "status"].map((hd) => (
                  <th key={hd} className="microlabel px-4 py-3 font-normal">{hd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {app.sites.map((s) => (
                <tr key={s.id} onClick={() => selectSite(s)}
                  className={`rowline border-b border-line/40 cursor-pointer ${sel === s.id ? "bg-pane2/50" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: STATUS_COLOR[s.status] }}>{s.code}</td>
                  <td className="px-4 py-2.5 text-[13px] text-fog font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-[12px] text-mist">{s.type}</td>
                  <td className="px-4 py-2.5 font-mono text-[10.5px] text-dim tnum">{s.lat} · {s.lng}</td>
                  <td className="px-4 py-2.5 text-[12px] text-mist">{s.inspector}</td>
                  <td className="px-4 py-2.5 font-mono text-[10.5px] text-dim">{s.lastSync}</td>
                  <td className="px-4 py-2.5"><StatusPill s={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
      </>}
    </div>
  );
}
