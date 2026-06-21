import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet } from "../lib/api";

function roleBadge(role) {
  const isStaff = role === "STAFF" || role === "ADMIN";
  return (
    <span
      style={{
        background: isStaff ? "#0749B3" : "#0E9F6E",
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "10px",
        fontSize: "11px",
        fontWeight: 700,
      }}
    >
      {role}
    </span>
  );
}

export default function MessageLog() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet("/project-messages/log/all");
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (roleFilter !== "ALL") {
        const isStaff = m.senderRole === "STAFF" || m.senderRole === "ADMIN";
        if (roleFilter === "STAFF" && !isStaff) return false;
        if (roleFilter === "CLIENT" && isStaff) return false;
      }
      if (!q) return true;
      return (
        (m.message || "").toLowerCase().includes(q) ||
        (m.sender || "").toLowerCase().includes(q) ||
        (m.projectTitle || "").toLowerCase().includes(q) ||
        (m.clientName || "").toLowerCase().includes(q) ||
        (m.clientEmail || "").toLowerCase().includes(q)
      );
    });
  }, [messages, search, roleFilter]);

  const pagination = usePagination(filtered, 15);

  return (
    <div>
      <PageHeader
        title="Conversation Log"
        description="Read-only audit log of every message exchanged between clients and the JPS team across all projects."
        actions={<button className="view-btn" onClick={load}>Refresh</button>}
      />

      <section className="panel">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <input
            placeholder="Search messages, sender, project, client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "220px", padding: "10px 12px", border: "1.5px solid var(--line)", borderRadius: "8px" }}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: "10px 12px", border: "1.5px solid var(--line)", borderRadius: "8px" }}>
            <option value="ALL">All Senders</option>
            <option value="STAFF">JPS Team</option>
            <option value="CLIENT">Clients</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading conversation log…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>💬</div>
            <p style={{ margin: 0 }}>No messages found.</p>
          </div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Sender</th>
                  <th>Role</th>
                  <th>Message</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paged.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.projectTitle}</strong>
                      {m.clientName && <><br /><small style={{ color: "#64748b" }}>{m.clientName}</small></>}
                    </td>
                    <td>{m.sender}</td>
                    <td>{roleBadge(m.senderRole)}</td>
                    <td style={{ maxWidth: "360px" }}>{m.message}</td>
                    <td><small style={{ color: "#64748b" }}>{new Date(m.createdAt).toLocaleString()}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </section>
    </div>
  );
}
