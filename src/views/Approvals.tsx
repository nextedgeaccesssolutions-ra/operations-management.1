import { useState } from "react";
import { APPROVAL_TYPE_LABEL, ROLE_META, timeAgo } from "../data";
import type { Approval, ApprovalStatus, ApprovalType } from "../data";
import { Avatar, Empty, Icon, Reveal, SectionHead, StatusPill } from "../ui";
import { useApp } from "../store";

const TYPE_ICON: Record<ApprovalType, string> = {
  "change-request": "edit", "file-delete": "trash", "geo-tag": "pin", edit: "file",
  "vendor-review": "star", "settings-change": "sliders",
};

export function ApprovalsView() {
  const app = useApp();
  const role = app.role ?? "admin";
  const isAdmin = role === "admin";
  const [tab, setTab] = useState<"pending" | ApprovalStatus | "all">("pending");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "change-request" as ApprovalType, title: "", target: "", summary: "" });

  const list = app.approvals.filter((a) => {
    if (tab === "all") return true;
    return a.status === tab;
  });

  const decide = (a: Approval, status: ApprovalStatus, withNote: boolean) => {
    if (withNote && noteFor !== a.id) { setNoteFor(a.id); setNote(""); return; }
    app.decide(a.id, status, note.trim() || (status === "approved" ? "Approved at gate." : "Rejected at gate."));
    app.log(`${status === "approved" ? "Approved" : "Rejected"}: ${a.title}`, "approval");
    app.toast(`${status === "approved" ? "Approved" : "Rejected"} · ${a.title}`, status === "approved" ? "ok" : "err");
    setNoteFor(null); setNote("");
  };

  const tabs: { k: typeof tab; label: string; n?: number }[] = [
    { k: "pending", label: "Pending", n: app.approvals.filter((a) => a.status === "pending").length },
    { k: "approved", label: "Approved", n: app.approvals.filter((a) => a.status === "approved").length },
    { k: "rejected", label: "Rejected", n: app.approvals.filter((a) => a.status === "rejected").length },
    { k: "all", label: "All" },
  ];

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="governance / approval gate"
        title={isAdmin ? "Decision Gate" : "Request Pipeline"}
        right={
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map((t) => (
              <button key={t.k} className={`chip ${tab === t.k ? "chip-on" : ""}`} onClick={() => setTab(t.k)}>
                {t.label}{t.n != null && <span className="opacity-70">·{t.n}</span>}
              </button>
            ))}
            {!isAdmin && (
              <button className="btn btn-pri !h-7 ml-1" onClick={() => setShowForm((v) => !v)}>
                <Icon name={showForm ? "x" : "plus"} size={12} /> {showForm ? "close" : "new request"}
              </button>
            )}
          </div>
        }
      />

      {!isAdmin && showForm && (
        <Reveal>
          <div className="panel panel-hot p-4 sm:p-5">
            <div className="microlabel mb-3">route to {ROLE_META.admin.clearance} gate · decision SLA 24 h</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="microlabel block mb-1.5">request type</label>
                <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ApprovalType }))}>
                  {(Object.keys(APPROVAL_TYPE_LABEL) as ApprovalType[]).map((t) => (
                    <option key={t} value={t}>{APPROVAL_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="microlabel block mb-1.5">target</label>
                <input className="input" placeholder="e.g. PRJ-014 / runbook v2.3" value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="microlabel block mb-1.5">title</label>
                <input className="input" placeholder="One-line summary of the change" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="microlabel block mb-1.5">justification</label>
                <textarea className="textarea" placeholder="Why this change is needed, impact if deferred…"
                  value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn" onClick={() => setShowForm(false)}>discard</button>
              <button className="btn btn-pri" disabled={!form.title.trim()}
                onClick={() => {
                  app.submit({
                    type: form.type, title: form.title.trim(),
                    target: form.target.trim() || "general", summary: form.summary.trim() || "—",
                    requester: ROLE_META[role].persona, role,
                  });
                  app.toast("Request routed to admin gate", "info");
                  setForm({ type: "change-request", title: "", target: "", summary: "" });
                  setShowForm(false);
                  setTab("pending");
                }}>
                <Icon name="send" size={12} /> submit to gate
              </button>
            </div>
          </div>
        </Reveal>
      )}

      <div className="space-y-3">
        {list.length === 0 && <Empty text={`no ${tab === "all" ? "" : tab + " "}items in the gate`} />}
        {list.map((a, i) => (
          <Reveal key={a.id} delay={i * 40}>
            <div className={`panel p-4 sm:p-5 ${a.status === "pending" ? "panel-hot" : ""}`}>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 grid place-items-center border border-line bg-[#0d1526] flex-none mt-0.5"
                  style={{ color: a.status === "rejected" ? "#ff5d55" : a.status === "approved" ? "#43d9a3" : "#ffb224" }}>
                  <Icon name={TYPE_ICON[a.type]} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] font-semibold text-fog leading-snug">{a.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 font-mono text-[10px] tracking-wider uppercase text-dim">
                        <span className="text-amberx">{APPROVAL_TYPE_LABEL[a.type]}</span>
                        <span>→</span><span className="text-mist">{a.target}</span>
                      </div>
                    </div>
                    <StatusPill s={a.status} />
                  </div>

                  <p className="text-[12.5px] text-mist leading-relaxed mt-2.5">{a.summary}</p>

                  {a.note && (
                    <p className="text-[11.5px] text-dim mt-2 border-l-2 pl-2.5 italic"
                      style={{ borderColor: a.status === "rejected" ? "#ff5d55" : "#43d9a3" }}>
                      “{a.note}”
                    </p>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3 mt-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar initials={a.requester.split(" ").map((w) => w[0]).join("").replace(".", "")} accent={ROLE_META[a.role].accent} />
                      <div className="leading-tight">
                        <div className="text-[11.5px] text-fog">{a.requester}</div>
                        <div className="font-mono text-[9px] text-dim tracking-wider uppercase">{ROLE_META[a.role].clearance} · {timeAgo(a.ts)}</div>
                      </div>
                    </div>

                    {isAdmin && a.status === "pending" && (
                      <div className="flex items-center gap-2">
                        {noteFor === a.id && (
                          <input className="input !h-8 !w-56" placeholder="Decision note…" value={note}
                            onChange={(e) => setNote(e.target.value)} autoFocus />
                        )}
                        <button className="btn btn-grn !h-8" onClick={() => decide(a, "approved", false)}>
                          <Icon name="check" size={12} /> approve
                        </button>
                        <button className={`btn btn-danger !h-8 ${noteFor === a.id ? "!bg-redx/20" : ""}`} onClick={() => decide(a, "rejected", true)}>
                          <Icon name="x" size={12} /> {noteFor === a.id ? "confirm reject" : "reject"}
                        </button>
                      </div>
                    )}
                    {!isAdmin && a.status === "pending" && a.requester === ROLE_META[role].persona && (
                      <button className="btn !h-8" onClick={() => { app.withdraw(a.id); app.toast("Request withdrawn from gate", "info"); }}>
                        <Icon name="x" size={12} /> withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
