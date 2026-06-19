import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const TEMPLATE_CATEGORIES = ["General", "Maintenance", "Marketing", "Promotion", "Newsletter", "Follow-up"];

const EMPTY_CAMPAIGN = { name: "", segment: "All", subject: "", emailTitle: "", emailBody: "", buttonText: "", buttonLink: "", bannerImage: "" };
const EMPTY_TEMPLATE = { name: "", category: "General", subject: "", emailTitle: "", emailBody: "", buttonText: "", buttonLink: "" };

function authFetch(url, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

export default function CampaignsPage() {
  const [tab, setTab] = useState("campaigns"); // "campaigns" | "templates"

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignLogs, setCampaignLogs] = useState([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Shared
  const [serviceGroups, setServiceGroups] = useState([]);

  const campaignsPagination = usePagination(campaigns, 8);
  const logsPagination      = usePagination(campaignLogs, 10);

  useEffect(() => {
    loadStats();
    loadCampaigns();
    loadCampaignLogs();
    loadTemplates();
    loadServiceGroups();
  }, []);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const data = await apiGet("/campaigns/stats");
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadServiceGroups() {
    try {
      const data = await apiGet("/service-catalog/groups");
      setServiceGroups(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  async function loadCampaigns() {
    try { setCampaigns(await apiGet("/campaigns").then(d => Array.isArray(d) ? d : [])); }
    catch (e) { console.error(e); }
  }

  async function loadCampaignLogs() {
    try { setCampaignLogs(await apiGet("/campaign-logs").then(d => Array.isArray(d) ? d : [])); }
    catch (e) { console.error(e); }
  }

  async function loadTemplates() {
    try { setTemplates(await apiGet("/email-templates").then(d => Array.isArray(d) ? d : [])); }
    catch (e) { console.error(e); }
  }

  async function loadRecipients(seg) {
    if (!seg || seg === "All") { setRecipients([]); return; }
    try {
      const data = await apiGet(`/users/segment/${encodeURIComponent(seg)}`);
      setRecipients(Array.isArray(data) ? data : []);
    } catch (e) { setRecipients([]); }
  }

  // ── Templates CRUD ──────────────────────────────────────────────
  function openNewTemplate() {
    setEditingTemplate(null);
    setTemplateForm(EMPTY_TEMPLATE);
    setShowTemplateForm(true);
  }

  function openEditTemplate(t) {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, category: t.category, subject: t.subject, emailTitle: t.emailTitle, emailBody: t.emailBody, buttonText: t.buttonText || "", buttonLink: t.buttonLink || "" });
    setShowTemplateForm(true);
  }

  async function saveTemplate() {
    if (!templateForm.name || !templateForm.subject || !templateForm.emailTitle || !templateForm.emailBody) {
      alert("Name, subject, heading, and message are required."); return;
    }
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await authFetch(`${API_BASE}/email-templates/${editingTemplate.id}`, { method: "PUT", body: JSON.stringify(templateForm) });
      } else {
        await apiPost("/email-templates", templateForm);
      }
      setShowTemplateForm(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (e) {
      alert(e.message || "Unable to save template");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function deleteTemplate(id) {
    if (!confirm("Delete this template?")) return;
    try { await apiDelete(`/email-templates/${id}`); await loadTemplates(); }
    catch (e) { alert(e.message || "Delete failed"); }
  }

  // Apply template to campaign form
  function applyTemplate(t) {
    setCampaignForm((prev) => ({ ...prev, subject: t.subject, emailTitle: t.emailTitle, emailBody: t.emailBody, buttonText: t.buttonText || "", buttonLink: t.buttonLink || "" }));
    setTab("campaigns");
    setShowCampaignForm(true);
  }

  // ── Campaigns CRUD ──────────────────────────────────────────────
  function openNewCampaign() {
    setEditingCampaign(null);
    setCampaignForm(EMPTY_CAMPAIGN);
    setRecipients([]);
    setShowCampaignForm(true);
  }

  function openEditCampaign(c) {
    setEditingCampaign(c);
    setCampaignForm({ name: c.name, segment: c.segment, subject: c.subject, emailTitle: c.emailTitle, emailBody: c.emailBody, buttonText: c.buttonText || "", buttonLink: c.buttonLink || "", bannerImage: c.bannerImage || "" });
    loadRecipients(c.segment);
    setShowCampaignForm(true);
  }

  function buildHtml() {
    const { emailTitle, emailBody, buttonText, buttonLink, bannerImage } = campaignForm;
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <img src="https://app.jpssupport.com/assets/jps-support-services-primary-logo.png" alt="JPS" style="height:50px;margin-bottom:20px" />
      ${bannerImage ? `<img src="${bannerImage}" style="width:100%;border-radius:12px;margin-bottom:20px" />` : ""}
      <h1 style="color:#0749B3">${emailTitle}</h1>
      <p style="white-space:pre-line">${emailBody}</p>
      ${buttonText ? `<p><a href="${buttonLink || "#"}" style="display:inline-block;background:#22A9E0;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold">${buttonText}</a></p>` : ""}
      <p style="color:#64748b;margin-top:24px">JPS Support Services — Your Digital Business Partner</p>
    </div>`;
  }

  async function saveDraft() {
    if (!campaignForm.name.trim() || !campaignForm.subject.trim()) { alert("Campaign name and subject are required."); return; }
    setSending(true);
    try {
      const payload = { ...campaignForm };
      if (editingCampaign) {
        await authFetch(`${API_BASE}/campaigns/${editingCampaign.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiPost("/campaigns", payload);
      }
      setShowCampaignForm(false);
      setEditingCampaign(null);
      await loadCampaigns();
    } catch (e) { alert(e.message || "Unable to save"); }
    finally { setSending(false); }
  }

  async function sendTest() {
    setSending(true);
    try {
      const r = await authFetch(`${API_BASE}/email/test`, { method: "POST", body: JSON.stringify({ subject: campaignForm.subject || "JPS Campaign Test", html: buildHtml() }) });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "Failed"); return; }
      alert("Test email sent!");
    } catch (e) { alert("Failed to send test email"); }
    finally { setSending(false); }
  }

  async function sendCampaign() {
    if (!campaignForm.segment || campaignForm.segment === "All") { alert("Select a specific segment to send."); return; }
    if (recipients.length === 0) { alert("No recipients found for this segment."); return; }
    if (!confirm(`Send to ${recipients.length} recipient(s) in "${campaignForm.segment}"?`)) return;
    setSending(true);
    try {
      const r = await authFetch(`${API_BASE}/email/send-segment`, { method: "POST", body: JSON.stringify({ campaignName: campaignForm.name, segment: campaignForm.segment, subject: campaignForm.subject, html: buildHtml() }) });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "Send failed"); return; }
      alert(`Sent! Recipients: ${d.recipients} | Delivered: ${d.successCount} | Failed: ${d.failedCount}`);
      await Promise.all([loadCampaignLogs(), loadStats()]);
    } catch (e) { alert("Campaign send failed"); }
    finally { setSending(false); }
  }

  async function deleteCampaign(id) {
    if (!confirm("Delete this campaign?")) return;
    try { await apiDelete(`/campaigns/${id}`); await loadCampaigns(); }
    catch (e) { alert(e.message || "Delete failed"); }
  }

  const segmentOptions = ["All", ...serviceGroups.map((g) => g.name)];

  const groupedTemplates = TEMPLATE_CATEGORIES.reduce((acc, cat) => {
    const list = templates.filter((t) => t.category === cat);
    if (list.length) acc[cat] = list;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Email Campaigns"
        description="Create and send targeted email campaigns to your client segments."
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="outline" onClick={() => { setTab("templates"); setShowTemplateForm(false); }}>Manage Templates</button>
            <button className="view-btn" onClick={() => { setTab("campaigns"); openNewCampaign(); }}>+ New Campaign</button>
          </div>
        }
      />

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "20px" }}>
        {[
          { label: "Total Campaigns", value: stats?.totalCampaigns, sub: `${stats?.draftCampaigns ?? "—"} drafts · ${stats?.sentCampaigns ?? "—"} sent` },
          { label: "Emails Sent",     value: stats?.totalSent,      sub: "across all campaigns" },
          { label: "Delivered",       value: stats?.totalDelivered,  sub: "successfully received" },
          { label: "Failed",          value: stats?.totalFailed,     sub: "delivery errors", danger: (stats?.totalFailed ?? 0) > 0 },
          { label: "Success Rate",    value: stats ? `${stats.successRate}%` : null, sub: `${stats?.activeUsers ?? "—"} active recipients` },
          { label: "Templates",       value: stats?.totalTemplates,  sub: "saved email templates" },
        ].map(({ label, value, sub, danger }) => (
          <div key={label}>
            <span>{label}</span>
            <strong style={danger ? { color: "#dc2626" } : {}}>
              {loadingStats ? <span className="stat-loading">…</span> : (value ?? 0)}
            </strong>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>{loadingStats ? "" : sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="project-filters" style={{ marginBottom: "20px" }}>
        <button className={tab === "campaigns" ? "filter-btn active" : "filter-btn"} onClick={() => setTab("campaigns")}>Campaigns</button>
        <button className={tab === "templates" ? "filter-btn active" : "filter-btn"} onClick={() => setTab("templates")}>Email Templates</button>
        <button className={tab === "logs" ? "filter-btn active" : "filter-btn"} onClick={() => setTab("logs")}>Delivery Logs</button>
      </div>

      {/* ── TEMPLATES TAB ── */}
      {tab === "templates" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button className="green-btn" onClick={openNewTemplate}>+ Create Template</button>
          </div>

          {showTemplateForm && (
            <section className="panel" style={{ marginBottom: "20px" }}>
              <h3 style={{ marginTop: 0 }}>{editingTemplate ? "Edit Template" : "New Email Template"}</h3>
              <div className="form-grid">
                <label className="form-label">
                  Template Name *
                  <input className="form-select" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g. Monthly Maintenance Offer" />
                </label>
                <label className="form-label">
                  Category
                  <select className="form-select" value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}>
                    {TEMPLATE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-label" style={{ gridColumn: "1/-1" }}>
                  Email Subject *
                  <input className="form-select" value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="e.g. Keep your site updated and protected" />
                </label>
                <label className="form-label" style={{ gridColumn: "1/-1" }}>
                  Heading *
                  <input className="form-select" value={templateForm.emailTitle} onChange={(e) => setTemplateForm({ ...templateForm, emailTitle: e.target.value })} placeholder="e.g. Website Maintenance Plan" />
                </label>
                <label className="form-label" style={{ gridColumn: "1/-1" }}>
                  Message Body *
                  <textarea className="form-select" rows={6} value={templateForm.emailBody} onChange={(e) => setTemplateForm({ ...templateForm, emailBody: e.target.value })} placeholder="Write your email message..." style={{ resize: "vertical" }} />
                </label>
                <label className="form-label">
                  Button Text
                  <input className="form-select" value={templateForm.buttonText} onChange={(e) => setTemplateForm({ ...templateForm, buttonText: e.target.value })} placeholder="e.g. Get Started" />
                </label>
                <label className="form-label">
                  Button Link
                  <input className="form-select" value={templateForm.buttonLink} onChange={(e) => setTemplateForm({ ...templateForm, buttonLink: e.target.value })} placeholder="https://jpssupport.com" />
                </label>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button className="green-btn" onClick={saveTemplate} disabled={savingTemplate}>{savingTemplate ? "Saving..." : "Save Template"}</button>
                <button className="outline" onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }}>Cancel</button>
              </div>
            </section>
          )}

          {templates.length === 0 && !showTemplateForm ? (
            <div className="panel" style={{ textAlign: "center", color: "#94a3b8", padding: "40px" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>📧</div>
              <p>No templates yet. Create one to get started.</p>
            </div>
          ) : (
            Object.entries(groupedTemplates).map(([cat, list]) => (
              <section key={cat} className="panel" style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 14px", color: "#0749B3", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.1em" }}>{cat}</h4>
                <div className="template-grid">
                  {list.map((t) => (
                    <div key={t.id} className="template-card">
                      <div className="template-card-name">{t.name}</div>
                      <div className="template-card-subject">{t.subject}</div>
                      <p className="template-card-body">{t.emailBody}</p>
                      <div className="template-card-actions">
                        <button className="green-btn" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => applyTemplate(t)}>Use in Campaign</button>
                        <button className="view-btn" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => openEditTemplate(t)}>Edit</button>
                        <button className="delete-btn" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => deleteTemplate(t.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}

      {/* ── CAMPAIGNS TAB ── */}
      {tab === "campaigns" && (
        <>
          {showCampaignForm && (
            <section className="panel" style={{ marginBottom: "20px" }}>
              <h3 style={{ marginTop: 0 }}>{editingCampaign ? "Edit Campaign" : "New Campaign"}</h3>

              {/* Quick-apply templates */}
              {templates.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px" }}>Apply a template:</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        className="filter-btn"
                        onClick={() => setCampaignForm((prev) => ({ ...prev, subject: t.subject, emailTitle: t.emailTitle, emailBody: t.emailBody, buttonText: t.buttonText || "", buttonLink: t.buttonLink || "" }))}
                        title={t.subject}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-grid">
                <label className="form-label">
                  Campaign Name *
                  <input className="form-select" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. June Website Promo" />
                </label>
                <label className="form-label">
                  Target Segment *
                  <select className="form-select" value={campaignForm.segment}
                    onChange={(e) => { setCampaignForm({ ...campaignForm, segment: e.target.value }); loadRecipients(e.target.value); }}>
                    {segmentOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="form-label" style={{ gridColumn: "1/-1" }}>
                  Email Subject *
                  <input className="form-select" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} placeholder="e.g. Keep your website updated" />
                </label>
              </div>

              {/* Recipients preview */}
              {campaignForm.segment !== "All" && (
                <div className="campaign-recipients">
                  <strong>{recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</strong> in "{campaignForm.segment}"
                  {recipients.length > 0 && (
                    <span style={{ marginLeft: "8px", fontSize: "12px", color: "#64748b" }}>
                      {recipients.slice(0, 3).map((u) => u.fullName).join(", ")}{recipients.length > 3 ? ` +${recipients.length - 3} more` : ""}
                    </span>
                  )}
                </div>
              )}

              <div style={{ marginTop: "16px" }}>
                <label className="form-label">
                  Heading
                  <input className="form-select" value={campaignForm.emailTitle} onChange={(e) => setCampaignForm({ ...campaignForm, emailTitle: e.target.value })} placeholder="Email heading" />
                </label>
              </div>
              <div style={{ marginTop: "12px" }}>
                <label className="form-label">
                  Message *
                  <textarea className="form-select" rows={8} value={campaignForm.emailBody} onChange={(e) => setCampaignForm({ ...campaignForm, emailBody: e.target.value })} placeholder="Write your message..." style={{ resize: "vertical" }} />
                </label>
              </div>
              <div className="form-grid" style={{ marginTop: "12px" }}>
                <label className="form-label">
                  Button Text
                  <input className="form-select" value={campaignForm.buttonText} onChange={(e) => setCampaignForm({ ...campaignForm, buttonText: e.target.value })} placeholder="Learn More" />
                </label>
                <label className="form-label">
                  Button Link
                  <input className="form-select" value={campaignForm.buttonLink} onChange={(e) => setCampaignForm({ ...campaignForm, buttonLink: e.target.value })} placeholder="https://" />
                </label>
                <label className="form-label" style={{ gridColumn: "1/-1" }}>
                  Banner Image URL
                  <input className="form-select" value={campaignForm.bannerImage} onChange={(e) => setCampaignForm({ ...campaignForm, bannerImage: e.target.value })} placeholder="https://yourdomain.com/banner.jpg" />
                </label>
              </div>

              {/* Preview */}
              <section className="panel" style={{ marginTop: "20px" }}>
                <h4 style={{ margin: "0 0 12px" }}>Email Preview</h4>
                <div className="email-preview">
                  <img src="/assets/jps-support-services-primary-logo.png" alt="JPS" style={{ maxWidth: "180px", marginBottom: "16px" }} />
                  {campaignForm.bannerImage && <img src={campaignForm.bannerImage} alt="" style={{ width: "100%", borderRadius: "10px", marginBottom: "16px" }} />}
                  <h2 style={{ color: "#0749B3" }}>{campaignForm.emailTitle || "Email Heading"}</h2>
                  <p style={{ whiteSpace: "pre-wrap", color: "#334155" }}>{campaignForm.emailBody || "Your message will appear here."}</p>
                  {campaignForm.buttonText && (
                    <a href={campaignForm.buttonLink || "#"} className="email-btn" target="_blank" rel="noreferrer">{campaignForm.buttonText}</a>
                  )}
                </div>
              </section>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                <button className="view-btn" onClick={saveDraft} disabled={sending}>{sending ? "Saving..." : "Save Draft"}</button>
                <button className="outline" onClick={sendTest} disabled={sending}>Send Test Email</button>
                <button className="green-btn" onClick={sendCampaign} disabled={sending}>{sending ? "Sending..." : "Send Campaign"}</button>
                <button className="delete-btn" onClick={() => { setShowCampaignForm(false); setEditingCampaign(null); }}>Cancel</button>
              </div>
            </section>
          )}

          <section className="panel">
            <h3 style={{ margin: "0 0 16px" }}>All Campaigns ({campaigns.length})</h3>
            {campaigns.length === 0 ? (
              <p style={{ color: "#64748b" }}>No campaigns yet. Click "New Campaign" to start.</p>
            ) : (
              <>
              {campaignsPagination.paged.map((c) => (
                <div key={c.id} className="row">
                  <div>
                    <strong>{c.name}</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>{c.segment} · {c.status} · {new Date(c.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button className="view-btn" onClick={() => openEditCampaign(c)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteCampaign(c.id)}>Delete</button>
                  </div>
                </div>
              ))}
              <Pagination {...campaignsPagination} onPageChange={campaignsPagination.setPage} />
              </>
            )}
          </section>
        </>
      )}

      {/* ── LOGS TAB ── */}
      {tab === "logs" && (
        <section className="panel">
          <h3 style={{ margin: "0 0 16px" }}>Delivery Logs ({campaignLogs.length})</h3>
          {campaignLogs.length === 0 ? (
            <p style={{ color: "#64748b" }}>No delivery logs yet.</p>
          ) : (
            <>
            {logsPagination.paged.map((log) => (
              <div key={log.id} className="row">
                <div>
                  <strong>{log.campaignName}</strong>
                  <br />
                  <small style={{ color: "#64748b" }}>{log.segment} · {log.status} · {new Date(log.createdAt).toLocaleString()}</small>
                </div>
                <div style={{ textAlign: "right", fontSize: "13px" }}>
                  <span style={{ color: "#15803d" }}>✓ {log.successCount}</span>
                  {log.failedCount > 0 && <span style={{ color: "#dc2626", marginLeft: "10px" }}>✗ {log.failedCount}</span>}
                  <br />
                  <small style={{ color: "#64748b" }}>{log.recipients} total</small>
                </div>
              </div>
            ))}
            <Pagination {...logsPagination} onPageChange={logsPagination.setPage} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
