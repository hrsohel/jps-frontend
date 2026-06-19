import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPost, apiPatch } from "../lib/api";

const TIME_SLOTS = [
  "Morning (9am – 12pm)",
  "Afternoon (12pm – 3pm)",
  "Late Afternoon (3pm – 5pm)",
];

const STATUS_META = {
  PENDING:   { label: "Pending",   bg: "#fefce8", color: "#a16207" },
  APPROVED:  { label: "Approved",  bg: "#f0fdf4", color: "#15803d" },
  REJECTED:  { label: "Declined",  bg: "#fef2f2", color: "#dc2626" },
  CANCELLED: { label: "Cancelled", bg: "#f1f5f9", color: "#64748b" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{
      background: m.bg, color: m.color,
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
    }}>
      {m.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function Appointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [serviceGroups, setServiceGroups] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("ALL");

  const isStaff = ["ADMIN", "STAFF"].includes(user?.role);

  const [form, setForm] = useState({
    title: "",
    serviceType: "",
    serviceId: "",
    date: "",
    timeSlot: "",
    notes: "",
    targetUserId: "",
  });

  useEffect(() => {
    load();
    loadServiceGroups();
    if (isStaff) loadUsers();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet("/appointments");
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadServiceGroups() {
    try {
      const [groups, services] = await Promise.all([
        apiGet("/service-catalog/groups"),
        apiGet("/service-catalog/services"),
      ]);
      setServiceGroups(Array.isArray(groups) ? groups : []);
      setAllServices(Array.isArray(services) ? services : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadUsers() {
    try {
      const data = await apiGet("/users");
      setUsers(Array.isArray(data) ? data.filter((u) => u.role === "CLIENT") : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title || !form.serviceType || !form.date || !form.timeSlot) {
      setError("Title, service type, date, and time are required.");
      return;
    }

    const selected = isStaff && form.targetUserId
      ? users.find((u) => String(u.id) === String(form.targetUserId))
      : null;

    const payload = {
      title: form.title,
      serviceType: form.serviceType,
      date: form.date,
      timeSlot: form.timeSlot,
      notes: form.notes,
      targetUserId: selected?.id || null,
      targetName: selected?.fullName || null,
      targetEmail: selected?.email || null,
    };

    try {
      setSubmitting(true);
      await apiPost("/appointments", payload);
      setSuccess("Appointment request sent successfully!");
      setForm({ title: "", serviceType: "", serviceId: "", date: "", timeSlot: "", notes: "", targetUserId: "" });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message || "Unable to create appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id, action) {
    try {
      await apiPatch(`/appointments/${id}/${action}`, {});
      await load();
    } catch (e) {
      alert(e.message || `Unable to ${action} appointment.`);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  // Services that belong to the currently selected group
  const selectedGroup = serviceGroups.find((g) => g.name === form.serviceType);
  const groupServices = selectedGroup
    ? allServices.filter((s) => s.serviceGroupId === selectedGroup.id && s.isActive)
    : [];

  const filtered = filter === "ALL"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const apptPagination = usePagination(filtered, 8);

  // Determine which appointments need the current user's action
  function needsMyAction(appt) {
    if (isStaff && appt.status === "PENDING" && appt.createdByRole === "CLIENT") return true;
    if (!isStaff && appt.status === "PENDING" && appt.targetUserId === user?.id) return true;
    return false;
  }

  function canCancel(appt) {
    return appt.createdByUserId === user?.id && appt.status === "PENDING";
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Schedule and manage consultations, project meetings, and support sessions."
        actions={
          <button className="green-btn" onClick={() => { setShowForm((v) => !v); setError(""); setSuccess(""); }}>
            {showForm ? "Close" : "+ Schedule Appointment"}
          </button>
        }
      />

      {/* Book form */}
      {showForm && (
        <section className="panel" style={{ marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>
            {isStaff ? "Schedule Appointment with Client" : "Request an Appointment"}
          </h3>

          {error && <div className="appt-alert error">{error}</div>}
          {success && <div className="appt-alert success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-label">
                Title *
                <input
                  className="form-select"
                  placeholder="e.g. Website Kickoff Meeting"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="form-label">
                Service Category *
                <select
                  className="form-select"
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value, serviceId: "" })}
                >
                  <option value="">— Select category —</option>
                  {serviceGroups.length > 0
                    ? serviceGroups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)
                    : <option disabled>No services available</option>
                  }
                </select>
              </label>

              {form.serviceType && (
                <label className="form-label">
                  Specific Service
                  <select
                    className="form-select"
                    value={form.serviceId}
                    onChange={(e) => {
                      const svc = allServices.find((s) => String(s.id) === e.target.value);
                      setForm({
                        ...form,
                        serviceId: e.target.value,
                        title: svc ? svc.title : form.title,
                      });
                    }}
                  >
                    <option value="">— Select service (optional) —</option>
                    {groupServices.length > 0
                      ? groupServices.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}{s.startingPrice ? ` — from $${s.startingPrice}` : ""}
                          </option>
                        ))
                      : <option disabled>No specific services listed</option>
                    }
                  </select>
                  {form.serviceId && (() => {
                    const svc = allServices.find((s) => String(s.id) === form.serviceId);
                    return svc?.description
                      ? <small style={{ color: "#64748b", marginTop: "4px" }}>{svc.description}</small>
                      : null;
                  })()}
                </label>
              )}

              <label className="form-label">
                Date *
                <input
                  type="date"
                  className="form-select"
                  min={today}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <label className="form-label">
                Time Slot *
                <select className="form-select" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
                  <option value="">— Select —</option>
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              {isStaff && (
                <label className="form-label">
                  Assign to Client
                  <select className="form-select" value={form.targetUserId} onChange={(e) => setForm({ ...form, targetUserId: e.target.value })}>
                    <option value="">— Select client (optional) —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
                  </select>
                </label>
              )}
            </div>

            <label className="form-label" style={{ marginTop: "12px" }}>
              Notes
              <textarea
                className="form-select"
                rows="3"
                placeholder="Any additional details or agenda items..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button type="submit" className="green-btn" disabled={submitting}>
                {submitting ? "Sending..." : "Send Request"}
              </button>
              <button type="button" className="outline" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter tabs */}
      <div className="project-filters" style={{ marginBottom: "16px" }}>
        {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
          <button
            key={s}
            className={filter === s ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All" : STATUS_META[s]?.label || s}
            {s === "ALL" ? "" : ` (${appointments.filter((a) => a.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Appointments list */}
      <section className="panel">
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
          {filter === "ALL" ? `All Appointments (${filtered.length})` : `${STATUS_META[filter]?.label} (${filtered.length})`}
        </h3>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading appointments...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📅</div>
            <p style={{ margin: 0 }}>No appointments found.</p>
          </div>
        ) : (
          <div className="appt-list">
            {apptPagination.paged.map((appt) => {
              const actionNeeded = needsMyAction(appt);
              return (
                <div key={appt.id} className={`appt-card ${actionNeeded ? "appt-action-needed" : ""}`}>
                  <div className="appt-card-top">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <strong className="appt-title">{appt.title}</strong>
                        <StatusBadge status={appt.status} />
                        {actionNeeded && (
                          <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "20px", fontWeight: 700 }}>
                            Action Required
                          </span>
                        )}
                      </div>
                      <div className="appt-meta">
                        <span>📅 {formatDate(appt.date)}</span>
                        <span>🕐 {appt.timeSlot}</span>
                        <span>🏷️ {appt.serviceType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="appt-parties">
                    <div className="appt-party">
                      <small>From</small>
                      <strong>{appt.createdByName}</strong>
                      <span>{appt.createdByEmail}</span>
                    </div>
                    {(appt.targetName || appt.targetEmail) && (
                      <div className="appt-party">
                        <small>To</small>
                        <strong>{appt.targetName || "—"}</strong>
                        <span>{appt.targetEmail || ""}</span>
                      </div>
                    )}
                  </div>

                  {appt.notes && (
                    <p className="appt-notes">{appt.notes}</p>
                  )}

                  <div className="appt-actions">
                    {/* Staff approves/rejects client requests */}
                    {isStaff && appt.status === "PENDING" && appt.createdByRole === "CLIENT" && (
                      <>
                        <button className="green-btn" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => handleAction(appt.id, "approve")}>
                          Approve
                        </button>
                        <button className="delete-btn" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => handleAction(appt.id, "reject")}>
                          Decline
                        </button>
                      </>
                    )}
                    {/* Client approves/rejects admin-sent appointments */}
                    {!isStaff && appt.status === "PENDING" && appt.targetUserId === user?.id && (
                      <>
                        <button className="green-btn" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => handleAction(appt.id, "approve")}>
                          Accept
                        </button>
                        <button className="delete-btn" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => handleAction(appt.id, "reject")}>
                          Decline
                        </button>
                      </>
                    )}
                    {/* Creator can cancel pending */}
                    {canCancel(appt) && (
                      <button className="outline" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => handleAction(appt.id, "cancel")}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <Pagination {...apptPagination} onPageChange={apptPagination.setPage} />
          </div>
        )}
      </section>
    </div>
  );
}
