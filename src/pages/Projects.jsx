import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet } from "../lib/api";

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

export default function Projects({ setPage, setSelectedProject, user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    loadProjects();
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

  const isStaff = ["ADMIN", "STAFF"].includes(user?.role);

  const filtered = filter === "ALL"
    ? projects
    : projects.filter((p) => p.status === filter);

  const projectsPagination = usePagination(filtered, 9);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Track active projects, review progress updates, upload project files, approve deliverables, and communicate with the JPS team."
        actions={<button className="green-btn">Schedule Appointment</button>}
      />

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
