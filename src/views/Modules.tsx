import { useEffect, useState } from "react";
import { CHECKLISTS, MODULE_CATS, MODULES, ROLE_META, timeAgo } from "../data";
import type { ModuleDef } from "../data";
import { Icon, Reveal, SectionHead } from "../ui";
import { useApp } from "../store";
import { ModuleWorkspace } from "./workspaces";

const CAT_ACCENT: Record<string, string> = {
  Operations: "#ffb224", "PDF Viewer": "#ff5d55", Engineering: "#58a6ff", Design: "#2fd6c3",
  Data: "#43d9a3", Search: "#94a4c0", Productivity: "#ffb224", Product: "#58a6ff",
};

export function LibraryView() {
  const app = useApp();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const filtered = MODULES.filter((m) => !needle || m.name.toLowerCase().includes(needle) || m.id.includes(needle) || m.desc.toLowerCase().includes(needle));

  return (
    <div className="space-y-6">
      <SectionHead
        kicker="operations library · 28 modules"
        title="Module Registry"
        right={
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
            <input className="input !h-9 !pl-8 !w-56" placeholder="Filter modules…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        }
      />

      {MODULE_CATS.map((cat) => {
        const mods = filtered.filter((m) => m.cat === cat);
        if (!mods.length) return null;
        const accent = CAT_ACCENT[cat];
        return (
          <Reveal key={cat}>
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2 h-2" style={{ background: accent }} />
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-mist">{cat}</span>
                <span className="flex-1 h-px bg-line" />
                <span className="font-mono text-[9.5px] text-dim">{mods.length}</span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {mods.map((m0) => {
                  const ed = app.moduleEdits[m0.id];
                  const m = ed ? { ...m0, name: ed.name ?? m0.name, desc: ed.desc ?? m0.desc } : m0;
                  const archived = app.archived.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => app.nav("module", m.id)}
                      className="group panel p-3.5 text-left cursor-pointer hover:-translate-y-0.5 transition-all duration-200 hover:border-line2"
                      style={{ transitionProperty: "transform, border-color" }}>
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 grid place-items-center border flex-none"
                          style={{ color: accent, borderColor: `${accent}44`, background: `${accent}0f` }}>
                          <Icon name={m.icon} size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={`text-[13.5px] font-semibold text-fog group-hover:text-amberx transition-colors truncate ${archived ? "line-through opacity-50" : ""}`}>{m.name}</span>
                            {archived && <span className="chip !h-5 !px-1.5 !text-[8.5px] !text-redx !border-redx/40 !cursor-default">archived</span>}
                            {!!ed && !archived && <span className="chip !h-5 !px-1.5 !text-[8.5px] !text-grnx !border-grnx/40 !cursor-default">revised</span>}
                          </span>
                          <span className="block font-mono text-[9px] text-dim tracking-wider mt-0.5">{m.id}</span>
                          <span className="block text-[11.5px] text-mist leading-snug mt-1.5">{m.desc}</span>
                        </span>
                        <Icon name="chev" size={13} className="text-dim group-hover:text-amberx group-hover:translate-x-0.5 transition-all flex-none mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export function ModuleView({ id }: { id: string }) {
  const app = useApp();
  const role = app.role ?? "admin";
  const isAdmin = role === "admin";
  const [confirmArch, setConfirmArch] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  useEffect(() => { setEditOpen(false); setConfirmArch(false); }, [id]);
  const mod: ModuleDef | undefined = MODULES.find((m) => m.id === id);

  if (!mod) {
    return (
      <div className="panel p-10 text-center">
        <div className="microlabel">module not found in registry</div>
        <button className="btn mt-4" onClick={() => app.nav("modules")}>back to registry</button>
      </div>
    );
  }

  const archived = app.archived.includes(mod.id);
  const accent = CAT_ACCENT[mod.cat];
  const ed = app.moduleEdits[mod.id];
  const eff: ModuleDef = ed ? { ...mod, name: ed.name ?? mod.name, desc: ed.desc ?? mod.desc } : mod;

  return (
    <div className="space-y-5">
      <button className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.14em] uppercase text-dim hover:text-amberx transition-colors cursor-pointer"
        onClick={() => app.nav("modules")}>
        <Icon name="chev" size={12} className="rotate-180" /> registry
      </button>

      <Reveal>
        <div className={`panel p-4 sm:p-6 ${archived ? "" : "panel-hot"}`}>
          <div className="flex items-start gap-4 flex-wrap">
            <span className="w-11 h-11 grid place-items-center border flex-none" style={{ color: accent, borderColor: `${accent}55`, background: `${accent}12` }}>
              <Icon name={mod.icon} size={20} />
            </span>
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display font-bold text-[20px] sm:text-[22px] text-fog tracking-wide">{eff.name}</h1>
                <span className="chip !cursor-default">{eff.cat}</span>
                <span className="chip !cursor-default">{eff.ws.replace("ws", "")}</span>
                {archived && <span className="chip !cursor-default !text-redx !border-redx/50">archived</span>}
                {!!ed && !archived && <span className="chip !cursor-default !text-grnx !border-grnx/50">revised</span>}
              </div>
              <p className="text-[13px] text-mist mt-1.5 max-w-2xl">{eff.desc}</p>
              <div className="font-mono text-[9.5px] text-dim tracking-wider mt-2">{mod.id} · governed artifact · edits & deletes gate through {ROLE_META.admin.clearance}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <>
                  <button className={`btn ${editOpen ? "btn-pri" : ""}`} onClick={() => setEditOpen((v) => !v)}>
                    <Icon name={editOpen ? "x" : "edit"} size={12} /> {editOpen ? "close editor" : "edit artifact"}
                  </button>
                  {!archived ? (
                    <button className={`btn btn-danger ${confirmArch ? "!bg-redx/25" : ""}`}
                      onClick={() => {
                        if (!confirmArch) { setConfirmArch(true); return; }
                        app.archive(mod.id);
                        app.log(`Archived module ${mod.id} (delete approved · L5)`, "approval");
                        app.toast(`${mod.name} archived`, "err");
                        setConfirmArch(false);
                      }}>
                      <Icon name="trash" size={12} /> {confirmArch ? "confirm archive" : "archive"}
                    </button>
                  ) : (
                    <button className="btn btn-grn" onClick={() => { app.restore(mod.id); app.log(`Restored module ${mod.id}`, "approval"); app.toast(`${mod.name} restored`); }}>
                      <Icon name="sync" size={12} /> restore
                    </button>
                  )}
                </>
              ) : (
                <>
                  {role === "inspector" && (
                    <button className={`btn ${editOpen ? "btn-teal" : ""}`} onClick={() => setEditOpen((v) => !v)}>
                      <Icon name={editOpen ? "x" : "edit"} size={12} /> {editOpen ? "close editor" : "edit artifact"}
                    </button>
                  )}
                  {role === "client" && (
                    <button className="btn" onClick={() => {
                      app.submit({ type: "edit", title: `Edit ${mod.name}`, target: mod.id, requester: ROLE_META[role].persona, role, summary: "Requesting edit access to this governed artifact." });
                      app.toast("Edit request routed to admin gate", "info");
                    }}><Icon name="edit" size={12} /> request edit</button>
                  )}
                  <button className="btn btn-danger" onClick={() => {
                    app.submit({ type: "file-delete", title: `Delete ${mod.name}`, target: mod.id, requester: ROLE_META[role].persona, role, summary: "Requesting deletion / archive of this governed artifact." });
                    app.toast("Delete request routed to admin gate", "info");
                  }}><Icon name="trash" size={12} /> request delete</button>
                </>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {editOpen && !archived && role !== "client" && (
        <Reveal>
          <ArtifactEditor mod={mod} />
        </Reveal>
      )}

      {archived && !isAdmin ? (
        <Reveal>
          <div className="panel p-10 text-center border-redx/30">
            <Icon name="lock" size={26} className="text-redx mx-auto" />
            <div className="font-display font-semibold text-[16px] text-fog mt-3">Artifact archived</div>
            <p className="text-[12.5px] text-mist mt-1.5 max-w-md mx-auto">This module was archived through the admin gate. Submit a change request to restore access.</p>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={80}>
          <div className="panel p-4 sm:p-6">
            {archived && (
              <div className="mb-4 border border-redx/40 bg-redx/5 px-3.5 py-2.5 flex items-center gap-2.5 text-[12px] text-redx">
                <Icon name="alert" size={14} /> Archived artifact — visible to L5 only. Restore to re-enter the live registry.
              </div>
            )}
            <ModuleWorkspace mod={eff} />
          </div>
        </Reveal>
      )}
    </div>
  );
}

// ───────────────────────── governed artifact editor ─────────────────────────

function ArtifactEditor({ mod }: { mod: ModuleDef }) {
  const app = useApp();
  const role = app.role!;
  const isAdmin = role === "admin";
  const ed = app.moduleEdits[mod.id];
  const effName = ed?.name ?? mod.name;
  const effDesc = ed?.desc ?? mod.desc;
  const effSteps = ed?.steps ?? CHECKLISTS[mod.id] ?? null;

  const [name, setName] = useState(effName);
  const [desc, setDesc] = useState(effDesc);
  const [stepsText, setStepsText] = useState(effSteps ? effSteps.join("\n") : "");
  useEffect(() => {
    setName(effName); setDesc(effDesc);
    setStepsText(effSteps ? effSteps.join("\n") : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod.id]);

  const pending = app.pendingModuleEdits[mod.id];
  const steps = stepsText.split("\n").map((x) => x.trim()).filter(Boolean);
  const dirtyName = name.trim() !== effName;
  const dirtyDesc = desc.trim() !== effDesc;
  const dirtySteps = effSteps !== null && steps.join("\n") !== effSteps.join("\n");
  const dirty = dirtyName || dirtyDesc || dirtySteps;

  const submit = () => {
    const patch: { name?: string; desc?: string; steps?: string[] } = {};
    if (dirtyName) patch.name = name.trim();
    if (dirtyDesc) patch.desc = desc.trim();
    if (dirtySteps) patch.steps = steps;
    if (!Object.keys(patch).length) return;
    app.applyModuleEdit(mod.id, patch);
  };

  return (
    <div className={`panel p-4 sm:p-5 ${isAdmin ? "panel-hot" : ""}`}>
      <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
        <div>
          <div className="microlabel mb-1 flex items-center gap-2">
            governed artifact editor · {mod.id}
            {pending && (
              <span className="chip !cursor-default !text-amberx !border-amberx/50">
                <span className="led led-amber led-live" /> revision pending · {ROLE_META[pending.role].persona} · {timeAgo(pending.ts)}
              </span>
            )}
            {!!ed && !pending && <span className="chip !cursor-default !text-grnx !border-grnx/50">revised ledger live</span>}
          </div>
          <div className="text-[14px] font-semibold text-fog">
            {isAdmin ? "Apply revisions under L5 authority" : "Propose revisions — routed to the L5 gate"}
          </div>
        </div>
        {pending && role === "inspector" && pending.requestedBy === ROLE_META.inspector.persona && (
          <button className="btn !h-8" onClick={() => { app.withdraw(pending.approvalId); app.toast("Module revision withdrawn", "info"); }}>
            withdraw revision
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        <div>
          <label className="microlabel block mb-1.5">module name</label>
          <input className="input" value={name} disabled={!!pending} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="microlabel block mb-1.5">description</label>
          <input className="input" value={desc} disabled={!!pending} onChange={(e) => setDesc(e.target.value)} />
        </div>
        {effSteps !== null && (
          <div className="sm:col-span-2">
            <label className="microlabel block mb-1.5 flex justify-between">
              <span>checklist steps · one per line</span>
              <span className="text-amberx tnum">{steps.length} steps</span>
            </label>
            <textarea className="textarea font-mono !text-[12px] !leading-relaxed" rows={9} value={stepsText} disabled={!!pending}
              onChange={(e) => setStepsText(e.target.value)} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
        <div className="font-mono text-[10px] text-dim tracking-wider uppercase">
          {dirty
            ? <>Δ {dirtyName && <span className="text-amberx">name</span>}{(dirtyName && (dirtyDesc || dirtySteps)) && " · "}{dirtyDesc && <span className="text-amberx">description</span>}{((dirtyName || dirtyDesc) && dirtySteps) && " · "}{dirtySteps && <span className="text-amberx">steps {effSteps!.length} → {steps.length}</span>}</>
            : "no changes yet"}
        </div>
        <button className={`btn ${isAdmin ? "btn-pri" : "btn-teal"} !h-9`} disabled={!dirty || !!pending} onClick={submit}>
          <Icon name={isAdmin ? "check" : "send"} size={12} />
          {isAdmin ? "apply revision · L5" : pending ? "awaiting gate decision" : "submit revision to gate"}
        </button>
      </div>
    </div>
  );
}
