import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPatch, apiPost } from "../lib/api";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const data = await apiGet("/service-requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateRequestStatus(id, action) {
    try {
      await apiPatch(`/service-requests/${id}/${action}`, {});
      await loadRequests();
    } catch (error) {
      alert(error.message || "Unable to update request");
    }
  }

  async function createProject(requestId) {
    try {
      await apiPost(`/service-requests/${requestId}/create-project`, {});
      alert("Project created successfully!");
      await loadRequests();
    } catch (error) {
      alert(error.message || "Unable to create project");
    }
  }

  const reqPagination = usePagination(requests, 8);

  function statusBadge(status) {
    const map = {
      NEW:      { bg: "#f1f5f9", color: "#475569" },
      Approved: { bg: "#f0fdf4", color: "#15803d" },
      Rejected: { bg: "#fef2f2", color: "#dc2626" },
    };
    const s = map[status] || map.NEW;
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
      }}>
        {status}
      </span>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Requests"
        description="Review, approve, or reject client service requests."
      />

      <section className="panel">
        <h2>Service Requests</h2>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: "#64748b" }}>No service requests found.</p>
        ) : (
          <>
            {reqPagination.paged.map((request) => (
              <div key={request.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                {/* Header row */}
                <div
                  className="row"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>#{request.id} — {request.projectTitle}</strong>
                      {statusBadge(request.status)}
                    </div>
                    <small style={{ color: "#64748b" }}>
                      {request.serviceGroup} &bull; {request.email} &bull; {request.contactName}
                    </small>
                    <br />
                    <small style={{ color: "#94a3b8" }}>
                      {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </small>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {/* Action buttons — stop propagation so click doesn't toggle expand */}
                    <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                      {request.status === "NEW" && (
                        <>
                          <button
                            className="view-btn"
                            onClick={() => updateRequestStatus(request.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => updateRequestStatus(request.id, "reject")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === "Approved" && (
                        <button
                          className="green-btn"
                          onClick={() => createProject(request.id)}
                        >
                          Create Project
                        </button>
                      )}
                    </div>
                    {expandedId === request.id ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {expandedId === request.id && (
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "16px 20px",
                    margin: "0 0 12px 0",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "12px 24px",
                  }}>
                    {request.description && (
                      <div style={{ gridColumn: "1/-1" }}>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>Description</p>
                        <p style={{ fontSize: 14, color: "#0f172a", margin: 0, whiteSpace: "pre-wrap" }}>{request.description}</p>
                      </div>
                    )}
                    {request.businessName && (
                      <div>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>Business</p>
                        <p style={{ fontSize: 14, color: "#0f172a", margin: 0, fontWeight: 600 }}>{request.businessName}</p>
                      </div>
                    )}
                    {request.phone && (
                      <div>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>Phone</p>
                        <p style={{ fontSize: 14, color: "#0f172a", margin: 0 }}>{request.phone}</p>
                      </div>
                    )}
                    {request.budgetRange && (
                      <div>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>Budget</p>
                        <p style={{ fontSize: 14, color: "#0f172a", margin: 0 }}>{request.budgetRange}</p>
                      </div>
                    )}
                    {request.desiredDate && (
                      <div>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>Desired Date</p>
                        <p style={{ fontSize: 14, color: "#0f172a", margin: 0 }}>{new Date(request.desiredDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {request.industryType && (
                      <div>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>Industry</p>
                        <p style={{ fontSize: 14, color: "#0f172a", margin: 0 }}>{request.industryType}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <Pagination {...reqPagination} onPageChange={reqPagination.setPage} />
          </>
        )}
      </section>
    </div>
  );
}
