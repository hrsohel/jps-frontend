import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatsCard from "../components/StatsCard";
import ServiceCard from "../components/ServiceCard";
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

export default function Dashboard({ user }) {
  const [serviceGroups, setServiceGroups] = useState([]);
  const [stats, setStats] = useState({
    projects: 0,
    requests: 0,
    invoices: 0,
    notifications: 0,
    revenue: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadServiceGroups();
    loadDashboardStats();
    loadRecentProjects();
  }, []);

  async function loadServiceGroups() {
    try {
      const data = await apiGet("/service-catalog/groups");
      setServiceGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadDashboardStats() {
    try {
      const data = await apiGet("/dashboard");
      setStats({
        projects: data.projects || 0,
        requests: data.requests || 0,
        invoices: data.invoices || 0,
        notifications: data.notifications || 0,
        revenue: data.revenue || 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadRecentProjects() {
    try {
      const data = await apiGet("/projects");
      setRecentProjects(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function addServiceRequest(service) {
    if (!user?.email) {
      alert("Please log in to request a service.");
      return;
    }

    try {
      await apiPost("/service-requests", {
        serviceGroup: service.groupName,
        projectTitle: service.title,
        businessName: user.businessName || user.fullName || "JPS Portal Client",
        contactName: user.fullName || "Portal User",
        email: user.email,
        phone: user.phone || "",
        budgetRange: service.startingPrice ? `$${service.startingPrice}` : "",
        desiredDate: "",
        description: service.description || "",
      });

      alert("Service request created successfully! Our team will review it shortly.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to create service request");
    }
  }

  const addOnServices = serviceGroups.flatMap((group) =>
    (group.services || []).map((service) => ({
      ...service,
      groupName: group.name,
    }))
  );

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!`}
        description="Manage your business marketing projects, service requests, invoices, from one location."
        actions={
          <button className="green-btn" onClick={() => {}}>
            Schedule Appointment
          </button>
        }
      />

      <section className="stats-grid">
        <StatsCard
          title="Active Projects"
          value={loadingStats ? "..." : stats.projects}
          description="Projects currently in the portal"
        />
        <StatsCard
          title="Service Requests"
          value={loadingStats ? "..." : stats.requests}
          description="Submitted requests"
        />
        <StatsCard
          title="Invoices"
          value={loadingStats ? "..." : stats.invoices}
          description="Created invoices"
        />
        <StatsCard
          title="Revenue"
          value={loadingStats ? "..." : `$${Number(stats.revenue).toFixed(2)}`}
          description="Total invoice value"
        />
        <StatsCard
          title="Unread Notifications"
          value={loadingStats ? "..." : stats.notifications}
          description="Updates needing attention"
        />
      </section>

      <section className="panel">
        <h2>Your Business Growth Starts Now</h2>
        <p>
          Your digital business partner for website development, digital marketing, branding & signs, and IT solutions.
        </p>
        <div className="card-actions">
          <button>Request Service</button>
          <button className="outline">Upload Files</button>
          <button className="green-btn">Schedule Appointment</button>
        </div>
      </section>

      <section className="panel">
        <h2>Active Projects</h2>
        <p>Track active projects, review progress updates, and monitor deliverables.</p>

        {recentProjects.length === 0 ? (
          <p style={{ color: "#64748b" }}>No active projects yet.</p>
        ) : (
          <div className="projects-grid" style={{ marginTop: "16px" }}>
            {recentProjects.map((project) => {
              const st = statusStyle(project.status);
              const progress = project.progress ?? 0;
              return (
                <div key={project.id} className="project-card-new">
                  <div className="project-card-header">
                    <div>
                      <span className="status-badge" style={{ background: st.bg, color: st.color }}>
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
                      <div className="project-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="project-progress-label">{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {serviceGroups.length > 0 && (
        <section className="panel">
          <h2>Service Overview</h2>
          <p>Explore our core services offered to help your business growth.</p>

          <div className="service-grid">
            {serviceGroups.map((group) => (
              <ServiceCard
                key={group.id}
                title={group.name}
                image={group.imageUrl || null}
                description={group.description || ""}
              />
            ))}
          </div>
        </section>
      )}

      {addOnServices.length > 0 && (
        <section className="panel">
          <h2>Add-On Services</h2>
          <p>Quickly request our most popular services.</p>

          <div className="addon-grid">
            {addOnServices.map((service) => (
              <div key={service.id} className="addon-card">
                <small>{service.groupName}</small>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                {service.startingPrice && (
                  <strong>Starting at ${service.startingPrice}</strong>
                )}
                <button className="view-btn" onClick={() => addServiceRequest(service)}>
                  Add Service
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
