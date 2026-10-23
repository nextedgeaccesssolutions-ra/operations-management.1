import { useEffect, useState } from "react";
import { PORTALS, ROLE_META, SETTING_DEFAULTS, SETTING_SECTIONS, SETTINGS_SEED, timeAgo } from "../data";
import type { SettingDef, SettingValue } from "../data";
import { Icon, Reveal, SectionHead, Toggle } from "../ui";
import { useApp } from "../store";

const fmt = (v: SettingValue) => (typeof v === "boolean" ? (v ? "ON" : "OFF") : String(v));

function TextInput({ initial, disabled, onCommit }: {
  initial: string; disabled: boolean; onCommit: (v: string) => void;
}) {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <input className="input !w-52" value={v} disabled={disabled}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v.trim() && v.trim() !== initial) onCommit(v.trim()); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
  );
}

function SettingRow({ def }: { def: SettingDef }) {
  const app = useApp();
  const role = app.role!;
  const isAdmin = role === "admin";
  const cur = app.settings[def.key] ?? SETTING_DEFAULTS[def.key];
  const pend = app.pendingSettings[def.key];
  const mine = !!pend && pend.requestedBy === ROLE_META[role].persona;
  const locked = !!pend;

  const commit = (v: SettingValue) => app.updateSetting(def.key, v);

  return (
    <div className="py-3.5 border-b border-line/50 last:border-0 grid md:grid-cols-[1fr_250px] gap-3 md:items-center rowline px-2 -mx-2">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-medium text-fog">{def.label}</span>
          {pend && (
            <span className="chip !cursor-default !text-amberx !border-amberx/50 !bg-amberx/10">
              <span className="led led-amber led-live" /> pending · {fmt(pend.value)}
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-dim mt-0.5 max-w-xl leading-relaxed">{def.desc}</p>
        {pend && (
          <div className="flex items-center gap-2.5 mt-2 flex-wrap font-mono text-[9.5px] tracking-wider uppercase text-dim">
            <span>requested by <span className="text-mist">{pend.requestedBy}</span> · {timeAgo(pend.ts)}</span>
            {mine && (
              <button className="btn !h-6 !px-2" onClick={() => { app.withdraw(pend.approvalId); app.toast("Request withdrawn from gate", "info"); }}>
                <Icon name="x" size={10} /> withdraw
              </button>
            )}
            {!mine && <span>{isAdmin ? "· decide in approval gate" : "· locked until admin decides"}</span>}
          </div>
        )}
      </div>

      <div className="flex md:justify-end">
        {def.kind === "toggle" && (
          <Toggle on={Boolean(cur)} label={fmt(cur)} onChange={() => { if (!locked) commit(!cur); }} />
        )}
        {def.kind === "select" && (
          <select className="select !w-44" value={String(cur)} disabled={locked}
            onChange={(e) => commit(e.target.value)}>
            {def.options!.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {def.kind === "number" && (
          <div className="flex items-center gap-2">
            <input type="number" className="input !w-24" value={Number(cur)} disabled={locked}
              onChange={(e) => commit(Number(e.target.value))} />
            <span className="font-mono text-[10px] text-dim tracking-wider">{def.unit}</span>
          </div>
        )}
        {def.kind === "text" && (
          <TextInput initial={String(cur)} disabled={locked} onCommit={(v) => commit(v)} />
        )}
      </div>
    </div>
  );
}

export function SettingsView() {
  const app = useApp();
  const role = app.role!;

  // client portal has no settings clearance
  if (role === "client") {
    return (
      <div className="panel p-10 text-center">
        <Icon name="lock" size={26} className="text-redx mx-auto" />
        <div className="font-display font-semibold text-[16px] text-fog mt-3">No settings clearance</div>
        <p className="text-[12.5px] text-mist mt-1.5 max-w-md mx-auto">
          The {PORTALS.client.name} is scoped to portfolio visibility. Platform configuration is governed by L5 Command.
        </p>
      </div>
    );
  }

  const isAdmin = role === "admin";
  const meta = ROLE_META[role];
  const pendingCount = Object.keys(app.pendingSettings).length;

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="governed configuration"
        title="Platform Settings"
        right={
          <span className={`chip !cursor-default ${isAdmin ? "!text-amberx !border-amberx/50" : "!text-blux !border-blux/50"}`}>
            <Icon name={isAdmin ? "shield" : "lock"} size={11} />
            {isAdmin ? "L5 · applies instantly" : "L4 · edits gated by L5"}
          </span>
        }
      />

      <Reveal>
        <div className={`panel p-4 flex items-start gap-3.5 ${isAdmin ? "panel-hot" : ""}`}
          style={!isAdmin ? { borderColor: "rgba(88,166,255,.35)" } : undefined}>
          <span className="w-9 h-9 grid place-items-center border flex-none mt-0.5"
            style={{ color: meta.accent, borderColor: `${meta.accent}55`, background: `${meta.accent}10` }}>
            <Icon name={isAdmin ? "shield" : "radio"} size={16} />
          </span>
          <div>
            <div className="font-display font-semibold text-[14px] text-fog tracking-wide">
              {isAdmin ? "Command authority active" : "Field edits route through the L5 gate"}
            </div>
            <p className="text-[12px] text-mist leading-relaxed mt-1 max-w-3xl">
              {isAdmin
                ? "Every change applies immediately, supersedes any pending request on the same key and is written to the immutable audit ledger."
                : "You can edit any setting — each change is captured with your operator ID and held at the admin approval gate. Nothing takes effect until L5 signs off. Withdraw anytime before the decision."}
            </p>
          </div>
          {pendingCount > 0 && (
            <button className="btn ml-auto flex-none" onClick={() => app.nav("approvals")}>
              <span className="led led-amber led-live" /> {pendingCount} pending
            </button>
          )}
        </div>
      </Reveal>

      {SETTING_SECTIONS.map((sec, si) => {
        const defs = SETTINGS_SEED.filter((d) => d.section === sec);
        if (!defs.length) return null;
        return (
          <Reveal key={sec} delay={si * 50}>
            <div className="panel p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 bg-amberx" />
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-mist">{sec}</span>
                <span className="flex-1 h-px bg-line" />
                <span className="font-mono text-[9.5px] text-dim">{defs.length} keys</span>
              </div>
              <div>
                {defs.map((d) => <SettingRow key={d.key} def={d} />)}
              </div>
            </div>
          </Reveal>
        );
      })}

      <div className="microlabel text-center pt-1">
        settings state persists on this node · synced through the approval ledger when gated
      </div>
    </div>
  );
}
