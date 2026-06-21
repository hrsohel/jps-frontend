import React, { useEffect, useState } from "react";
import {
  Users,
  Home,
  ShoppingBag,
  ReceiptText,
  DollarSign,
  Bell,
  FileUp,
  CalendarDays,
  MessageSquare,
  Megaphone,
  Wrench,
  ClipboardList,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatsCard from "../components/StatsCard";
import ServiceCard from "../components/ServiceCard";
import { apiGet, apiPost } from "../lib/api";

const STAFF_ROLES = ["ADMIN", "STAFF"];

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

const REQUEST_COLORS = {
  NEW: "#64748b", Approved: "#0E9F6E", APPROVED: "#0E9F6E",
  Rejected: "#ef4444", REJECTED: "#ef4444",
};

export default function Dashboard({ user, setPage }) {
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isAdmin = user?.role === "ADMIN";

  const [serviceGroups, setServiceGroups] = useState([]);
  const [stats, setStats] = useState({
    projects: 0, requests: 0, invoices: 0, notifications: 0, revenue: 0,
  });
  const [userCount, setUserCount] = useState(null);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const calls = [
        apiGet("/dashboard").catch(() => null),
        apiGet("/projects").catch(() => []),
        apiGet("/service-requests").catch(() => []),
        apiGet("/invoices").catch(() => []),
        apiGet("/service-catalog/groups").catch(() => []),
        isAdmin ? apiGet("/users").catch(() => []) : Promise.resolve(null),
      ];
      const [dash, proj, reqs, invs, groups, users] = await Promise.all(calls);

      if (dash) {
        setStats({
          projects: dash.projects || 0,
          requests: dash.requests || 0,
          invoices: dash.invoices || 0,
          notifications: dash.notifications || 0,
          revenue: dash.revenue || 0,
        });
      }
      setProjects(Array.isArray(proj) ? proj : []);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setInvoices(Array.isArray(invs) ? invs : []);
      setServiceGroups(Array.isArray(groups) ? groups : []);
      if (Array.isArray(users)) setUserCount(users.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
      loadAll();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to create service request");
    }
  }

  const go = (p) => setPage && setPage(p);
  const v = (n) => (loading ? "..." : n);

  const pendingRequests = requests.filter((r) => r.status === "NEW");
  const recentProjects = projects.slice(0, 3);
  const recentInvoices = invoices.slice(0, 4);
  const recentRequests = requests.slice(0, 5);

  const addOnServices = serviceGroups.flatMap((group) =>
    (group.services || []).map((service) => ({ ...service, groupName: group.name }))
  );

  // Quick actions differ by role
  const quickActions = isStaff
    ? [
        { label: "Manage Users", desc: "Roles, segments & access", icon: Users, page: "Users", admin: true },
        { label: "Review Requests", desc: "Approve & create projects", icon: ClipboardList, page: "Admin Requests", admin: true },
        { label: "Projects", desc: "Track delivery & progress", icon: Home, page: "Projects" },
        { label: "Email Campaigns", desc: "Send client marketing", icon: Megaphone, page: "Email Campaigns", admin: true },
        { label: "Admin Services", desc: "Manage service catalog", icon: Wrench, page: "Admin Services", admin: true },
        { label: "Invoices", desc: "Billing & payments", icon: ReceiptText, page: "Invoices" },
      ].filter((a) => !a.admin || isAdmin)
    : [
        { label: "Request Service", desc: "Start a new project", icon: ShoppingBag, page: "Request Service" },
        { label: "My Projects", desc: "Track progress & files", icon: Home, page: "Projects" },
        { label: "Upload Files", desc: "Share artwork & docs", icon: FileUp, page: "Files & Documents" },
        { label: "Messages", desc: "Chat with the JPS team", icon: MessageSquare, page: "Messages" },
        { label: "Invoices", desc: "View & pay invoices", icon: ReceiptText, page: "Invoices" },
        { label: "Appointments", desc: "Schedule a consultation", icon: CalendarDays, page: "Appointments" },
      ];

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!`}
        description={
          isStaff
            ? "Manage clients, service requests, projects, invoices, and marketing from one place."
            : "Manage your projects, service requests, invoices, and appointments from one location."
        }
        actions={
          <button className="green-btn" onClick={() => go("Appointments")}>
            Schedule Appointment
          </button>
        }
      />

      {/* ── Stats (role-aware) ── */}
      <section className="stats-grid">
        {isStaff ? (
          <>
            {isAdmin && (
              <StatsCard
                title="Total Users"
                value={v(userCount ?? 0)}
                description="Registered portal accounts"
                icon={<Users size={18} color="#fff" />}
                color="#0749B3"
              />
            )}
            <StatsCard
              title="Active Projects"
              value={v(stats.projects)}
              description="All projects in the portal"
              icon={<Home size={18} color="#fff" />}
              color="#22A9E0"
            />
            <StatsCard
              title="Service Requests"
              value={v(stats.requests)}
              description={`${pendingRequests.length} pending review`}
              icon={<ClipboardList size={18} color="#fff" />}
              color="#a16207"
            />
            <StatsCard
              title="Total Revenue"
              value={v(`$${Number(stats.revenue).toFixed(2)}`)}
              description="Across all invoices"
              icon={<DollarSign size={18} color="#fff" />}
              color="#0E9F6E"
            />
            <StatsCard
              title="Invoices"
              value={v(stats.invoices)}
              description="Generated invoices"
              icon={<ReceiptText size={18} color="#fff" />}
              color="#7e22ce"
            />
          </>
        ) : (
          <>
            <StatsCard
              title="My Projects"
              value={v(stats.projects)}
              description="Projects assigned to you"
              icon={<Home size={18} color="#fff" />}
              color="#22A9E0"
            />
            <StatsCard
              title="My Requests"
              value={v(stats.requests)}
              description="Service requests submitted"
              icon={<ShoppingBag size={18} color="#fff" />}
              color="#a16207"
            />
            <StatsCard
              title="My Invoices"
              value={v(stats.invoices)}
              description="Invoices on your account"
              icon={<ReceiptText size={18} color="#fff" />}
              color="#7e22ce"
            />
            <StatsCard
              title="Total Billed"
              value={v(`$${Number(stats.revenue).toFixed(2)}`)}
              description="Value of your invoices"
              icon={<DollarSign size={18} color="#fff" />}
              color="#0E9F6E"
            />
            <StatsCard
              title="Notifications"
              value={v(stats.notifications)}
              description="Unread updates"
              icon={<Bell size={18} color="#fff" />}
              color="#0749B3"
            />
          </>
        )}
      </section>

      {/* ── Quick actions ── */}
      <section className="panel">
        <h2>Quick Actions</h2>
        <p>{isStaff ? "Jump straight into management tasks." : "Get things done in a couple of clicks."}</p>
        <div className="addon-grid" style={{ marginTop: "16px" }}>
          {quickActions.map(({ label, desc, icon: Icon, page }) => (
            <button
              key={label}
              className="addon-card"
              style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)" }}
              onClick={() => go(page)}
            >
              <div
                className="stat-card-icon"
                style={{ background: "var(--deep)", marginBottom: "10px" }}
              >
                <Icon size={18} color="#fff" />
              </div>
              <h3>{label}</h3>
              <p>{desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Admin: pending requests needing action ── */}
      {isStaff && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Pending Service Requests</h2>
            <button className="view-btn" onClick={() => go("Admin Requests")}>View All</button>
          </div>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading...</p>
          ) : pendingRequests.length === 0 ? (
            <p style={{ color: "#64748b" }}>No requests awaiting review. 🎉</p>
          ) : (
            pendingRequests.slice(0, 5).map((r) => (
              <div key={r.id} className="row">
                <div>
                  <strong>#{r.id} — {r.projectTitle}</strong><br />
                  <small style={{ color: "#64748b" }}>{r.serviceGroup} • {r.contactName} • {r.email}</small>
                </div>
                <button className="green-btn" onClick={() => go("Admin Requests")}>Review</button>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── Recent projects (both roles) ── */}
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{isStaff ? "Recent Projects" : "Your Active Projects"}</h2>
          <button className="view-btn" onClick={() => go("Projects")}>View All</button>
        </div>
        <p>Track active projects, review progress updates, and monitor deliverables.</p>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading projects...</p>
        ) : recentProjects.length === 0 ? (
          <p style={{ color: "#64748b" }}>No projects yet.</p>
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
                  {isStaff && project.clientName && (
                    <p className="project-card-desc">Client: {project.clientName}</p>
                  )}
                  {!isStaff && project.description && (
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

      {/* ── Recent invoices (both roles) ── */}
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Recent Invoices</h2>
          <button className="view-btn" onClick={() => go("Invoices")}>View All</button>
        </div>
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : recentInvoices.length === 0 ? (
          <p style={{ color: "#64748b" }}>No invoices yet.</p>
        ) : (
          recentInvoices.map((inv) => (
            <div key={inv.id} className="row">
              <div>
                <strong>{inv.invoiceNumber}</strong><br />
                <small style={{ color: "#64748b" }}>
                  {isStaff ? inv.clientName : inv.serviceDescription}
                </small>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>${Number(inv.totalAmount).toFixed(2)}</strong><br />
                <small style={{ color: "#64748b" }}>{inv.status}</small>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Client: recent requests ── */}
      {!isStaff && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Your Recent Requests</h2>
            <button className="view-btn" onClick={() => go("Request Service")}>New Request</button>
          </div>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading...</p>
          ) : recentRequests.length === 0 ? (
            <p style={{ color: "#64748b" }}>You haven't submitted any service requests yet.</p>
          ) : (
            recentRequests.map((r) => (
              <div key={r.id} className="row">
                <div>
                  <strong>{r.projectTitle}</strong><br />
                  <small style={{ color: "#64748b" }}>{r.serviceGroup}</small>
                </div>
                <span style={{ color: REQUEST_COLORS[r.status] || "#64748b", fontWeight: 700, fontSize: "13px" }}>
                  {r.status}
                </span>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── Service overview (everyone) ── */}
      {serviceGroups.length > 0 && (
        <section className="panel">
          <h2>Service Overview</h2>
          <p>Explore our core services offered to help your business grow.</p>
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

      {/* ── Add-on services (clients request directly) ── */}
      {!isStaff && addOnServices.length > 0 && (
        <section className="panel">
          <h2>Add-On Services</h2>
          <p>Quickly request our most popular services.</p>
          <div className="addon-grid">
            {addOnServices.map((service) => (
              <div key={service.id} className="addon-card">
                <small>{service.groupName}</small>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                {service.startingPrice && <strong>Starting at ${service.startingPrice}</strong>}
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
