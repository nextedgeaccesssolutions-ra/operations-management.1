// ─────────────────────────────────────────────────────────────
// OPSDECK · data layer — types, seeds, deterministic generators
// ─────────────────────────────────────────────────────────────

export type Role = "admin" | "client" | "inspector";
export type ViewKey =
  | "dashboard" | "gantt" | "scurve" | "geo" | "approvals"
  | "modules" | "module" | "search" | "settings" | "reports" | "refrens";

export type ProjectStatus = "on-track" | "at-risk" | "delayed" | "planning";

export interface Project {
  code: string; name: string; client: string; status: ProjectStatus;
  progress: number; color: string; inspector: string; manager: string;
  trend: number[]; nextMilestone: string; milestoneDate: string;
}

export type TaskKind = "field" | "eng" | "qa" | "docs";
export interface Task {
  id: string; prj: string; name: string; owner: string; who: Role | "eng";
  start: number; dur: number; prog: number; kind: TaskKind; ms?: boolean;
}

export interface SCurveData {
  weeks: number; curWeek: number;
  planned: number[]; actual: (number | null)[]; forecast: (number | null)[];
}

export type SiteStatus = "active" | "attention" | "pending" | "offline";
export interface GeoSite {
  id: string; code: string; name: string; x: number; y: number;
  lat: string; lng: string; type: string; status: SiteStatus;
  inspector: string; lastSync: string; cache: boolean; note: string;
}

export type ApprovalType =
  | "change-request" | "file-delete" | "geo-tag" | "edit" | "vendor-review" | "settings-change" | "report-approval";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export interface Approval {
  id: string; type: ApprovalType; title: string; target: string;
  requester: string; role: Role; summary: string;
  status: ApprovalStatus; note?: string; ts: number;
}

export interface Activity { id: string; ts: number; who: string; text: string; tag: string; }

export type WorkspaceKind =
  | "form" | "checklist" | "vendor" | "meter" | "doc" | "toggles" | "matrix"
  | "pdf" | "diff" | "tokens" | "builder" | "analyzer" | "extractor"
  | "searchws" | "timer" | "updateform" | "kanban" | "timeline";

export interface ModuleDef {
  id: string; cat: string; name: string; desc: string;
  ws: WorkspaceKind; icon: string;
}

// ───────────────────────── role metadata ─────────────────────────

export const ROLE_META: Record<Role, {
  label: string; persona: string; initials: string; clearance: string;
  accent: string; blurb: string; org: string;
}> = {
  admin: {
    label: "Administrator", persona: "A. Kessler", initials: "AK",
    clearance: "L5 · COMMAND", accent: "#ffb224", org: "Opsdeck Control",
    blurb: "Full command: approvals, geo-tag authority, archive & edit rights across every operation.",
  },
  client: {
    label: "Client Portal", persona: "J. Okafor", initials: "JO",
    clearance: "L3 · PORTAL", accent: "#2fd6c3", org: "Meridian Energy",
    blurb: "Portfolio dashboards, S-curve progress, milestone tracking and request submission.",
  },
  inspector: {
    label: "Field Inspector", persona: "R. Vance", initials: "RV",
    clearance: "L4 · FIELD", accent: "#58a6ff", org: "Field Unit 07",
    blurb: "Inspection queue, geo-tag drops, runbook execution and offline sync from site.",
  },
};

export const ROLE_SCOPE: Record<Role, string[]> = {
  admin: ["PRJ-014", "PRJ-021", "PRJ-027", "PRJ-033", "PRJ-036", "PRJ-041"],
  client: ["PRJ-014", "PRJ-027"],
  inspector: ["PRJ-014", "PRJ-021", "PRJ-033"],
};

// ───────────────────────── portals · credentials · navigation ─────────────────────────

export const PORTALS: Record<Role, { name: string; tag: string; desc: string; icon: string }> = {
  admin: {
    name: "Command Portal", tag: "CMD", icon: "shield",
    desc: "Full-scope governance console. Approval gate, geo authority, platform settings and archive rights.",
  },
  client: {
    name: "Client Portal", tag: "CLT", icon: "target",
    desc: "Portfolio truth for Meridian Energy. Dashboards, earned value, milestones and request tracking.",
  },
  inspector: {
    name: "Field Portal", tag: "FLD", icon: "radio",
    desc: "Field Unit 07 console. Inspections, geo drops, offline sync — every setting edit routes to the L5 gate.",
  },
};

export const CREDENTIALS: Record<Role, { user: string; pass: string; hint: string }> = {
  admin: { user: "a.kessler", pass: "deck-admin", hint: "a.kessler · deck-admin" },
  client: { user: "j.okafor", pass: "deck-client", hint: "j.okafor · deck-client" },
  inspector: { user: "r.vance", pass: "deck-field", hint: "r.vance · deck-field" },
};

export interface NavItem { view: ViewKey; label: string; icon: string; }

export const NAV_FOR: Record<Role, NavItem[]> = {
  admin: [
    { view: "dashboard", label: "Command Deck", icon: "grid" },
    { view: "gantt", label: "Gantt Planner", icon: "gantt" },
    { view: "scurve", label: "S-Curve Control", icon: "curve" },
    { view: "geo", label: "Geo Command", icon: "pin" },
    { view: "reports", label: "Inspection Reports", icon: "clip" },
    { view: "refrens", label: "Refrens Integration", icon: "refrens" },
    { view: "approvals", label: "Approval Gate", icon: "shield" },
    { view: "settings", label: "Platform Settings", icon: "sliders" },
    { view: "modules", label: "Module Registry", icon: "layers" },
    { view: "search", label: "Enterprise Search", icon: "search" },
  ],
  client: [
    { view: "dashboard", label: "Portfolio Deck", icon: "grid" },
    { view: "gantt", label: "Programme Gantt", icon: "gantt" },
    { view: "scurve", label: "S-Curve Review", icon: "curve" },
    { view: "geo", label: "Site Map", icon: "pin" },
    { view: "reports", label: "Inspection Reports", icon: "clip" },
    { view: "refrens", label: "Refrens Integration", icon: "refrens" },
    { view: "approvals", label: "My Requests", icon: "shield" },
    { view: "modules", label: "Module Registry", icon: "layers" },
    { view: "search", label: "Enterprise Search", icon: "search" },
  ],
  inspector: [
    { view: "dashboard", label: "Field Console", icon: "grid" },
    { view: "gantt", label: "Sector Gantt", icon: "gantt" },
    { view: "scurve", label: "Progress S-Curve", icon: "curve" },
    { view: "geo", label: "Geo Drop", icon: "pin" },
    { view: "reports", label: "Field Reports", icon: "clip" },
    { view: "refrens", label: "Refrens Integration", icon: "refrens" },
    { view: "approvals", label: "Approval Gate", icon: "shield" },
    { view: "settings", label: "Settings · gated", icon: "sliders" },
    { view: "modules", label: "Module Registry", icon: "layers" },
    { view: "search", label: "Enterprise Search", icon: "search" },
  ],
};

// ───────────────────────── governed platform settings ─────────────────────────

export type SettingValue = string | number | boolean;

export interface SettingDef {
  key: string; section: string; label: string; desc: string;
  kind: "toggle" | "select" | "number" | "text";
  def: SettingValue; options?: string[]; unit?: string;
}

export const SETTING_SECTIONS = ["Platform", "Sync & Offline", "Notifications", "Governance", "Data & Retention"];

export const SETTINGS_SEED: SettingDef[] = [
  { key: "platform_name", section: "Platform", label: "Platform name", desc: "Shown on all portal headers and generated reports.", kind: "text", def: "OPSDECK OS" },
  { key: "maintenance_mode", section: "Platform", label: "Maintenance mode", desc: "Freeze writes for all non-L5 sessions during change windows.", kind: "toggle", def: false },
  { key: "session_timeout", section: "Platform", label: "Session timeout", desc: "Auto sign-out after inactivity on field consoles.", kind: "select", options: ["15 min", "30 min", "60 min", "8 h"], def: "30 min" },
  { key: "sync_interval", section: "Sync & Offline", label: "Uplink sync interval", desc: "How often online nodes push the evidence queue to control.", kind: "select", options: ["15 s", "30 s", "60 s", "120 s"], def: "30 s" },
  { key: "offline_tolerance", section: "Sync & Offline", label: "Offline tolerance", desc: "Hours a node may run dark before control is alerted.", kind: "number", def: 12, unit: "h" },
  { key: "evidence_autosync", section: "Sync & Offline", label: "Evidence auto-sync", desc: "Push geo-tagged photos and step-locks as soon as uplink returns.", kind: "toggle", def: true },
  { key: "conflict_policy", section: "Sync & Offline", label: "Merge conflict policy", desc: "Behaviour when two nodes edit the same artifact offline.", kind: "select", options: ["control wins", "field wins", "manual merge"], def: "manual merge" },
  { key: "notif_email", section: "Notifications", label: "Email alerts", desc: "Approval decisions and NCR events to portal owners.", kind: "toggle", def: true },
  { key: "notif_sms", section: "Notifications", label: "SMS escalation", desc: "SLA breaches page the on-call commander.", kind: "toggle", def: false },
  { key: "notif_digest", section: "Notifications", label: "Digest cadence", desc: "Rollup of field activity for client stakeholders.", kind: "select", options: ["daily", "weekly", "off"], def: "daily" },
  { key: "approval_sla", section: "Governance", label: "Approval SLA", desc: "Decision window before a pending gate item escalates.", kind: "select", options: ["12 h", "24 h", "48 h"], def: "24 h" },
  { key: "dual_sign_deletes", section: "Governance", label: "Dual-sign deletes", desc: "Archive actions require a second L5 countersign.", kind: "toggle", def: true },
  { key: "geo_authority", section: "Governance", label: "Geo-tag authority", desc: "Who may register new waypoints without a gate decision.", kind: "select", options: ["admin only", "admin + inspector", "all roles"], def: "admin only" },
  { key: "runbook_enforcement", section: "Governance", label: "Runbook enforcement", desc: "Strict locks steps in order; standard allows skips with a note.", kind: "select", options: ["strict", "standard", "advisory"], def: "strict" },
  { key: "retention_days", section: "Data & Retention", label: "Evidence retention", desc: "Days geo-tagged evidence is retained before purge review.", kind: "number", def: 365, unit: "d" },
  { key: "audit_stream", section: "Data & Retention", label: "Audit stream", desc: "Immutable ledger of every governed action.", kind: "toggle", def: true },
];

export const SETTING_DEFAULTS: Record<string, SettingValue> = Object.fromEntries(
  SETTINGS_SEED.map((x) => [x.key, x.def]),
);

// ───────────────────────── philippines geo network ─────────────────────────

export type PhRegion = "LUZON" | "VISAYAS" | "MINDANAO" | "PALAWAN";

export interface PhSite {
  id: string; code: string; name: string; region: PhRegion;
  x: number; y: number; lat: string; lng: string; type: string;
  status: SiteStatus; inspector: string; lastSync: string; cache: boolean;
  note: string; report?: string;
}

export const PH_SITES: PhSite[] = [
  { id: "ph01", code: "PH-01", name: "Bataan Refinery Turnaround", region: "LUZON", x: 116, y: 112, lat: "14.6530° N", lng: "120.2840° E", type: "Refinery", status: "active", inspector: "R. Vance", lastSync: "6 min", cache: true, note: "Exchanger bundle E-14 pull complete. Hot-work permit PTW-2210 open until 18:00.", report: "IR-2201" },
  { id: "ph02", code: "PH-02", name: "Clark Solar Array · Block C", region: "LUZON", x: 148, y: 86, lat: "15.1860° N", lng: "120.5580° E", type: "Solar", status: "active", inspector: "M. Osei", lastSync: "14 min", cache: true, note: "String combiner audits 62/80. Thermal cam sweep on block C-7 tomorrow 05:30.", report: "IR-2204" },
  { id: "ph03", code: "PH-03", name: "Manila Bay Reclamation Survey", region: "LUZON", x: 158, y: 121, lat: "14.5740° N", lng: "120.9710° E", type: "Survey", status: "attention", inspector: "R. Vance", lastSync: "51 min", cache: true, note: "Bathymetry delta +0.4 m at stake R-118. Awaiting hydrography re-shoot on calm sea window.", report: "IR-2197" },
  { id: "ph04", code: "PH-04", name: "Batangas Port Crane Audit", region: "LUZON", x: 141, y: 143, lat: "13.7560° N", lng: "121.0580° E", type: "Crane", status: "active", inspector: "T. Brandt", lastSync: "22 min", cache: true, note: "STS crane 4 wire-rope NDT passed. Load test certificate issued C-8841." },
  { id: "ph05", code: "PH-05", name: "Naga Grid Substation", region: "LUZON", x: 200, y: 119, lat: "13.6210° N", lng: "123.1920° E", type: "Substation", status: "pending", inspector: "M. Reyes", lastSync: "—", cache: false, note: "Proposed relay upgrade waypoint. Registration pending L5 approval." },
  { id: "ph14", code: "PH-14", name: "Baguio Highlands Telemetry", region: "LUZON", x: 140, y: 54, lat: "16.4020° N", lng: "120.5960° E", type: "Telemetry", status: "active", inspector: "M. Osei", lastSync: "3 min", cache: true, note: "Ridge mast uplink 99.2% over 30 d. Battery bank derating flagged for Q-review." },
  { id: "ph06", code: "PH-06", name: "Iloilo Water District Intake", region: "VISAYAS", x: 98, y: 238, lat: "10.7200° N", lng: "122.5450° E", type: "Water", status: "active", inspector: "M. Osei", lastSync: "9 min", cache: true, note: "Intake screen differential pressure normal. Chlorination log countersigned.", report: "IR-2208" },
  { id: "ph07", code: "PH-07", name: "Cebu–Mactan Bridge Bearings", region: "VISAYAS", x: 139, y: 252, lat: "10.3090° N", lng: "123.9470° E", type: "Bridge", status: "attention", inspector: "R. Vance", lastSync: "1 h", cache: true, note: "Elastomeric bearing B-12 shear deformation 9 mm — above watch threshold. Weekly monitoring set.", report: "IR-2193" },
  { id: "ph08", code: "PH-08", name: "Bohol Geotechnical Array", region: "VISAYAS", x: 158, y: 270, lat: "9.8500° N", lng: "124.2100° E", type: "Geotech", status: "active", inspector: "T. Brandt", lastSync: "31 min", cache: true, note: "Piezometer cluster P-3 baseline stable after storm recharge event." },
  { id: "ph09", code: "PH-09", name: "Tacloban Wind Corridor", region: "VISAYAS", x: 171, y: 236, lat: "11.2430° N", lng: "125.0040° E", type: "Wind", status: "active", inspector: "R. Vance", lastSync: "18 min", cache: true, note: "Met-mast anemometry 6.8 m/s monthly mean. Typhoon-shutdown drill logged.", report: "IR-2210" },
  { id: "ph13", code: "PH-13", name: "Puerto Princesa Relay Node", region: "PALAWAN", x: 44, y: 289, lat: "9.7390° N", lng: "118.7350° E", type: "Node", status: "pending", inspector: "M. Reyes", lastSync: "—", cache: false, note: "Proposed sync-relay waypoint on the Palawan corridor. Coordinates captured on-site, awaiting gate." },
  { id: "ph10", code: "PH-10", name: "Davao Datacenter Uptime Audit", region: "MINDANAO", x: 203, y: 344, lat: "7.0730° N", lng: "125.6120° E", type: "Datacenter", status: "active", inspector: "M. Osei", lastSync: "2 min", cache: true, note: "Generator bank 2 load test passed at 92%. ATS transfer 11.4 s — within spec.", report: "IR-2212" },
  { id: "ph11", code: "PH-11", name: "Cagayan de Oro Fleet Depot", region: "MINDANAO", x: 151, y: 310, lat: "8.4540° N", lng: "124.6310° E", type: "Depot", status: "offline", inspector: "T. Brandt", lastSync: "7 h", cache: true, note: "Node dark since 02:10 — 14 cached forms on device. Dispatch alerted, fuel run scheduled." },
  { id: "ph12", code: "PH-12", name: "Zamboanga Marine Terminal", region: "MINDANAO", x: 95, y: 343, lat: "6.9080° N", lng: "122.0640° E", type: "Marine", status: "attention", inspector: "R. Vance", lastSync: "44 min", cache: false, note: "Fender F-7 impact damage logged; dive survey requested for pile toe inspection." },
];

export const PH_REGIONS: PhRegion[] = ["LUZON", "VISAYAS", "MINDANAO", "PALAWAN"];

// ───────────────────────── projects ─────────────────────────

export const PROJECTS: Project[] = [
  { code: "PRJ-014", name: "Northgate Substation Retrofit", client: "Meridian Energy", status: "on-track", progress: 68, color: "#ffb224", inspector: "R. Vance", manager: "A. Kessler", trend: [41, 46, 50, 55, 58, 63, 68], nextMilestone: "Energization dry-run", milestoneDate: "+9d" },
  { code: "PRJ-021", name: "Harbor Line Signal Upgrade", client: "Port Authority", status: "at-risk", progress: 41, color: "#ff5d55", inspector: "R. Vance", manager: "D. Silva", trend: [22, 27, 30, 33, 36, 39, 41], nextMilestone: "Block window B2", milestoneDate: "+4d" },
  { code: "PRJ-027", name: "Metro Water Treatment · Phase II", client: "City of Ashford", status: "on-track", progress: 82, color: "#2fd6c3", inspector: "M. Osei", manager: "A. Kessler", trend: [58, 63, 67, 71, 75, 79, 82], nextMilestone: "Commissioning week", milestoneDate: "+16d" },
  { code: "PRJ-033", name: "Ridgeline Wind Farm Inspection", client: "Vantage Renewables", status: "delayed", progress: 27, color: "#58a6ff", inspector: "R. Vance", manager: "D. Silva", trend: [12, 15, 17, 20, 23, 25, 27], nextMilestone: "Turbine string T4 access", milestoneDate: "+12d" },
  { code: "PRJ-036", name: "Datacenter Cutover · East Wing", client: "Helix Cloud", status: "on-track", progress: 55, color: "#43d9a3", inspector: "M. Osei", manager: "A. Kessler", trend: [30, 35, 40, 44, 48, 52, 55], nextMilestone: "Load bank test", milestoneDate: "+6d" },
  { code: "PRJ-041", name: "Fleet Telematics Rollout", client: "TransCore Logistics", status: "planning", progress: 12, color: "#94a4c0", inspector: "T. Brandt", manager: "D. Silva", trend: [4, 6, 7, 9, 10, 11, 12], nextMilestone: "Pilot depot sign-off", milestoneDate: "+21d" },
];

// ───────────────────────── gantt tasks (day offsets from today) ─────────────────────────

const t = (id: string, prj: string, name: string, owner: string, who: Role | "eng", start: number, dur: number, prog: number, kind: TaskKind, ms = false): Task =>
  ({ id, prj, name, owner, who, start, dur, prog, kind, ms });

export const TASKS: Task[] = [
  // PRJ-014 — Northgate Substation Retrofit
  t("T-101", "PRJ-014", "HV bushing replacement · Bay 3", "R. Vance", "inspector", -24, 12, 100, "field"),
  t("T-102", "PRJ-014", "Protection relay reconfiguration", "L. Fontaine", "eng", -16, 10, 85, "eng"),
  t("T-103", "PRJ-014", "Torque spec verification sweep", "R. Vance", "inspector", -6, 8, 55, "qa"),
  t("T-104", "PRJ-014", "SCADA point-to-point tests", "K. Yamada", "eng", 1, 9, 20, "eng"),
  t("T-105", "PRJ-014", "Energization dry-run", "A. Kessler", "admin", 9, 2, 0, "field", true),
  t("T-106", "PRJ-014", "As-built drawings issue", "P. Novak", "eng", 12, 7, 0, "docs"),
  t("T-107", "PRJ-014", "Client witness inspection", "J. Okafor", "client", 18, 3, 0, "qa"),
  // PRJ-021 — Harbor Line Signal Upgrade
  t("T-201", "PRJ-021", "Cable route survey · Section C", "R. Vance", "inspector", -20, 9, 100, "field"),
  t("T-202", "PRJ-021", "Signal head installation B1–B4", "Crew Delta", "field" as never, -10, 14, 60, "field"),
  t("T-203", "PRJ-021", "Block window B2 possession", "D. Silva", "admin", 4, 3, 0, "field", true),
  t("T-204", "PRJ-021", "Interlocking logic validation", "K. Yamada", "eng", 7, 8, 0, "qa"),
  t("T-205", "PRJ-021", "Night testing programme", "R. Vance", "inspector", 15, 10, 0, "qa"),
  t("T-206", "PRJ-021", "Handover dossier compile", "P. Novak", "eng", 26, 6, 0, "docs"),
  // PRJ-027 — Metro Water Treatment
  t("T-301", "PRJ-027", "Membrane rack installation", "Crew Alpha", "field" as never, -30, 20, 100, "field"),
  t("T-302", "PRJ-027", "Dosage system calibration", "M. Osei", "inspector", -12, 8, 90, "qa"),
  t("T-303", "PRJ-027", "PLC migration · Stage 2", "L. Fontaine", "eng", -4, 12, 45, "eng"),
  t("T-304", "PRJ-027", "Water quality sampling run", "M. Osei", "inspector", 8, 6, 0, "qa"),
  t("T-305", "PRJ-027", "Commissioning week", "A. Kessler", "admin", 16, 5, 0, "field", true),
  t("T-306", "PRJ-027", "O&M manual issue", "P. Novak", "eng", 22, 8, 0, "docs"),
  // PRJ-033 — Ridgeline Wind
  t("T-401", "PRJ-033", "Access road reinforcement", "Crew Bravo", "field" as never, -18, 16, 70, "field"),
  t("T-402", "PRJ-033", "Blade drone survey · T1–T9", "R. Vance", "inspector", -2, 10, 30, "field"),
  t("T-403", "PRJ-033", "Turbine string T4 access", "D. Silva", "admin", 12, 2, 0, "field", true),
  t("T-404", "PRJ-033", "Gearbox vibration analysis", "S. Holm", "eng", 14, 9, 0, "qa"),
  t("T-405", "PRJ-033", "Findings report & NCR log", "R. Vance", "inspector", 24, 6, 0, "docs"),
  // PRJ-036 — Datacenter Cutover
  t("T-501", "PRJ-036", "East wing rack decommission", "Crew Echo", "field" as never, -14, 10, 100, "field"),
  t("T-502", "PRJ-036", "Fibre re-splice · Ring 2", "S. Holm", "eng", -6, 9, 75, "eng"),
  t("T-503", "PRJ-036", "Load bank test", "M. Osei", "inspector", 6, 3, 0, "qa", true),
  t("T-504", "PRJ-036", "Cutover rehearsal #2", "A. Kessler", "admin", 10, 2, 0, "eng"),
  t("T-505", "PRJ-036", "Live cutover window", "A. Kessler", "admin", 19, 2, 0, "field", true),
  t("T-506", "PRJ-036", "Post-cutover soak monitoring", "M. Osei", "inspector", 21, 7, 0, "qa"),
  // PRJ-041 — Fleet Telematics
  t("T-601", "PRJ-041", "Device spec freeze", "L. Fontaine", "eng", -4, 6, 80, "docs"),
  t("T-602", "PRJ-041", "Pilot depot site survey", "T. Brandt", "inspector", 5, 7, 0, "field"),
  t("T-603", "PRJ-041", "Pilot depot sign-off", "D. Silva", "admin", 21, 2, 0, "field", true),
  t("T-604", "PRJ-041", "Install batch 1 · 40 units", "Crew Foxtrot", "field" as never, 24, 14, 0, "field"),
  t("T-605", "PRJ-041", "Telemetry validation harness", "K. Yamada", "eng", 30, 10, 0, "eng"),
];

export const GANTT_WINDOW = { start: -32, days: 78 };

// ───────────────────────── s-curve generator ─────────────────────────

function mulberry(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function genCurve(progress: number, status: ProjectStatus, seed: number, weeks = 16): SCurveData {
  const rnd = mulberry(seed);
  const curWeek = Math.max(2, Math.min(weeks - 2, Math.round((progress / 100) * weeks)));
  const planned: number[] = [];
  const m = weeks * 0.48, k = 0.62;
  const p0 = 100 / (1 + Math.exp(k * m));
  for (let w = 0; w <= weeks; w++) {
    const p = 100 / (1 + Math.exp(-k * (w - m)));
    planned.push(Math.max(0, Math.min(98, +(((p - p0) / (100 - p0)) * 100).toFixed(1))));
  }
  const drift = status === "on-track" ? 0.6 : status === "planning" ? 0 : status === "at-risk" ? -5.5 : -11;
  const actual: (number | null)[] = [];
  let last = 0, lastDelta = 1.4;
  for (let w = 0; w <= weeks; w++) {
    if (w > curWeek) { actual.push(null); continue; }
    const noise = (rnd() - 0.5) * 3.1;
    let v = planned[w] + drift * (w / curWeek) + noise;
    v = Math.max(last, Math.max(0, v));
    lastDelta = v - last; last = v;
    actual.push(+v.toFixed(1));
  }
  const forecast: (number | null)[] = [];
  let f = last; let d = Math.max(0.6, lastDelta * 0.94);
  for (let w = 0; w <= weeks; w++) {
    if (w < curWeek) { forecast.push(null); continue; }
    forecast.push(+Math.min(98, f).toFixed(1));
    d *= 0.985; f += d + 0.35;
  }
  return { weeks, curWeek, planned, actual, forecast };
}

const CURVE_DEFS: { code: string; progress: number; status: ProjectStatus; seed: number }[] = [
  { code: "PRJ-014", progress: 68, status: "on-track", seed: 11 },
  { code: "PRJ-021", progress: 41, status: "at-risk", seed: 23 },
  { code: "PRJ-027", progress: 82, status: "on-track", seed: 37 },
  { code: "PRJ-033", progress: 27, status: "delayed", seed: 51 },
  { code: "PRJ-036", progress: 55, status: "on-track", seed: 67 },
  { code: "PRJ-041", progress: 12, status: "planning", seed: 83 },
];

export const SCURVES: Record<string, SCurveData> = Object.fromEntries(
  CURVE_DEFS.map((d) => [d.code, genCurve(d.progress, d.status, d.seed)]),
);

/** Curve with certified-progress edits applied (regenerated deterministically). */
export function getCurve(code: string, edits?: Record<string, number>): SCurveData {
  const def = CURVE_DEFS.find((d) => d.code === code);
  if (!def) return SCURVES[code];
  const p = edits?.[code];
  if (p == null) return SCURVES[code];
  return genCurve(Math.max(0, Math.min(100, p)), def.status, def.seed);
}

export function portfolioCurve(codes: string[], edits?: Record<string, number>): SCurveData {
  const list = codes.map((c) => getCurve(c, edits));
  const weeks = list[0].weeks;
  const avg = (arr: (number | null)[][]) =>
    Array.from({ length: weeks + 1 }, (_, w) => {
      const vals = arr.map((a) => a[w]).filter((v): v is number => v != null);
      return vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null;
    });
  return {
    weeks,
    curWeek: Math.round(list.reduce((s, c) => s + c.curWeek, 0) / list.length),
    planned: avg(list.map((c) => c.planned)) as number[],
    actual: avg(list.map((c) => c.actual)),
    forecast: avg(list.map((c) => c.forecast)),
  };
}

// ───────────────────────── geo sites ─────────────────────────

export const SITES_SEED: GeoSite[] = [
  { id: "st1", code: "ST-01", name: "Northgate Substation", x: 23, y: 17, lat: "51.4821° N", lng: "0.0294° W", type: "Substation", status: "active", inspector: "R. Vance", lastSync: "4 min", cache: true, note: "Bay 3 retrofit zone. PPE level C beyond fence line." },
  { id: "st2", code: "ST-02", name: "Harbor Line Depot", x: 62, y: 44, lat: "51.4702° N", lng: "0.0112° E", type: "Depot", status: "attention", inspector: "R. Vance", lastSync: "38 min", cache: true, note: "Signal head staging. Access restricted during block window B2." },
  { id: "st3", code: "ST-03", name: "Ashford WTP Intake", x: 38, y: 52, lat: "51.4588° N", lng: "0.0441° W", type: "Plant", status: "active", inspector: "M. Osei", lastSync: "11 min", cache: true, note: "Membrane hall + dosing skid. Sampling point SP-7 online." },
  { id: "st4", code: "ST-04", name: "Ridgeline Turbine Array", x: 79, y: 15, lat: "51.5014° N", lng: "0.0726° E", type: "Field", status: "attention", inspector: "R. Vance", lastSync: "2 h", cache: false, note: "Drone survey corridor T1–T9. Wind hold above 12 m/s." },
  { id: "st5", code: "ST-05", name: "East Wing Datacenter", x: 51, y: 29, lat: "51.4766° N", lng: "0.0188° E", type: "Facility", status: "active", inspector: "M. Osei", lastSync: "2 min", cache: true, note: "Cold aisle containment zone. Escort required beyond badge gate 4." },
  { id: "st6", code: "ST-06", name: "TransCore Yard South", x: 14, y: 39, lat: "51.4639° N", lng: "0.0537° W", type: "Yard", status: "active", inspector: "T. Brandt", lastSync: "26 min", cache: true, note: "Telematics pilot yard. 40-unit install batch staging." },
  { id: "st7", code: "ST-07", name: "Calder Bridge Crossing", x: 85, y: 50, lat: "51.4551° N", lng: "0.0802° E", type: "Field", status: "pending", inspector: "M. Reyes", lastSync: "—", cache: false, note: "Proposed inspection waypoint for span bearing survey. Awaiting admin approval." },
  { id: "st8", code: "ST-08", name: "Old Mill Warehouse", x: 45, y: 11, lat: "51.4877° N", lng: "0.0066° W", type: "Warehouse", status: "offline", inspector: "T. Brandt", lastSync: "9 h", cache: true, note: "Spares buffer store. Node offline — cached forms on device." },
];

// ───────────────────────── approvals + activity seeds ─────────────────────────

const h = 3600_000;
const now = Date.now();

export const APPROVALS_SEED: Approval[] = [
  { id: "ap1", type: "change-request", title: "Revise torque spec on HV bushings", target: "PRJ-014 / runbook v2.3", requester: "R. Vance", role: "inspector", summary: "Field verification shows M16 spec should be 210 N·m ±5, not 185 N·m. Requesting runbook revision before Bay 4 starts.", status: "pending", ts: now - 3 * h },
  { id: "ap2", type: "file-delete", title: "Archive obsolete runbook v1.2.pdf", target: "operations:runbook", requester: "J. Okafor", role: "client", summary: "Superseded by v2.3 after relay reconfiguration. Retain read-only copy in archive tier.", status: "pending", ts: now - 7 * h },
  { id: "ap3", type: "geo-tag", title: "Add waypoint ST-07 · Calder Bridge", target: "geo-tagging map", requester: "M. Reyes", role: "inspector", summary: "Span bearing survey needs a registered waypoint on the east approach. Coordinates captured on-site.", status: "pending", ts: now - 26 * h },
  { id: "ap4", type: "edit", title: "Update status report narrative §3", target: "PRJ-027 / status-report", requester: "M. Osei", role: "inspector", summary: "Correct dosing calibration variance from 4.1% to 2.8% after re-test on SP-7.", status: "approved", note: "Verified against lab sheet L-2214.", ts: now - 49 * h },
  { id: "ap5", type: "vendor-review", title: "Onboard Helix Crane Services", target: "vendor registry", requester: "D. Silva", role: "admin", summary: "Lift contractor for turbine gearbox exchange. Insurance cert expires in 41 days — flagged.", status: "rejected", note: "Hold until insurance renewal is confirmed.", ts: now - 70 * h },
  { id: "ap6", type: "change-request", title: "Shift cutover rehearsal to T-9", target: "PRJ-036 / deploy-checklist", requester: "A. Kessler", role: "admin", summary: "Rehearsal #2 moved to avoid clash with load bank test window.", status: "approved", note: "Auto-approved · L5 authority.", ts: now - 96 * h },
];

export const ACTIVITY_SEED: Activity[] = [
  { id: "ac1", ts: now - 0.4 * h, who: "R. Vance", text: "Completed torque sweep on Bay 3 bushings — 14/14 within spec", tag: "field" },
  { id: "ac2", ts: now - 1.2 * h, who: "SYSTEM", text: "ST-08 Old Mill node missed heartbeat ×3 — switched to OFFLINE cache", tag: "sync" },
  { id: "ac3", ts: now - 2.1 * h, who: "K. Yamada", text: "SCADA point-to-point: 214/1,180 tags verified on PRJ-014", tag: "eng" },
  { id: "ac4", ts: now - 3 * h, who: "R. Vance", text: "Submitted change request: HV bushing torque spec revision", tag: "approval" },
  { id: "ac5", ts: now - 5 * h, who: "M. Osei", text: "Dosing re-test on SP-7: variance 2.8% — within tolerance", tag: "qa" },
  { id: "ac6", ts: now - 8 * h, who: "J. Okafor", text: "Requested archive of runbook v1.2.pdf (superseded)", tag: "approval" },
  { id: "ac7", ts: now - 12 * h, who: "D. Silva", text: "Block window B2 confirmed with Port Authority control", tag: "plan" },
  { id: "ac8", ts: now - 20 * h, who: "SYSTEM", text: "Nightly S-curve recompute — 6 projects, 0 anomalies", tag: "data" },
  { id: "ac9", ts: now - 26 * h, who: "M. Reyes", text: "Dropped geo-tag ST-07 at Calder Bridge east approach", tag: "geo" },
  { id: "ac10", ts: now - 31 * h, who: "A. Kessler", text: "Approved cutover rehearsal shift to T-9 on PRJ-036", tag: "approval" },
];

// ───────────────────────── module registry ─────────────────────────

const m = (id: string, cat: string, name: string, desc: string, ws: WorkspaceKind, icon: string): ModuleDef =>
  ({ id, cat, name, desc, ws, icon });

export const MODULES: ModuleDef[] = [
  m("operations:change-request", "Operations", "Change Request", "Raise, route and track controlled changes with impact scoring.", "form", "edit"),
  m("operations:runbook", "Operations", "Runbook", "Step-locked field procedure for HV bushing torque verification.", "checklist", "doc"),
  m("operations:vendor-review", "Operations", "Vendor Review", "Qualified vendor registry with live performance scores.", "vendor", "star"),
  m("operations:process-optimization", "Operations", "Process Optimization", "Cycle-time baselines vs. optimized flows per stage.", "meter", "gauge"),
  m("operations:status-report", "Operations", "Status Report", "Weekly rollup: schedule, cost, risk and next-period plan.", "doc", "file"),
  m("operations:process-doc", "Operations", "Process Document", "Permit-to-Work process definition, rev 4.", "doc", "file"),
  m("operations:compliance-tracking", "Operations", "Compliance Tracking", "Regulatory register with evidence-linked statuses.", "toggles", "shield"),
  m("operations:capacity-plan", "Operations", "Capacity Plan", "Crew allocation vs. available hours, 6-week horizon.", "meter", "columns"),
  m("operations:risk-assessment", "Operations", "Risk Assessment", "5×5 likelihood–impact matrix with live heat scoring.", "matrix", "alert"),
  m("pdf-viewer:fill-form", "PDF Viewer", "Fill Form", "Permit-to-Work form PDF with fillable fields.", "pdf", "pdf"),
  m("pdf-viewer:view-pdf", "PDF Viewer", "View PDF", "Read-only inspection certificate with annotations.", "pdf", "eye"),
  m("engineering:deploy-checklist", "Engineering", "Deploy Checklist", "Cutover go/no-go gates for East Wing migration.", "checklist", "check"),
  m("engineering:code-review", "Engineering", "Code Review", "Diff review: telemetry validation harness PR #248.", "diff", "git"),
  m("engineering:architecture", "Engineering", "Architecture", "Platform topology and integration map.", "doc", "layers"),
  m("engineering:system-design", "Engineering", "System Design", "Telemetry ingestion pipeline design note.", "doc", "cpu"),
  m("design:design-system", "Design", "Design System", "OPSDECK tokens: palette, type and spacing scale.", "tokens", "palette"),
  m("design:accessibility-review", "Design", "Accessibility Review", "WCAG 2.2 AA audit checklist for field console.", "checklist", "eye"),
  m("data:build-dashboard", "Data", "Build Dashboard", "Assemble a live dashboard from widget blocks.", "builder", "grid"),
  m("data:analyze", "Data", "Analyze", "Cycle-time analytics across delivery stages.", "analyzer", "curve"),
  m("data:data-context-extractor", "Data", "Context Extractor", "Pull dates, codes, mails and amounts from raw text.", "extractor", "zap"),
  m("data:validate-data", "Data", "Validate Data", "Ingest QA: schema + range checks on last sync batch.", "toggles", "check"),
  m("enterprise-search:search", "Search", "Enterprise Search", "One index across modules, projects, sites and approvals.", "searchws", "search"),
  m("productivity:start", "Productivity", "Start Session", "Clock a focused ops session with intent logging.", "timer", "zap"),
  m("productivity:update", "Productivity", "Daily Update", "Post a structured end-of-day field update.", "updateform", "send"),
  m("product-management:synthesize-research", "Product", "Synthesize Research", "Field app usability study — merged findings.", "doc", "file"),
  m("product-management:competitive-brief", "Product", "Competitive Brief", "Ops-suite landscape: positioning and gaps.", "doc", "target"),
  m("product-management:sprint-planning", "Product", "Sprint Planning", "Sprint 22 board: backlog → review with live moves.", "kanban", "columns"),
  m("product-management:roadmap-update", "Product", "Roadmap Update", "Quarterly horizon with commit/confidence states.", "timeline", "flag"),
];

export const MODULE_CATS = ["Operations", "PDF Viewer", "Engineering", "Design", "Data", "Search", "Productivity", "Product"];
export const CAT_ICON: Record<string, string> = {
  Operations: "layers", "PDF Viewer": "pdf", Engineering: "git", Design: "palette",
  Data: "db", Search: "search", Productivity: "zap", Product: "target",
};

// ───────────────────────── workspace seeds ─────────────────────────

export const CHECKLISTS: Record<string, string[]> = {
  "operations:runbook": [
    "Confirm permit PTW-118 is open and isolations verified",
    "Lock out Bay 3 feeder and prove dead at test point TP-3",
    "Inspect bushing flange faces; clean with approved solvent",
    "Fit new gasket set GS-440 — check part number against BOM",
    "Torque M16 studs to 210 N·m ±5 in star sequence",
    "Witness-mark each stud with torque seal lacquer",
    "Megger test: record IR values ≥ 1 GΩ at 5 kV",
    "Photograph assembly and upload to ST-01 site folder",
    "Close isolation, remove locks, restore bay to standby",
    "Sign runbook step-lock and sync to control (offline OK)",
  ],
  "engineering:deploy-checklist": [
    "Change record CR-2231 approved and scheduled",
    "Rollback runbook rehearsed within last 72 h",
    "East Wing rack power budgets confirmed",
    "Ring 2 fibre splices OTDR-tested, loss < 0.35 dB",
    "Load bank available and test plan signed",
    "On-call rota published for cutover window",
    "Client comms drafted: T-24 h and T-1 h notices",
    "Monitoring dashboards pre-warmed, alerts armed",
    "Go/no-go call recorded with attendees",
    "Post-cutover soak thresholds agreed (15 min)",
  ],
  "design:accessibility-review": [
    "Contrast ≥ 4.5:1 on all body text in night mode",
    "Touch targets ≥ 44 px on field console views",
    "Full keyboard traversal of approval queue",
    "Focus rings visible on amber-dark palette",
    "Screen-reader labels on all icon-only buttons",
    "Error messages announced via live region",
    "Gantt chart has tabular alternative view",
    "Reduced-motion honoured for radar + pings",
    "Glove-mode input spacing validated on-site",
  ],
};

export interface DocSection { h: string; p?: string; bullets?: string[]; }
export const DOCS: Record<string, { title: string; rev: string; sections: DocSection[] }> = {
  "operations:status-report": {
    title: "Weekly Status Report — W31", rev: "rev 7",
    sections: [
      { h: "Executive summary", p: "Portfolio health steady at 3 green / 2 amber / 1 red. Northgate retrofit holds 68% against a 66% plan; Harbor Line remains the primary schedule exposure heading into block window B2." },
      { h: "Schedule", bullets: ["PRJ-014: +2 pts vs plan after relay reconfig finished early", "PRJ-021: −6 pts; cable pull resequenced around B2 possession", "PRJ-033: −11 pts; access road cure time extended by weather"] },
      { h: "Cost", p: "Commit-to-date at 61% of budget vs 63% of scope earned. Crane standby dayworks on Ridgeline are the main variance driver (+$18k MTD)." },
      { h: "Top risks", bullets: ["B2 possession slip → signals testing cascade (PRJ-021)", "Turbine string T4 access weather hold (PRJ-033)", "Helix Crane insurance renewal gap (vendor)"] },
      { h: "Next period", bullets: ["Energization dry-run on PRJ-014 (T+9)", "Commissioning week prep on PRJ-027", "Cutover rehearsal #2 on PRJ-036 (T-9)"] },
    ],
  },
  "operations:process-doc": {
    title: "Permit-to-Work Process", rev: "rev 4",
    sections: [
      { h: "Purpose", p: "Defines how hazardous work is authorized, isolated, executed and closed across all OPSDECK-governed sites, including offline field issue." },
      { h: "Flow", bullets: ["Request raised in module with scope + isolation list", "Issuer validates against live isolation board", "Permit issued with digital signature (cached on device)", "Receiver step-locks execution against runbook", "Close-out: gas tests, housekeeping, permit return"] },
      { h: "Offline behaviour", p: "Permits issued offline carry a pending-sync flag and reconcile on next uplink; conflicting isolations are rejected at merge time, never silently." },
      { h: "Exceptions", p: "Sanction-for-test deviations require L5 countersign within 4 hours or the permit auto-suspends and control is notified." },
    ],
  },
  "engineering:architecture": {
    title: "Platform Topology", rev: "rev 3",
    sections: [
      { h: "Overview", p: "A control-plane API fronted by edge relays. Field consoles run offline-first against a local node; merges flow through the sync gateway with conflict scoring." },
      { h: "Layers", bullets: ["Edge: site node (SQLite) + field console cache", "Sync: queue → conflict scorer → merge ledger", "Core: Postgres + event bus + approval state machine", "Presentation: role dashboards, planner, geo map"] },
      { h: "Integration points", bullets: ["SCADA historian (read-only tags)", "Client ERP cost feed (nightly batch)", "Document vault with checksum pinning"] },
    ],
  },
  "engineering:system-design": {
    title: "Telemetry Ingestion Pipeline", rev: "rev 2",
    sections: [
      { h: "Context", p: "Fleet devices emit 40 Hz bursts; the pipeline must normalize, dedupe and land readings with end-to-end lag under 90 s at the 99th percentile." },
      { h: "Design", bullets: ["Edge buffers on-device with sequence watermarks", "Gateway fans out to validators (schema, range, drift)", "Rejected frames park in quarantine with reason codes", "Clean frames write to TimescaleDB + rollup materializer"] },
      { h: "Failure modes", p: "Backpressure sheds oldest low-priority channels first; quarantine replay is idempotent via watermark + device UUID keys." },
    ],
  },
  "product-management:synthesize-research": {
    title: "Field App Usability Study — Synthesis", rev: "rev 1",
    sections: [
      { h: "Method", p: "9 ride-alongs across 3 crews, 41 task timings, 12 offline-resync incidents reviewed. Affinity-mapped into 5 themes." },
      { h: "Headline findings", bullets: ["Glove-mode misses cost inspectors ~7 s per tap on 12 px targets", "Step-lock runbooks cut rework flags by half vs paper", "Sync uncertainty is the #1 anxiety source — needs visible queue state", "Inspectors want geo-tag drops in ≤ 3 taps"] },
      { h: "Decisions", bullets: ["Ship queue-state LED on all offline views (Sprint 22)", "Re-space field inputs to 44 px minimum", "Pilot 3-tap geo-tag flow on Field Unit 07"] },
    ],
  },
  "product-management:competitive-brief": {
    title: "Ops-Suite Competitive Brief", rev: "rev 5",
    sections: [
      { h: "Landscape", p: "Incumbents lead on ERP depth but ship brittle offline stories. Field-native tools win on sync UX yet lack approval governance." },
      { h: "Where OPSDECK wins", bullets: ["Offline-first sync with visible queue + conflict scoring", "Approval state machine tied to geo-tagged evidence", "Planner views (Gantt + S-curve) rendered per role"] },
      { h: "Where we trail", bullets: ["ERP cost integration breadth", "Third-party document format coverage"] },
      { h: "Play", p: "Double down on field trust: every offline action must have a visible, reversible path back to the ledger." },
    ],
  },
};

export const VENDORS = [
  { name: "Helix Crane Services", cat: "Lifting", score: 7.2, status: "Hold" },
  { name: "Nordvik Cabling Co.", cat: "Electrical", score: 9.1, status: "Qualified" },
  { name: "Ashfield NDT Ltd.", cat: "Testing", score: 8.6, status: "Qualified" },
  { name: "Bluewater Chem Supply", cat: "Consumables", score: 6.4, status: "Review" },
  { name: "TransCore Freight", cat: "Logistics", score: 8.9, status: "Qualified" },
];

export const COMPLIANCE = [
  { code: "REG-01", title: "High-voltage switching authority cards current", status: "ok" },
  { code: "REG-02", title: "Pressure system PSSR dossiers filed", status: "ok" },
  { code: "REG-04", title: "Crane LOLER certificates within date", status: "open" },
  { code: "REG-06", title: "Environmental discharge consents renewed", status: "ok" },
  { code: "REG-07", title: "Lone-worker check-in policy acknowledged", status: "ok" },
  { code: "REG-09", title: "Asbestos register re-inspection (6-mo)", status: "open" },
  { code: "REG-11", title: "Data retention schedule audit", status: "ok" },
  { code: "REG-12", title: "Subcontractor induction records complete", status: "open" },
];

export const VALIDATIONS = [
  { name: "telemetry.batch_2214 → schema v3", issue: "2 frames missing `seq` watermark", sev: "error", status: "open" },
  { name: "cost.erp_feed → currency normalize", issue: "3 rows unmapped cost codes", sev: "warn", status: "open" },
  { name: "geo.waypoints → range check", issue: "ST-07 lat outside sector bounds (pending tag)", sev: "info", status: "open" },
  { name: "permits.ptw_118 → isolation cross-ref", issue: "All isolations resolve against live board", sev: "pass", status: "ok" },
  { name: "runbooks.v2_3 → checksum pin", issue: "SHA match vs vault copy", sev: "pass", status: "ok" },
  { name: "vendors.registry → insurance dates", issue: "Helix Crane cert expires in 41 days", sev: "warn", status: "open" },
];

export interface Risk { id: string; name: string; l: number; i: number; owner: string; }
export const RISKS_SEED: Risk[] = [
  { id: "rk1", name: "Block window B2 slip", l: 4, i: 5, owner: "D. Silva" },
  { id: "rk2", name: "T4 access weather hold", l: 4, i: 3, owner: "R. Vance" },
  { id: "rk3", name: "Crane vendor insurance gap", l: 3, i: 4, owner: "A. Kessler" },
  { id: "rk4", name: "SCADA tag verification overrun", l: 2, i: 3, owner: "K. Yamada" },
  { id: "rk5", name: "Spares buffer stockout (ST-08)", l: 2, i: 2, owner: "T. Brandt" },
];

export const KANBAN_SEED: Record<string, { id: string; title: string; pts: number; tag: string }[]> = {
  backlog: [
    { id: "k1", title: "Offline queue-state LED on all views", pts: 3, tag: "field" },
    { id: "k2", title: "Gantt tabular alt-view for SR readers", pts: 5, tag: "a11y" },
    { id: "k3", title: "Batch geo-tag import from CSV", pts: 3, tag: "geo" },
  ],
  inprogress: [
    { id: "k4", title: "3-tap geo-tag drop flow (pilot)", pts: 5, tag: "field" },
    { id: "k5", title: "Approval deep-links from alerts", pts: 2, tag: "gov" },
  ],
  review: [
    { id: "k6", title: "S-curve forecast confidence bands", pts: 5, tag: "data" },
  ],
  done: [
    { id: "k7", title: "44 px glove-mode inputs", pts: 3, tag: "a11y" },
    { id: "k8", title: "Conflict scorer reason codes", pts: 8, tag: "sync" },
  ],
};

export const ROADMAP = [
  { q: "Q3", items: [{ name: "Sync ledger GA", state: "committed" }, { name: "Glove-mode inputs", state: "shipped" }, { name: "Approval SLA timers", state: "committed" }] },
  { q: "Q4", items: [{ name: "Client S-curve export packs", state: "committed" }, { name: "Predictive risk flags (pilot)", state: "confidence" }, { name: "ERP cost connector v2", state: "confidence" }] },
  { q: "Q1", items: [{ name: "Multi-sector geo federations", state: "exploration" }, { name: "Voice-logged inspections", state: "exploration" }] },
];

export const CAPACITY = [
  { team: "Crew Alpha · Mech", alloc: 312, cap: 340, note: "Commissioning week reserve held" },
  { team: "Crew Delta · Signals", alloc: 298, cap: 320, note: "B2 possession overtime pre-approved" },
  { team: "Field Unit 07 · Insp", alloc: 204, cap: 240, note: "Drone cert renewal frees 16 h" },
  { team: "Eng · Controls", alloc: 251, cap: 260, note: "SCADA verification at ceiling" },
  { team: "Docs · Handover", alloc: 96, cap: 160, note: "Can absorb dossier compile" },
];

export const OPTIMIZATION = [
  { stage: "Permit issue", before: 42, after: 18, unit: "min" },
  { stage: "Isolation prove", before: 25, after: 21, unit: "min" },
  { stage: "Runbook step-lock", before: 9, after: 4, unit: "min/step" },
  { stage: "Sync reconcile", before: 14, after: 3, unit: "min" },
  { stage: "Report rollup", before: 95, after: 22, unit: "min" },
];

export const DIFF_LINES: { k: "ctx" | "add" | "del"; n: string }[] = [
  { k: "ctx", n: "def validate_frame(frame: Frame) -> Result:" },
  { k: "ctx", n: "    if frame.device not in registry:" },
  { k: "del", n: "        return reject('unknown-device')" },
  { k: "add", n: "        return reject('unknown-device', quarantine=True)" },
  { k: "ctx", n: "    seq = frame.seq" },
  { k: "del", n: "    if seq < watermark[frame.device]:" },
  { k: "add", n: "    wm = watermark.get(frame.device)" },
  { k: "add", n: "    if wm is not None and seq <= wm:" },
  { k: "add", n: "        metrics.inc('frames.duplicate')" },
  { k: "ctx", n: "        return reject('stale-seq')" },
  { k: "ctx", n: "    if not schema_ok(frame.payload):" },
  { k: "del", n: "        return reject('schema')" },
  { k: "add", n: "        return reject('schema', reason_codes=schema_errors(frame.payload))" },
  { k: "ctx", n: "    return accept(frame)" },
];

export const TOKENS = {
  palette: [
    { name: "Ink", hex: "#0a101d" }, { name: "Pane", hex: "#0f1729" },
    { name: "Line", hex: "#1e2b47" }, { name: "Fog", hex: "#e7edf8" },
    { name: "Mist", hex: "#94a4c0" }, { name: "Signal Amber", hex: "#ffb224" },
    { name: "Field Teal", hex: "#2fd6c3" }, { name: "Alert Red", hex: "#ff5d55" },
    { name: "Go Green", hex: "#43d9a3" }, { name: "Info Blue", hex: "#58a6ff" },
  ],
  type: [
    { label: "Display / 28", cls: "text-[28px] font-display font-semibold leading-tight" },
    { label: "Heading / 18", cls: "text-lg font-display font-semibold" },
    { label: "Body / 14", cls: "text-sm" },
    { label: "Mono label / 10", cls: "text-[10px] font-mono tracking-[0.17em] uppercase" },
  ],
  spacing: [4, 8, 12, 16, 24, 32, 48],
};

export const BUILDER_WIDGETS = [
  { id: "kpi", name: "KPI strip", on: true },
  { id: "scurve", name: "S-curve panel", on: true },
  { id: "gantt", name: "Gantt strip", on: true },
  { id: "map", name: "Geo map", on: false },
  { id: "alerts", name: "Alert rail", on: true },
  { id: "activity", name: "Activity feed", on: false },
];

export const ANALYZER = {
  kpis: [
    { label: "Median cycle time", value: "6.2 d", delta: "−0.8 d vs W30" },
    { label: "First-pass yield", value: "91.4%", delta: "+1.1 pts" },
    { label: "Rework flags", value: "17", delta: "−6 vs W30" },
    { label: "Sync conflicts", value: "3", delta: "−41%" },
  ],
  bars: [
    { stage: "Permit", days: 1.4 }, { stage: "Stage", days: 2.1 },
    { stage: "Inspect", days: 1.8 }, { stage: "QA", days: 0.9 },
    { stage: "Docs", days: 1.2 }, { stage: "Close", days: 0.6 },
  ],
  insights: [
    "Inspect stage dominates cycle time on PRJ-021 — sequence around B2 possession.",
    "Docs stage shrunk 38% since step-lock runbooks adopted.",
    "Permit issue variance spikes Mondays; pre-stage isolations Friday PM.",
    "QA rework correlates with torque seal misses — add witness photo gate.",
  ],
};

// ───────────────────────── date utils ─────────────────────────

export const DAY = 86_400_000;
export function addDays(base: Date, d: number) { const x = new Date(base); x.setDate(x.getDate() + d); return x; }
export function fmtShort(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
export function timeAgo(ts: number) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export const APPROVAL_TYPE_LABEL: Record<ApprovalType, string> = {
  "change-request": "Change request",
  "file-delete": "File delete",
  "geo-tag": "Geo-tag",
  "settings-change": "Settings change",
  "report-approval": "Report approval",
  edit: "Edit",
  "vendor-review": "Vendor review",
};
