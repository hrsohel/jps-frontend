import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiGet, apiPatch } from "../lib/api";

const COMM_OPTIONS = ["Email", "Phone", "Text", "Portal Message"];
const APPT_OPTIONS = ["Morning (9am–12pm)", "Afternoon (12pm–3pm)", "Late Afternoon (3pm–5pm)"];

export default function SettingsPage({ setPage, user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet("/users/me");
      setProfile(data);
    } catch (e) {
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }

  function set(key, value) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function save() {
    setError("");
    setSuccess("");
    if (!profile.fullName?.trim()) { setError("Full name is required."); return; }
    setSaving(true);
    try {
      const updated = await apiPatch("/users/me", profile);
      setProfile(updated);
      // Update localStorage user so topbar name refreshes
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, fullName: updated.fullName, businessName: updated.businessName }));
      setSuccess("Profile saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Account Settings" description="Manage your profile and account preferences." />
        <div className="panel" style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}>Loading profile…</div>
      </div>
    );
  }

  const p = profile || {};

  return (
    <div>
      <PageHeader
        title="Account Settings"
        description="Manage your business profile, contact information, billing, and account security."
        actions={
          <button className="green-btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        }
      />

      {error && <div className="settings-alert error">{error}</div>}
      {success && <div className="settings-alert success">{success}</div>}

      {/* ── Business Profile ── */}
      <section className="panel">
        <h2>Business Profile</h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>Keep your business details updated for service requests, projects, and invoices.</p>
        <div className="form-grid">
          <label className="form-label">
            Full Name *
            <input className="form-select" value={p.fullName || ""} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" />
          </label>
          <label className="form-label">
            Business Name
            <input className="form-select" value={p.businessName || ""} onChange={(e) => set("businessName", e.target.value)} placeholder="Your business name" />
          </label>
          <label className="form-label">
            Business Industry
            <input className="form-select" value={p.businessIndustry || ""} onChange={(e) => set("businessIndustry", e.target.value)} placeholder="e.g. Construction, Retail, Healthcare" />
          </label>
          <label className="form-label">
            Business Type
            <input className="form-select" value={p.businessType || ""} onChange={(e) => set("businessType", e.target.value)} placeholder="LLC, Corporation, Sole Proprietor…" />
          </label>
          <label className="form-label">
            Website
            <input className="form-select" value={p.website || ""} onChange={(e) => set("website", e.target.value)} placeholder="https://yourbusiness.com" />
          </label>
        </div>
      </section>

      {/* ── Contact Information ── */}
      <section className="panel">
        <h2>Contact Information</h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>Used for project updates, support tickets, and appointments.</p>
        <div className="form-grid">
          <label className="form-label">
            Email Address
            <input className="form-select" value={p.email || ""} disabled style={{ background: "#f8fafc", cursor: "not-allowed" }} />
            <small style={{ color: "#94a3b8" }}>Email cannot be changed here</small>
          </label>
          <label className="form-label">
            Phone Number
            <input className="form-select" value={p.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
          </label>
          <label className="form-label">
            Preferred Communication
            <select className="form-select" value={p.preferredComm || ""} onChange={(e) => set("preferredComm", e.target.value)}>
              <option value="">— Select —</option>
              {COMM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="form-label">
            Preferred Appointment Time
            <select className="form-select" value={p.preferredApptTime || ""} onChange={(e) => set("preferredApptTime", e.target.value)}>
              <option value="">— Select —</option>
              {APPT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* ── Business Address ── */}
      <section className="panel">
        <h2>Business Address</h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>Used on invoices, service requests, and project planning.</p>
        <div className="form-grid">
          <label className="form-label" style={{ gridColumn: "1/-1" }}>
            Street Address
            <input className="form-select" value={p.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, Suite 100" />
          </label>
          <label className="form-label">
            City
            <input className="form-select" value={p.city || ""} onChange={(e) => set("city", e.target.value)} placeholder="City" />
          </label>
          <label className="form-label">
            State / Province
            <input className="form-select" value={p.state || ""} onChange={(e) => set("state", e.target.value)} placeholder="State" />
          </label>
          <label className="form-label">
            ZIP / Postal Code
            <input className="form-select" value={p.zipCode || ""} onChange={(e) => set("zipCode", e.target.value)} placeholder="ZIP Code" />
          </label>
          <label className="form-label">
            Country
            <input className="form-select" value={p.country || ""} onChange={(e) => set("country", e.target.value)} placeholder="Country" />
          </label>
        </div>
      </section>

      {/* ── Billing Information ── */}
      <section className="panel">
        <h2>Billing Information</h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>Billing details used for invoices, receipts, and payment records.</p>
        <div className="form-grid">
          <label className="form-label">
            Billing Contact Name
            <input className="form-select" value={p.billingContact || ""} onChange={(e) => set("billingContact", e.target.value)} placeholder="Billing contact full name" />
          </label>
          <label className="form-label">
            Billing Email
            <input className="form-select" value={p.billingEmail || ""} onChange={(e) => set("billingEmail", e.target.value)} placeholder="billing@yourbusiness.com" />
          </label>
          <label className="form-label">
            Tax ID / EIN
            <input className="form-select" value={p.taxId || ""} onChange={(e) => set("taxId", e.target.value)} placeholder="Optional" />
          </label>
        </div>
      </section>

      {/* ── Account Info ── */}
      <section className="panel">
        <h2>Account Information</h2>
        <div className="settings-info-grid">
          <div className="settings-info-item">
            <span>Role</span>
            <strong>{p.role || "—"}</strong>
          </div>
          <div className="settings-info-item">
            <span>Status</span>
            <strong style={{ color: p.status === "ACTIVE" ? "#15803d" : "#dc2626" }}>{p.status || "—"}</strong>
          </div>
          <div className="settings-info-item">
            <span>Member Since</span>
            <strong>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</strong>
          </div>
          <div className="settings-info-item">
            <span>Email</span>
            <strong>{p.email || "—"}</strong>
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="panel">
        <h2>Account Security</h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>Manage your password and login security.</p>
        <div className="card-actions">
          <button className="green-btn" onClick={() => setPage("Change Password")}>Change Password</button>
        </div>
      </section>

      {/* Sticky save bar */}
      <div className="settings-save-bar">
        {error && <span style={{ color: "#dc2626", fontSize: "13px" }}>{error}</span>}
        {success && <span style={{ color: "#15803d", fontSize: "13px" }}>{success}</span>}
        <button className="green-btn" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
