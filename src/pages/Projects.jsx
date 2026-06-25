import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPost } from "../lib/api";

const STATUS_COLORS = {
  PLANNING:    { bg: "#eff6ff", color: "#1d4ed8", label: "Planning" },
  IN_PROGRESS: { bg: "#fefce8", color: "#a16207", label: "In Progress" },
  REVIEW:      { bg: "#fdf4ff", color: "#7e22ce", label: "Review" },
  COMPLETED:   { bg: "#f0fdf4", color: "#15803d", label: "Completed" },
  ON_HOLD:     { bg: "#fff7ed", color: "#c2410c", label: "On Hold" },
};

function statusStyle(status) {
  return STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#475569", label: status };
}

const BLANK_PROJECT = {
  title: "", serviceGroup: "", clientEmail: "", clientName: "",
  description: "", status: "IN_PROGRESS", clientUserId: "",
};

export default function Projects({ setPage, setSelectedProject, user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_PROJECT);
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState([]);

  const isStaff = ["ADMIN", "STAFF"].includes(user?.role);

  useEffect(() => {
    loadProjects();
    if (isStaff) {
      apiGet("/users")
        .then((data) => setClients(Array.isArray(data) ? data.filter((u) => u.role === "CLIENT") : []))
        .catch(() => {});
    }
  }, []);

  async function loadProjects() {
    try {
      const data = await apiGet("/projects");
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!form.title || !form.clientEmail || !form.clientName) {
      alert("Project title, client email, and client name are required.");
      return;
    }
    try {
      setCreating(true);
      await apiPost("/projects", {
        ...form,
        clientUserId: form.clientUserId ? Number(form.clientUserId) : undefined,
      });
      setForm(BLANK_PROJECT);
      setShowCreate(false);
      await loadProjects();
    } catch (error) {
      alert(error.message || "Unable to create project");
    } finally {
      setCreating(false);
    }
  }

  function onClientSelect(e) {
    const userId = e.target.value;
    const client = clients.find((c) => String(c.id) === userId);
    setForm((f) => ({
      ...f,
      clientUserId: userId,
      clientEmail: client?.email || f.clientEmail,
      clientName: client?.fullName || f.clientName,
    }));
  }

  const filtered = filter === "ALL" ? projects : projects.filter((p) => p.status === filter);
  const projectsPagination = usePagination(filtered, 9);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Track active projects, review progress updates, upload project files, approve deliverables, and communicate with the JPS team."
        actions={
          isStaff && (
            <button className="green-btn" onClick={() => setShowCreate((v) => !v)}>
              {showCreate
                ? <><X size={14} style={{ verticalAlign: "middle" }} /> Cancel</>
                : <><Plus size={14} style={{ verticalAlign: "middle" }} /> New Project</>}
            </button>
          )
        }
      />

      {/* Admin: Create Project form */}
      {isStaff && showCreate && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Create Project for Client</h2>
          <form onSubmit={handleCreateProject}>
            <div className="invoice-grid">
              <label style={{ gridColumn: "1/-1" }}>
                Assign to Client
                <select value={form.clientUserId} onChange={onClientSelect}>
                  <option value="">— Select a client account —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.email})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Client Name *
                <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} required placeholder="Full Name" />
              </label>
              <label>
                Client Email *
                <input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} required placeholder="client@email.com" />
              </label>
              <label>
                Project Title *
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Website Redesign" />
              </label>
              <label>
                Service Group
                <input value={form.serviceGroup} onChange={(e) => setForm((f) => ({ ...f, serviceGroup: e.target.value }))} placeholder="Website Services" />
              </label>
              <label>
                Initial Status
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="PLANNING">Planning</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                </select>
              </label>
              <label style={{ gridColumn: "1/-1" }}>
                Description
                <textarea rows="2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ width: "100%", marginTop: 4 }} />
              </label>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="green-btn" type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Project"}
              </button>
              <button className="view-btn" type="button" onClick={() => { setShowCreate(false); setForm(BLANK_PROJECT); }}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="project-filters">
        {["ALL", "PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"].map((s) => (
          <button
            key={s}
            className={filter === s ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All" : statusStyle(s).label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#64748b", padding: "20px 0" }}>Loading projects...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", color: "#64748b" }}>
          <p>{projects.length === 0 ? "No projects found yet." : "No projects match this filter."}</p>
        </div>
      ) : (
        <>
        <div className="projects-grid">
          {projectsPagination.paged.map((project) => {
            const st = statusStyle(project.status);
            const progress = project.progress ?? 0;
            return (
              <div key={project.id} className="project-card-new">
                <div className="project-card-header">
                  <div>
                    <span
                      className="status-badge"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                    {project.serviceGroup && (
                      <span className="service-tag">{project.serviceGroup}</span>
                    )}
                  </div>
                </div>

                <h3 className="project-card-title">{project.title}</h3>

                {project.description && (
                  <p className="project-card-desc">{project.description}</p>
                )}

                <div className="project-progress-wrap">
                  <div className="project-progress-bar">
                    <div
                      className="project-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="project-progress-label">{progress}%</span>
                </div>

                <div className="project-card-meta">
                  {isStaff && project.clientName && (
                    <span>Client: <strong>{project.clientName}</strong></span>
                  )}
                  {project.startDate && (
                    <span>Started: <strong>{new Date(project.startDate).toLocaleDateString()}</strong></span>
                  )}
                </div>

                <button
                  className="project-view-btn"
                  onClick={() => {
                    setSelectedProject(project);
                    setPage("Project Details");
                  }}
                >
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
        <Pagination {...projectsPagination} onPageChange={projectsPagination.setPage} />
        </>
      )}
    </div>
  );
}
