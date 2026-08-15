import { useMemo, useState } from "react";
import { APPROVAL_TYPE_LABEL, MODULES, PROJECTS, TASKS, timeAgo } from "../data";
import { Icon, StatusPill } from "../ui";
import { useApp } from "../store";

function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "ig"));
  return <>{parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}</>;
}

interface Hit { icon: string; title: string; sub: string; kicker: string; go: () => void; right?: React.ReactNode; }

export function SearchPanel() {
  const app = useApp();
  const [q, setQ] = useState("");

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const has = (s: string) => s.toLowerCase().includes(needle);
    const out: Hit[] = [];

    MODULES.filter((m) => has(m.name) || has(m.id) || has(m.desc) || has(m.cat)).forEach((m) =>
      out.push({ icon: m.icon, kicker: "module", title: m.name, sub: m.id, go: () => app.nav("module", m.id) }));
    PROJECTS.filter((p) => has(p.name) || has(p.code) || has(p.client)).forEach((p) =>
      out.push({ icon: "gantt", kicker: "project", title: `${p.code} · ${p.name}`, sub: p.client, go: () => app.nav("gantt"), right: <StatusPill s={p.status} /> }));
    app.sites.filter((s) => has(s.name) || has(s.code) || has(s.type)).forEach((s) =>
      out.push({ icon: "pin", kicker: "geo site", title: `${s.code} · ${s.name}`, sub: `${s.lat} · ${s.lng}`, go: () => app.nav("geo"), right: <StatusPill s={s.status} /> }));
    app.approvals.filter((a) => has(a.title) || has(a.target) || has(a.requester)).forEach((a) =>
      out.push({ icon: "shield", kicker: APPROVAL_TYPE_LABEL[a.type], title: a.title, sub: `${a.requester} · ${timeAgo(a.ts)}`, go: () => app.nav("approvals"), right: <StatusPill s={a.status} /> }));
    TASKS.filter((t) => has(t.name) || has(t.owner) || has(t.prj)).slice(0, 8).forEach((t) =>
      out.push({ icon: "check", kicker: "task", title: t.name, sub: `${t.prj} · ${t.owner} · ${t.prog}%`, go: () => app.nav("gantt") }));
    return out.slice(0, 24);
  }, [q, app.sites, app.approvals, app]);

  const groups = useMemo(() => {
    const map = new Map<string, Hit[]>();
    hits.forEach((h) => map.set(h.kicker, [...(map.get(h.kicker) ?? []), h]));
    return [...map.entries()];
  }, [hits]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Icon name="search" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
        <input
          autoFocus
          className="input !h-12 !pl-11 !text-[15px]"
          placeholder="Search modules, projects, sites, approvals, tasks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[9.5px] text-dim border border-line px-1.5 py-0.5 hidden sm:block">
          {hits.length} hits
        </span>
      </div>

      {!q.trim() && (
        <div>
          <div className="microlabel mb-2.5">indexed surfaces</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              ["modules", "28 workspaces", "grid"],
              ["projects", "6 governed", "gantt"],
              ["geo sites", `${app.sites.length} waypoints`, "pin"],
              ["approvals", `${app.approvals.length} in gate log`, "shield"],
              ["tasks", `${TASKS.length} scheduled`, "check"],
              ["docs", "checksum-pinned", "file"],
            ].map(([t, s, ic]) => (
              <div key={t} className="panel p-3.5 flex items-center gap-3">
                <Icon name={ic} size={17} className="text-amberx" />
                <div><div className="text-[12.5px] text-fog font-medium capitalize">{t}</div><div className="font-mono text-[9.5px] text-dim tracking-wider uppercase">{s}</div></div>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-dim tracking-wider uppercase mt-4">type to query the unified index · results grouped by surface</p>
        </div>
      )}

      {q.trim() && groups.length === 0 && (
        <div className="border border-dashed border-line py-12 text-center">
          <div className="microlabel">no matches for “{q}” in the index</div>
        </div>
      )}

      {groups.map(([gk, items]) => (
        <div key={gk}>
          <div className="microlabel mb-2">{gk} · {items.length}</div>
          <div className="space-y-1">
            {items.map((h, i) => (
              <button key={`${gk}-${i}`} onClick={h.go}
                className="rowline w-full flex items-center gap-3 px-3 py-2.5 border border-line bg-[#0d1526] text-left cursor-pointer hover:border-line2">
                <Icon name={h.icon} size={15} className="text-dim" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] text-fog font-medium truncate"><Hl text={h.title} q={q.trim()} /></span>
                  <span className="block font-mono text-[9.5px] text-dim tracking-wider uppercase mt-0.5 truncate"><Hl text={h.sub} q={q.trim()} /></span>
                </span>
                {h.right}
                <Icon name="chev" size={13} className="text-dim" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
