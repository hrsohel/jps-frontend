import React, { useEffect, useState } from "react";
import { CreditCard, DollarSign, CheckCircle2, Clock, RefreshCw, AlertTriangle, Key, Eye, EyeOff } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { apiGet, apiPut } from "../lib/api";

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="panel stat-card" style={{ padding: "20px 22px" }}>
      <div className="stat-icon" style={{ background: color + "18", color }}>
        <Icon size={22} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <h3 className="stat-value" style={{ fontSize: 24, margin: "2px 0" }}>{value}</h3>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminPayments() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stripe key editor state
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  async function saveKeys() {
    if (!secretKey && !publishableKey) return;
    try {
      setSavingKeys(true);
      if (secretKey) await apiPut("/settings", { key: "STRIPE_SECRET_KEY", value: secretKey });
      if (publishableKey) await apiPut("/settings", { key: "STRIPE_PUBLISHABLE_KEY", value: publishableKey });
      setSecretKey("");
      setPublishableKey("");
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 3000);
    } catch (e) {
      alert(e.message || "Failed to save keys");
    } finally {
      setSavingKeys(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/payments/admin/summary");
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }

  function fmt(amount) {
    if (amount == null) return "—";
    return "$" + Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div>
      <PageHeader
        title="Payment Management"
        description="Stripe integration overview and invoice payment tracking."
        actions={
          <button className="view-btn" onClick={load} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="panel"><p style={{ color: "var(--muted)" }}>Loading payment data...</p></div>
      ) : error ? (
        <div className="panel" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <strong style={{ color: "var(--ink)" }}>Payment route not available on the server yet</strong>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 12 }}>
            The payment route and Stripe package need to be deployed to the server. Follow the steps below.
          </p>
          <ol style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 2, paddingLeft: 20 }}>
            <li>Upload the updated <code>api/src/routes/payments.js</code> and <code>api/src/server.js</code> to the server via SCP</li>
            <li>SSH into the server and run <code>npm install</code> inside <code>jps-backend/</code> to install the <code>stripe</code> package</li>
            <li>Add the Stripe keys to the server's <code>.env</code> file via File Manager</li>
            <li>Restart the app in cPanel Node.js (create <code>tmp/restart.txt</code>)</li>
          </ol>
        </div>
      ) : summary ? (
        <>
          {/* Invoice stats */}
          <div className="stats-row" style={{ marginBottom: 20 }}>
            <StatCard
              icon={CheckCircle2}
              label="Total Collected"
              value={fmt(summary.totalPaid)}
              sub={`${summary.paidCount} paid invoice${summary.paidCount !== 1 ? "s" : ""}`}
              color="#0E9F6E"
            />
            <StatCard
              icon={Clock}
              label="Pending Payments"
              value={fmt(summary.totalPending)}
              sub={`${summary.pendingCount} outstanding invoice${summary.pendingCount !== 1 ? "s" : ""}`}
              color="#22A9E0"
            />
            {summary.stripeAvailableBalance != null && (
              <StatCard
                icon={DollarSign}
                label="Stripe Available"
                value={fmt(summary.stripeAvailableBalance)}
                sub={`${summary.stripeCurrency} — ready to pay out`}
                color="#0749B3"
              />
            )}
            {summary.stripePendingBalance != null && (
              <StatCard
                icon={CreditCard}
                label="Stripe Pending"
                value={fmt(summary.stripePendingBalance)}
                sub="Processing — not yet available"
                color="#f59e0b"
              />
            )}
          </div>

          {/* Stripe config panel */}
          <div className="panel">
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={17} color="var(--deep)" />
              Stripe Configuration
            </h3>

            {!summary.stripeConfigured && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
                  <strong>Stripe keys not found on the server.</strong> Add <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_PUBLISHABLE_KEY</code> to the server's <code>.env</code> file via cPanel File Manager, then restart the app.
                </p>
              </div>
            )}

            <div style={{ display: "grid", gap: 0 }}>
              <div className="settings-row">
                <span className="settings-label">Status</span>
                {summary.stripeConfigured
                  ? <span className="badge badge-green">Connected</span>
                  : <span className="badge badge-yellow">Keys not set on server</span>}
              </div>
              <div className="settings-row">
                <span className="settings-label">Mode</span>
                <span className="badge badge-green">Live</span>
              </div>
              <div className="settings-row">
                <span className="settings-label">Publishable Key</span>
                <code style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface)", padding: "3px 8px", borderRadius: 4 }}>
                  pk_live_51Hr3cVH…
                </code>
              </div>
              <div className="settings-row">
                <span className="settings-label">Secret Key</span>
                <code style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface)", padding: "3px 8px", borderRadius: 4 }}>
                  rk_live_51Hr3cVH…
                </code>
              </div>
              <div className="settings-row">
                <span className="settings-label">Currency</span>
                <span style={{ fontWeight: 600 }}>USD</span>
              </div>
            </div>
            <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
              Payments are processed securely via Stripe. Secret keys are stored server-side only — never exposed to the browser. Clients pay invoices directly from the portal and funds appear in your Stripe dashboard.
            </p>
          </div>
        </>
      ) : null}

      {/* ── Editable API Keys ── */}
      <div className="panel" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Key size={18} color="var(--deep)" />
          <h3 style={{ margin: 0 }}>Update Stripe API Keys</h3>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
          Paste new keys below. Leave a field blank to keep the existing key. Keys are saved to the database and override the server's .env file immediately — no restart required.
        </p>

        {keySaved && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#15803d", fontSize: 13, fontWeight: 600 }}>
            ✓ Keys updated successfully
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Secret Key (sk_live_… or rk_live_…)
            <div style={{ position: "relative" }}>
              <input
                type={showSecret ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Paste new secret key here"
                style={{ width: "100%", paddingRight: 40, fontFamily: "monospace", fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Publishable Key (pk_live_…)
            <input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="Paste new publishable key here"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </label>

          <button
            className="green-btn"
            onClick={saveKeys}
            disabled={savingKeys || (!secretKey && !publishableKey)}
            style={{ alignSelf: "flex-start" }}
          >
            {savingKeys ? "Saving…" : "Save Keys"}
          </button>
        </div>
      </div>
    </div>
  );
}
