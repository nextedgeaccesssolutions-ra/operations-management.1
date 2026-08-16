import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ACTIVITY_SEED, APPROVALS_SEED, CREDENTIALS, PH_SITES, PORTALS, ROLE_META,
  SETTING_DEFAULTS, SETTINGS_SEED, SITES_SEED,
} from "./data";
import type { Activity, Approval, ApprovalStatus, GeoSite, PhSite, Role, SettingValue, ViewKey } from "./data";

export interface Toast { id: string; msg: string; tone: "ok" | "warn" | "err" | "info"; }
export interface PendingSetting { value: SettingValue; requestedBy: string; role: Role; ts: number; approvalId: string; }

export interface Report {
  id: string; ref: string; site: string; siteCode: string; type: string;
  inspector: string; ts: number; result: "pass" | "attention" | "fail";
  coords: string; queued: boolean; summary: string;
}

interface Persist {
  role: Role | null;
  view: ViewKey;
  moduleId: string | null;
  offline: boolean;
  approvals: Approval[];
  sites: GeoSite[];
  phSites: PhSite[];
  activity: Activity[];
  checks: Record<string, boolean[]>;
  archived: string[];
  settings: Record<string, SettingValue>;
  pendingSettings: Record<string, PendingSetting>;
  reports: Report[];
}

const KEY = "opsdeck:v5";
export const uid = () => Math.random().toString(36).slice(2, 9);

const FALLBACK: Persist = {
  role: null, view: "dashboard", moduleId: null, offline: false,
  approvals: APPROVALS_SEED, sites: SITES_SEED, phSites: PH_SITES,
  activity: ACTIVITY_SEED, checks: {}, archived: [], settings: {},
  pendingSettings: {}, reports: [],
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
  offline: boolean; approvals: Approval[]; sites: GeoSite[]; phSites: PhSite[];
  activity: Activity[]; checks: Record<string, boolean[]>; archived: string[];
  settings: Record<string, SettingValue>; pendingSettings: Record<string, PendingSetting>;
  reports: Report[];
  toasts: Toast[]; syncQueue: string[];
  pendingCount: number;
  nav: (v: ViewKey, moduleId?: string) => void;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  toggleOffline: () => void;
  toast: (msg: string, tone?: Toast["tone"]) => void;
  log: (text: string, tag: string, who?: string) => void;
  decide: (id: string, status: ApprovalStatus, note?: string) => void;
  withdraw: (approvalId: string) => void;
  submit: (a: Omit<Approval, "id" | "ts" | "status">) => void;
  updateSetting: (key: string, value: SettingValue) => void;
  addSite: (s: GeoSite) => void;
  updateSite: (id: string, patch: Partial<GeoSite>) => void;
  removeSite: (id: string) => void;
  addPh: (s: PhSite) => void;
  updatePh: (id: string, patch: Partial<PhSite>) => void;
  removePh: (id: string) => void;
  addReport: (r: Report) => void;
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

  // react to real network loss / return
  useEffect(() => {
    const goOff = () => setS((p) => (p.offline ? p : { ...p, offline: true }));
    const goOn = () => setS((p) => (p.offline ? { ...p, offline: false } : p));
    window.addEventListener("offline", goOff);
    window.addEventListener("online", goOn);
    return () => {
      window.removeEventListener("offline", goOff);
      window.removeEventListener("online", goOn);
    };
  }, []);

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

  // ── auth: separate portals, separate credentials ──

  const login = useCallback((user: string, pass: string): boolean => {
    const u = user.trim().toLowerCase();
    const pw = pass.trim();
    const found = (Object.keys(CREDENTIALS) as Role[]).find(
      (r) => CREDENTIALS[r].user === u && CREDENTIALS[r].pass === pw,
    );
    if (!found) return false;
    setS((prev) => ({
      ...prev, role: found, view: "dashboard", moduleId: null,
      activity: [
        { id: uid(), ts: Date.now(), who: ROLE_META[found].persona, text: `Session started · ${ROLE_META[found].clearance} · entered ${PORTALS[found].name}`, tag: "auth" },
        ...prev.activity,
      ].slice(0, 40),
    }));
    toast(`Access granted — ${PORTALS[found].name} · ${ROLE_META[found].persona}`, "ok");
    return true;
  }, [toast]);

  const logout = useCallback(() => {
    setS((prev) => {
      const act = prev.role
        ? [
            { id: uid(), ts: Date.now(), who: ROLE_META[prev.role].persona, text: `Session closed · signed out of ${PORTALS[prev.role].name}`, tag: "auth" },
            ...prev.activity,
          ].slice(0, 40)
        : prev.activity;
      return { ...prev, role: null, view: "dashboard", moduleId: null, activity: act };
    });
    toast("Session closed — portal locked", "info");
  }, [toast]);

  const toggleOffline = useCallback(() => {
    setS((p) => {
      const next = !p.offline;
      if (!next && syncQueue.length) {
        const n = syncQueue.length;
        setSyncQueue([]);
        setS((q) => ({ ...q, reports: q.reports.map((r) => ({ ...r, queued: false })) }));
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

  // ── approval gate (governs settings changes & report approvals) ──

  const decide = useCallback((id: string, status: ApprovalStatus, note?: string) => {
    setS((p) => {
      const a = p.approvals.find((x) => x.id === id);
      let settings = p.settings;
      let pendingSettings = p.pendingSettings;
      let reports = p.reports;
      let activity = p.activity;

      if (a?.type === "settings-change") {
        const key = Object.keys(pendingSettings).find((k) => pendingSettings[k].approvalId === id);
        if (key) {
          const entry = pendingSettings[key];
          const def = SETTINGS_SEED.find((x) => x.key === key);
          if (status === "approved") {
            settings = { ...settings, [key]: entry.value };
            activity = [{ id: uid(), ts: Date.now(), who: ROLE_META.admin.persona, text: `Settings applied at gate · ${def?.label ?? key} → ${String(entry.value)}`, tag: "approval" }, ...activity].slice(0, 40);
          } else {
            activity = [{ id: uid(), ts: Date.now(), who: ROLE_META.admin.persona, text: `Settings change rejected at gate · ${def?.label ?? key} stays at current value`, tag: "approval" }, ...activity].slice(0, 40);
          }
          pendingSettings = { ...pendingSettings };
          delete pendingSettings[key];
        }
      }

      if (a?.type === "report-approval") {
        const ref = a.target.replace("report:", "");
        reports = reports.map((r) => (r.ref === ref ? { ...r, result: status === "approved" ? r.result : "attention", queued: false } : r));
        activity = [{ id: uid(), ts: Date.now(), who: ROLE_META.admin.persona, text: `Inspection report ${ref} ${status} at gate`, tag: "approval" }, ...activity].slice(0, 40);
      }

      return {
        ...p, settings, pendingSettings, reports, activity,
        approvals: p.approvals.map((x) => (x.id === id ? { ...x, status, note: note ?? x.note } : x)),
      };
    });
    queue(`decide:${id}`);
  }, [queue]);

  const withdraw = useCallback((approvalId: string) => {
    setS((p) => {
      const pendingSettings = { ...p.pendingSettings };
      for (const k of Object.keys(pendingSettings)) {
        if (pendingSettings[k].approvalId === approvalId) delete pendingSettings[k];
      }
      return { ...p, approvals: p.approvals.filter((a) => a.id !== approvalId), pendingSettings };
    });
    queue(`withdraw:${approvalId}`);
  }, [queue]);

  const submit = useCallback((a: Omit<Approval, "id" | "ts" | "status">) => {
    setS((p) => ({
      ...p,
      approvals: [{ ...a, id: uid(), ts: Date.now(), status: "pending" as const }, ...p.approvals],
    }));
    queue(`submit:${a.type}`);
    log(`Submitted ${a.type}: ${a.title}`, "approval", a.requester);
  }, [queue, log]);

  // ── governed settings ──

  const updateSetting = useCallback((key: string, value: SettingValue) => {
    const role = s.role;
    if (!role) return;
    const def = SETTINGS_SEED.find((x) => x.key === key);
    const old = s.settings[key] ?? SETTING_DEFAULTS[key];
    if (String(old) === String(value)) return;
    const label = def?.label ?? key;

    if (role === "admin") {
      setS((p) => {
        const pend = p.pendingSettings[key];
        let approvals = p.approvals;
        if (pend) approvals = approvals.filter((a) => a.id !== pend.approvalId);
        const pendingSettings = { ...p.pendingSettings };
        delete pendingSettings[key];
        return {
          ...p,
          settings: { ...p.settings, [key]: value },
          pendingSettings,
          approvals,
          activity: [{ id: uid(), ts: Date.now(), who: ROLE_META.admin.persona, text: `Settings applied · ${label}: ${String(old)} → ${String(value)} (L5 direct)`, tag: "plan" }, ...p.activity].slice(0, 40),
        };
      });
      toast(`${label} applied — L5 authority`, "ok");
      return;
    }

    const apId = uid();
    const who = ROLE_META[role].persona;
    setS((p) => ({
      ...p,
      pendingSettings: { ...p.pendingSettings, [key]: { value, requestedBy: who, role, ts: Date.now(), approvalId: apId } },
      approvals: [
        {
          id: apId, type: "settings-change" as const,
          title: `Settings change · ${label}`, target: `settings:${key}`,
          requester: who, role,
          summary: `${label}: ${String(old)} → ${String(value)}. Requested from the ${PORTALS[role].name}; applies only after L5 sign-off.`,
          status: "pending" as const, ts: Date.now(),
        },
        ...p.approvals,
      ],
      activity: [{ id: uid(), ts: Date.now(), who, text: `Requested settings change · ${label} → ${String(value)} (routed to gate)`, tag: "approval" }, ...p.activity].slice(0, 40),
    }));
    toast(`${label} routed to admin gate`, "info");
    queue(`settings:${key}`);
  }, [s.role, s.settings, toast, queue]);

  // ── geo: sector grid + PH network ──

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

  const addPh = useCallback((site: PhSite) => {
    setS((p) => ({ ...p, phSites: [...p.phSites, site] }));
    queue(`ph:add:${site.code}`);
  }, [queue]);

  const updatePh = useCallback((id: string, patch: Partial<PhSite>) => {
    setS((p) => ({ ...p, phSites: p.phSites.map((x) => (x.id === id ? { ...x, ...patch, lastSync: app_offline(p) ? x.lastSync : "just now" } : x)) }));
    queue(`ph:edit:${id}`);
  }, [queue]);

  const removePh = useCallback((id: string) => {
    setS((p) => ({ ...p, phSites: p.phSites.filter((x) => x.id !== id) }));
    queue(`ph:del:${id}`);
  }, [queue]);

  const addReport = useCallback((r: Report) => {
    setS((p) => ({ ...p, reports: [r, ...p.reports] }));
    queue(`report:${r.ref}`);
    log(`Filed inspection report ${r.ref} · ${r.site}${r.queued ? " (queued offline)" : ""}`, "field", r.inspector);
  }, [queue, log]);

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
    nav, login, logout, toggleOffline, toast, log, decide, withdraw, submit, updateSetting,
    addSite, updateSite, removeSite, addPh, updatePh, removePh, addReport,
    toggleCheck, archive, restore, reset,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

function app_offline(p: Persist) { return p.offline; }

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
