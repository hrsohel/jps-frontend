import React, { useEffect, useState } from "react";
import { Send, ClipboardList, ChevronRight, Calendar, DollarSign, Building2, User, Mail, Phone, FileText, Layers } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPost } from "../lib/api";

const STATUS_CONFIG = {
  NEW:      { label: "New",      bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  APPROVED: { label: "Approved", bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  Approved: { label: "Approved", bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  REJECTED: { label: "Rejected", bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
  Rejected: { label: "Rejected", bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
  REVIEW:   { label: "In Review", bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
};

const INDUSTRY_OPTIONS = [
  "Restaurant / Food Service", "Beauty / Salon / Spa", "Construction / Contractor",
  "Healthcare / Wellness", "Real Estate / Property Management", "Retail / E-Commerce",
  "Professional Services", "Nonprofit / Community Organization", "Education / Training",
  "Transportation / Logistics", "Technology / IT Services", "Fashion / Apparel",
  "Home Services", "Other",
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label || status}
    </span>
  );
}

export default function ServiceRequests({ user }) {
  const [requests, setRequests]     = useState([]);
  const [serviceGroups, setServiceGroups] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState("");
  const historyPagination = usePagination(requests, 8);

  const [form, setForm] = useState({
    serviceGroup: "", industryType: "", projectTitle: "",
    businessName: user?.businessName || "", contactName: user?.fullName || "",
    email: user?.email || "", phone: "", budgetRange: "", desiredDate: "", description: "",
  });

  useEffect(() => {
    loadRequests();
    apiGet("/service-catalog/groups")
      .then((d) => setServiceGroups(Array.isArray(d) ? d.filter((g) => g.isActive) : []))
      .catch(() => {});
  }, []);

  async function loadRequests() {
    try {
      const data = await apiGet("/service-requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch { }
  }

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.serviceGroup || !form.projectTitle || !form.businessName || !form.contactName || !form.email) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      await apiPost("/service-requests", form);
      setSuccess(true);
      setForm({
        serviceGroup: "", industryType: "", projectTitle: "",
        businessName: user?.businessName || "", contactName: user?.fullName || "",
        email: user?.email || "", phone: "", budgetRange: "", desiredDate: "", description: "",
      });
      loadRequests();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const serviceOptions = serviceGroups.length > 0
    ? serviceGroups.map((g) => g.name)
    : ["Website Services", "Digital Marketing", "Branding & Signs", "IT & Business Solutions"];

  return (
    <div>
      <PageHeader
        title="Request a Service"
        description="Tell us about your project and we'll get back to you within 24 hours."
      />

      {/* ── Progress steps ── */}
      <div className="sr-steps">
        {["Project Details", "Contact Info", "Timeline & Budget", "Submit"].map((s, i) => (
          <div key={s} className="sr-step">
            <div className="sr-step-circle">{i + 1}</div>
            <span>{s}</span>
            {i < 3 && <ChevronRight size={14} className="sr-step-arrow" />}
          </div>
        ))}
      </div>

      {/* ── Success banner ── */}
      {success && (
        <div className="sr-success-banner">
          <div className="sr-success-icon">✓</div>
          <div>
            <strong>Request Submitted Successfully!</strong>
            <p>Our team will review your request and reach out within 24 hours.</p>
          </div>
        </div>
      )}

      {error && <div className="sr-error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Project Details ── */}
        <div className="sr-section">
          <div className="sr-section-header">
            <div className="sr-section-icon"><Layers size={18} /></div>
            <div>
              <h3>Project Details</h3>
              <p>What kind of service are you looking for?</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-label">
              Service Category *
              <select className="form-select" value={form.serviceGroup} onChange={(e) => set("serviceGroup", e.target.value)} required>
                <option value="">— Select a service —</option>
                {serviceOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>

            {form.serviceGroup === "Website Services" && (
              <label className="form-label">
                Industry Type
                <select className="form-select" value={form.industryType} onChange={(e) => set("industryType", e.target.value)}>
                  <option value="">— Select industry —</option>
                  {INDUSTRY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            )}

            <label className="form-label" style={{ gridColumn: form.serviceGroup === "Website Services" ? "auto" : "1/-1" }}>
              Project Title *
              <input className="form-select" value={form.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} placeholder="e.g. New Business Website" required />
            </label>

            <label className="form-label" style={{ gridColumn: "1/-1" }}>
              Project Description
              <textarea
                className="form-select"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe what you need, goals, references, or any specific requirements..."
                style={{ resize: "vertical" }}
              />
            </label>
          </div>
        </div>

        {/* ── Section 2: Contact Info ── */}
        <div className="sr-section">
          <div className="sr-section-header">
            <div className="sr-section-icon"><User size={18} /></div>
            <div>
              <h3>Contact Information</h3>
              <p>How should we reach you about this project?</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Building2 size={13} /> Business Name *</span>
              <input className="form-select" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Your business name" required />
            </label>

            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={13} /> Contact Name *</span>
              <input className="form-select" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Your full name" required />
            </label>

            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={13} /> Email Address *</span>
              <input className="form-select" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@business.com" required />
            </label>

            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={13} /> Phone Number</span>
              <input className="form-select" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
            </label>
          </div>
        </div>

        {/* ── Section 3: Timeline & Budget ── */}
        <div className="sr-section">
          <div className="sr-section-header">
            <div className="sr-section-icon"><Calendar size={18} /></div>
            <div>
              <h3>Timeline &amp; Budget</h3>
              <p>Help us plan the right solution for your needs.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><DollarSign size={13} /> Budget Range</span>
              <input className="form-select" value={form.budgetRange} onChange={(e) => set("budgetRange", e.target.value)} placeholder="e.g. $500 – $1,000" />
            </label>

            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={13} /> Desired Completion Date</span>
              <input className="form-select" type="date" value={form.desiredDate} onChange={(e) => set("desiredDate", e.target.value)} />
            </label>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="sr-submit-bar">
          <p className="sr-submit-note">By submitting, our team will review your request and contact you within 24 hours.</p>
          <button type="submit" className="sr-submit-btn" disabled={loading}>
            {loading ? (
              <><span className="sr-spinner" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Request</>
            )}
          </button>
        </div>
      </form>

      {/* ── Request History ── */}
      <div className="sr-history">
        <div className="sr-history-header">
          <ClipboardList size={20} />
          <h2>Request History</h2>
          <span className="sr-history-count">{requests.length}</span>
        </div>

        {requests.length === 0 ? (
          <div className="sr-history-empty">
            <ClipboardList size={36} strokeWidth={1.2} />
            <p>No service requests yet. Submit your first one above!</p>
          </div>
        ) : (
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project Title</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {historyPagination.paged.map((r) => (
                  <tr key={r.id}>
                    <td><span className="sr-id">#{r.id}</span></td>
                    <td><span className="sr-project-title">{r.projectTitle}</span></td>
                    <td><span className="sr-service-tag">{r.serviceGroup}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="sr-date">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 24px 16px" }}>
              <Pagination {...historyPagination} onPageChange={historyPagination.setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
