import { useState } from "react";
import { Icon, Reveal, SectionHead, StatusPill } from "../ui";
import { useApp } from "../store";

// ───────────────────────── Refrens integration types ─────────────────────────

type ConnectionStatus = "disconnected" | "awaiting-config" | "connecting" | "connected" | "error";
type ErrorCategory = "missing-config" | "auth-failed" | "network" | "timeout" | "rate-limit" | "provider-error" | "malformed-response" | "permission-denied";

interface RefrensState {
  status: ConnectionStatus;
  lastAttempt: number | null;
  lastSuccess: number | null;
  errorCategory: ErrorCategory | null;
  errorMessage: string | null;
  correlationId: string | null;
  records: {
    quotes: number;
    invoices: number;
    customers: number;
  };
  syncInProgress: boolean;
  configMissing: {
    backendProxy: boolean;
    apiCredentials: boolean;
    accountAuthorization: boolean;
  };
}

const INITIAL_STATE: RefrensState = {
  status: "awaiting-config",
  lastAttempt: null,
  lastSuccess: null,
  errorCategory: "missing-config",
  errorMessage: "Refrens integration not configured. Backend proxy endpoint and API credentials required.",
  correlationId: null,
  records: { quotes: 0, invoices: 0, customers: 0 },
  syncInProgress: false,
  configMissing: {
    backendProxy: true,
    apiCredentials: true,
    accountAuthorization: true,
  },
};

export function RefrensView() {
  const app = useApp();
  const role = app.role ?? "admin";
  const isAdmin = role === "admin";

  const [state, setState] = useState<RefrensState>(INITIAL_STATE);
  const [showRecovery, setShowRecovery] = useState(false);

  const isBlocked = state.status === "awaiting-config" || state.status === "disconnected" || state.status === "error";
  const isConnected = state.status === "connected";
  const hasConfig = !state.configMissing.backendProxy && !state.configMissing.apiCredentials && !state.configMissing.accountAuthorization;

  const attemptConnect = () => {
    if (!hasConfig) {
      setState((s) => ({
        ...s,
        status: "awaiting-config",
        lastAttempt: Date.now(),
        errorCategory: "missing-config",
        errorMessage: "Cannot connect: backend proxy and API credentials not configured.",
        correlationId: `corr-${Date.now()}`,
      }));
      app.toast("Configuration incomplete — see recovery steps", "warn");
      return;
    }

    setState((s) => ({ ...s, status: "connecting", lastAttempt: Date.now() }));
    app.log("Attempting Refrens connection", "integration");

    // Simulate connection attempt (would be real API call in production)
    window.setTimeout(() => {
      setState((s) => ({
        ...s,
        status: "error",
        errorCategory: "auth-failed",
        errorMessage: "Authentication failed. Verify API credentials and account authorization.",
        correlationId: `corr-${Date.now()}`,
      }));
      app.toast("Connection failed — check credentials", "err");
    }, 1500);
  };

  const attemptHealthCheck = () => {
    if (isBlocked) {
      app.toast("Cannot run health check while disconnected", "warn");
      return;
    }
    setState((s) => ({ ...s, syncInProgress: true }));
    window.setTimeout(() => {
      setState((s) => ({ ...s, syncInProgress: false }));
      app.toast("Health check complete", "ok");
    }, 1000);
  };

  const attemptSync = () => {
    if (isBlocked) {
      app.toast("Cannot sync while disconnected", "warn");
      return;
    }
    setState((s) => ({ ...s, syncInProgress: true }));
    app.log("Starting Refrens sync (read-only)", "integration");
    window.setTimeout(() => {
      setState((s) => ({ ...s, syncInProgress: false }));
      app.toast("Sync complete", "ok");
    }, 2000);
  };

  const disconnect = () => {
    setState(INITIAL_STATE);
    app.log("Disconnected from Refrens", "integration");
    app.toast("Disconnected", "info");
  };

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="integration / refrens"
        title="Refrens Integration"
        right={
          <div className="flex items-center gap-2">
            <StatusPill s={isConnected ? "ok" : isBlocked ? "open" : "warn"} />
            {state.syncInProgress && <span className="led led-amber led-live" />}
          </div>
        }
      />

      {/* Status banner */}
      <Reveal>
        <div className={`panel p-4 sm:p-5 ${isBlocked ? "border-redx/40" : isConnected ? "border-grnx/40" : "border-amberx/40"}`}>
          <div className="flex items-start gap-3.5">
            <Icon
              name={isConnected ? "check" : isBlocked ? "alert" : "sync"}
              size={20}
              className={isConnected ? "text-grnx" : isBlocked ? "text-redx" : "text-amberx"}
            />
            <div className="flex-1">
              <div className="font-display font-semibold text-[15px] text-fog">
                {isConnected ? "Connected to Refrens" : isBlocked ? "Refrens Integration Blocked" : "Connecting…"}
              </div>
              <p className="text-[12px] text-mist mt-1 leading-relaxed">
                {state.errorMessage ?? "Integration status unknown."}
              </p>
              {state.correlationId && (
                <div className="font-mono text-[9.5px] text-dim tracking-wider mt-2">
                  Correlation ID: {state.correlationId}
                </div>
              )}
            </div>
          </div>

          {/* Diagnostics */}
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
            <div className="bg-[#0d1526] px-3 py-2.5">
              <div className="microlabel">Status</div>
              <div className="text-[12px] text-fog mt-1 capitalize">{state.status.replace("-", " ")}</div>
            </div>
            <div className="bg-[#0d1526] px-3 py-2.5">
              <div className="microlabel">Last Attempt</div>
              <div className="text-[12px] text-fog mt-1">
                {state.lastAttempt ? new Date(state.lastAttempt).toLocaleTimeString("en-GB", { hour12: false }) : "Never"}
              </div>
            </div>
            <div className="bg-[#0d1526] px-3 py-2.5">
              <div className="microlabel">Last Success</div>
              <div className="text-[12px] text-fog mt-1">
                {state.lastSuccess ? new Date(state.lastSuccess).toLocaleTimeString("en-GB", { hour12: false }) : "Never"}
              </div>
            </div>
            <div className="bg-[#0d1526] px-3 py-2.5">
              <div className="microlabel">Error Category</div>
              <div className="text-[12px] mt-1" style={{ color: state.errorCategory ? "#ff5d55" : "#5d6d8b" }}>
                {state.errorCategory ?? "None"}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {!isConnected && (
              <button
                className="btn btn-pri !h-8"
                onClick={attemptConnect}
                disabled={state.syncInProgress}
              >
                <Icon name="zap" size={12} /> Connect
              </button>
            )}
            {isConnected && (
              <>
                <button className="btn !h-8" onClick={attemptHealthCheck} disabled={state.syncInProgress}>
                  <Icon name="radio" size={12} /> Health Check
                </button>
                <button className="btn btn-teal !h-8" onClick={attemptSync} disabled={state.syncInProgress}>
                  <Icon name="sync" size={12} /> Sync Now
                </button>
                <button className="btn btn-danger !h-8" onClick={disconnect}>
                  <Icon name="x" size={12} /> Disconnect
                </button>
              </>
            )}
            {isBlocked && (
              <button className="btn !h-8" onClick={() => setShowRecovery((v) => !v)}>
                <Icon name="alert" size={12} /> Recovery Steps
              </button>
            )}
          </div>
        </div>
      </Reveal>

      {/* Recovery instructions */}
      {isBlocked && showRecovery && (
        <Reveal>
          <div className="panel panel-hot p-4 sm:p-5">
            <div className="font-display font-semibold text-[14px] text-fog mb-3">Recovery Steps</div>
            <div className="space-y-3 text-[12px] text-mist leading-relaxed">
              {state.configMissing.backendProxy && (
                <div className="flex gap-2.5">
                  <span className="text-redx font-mono">01</span>
                  <div>
                    <span className="text-fog font-medium">Configure backend proxy endpoint</span>
                    <p className="text-[11px] text-dim mt-0.5">
                      Deploy a serverless function or API route that proxies requests to Refrens. The frontend cannot call Refrens directly due to CORS restrictions.
                    </p>
                  </div>
                </div>
              )}
              {state.configMissing.apiCredentials && (
                <div className="flex gap-2.5">
                  <span className="text-redx font-mono">02</span>
                  <div>
                    <span className="text-fog font-medium">Provide API credentials</span>
                    <p className="text-[11px] text-dim mt-0.5">
                      Obtain Refrens API credentials (Client ID, Client Secret) from the Refrens developer portal. Store securely in environment variables — never commit to source control.
                    </p>
                  </div>
                </div>
              )}
              {state.configMissing.accountAuthorization && (
                <div className="flex gap-2.5">
                  <span className="text-redx font-mono">03</span>
                  <div>
                    <span className="text-fog font-medium">Authorize account access</span>
                    <p className="text-[11px] text-dim mt-0.5">
                      Complete OAuth flow to authorize OPSDECK to read data from the Refrens account. This requires explicit owner consent — do not scrape or copy credentials from the browser.
                    </p>
                  </div>
                </div>
              )}
              <div className="border-t border-line/60 pt-3 mt-3">
                <p className="text-[11px] text-dim leading-relaxed">
                  <span className="text-amberx font-medium">Important:</span> This integration is read-only. OPSDECK will never modify, delete, or write back to Refrens records. All sync operations are idempotent and audited.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Data summary */}
      <Reveal delay={80}>
        <div className="panel p-4 sm:p-5">
          <SectionHead kicker="synchronization" title="Data Summary" />
          {isBlocked ? (
            <div className="text-center py-8">
              <Icon name="lock" size={26} className="text-dim mx-auto" />
              <div className="text-[13px] text-mist mt-3">No verified data — synchronization unavailable</div>
              <p className="text-[11px] text-dim mt-1.5 max-w-md mx-auto">
                Financial metrics are suppressed until a successful authenticated connection is established.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-line border border-line">
              <div className="bg-[#0d1526] px-4 py-3 text-center">
                <div className="microlabel">Quotes</div>
                <div className="font-display font-bold text-xl tnum text-fog mt-1">
                  {state.records.quotes}
                </div>
              </div>
              <div className="bg-[#0d1526] px-4 py-3 text-center">
                <div className="microlabel">Invoices</div>
                <div className="font-display font-bold text-xl tnum text-fog mt-1">
                  {state.records.invoices}
                </div>
              </div>
              <div className="bg-[#0d1526] px-4 py-3 text-center">
                <div className="microlabel">Customers</div>
                <div className="font-display font-bold text-xl tnum text-fog mt-1">
                  {state.records.customers}
                </div>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* Audit log */}
      <Reveal delay={120}>
        <div className="panel p-4 sm:p-5">
          <SectionHead kicker="audit trail" title="Integration Events" />
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {app.activity
              .filter((a) => a.tag === "integration")
              .slice(0, 10)
              .map((a) => (
                <div key={a.id} className="flex gap-3 py-2 border-b border-line/40 last:border-0 rowline px-1.5">
                  <span className="mt-1.5 w-1.5 h-1.5 flex-none bg-amberx" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-mist leading-snug">
                      <span className="text-fog font-medium">{a.who}</span> — {a.text}
                    </p>
                    <div className="font-mono text-[9px] text-dim tracking-wider uppercase mt-0.5">
                      {new Date(a.ts).toLocaleString("en-GB", { hour12: false })}
                    </div>
                  </div>
                </div>
              ))}
            {app.activity.filter((a) => a.tag === "integration").length === 0 && (
              <div className="microlabel py-6 text-center">no integration events yet</div>
            )}
          </div>
        </div>
      </Reveal>

      {/* Admin-only: configuration status */}
      {isAdmin && (
        <Reveal delay={160}>
          <div className="panel p-4 sm:p-5">
            <SectionHead kicker="admin · configuration" title="Integration Prerequisites" />
            <div className="space-y-2.5">
              {[
                { key: "backendProxy", label: "Backend proxy endpoint", desc: "Serverless function or API route for Refrens API calls" },
                { key: "apiCredentials", label: "API credentials", desc: "Client ID and Client Secret from Refrens developer portal" },
                { key: "accountAuthorization", label: "Account authorization", desc: "OAuth consent from Refrens account owner" },
              ].map((item) => {
                const missing = state.configMissing[item.key as keyof typeof state.configMissing];
                return (
                  <div key={item.key} className="flex items-start gap-3 px-3 py-2.5 border border-line bg-[#0d1526]">
                    <span className={`mt-0.5 w-2 h-2 flex-none rounded-full ${missing ? "bg-redx" : "bg-grnx"}`} />
                    <div className="flex-1">
                      <div className="text-[12.5px] text-fog font-medium">{item.label}</div>
                      <div className="text-[11px] text-dim mt-0.5">{item.desc}</div>
                    </div>
                    <span className={`font-mono text-[10px] tracking-wider uppercase ${missing ? "text-redx" : "text-grnx"}`}>
                      {missing ? "missing" : "configured"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10.5px] text-dim mt-3 leading-relaxed">
              Configuration is managed via environment variables and deployment settings. Do not commit credentials to source control.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}
