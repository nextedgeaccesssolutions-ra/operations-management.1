import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

// ───────────────────────── icon set (stroke-based inline SVG) ─────────────────────────

const P: Record<string, ReactNode> = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" /><rect x="13.5" y="3.5" width="7" height="7" /><rect x="3.5" y="13.5" width="7" height="7" /><rect x="13.5" y="13.5" width="7" height="7" /></>,
  gantt: <><path d="M3.5 6h11" /><path d="M7.5 12h12" /><path d="M3.5 18h8" /><path d="M17 6h3.5" strokeWidth="1" opacity=".5" /></>,
  curve: <path d="M3 12h3.5l2.8-7 4.4 14 2.8-7H21" />,
  pin: <><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></>,
  shield: <><path d="M12 3l7 2.8v5.4c0 4.4-2.9 7.9-7 9.8-4.1-1.9-7-5.4-7-9.8V5.8z" /><path d="M9 11.6l2.1 2.1 4-4.4" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13.5l9 5 9-5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>,
  bell: <><path d="M6 16v-6a6 6 0 0 1 12 0v6l1.5 2.5h-15z" /><path d="M10 21a2.2 2.2 0 0 0 4 0" /></>,
  wifi: <><path d="M2.5 9a14 14 0 0 1 19 0" /><path d="M5.8 12.5a9.5 9.5 0 0 1 12.4 0" /><path d="M9.2 16a4.8 4.8 0 0 1 5.6 0" /><circle cx="12" cy="19.4" r="1.1" fill="currentColor" stroke="none" /></>,
  wifioff: <><path d="M2.5 9a14 14 0 0 1 19 0" opacity=".45" /><path d="M5.8 12.5a9.5 9.5 0 0 1 12.4 0" opacity=".45" /><path d="M9.2 16a4.8 4.8 0 0 1 5.6 0" /><circle cx="12" cy="19.4" r="1.1" fill="currentColor" stroke="none" /><path d="M3.5 3.5l17 17" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.2l3.4 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" /></>,
  chev: <path d="M9.5 6l6 6-6 6" />,
  chevD: <path d="M6 9.5l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  alert: <><path d="M12 3.5L22 20H2z" /><path d="M12 9.5v5" /><circle cx="12" cy="17" r="0.4" fill="currentColor" /></>,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 15.5h6" /></>,
  edit: <><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" /><path d="M14.5 6.5l3 3" /></>,
  trash: <><path d="M4.5 6.5h15" /><path d="M8 6.5V4h8v2.5" /><path d="M6.5 6.5l1 14h9l1-14" /><path d="M10.2 10.5v6M13.8 10.5v6" /></>,
  sync: <><path d="M20 5v5h-5" /><path d="M4 19v-5h5" /><path d="M19.5 10a8 8 0 0 0-14-3.5M4.5 14a8 8 0 0 0 14 3.5" /></>,
  zap: <path d="M13 2.5L4.5 13.5H11L10 21.5l8.5-11H12z" />,
  pdf: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M8.5 16.5v-4h1.6a1.3 1.3 0 0 1 0 2.6H8.5M15.5 16.5v-4h1.2v4M13 16.5v-4h-1.2v4" strokeWidth="1.2" /></>,
  git: <><circle cx="6.5" cy="6" r="2.5" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="9" r="2.5" /><path d="M6.5 8.5v7M17.5 11.5c0 3-3 3.5-6 3.5" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.6 0 2-1 1.5-2-.6-1.3.2-2.5 2-2.5h2c2 0 3.5-1.5 3.5-4.5C21 7 17 3 12 3z" /><circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" /></>,
  db: <><ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" /><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" /><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  columns: <><rect x="3.5" y="4" width="5" height="16" /><rect x="9.7" y="4" width="5" height="11" /><rect x="15.9" y="4" width="5" height="14" /></>,
  gauge: <><path d="M4 17.5a8.5 8.5 0 1 1 16 0" /><path d="M12 17.5l4.2-6" /><circle cx="12" cy="17.5" r="1.2" fill="currentColor" stroke="none" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  lock: <><rect x="5.5" y="10.5" width="13" height="10" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  send: <path d="M21 3L10.5 13.5M21 3l-7 18-3.5-7.5L3 10z" />,
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  out: <><path d="M14 4H5v16h9" /><path d="M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5" /></>,
  radio: <><circle cx="12" cy="12" r="2" /><path d="M7.7 7.7a6 6 0 0 0 0 8.6M16.3 7.7a6 6 0 0 1 0 8.6" /><path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" /></>,
  flag: <><path d="M5.5 21V4" /><path d="M5.5 4.5c4-2.4 7 2.2 12.5 0v9c-5.5 2.2-8.5-2.4-12.5 0" /></>,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />,
  download: <><path d="M12 4v11M7.5 11l4.5 4.5L16.5 11" /><path d="M4.5 20h15" /></>,
  arrowR: <path d="M4 12h15M13.5 6l6 6-6 6" />,
  filter: <path d="M4 5.5h16l-6.2 7.2v5.8L10.2 20v-7.3z" />,
  cal: <><rect x="3.5" y="5" width="17" height="15.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" /><rect x="9.5" y="9.5" width="5" height="5" /><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" /></>,
  sliders: <><path d="M5 4v5.5M5 14.5V20" /><path d="M12 4v2M12 11v9" /><path d="M19 4v9M19 18v2" /><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="8.5" r="2.2" /><circle cx="19" cy="15.5" r="2.2" /></>,
};

export function Icon({ name, size = 16, className = "", sw = 1.6 }: { name: string; size?: number; className?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      className={`flex-none ${className}`} aria-hidden="true">
      {P[name] ?? P.grid}
    </svg>
  );
}

// ───────────────────────── scroll reveal ─────────────────────────

export function Reveal({ children, className = "", delay = 0, style }: {
  children: ReactNode; className?: string; delay?: number; style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}>
      {children}
    </div>
  );
}

// ───────────────────────── primitives ─────────────────────────

export function SectionHead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3.5 flex-wrap">
      <div>
        <div className="microlabel mb-1">{kicker}</div>
        <h2 className="font-display font-semibold text-[17px] tracking-wide text-fog">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function StatusPill({ s }: { s: string }) {
  const map: Record<string, [string, string]> = {
    "on-track": ["GRN", "text-grnx border-grnx/40 bg-grnx/10"],
    "at-risk": ["AMB", "text-amberx border-amberx/40 bg-amberx/10"],
    delayed: ["RED", "text-redx border-redx/40 bg-redx/10"],
    planning: ["PLN", "text-mist border-line2 bg-pane2/60"],
    active: ["ACT", "text-grnx border-grnx/40 bg-grnx/10"],
    attention: ["ATT", "text-amberx border-amberx/40 bg-amberx/10"],
    pending: ["PND", "text-amberx border-amberx/40 bg-amberx/10"],
    offline: ["OFF", "text-redx border-redx/40 bg-redx/10"],
    approved: ["APR", "text-grnx border-grnx/40 bg-grnx/10"],
    rejected: ["REJ", "text-redx border-redx/40 bg-redx/10"],
    ok: ["OK", "text-grnx border-grnx/40 bg-grnx/10"],
    open: ["OPEN", "text-amberx border-amberx/40 bg-amberx/10"],
    warn: ["WARN", "text-amberx border-amberx/40 bg-amberx/10"],
    error: ["ERR", "text-redx border-redx/40 bg-redx/10"],
    pass: ["PASS", "text-grnx border-grnx/40 bg-grnx/10"],
    info: ["INFO", "text-blux border-blux/40 bg-blux/10"],
    Hold: ["HOLD", "text-redx border-redx/40 bg-redx/10"],
    Qualified: ["QUAL", "text-grnx border-grnx/40 bg-grnx/10"],
    Review: ["REV", "text-amberx border-amberx/40 bg-amberx/10"],
    committed: ["CMT", "text-grnx border-grnx/40 bg-grnx/10"],
    confidence: ["CNF", "text-amberx border-amberx/40 bg-amberx/10"],
    exploration: ["EXP", "text-blux border-blux/40 bg-blux/10"],
    shipped: ["SHIP", "text-tealx border-tealx/40 bg-tealx/10"],
  };
  const [label, cls] = map[s] ?? [s.toUpperCase().slice(0, 4), "text-mist border-line2 bg-pane2/60"];
  return (
    <span className={`inline-flex items-center px-1.5 h-[19px] text-[9px] font-mono tracking-[0.12em] border ${cls}`}>
      {label}
    </span>
  );
}

export function Progress({ value, color = "#ffb224", h = 5 }: { value: number; color?: string; h?: number }) {
  return (
    <div className="w-full bg-[#0b1322] border border-line overflow-hidden" style={{ height: h + 2 }}>
      <div className="h-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, boxShadow: `0 0 10px ${color}55` }} />
    </div>
  );
}

export function Spark({ values, color = "#ffb224", w = 72, hgt = 24 }: { values: number[]; color?: string; w?: number; hgt?: number }) {
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${hgt - 3 - ((v - min) / (max - min || 1)) * (hgt - 6)}`).join(" ");
  return (
    <svg width={w} height={hgt} className="flex-none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={w} cy={hgt - 3 - ((values[values.length - 1] - min) / (max - min || 1)) * (hgt - 6)} r="2.2" fill={color} />
    </svg>
  );
}

export function Donut({ value, color = "#ffb224", size = 108, label }: { value: number; color?: string; size?: number; label?: string }) {
  const r = size / 2 - 9, c = 2 * Math.PI * r;
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2b47" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${(value / 100) * c} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.2,.7,.2,1)", filter: `drop-shadow(0 0 6px ${color}66)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-xl tnum leading-none">{Math.round(value)}<span className="text-[11px] text-mist">%</span></span>
        {label && <span className="microlabel mt-1">{label}</span>}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, accent = "#ffb224", spark, delay = 0 }: {
  label: string; value: string; sub?: string; accent?: string; spark?: number[]; delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="panel p-4 h-full group hover:border-line2 transition-colors duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="microlabel">{label}</div>
          <span className="led led-live" style={{ background: accent, boxShadow: `0 0 8px ${accent}cc` }} />
        </div>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <div className="font-display font-bold text-[26px] leading-none tnum text-fog">{value}</div>
            {sub && <div className="text-[11px] text-dim mt-1.5 font-mono">{sub}</div>}
          </div>
          {spark && <Spark values={spark} color={accent} />}
        </div>
      </div>
    </Reveal>
  );
}

export function LiveClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  const date = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  return (
    <div className="text-right leading-tight select-none">
      <div className="font-mono text-[13px] text-fog tnum tracking-wider">{time}</div>
      {!compact && <div className="microlabel mt-0.5">{date}</div>}
    </div>
  );
}

export function Avatar({ initials, accent }: { initials: string; accent: string }) {
  return (
    <div className="w-8 h-8 flex-none grid place-items-center font-display font-semibold text-[12px] border"
      style={{ color: accent, borderColor: `${accent}66`, background: `${accent}14` }}>
      {initials}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) {
  return (
    <button onClick={onChange} className="flex items-center gap-2.5 group cursor-pointer" aria-pressed={on}>
      <span className={`relative w-9 h-[18px] border transition-colors duration-200 flex-none ${on ? "bg-amberx/25 border-amberx/70" : "bg-[#0b1322] border-line2"}`}>
        <span className={`absolute top-[2px] w-[12px] h-[12px] transition-all duration-200 ${on ? "left-[21px] bg-amberx" : "left-[3px] bg-dim"}`}
          style={on ? { boxShadow: "0 0 8px rgba(255,178,36,.8)" } : undefined} />
      </span>
      {label && <span className={`font-mono text-[10.5px] tracking-[0.12em] uppercase transition-colors ${on ? "text-amberx" : "text-dim group-hover:text-mist"}`}>{label}</span>}
    </button>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-line py-10 text-center">
      <div className="microlabel">{text}</div>
    </div>
  );
}
