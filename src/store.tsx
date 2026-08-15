import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ACTIVITY_SEED, APPROVALS_SEED, ROLE_META, SITES_SEED } from "./data";
import type { Activity, Approval, ApprovalStatus, GeoSite, Role, ViewKey } from "./data";

export interface Toast { id: string; msg: string; tone: "ok" | "warn" | "err" | "info"; }

interface Persist {
  role: Role | null;
  view: ViewKey;
  moduleId: string | null;
  offline: boolean;
  approvals: Approval[];
  sites: GeoSite[];
  activity: Activity[];
  checks: Record<string, boolean[]>;
  archived: string[];
}

const KEY = "opsdeck:v3";
export const uid = () => Math.random().toString(36).slice(2, 9);

const FALLBACK: Persist = {
  role: null, view: "dashboard", moduleId: null, offline: false,
  approvals: APPROVALS_SEED, sites: SITES_SEED, activity: ACTIVITY_SEED,
  checks: {}, archived: [],
};

function load(): Persist {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    return { ...FALLBACK, ...(JSON.parse(raw) as Partial<Persist>) };
  } catch {
    return FALLBACK;
  }
}

interface Ctx {
  role: Role | null; view: ViewKey; moduleId: string | null;
  offline: boolean; approvals: Approval[]; sites: GeoSite[];
  activity: Activity[]; checks: Record<string, boolean[]>; archived: string[];
  toasts: Toast[]; syncQueue: string[];
  pendingCount: number;
  nav: (v: ViewKey, moduleId?: string) => void;
  setRole: (r: Role) => void;
  toggleOffline: () => void;
  toast: (msg: string, tone?: Toast["tone"]) => void;
  log: (text: string, tag: string, who?: string) => void;
  decide: (id: string, status: ApprovalStatus, note?: string) => void;
  submit: (a: Omit<Approval, "id" | "ts" | "status">) => void;
  addSite: (s: GeoSite) => void;
  updateSite: (id: string, patch: Partial<GeoSite>) => void;
  removeSite: (id: string) => void;
  toggleCheck: (modId: string, idx: number, total: number) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  reset: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Persist>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [syncQueue, setSyncQueue] = useState<string[]>([]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full */ }
  }, [s]);

  const toast = useCallback((msg: string, tone: Toast["tone"] = "ok") => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const log = useCallback((text: string, tag: string, who?: string) => {
    setS((p) => ({
      ...p,
      activity: [
        { id: uid(), ts: Date.now(), who: who ?? (p.role ? ROLE_META[p.role].persona : "SYSTEM"), text, tag },
        ...p.activity,
      ].slice(0, 40),
    }));
  }, []);

  const queue = useCallback((label: string) => {
    setSyncQueue((q) => (s.offline ? [...q, label] : q));
  }, [s.offline]);

  const nav = useCallback((v: ViewKey, moduleId?: string) => {
    setS((p) => ({ ...p, view: v, moduleId: moduleId ?? p.moduleId }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const setRole = useCallback((r: Role) => {
    setS((p) => ({ ...p, role: r, view: "dashboard", moduleId: null }));
    toast(`Clearance granted — ${ROLE_META[r].label} console`, "ok");
    log(`Session started · ${ROLE_META[r].clearance}`, "auth", ROLE_META[r].persona);
  }, [toast, log]);

  const toggleOffline = useCallback(() => {
    setS((p) => {
      const next = !p.offline;
      if (!next && syncQueue.length) {
        const n = syncQueue.length;
        setSyncQueue([]);
        window.setTimeout(() => {
          toast(`Uplink restored — ${n} queued op${n > 1 ? "s" : ""} synced to control`, "ok");
          log(`Sync flush complete · ${n} operation${n > 1 ? "s" : ""} reconciled`, "sync");
        }, 700);
      } else if (next) {
        window.setTimeout(() => toast("Offline node engaged — changes will queue locally", "warn"), 60);
      }
      return { ...p, offline: next };
    });
  }, [syncQueue, toast, log]);

  const decide = useCallback((id: string, status: ApprovalStatus, note?: string) => {
    setS((p) => ({
      ...p,
      approvals: p.approvals.map((a) => (a.id === id ? { ...a, status, note: note ?? a.note } : a)),
    }));
    queue(`decide:${id}`);
  }, [queue]);

  const submit = useCallback((a: Omit<Approval, "id" | "ts" | "status">) => {
    setS((p) => ({
      ...p,
      approvals: [{ ...a, id: uid(), ts: Date.now(), status: "pending" as const }, ...p.approvals],
    }));
    queue(`submit:${a.type}`);
    log(`Submitted ${a.type}: ${a.title}`, "approval", a.requester);
  }, [queue, log]);

  const addSite = useCallback((site: GeoSite) => {
    setS((p) => ({ ...p, sites: [...p.sites, site] }));
    queue(`geo:add:${site.code}`);
  }, [queue]);

  const updateSite = useCallback((id: string, patch: Partial<GeoSite>) => {
    setS((p) => ({ ...p, sites: p.sites.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    queue(`geo:edit:${id}`);
  }, [queue]);

  const removeSite = useCallback((id: string) => {
    setS((p) => ({ ...p, sites: p.sites.filter((x) => x.id !== id) }));
    queue(`geo:del:${id}`);
  }, [queue]);

  const toggleCheck = useCallback((modId: string, idx: number, total: number) => {
    setS((p) => {
      const cur = p.checks[modId] ?? Array<boolean>(total).fill(false);
      const next = [...cur];
      next[idx] = !next[idx];
      return { ...p, checks: { ...p.checks, [modId]: next } };
    });
  }, []);

  const archive = useCallback((id: string) => {
    setS((p) => ({ ...p, archived: [...p.archived, id] }));
    queue(`archive:${id}`);
  }, [queue]);

  const restore = useCallback((id: string) => {
    setS((p) => ({ ...p, archived: p.archived.filter((x) => x !== id) }));
    queue(`restore:${id}`);
  }, [queue]);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    window.location.reload();
  }, []);

  const value: Ctx = {
    ...s, toasts, syncQueue,
    pendingCount: s.approvals.filter((a) => a.status === "pending").length,
    nav, setRole, toggleOffline, toast, log, decide, submit,
    addSite, updateSite, removeSite, toggleCheck, archive, restore, reset,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
