import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiGet } from "../lib/api";

export default function UserDetails({ selectedUser, setPage }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedUser) return;
    loadUserData();
  }, [selectedUser]);

  async function loadUserData() {
    try {
      setLoading(true);
      const [allProjects, allInvoices, allRequests] = await Promise.all([
        apiGet("/projects"),
        apiGet("/invoices"),
        apiGet("/service-requests"),
      ]);

      // Filter by this user's data
      const userProjects = Array.isArray(allProjects)
        ? allProjects.filter(
            (p) =>
              p.clientEmail === selectedUser.email ||
              p.clientUserId === selectedUser.id
          )
        : [];

      const userInvoices = Array.isArray(allInvoices)
        ? allInvoices.filter((i) => i.clientEmail === selectedUser.email)
        : [];

      const userRequests = Array.isArray(allRequests)
        ? allRequests.filter((r) => r.email === selectedUser.email)
        : [];

      setProjects(userProjects);
      setInvoices(userInvoices);
      setRequests(userRequests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!selectedUser) {
    return (
      <div className="panel">
        <h2>User Not Found</h2>
        <p>Please go back and select a user.</p>
      </div>
    );
  }

  function roleBadge(role) {
    const colors = { ADMIN: "#0749B3", STAFF: "#22A9E0", CLIENT: "#64748b", MARKETING: "#0E9F6E" };
    return (
      <span style={{ background: colors[role] || "#64748b", color: "#fff", padding: "2px 10px", borderRadius: "10px", fontSize: "12px" }}>
        {role}
      </span>
    );
  }

  return (
    <div>
      <PageHeader
        title={selectedUser.fullName}
        description={selectedUser.email}
        actions={
          <button className="view-btn" onClick={() => setPage("Users")}>
            ← Back to Users
          </button>
        }
      />

      <section className="panel">
        <h2>User Information</h2>

        <div className="row"><span>Business</span><small>{selectedUser.businessName || "—"}</small></div>
        <div className="row"><span>Email</span><small>{selectedUser.email}</small></div>
        <div className="row"><span>Phone</span><small>{selectedUser.phone || "—"}</small></div>
        <div className="row"><span>Role</span><small>{roleBadge(selectedUser.role)}</small></div>
        <div className="row"><span>Segment</span><small>{selectedUser.segment || "General"}</small></div>
        <div className="row">
          <span>Status</span>
          <small style={{ color: selectedUser.status === "ACTIVE" ? "#0E9F6E" : "#ef4444" }}>
            {selectedUser.status}
          </small>
        </div>
        <div className="row">
          <span>Member Since</span>
          <small>{new Date(selectedUser.createdAt).toLocaleDateString()}</small>
        </div>
      </section>

      <section className="panel">
        <h2>Projects ({loading ? "..." : projects.length})</h2>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : projects.length === 0 ? (
          <p style={{ color: "#64748b" }}>No projects found for this user.</p>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="row">
              <div>
                <strong>{project.title}</strong><br />
                <small style={{ color: "#64748b" }}>{project.serviceGroup}</small>
              </div>
              <div>
                <small>{project.status}</small><br />
                <small style={{ color: "#64748b" }}>{project.progress}%</small>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="panel">
        <h2>Service Requests ({loading ? "..." : requests.length})</h2>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: "#64748b" }}>No service requests found.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="row">
              <div>
                <strong>{req.projectTitle}</strong><br />
                <small style={{ color: "#64748b" }}>{req.serviceGroup}</small>
              </div>
              <small>{req.status}</small>
            </div>
          ))
        )}
      </section>

      <section className="panel">
        <h2>Invoices ({loading ? "..." : invoices.length})</h2>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : invoices.length === 0 ? (
          <p style={{ color: "#64748b" }}>No invoices found.</p>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="row">
              <div>
                <strong>{invoice.invoiceNumber}</strong><br />
                <small style={{ color: "#64748b" }}>{invoice.serviceDescription}</small>
              </div>
              <div>
                <strong>${Number(invoice.totalAmount).toFixed(2)}</strong><br />
                <small>{invoice.status}</small>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
