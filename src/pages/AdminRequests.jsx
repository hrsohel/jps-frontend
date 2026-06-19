import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPatch, apiPost } from "../lib/api";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const colors = { NEW: "#64748b", Approved: "#0E9F6E", Rejected: "#ef4444" };
    return (
      <span
        style={{
          background: colors[status] || "#64748b",
          color: "#fff",
          padding: "2px 10px",
          borderRadius: "12px",
          fontSize: "12px",
        }}
      >
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
              <div key={request.id} className="row">
                <div>
                  <strong>#{request.id} — {request.projectTitle}</strong>
                  <br />
                  <small>{request.serviceGroup}</small>
                  <br />
                  <small>{request.email} &bull; {request.contactName}</small>
                  <br />
                  <small style={{ color: "#64748b" }}>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </small>
                </div>

                <div className="table-actions">
                  {statusBadge(request.status)}

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
              </div>
            ))}
            <Pagination {...reqPagination} onPageChange={reqPagination.setPage} />
          </>
        )}
      </section>
    </div>
  );
}
