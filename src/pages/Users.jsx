import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPatch, apiPost } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const EMPTY_NEW_USER = {
  fullName: "", email: "", password: "", phone: "",
  businessName: "", role: "CLIENT", segment: "General", status: "ACTIVE",
};

export default function UsersPage({ setPage, setSelectedUser }) {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editSegment, setEditSegment] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  function setNew(key, val) { setNewUser((u) => ({ ...u, [key]: val })); }

  async function createUser() {
    setAddError("");
    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.password) {
      setAddError("Full name, email, and password are required.");
      return;
    }
    if (newUser.password.length < 8) {
      setAddError("Password must be at least 8 characters.");
      return;
    }
    try {
      setAdding(true);
      await apiPost("/users", newUser);
      setNewUser(EMPTY_NEW_USER);
      setShowAddForm(false);
      await loadUsers();
      alert("User created successfully.");
    } catch (err) {
      setAddError(err.message || "Unable to create user.");
    } finally {
      setAdding(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await apiGet("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(userId, userEmail) {
    const password = prompt(`Enter a temporary password for ${userEmail}:`);
    if (!password || password.length < 6) {
      if (password !== null) alert("Password must be at least 6 characters.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.error || "Unable to reset password"); return; }
      alert(`Password reset successfully for ${userEmail}`);
    } catch (error) {
      alert("Unable to reset password");
    }
  }

  async function saveUserChanges() {
    if (!editingUser) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: editRole, segment: editSegment, status: editStatus }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.error || "Update failed"); return; }
      alert("User updated successfully");
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      alert("Unable to update user");
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = segmentFilter === "All" ? users : users.filter((u) => u.segment === segmentFilter);
  const usersPagination = usePagination(filteredUsers, 10);

  function roleBadgeColor(role) {
    const colors = { ADMIN: "#0749B3", STAFF: "#22A9E0", CLIENT: "#64748b", MARKETING: "#0E9F6E", SUBCONTRACTOR: "#f59e0b" };
    return colors[role] || "#64748b";
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage customer accounts, roles, segments, status, and password resets."
        actions={
          <button className="green-btn" onClick={() => { setShowAddForm((v) => !v); setAddError(""); }}>
            {showAddForm ? "Close" : "+ Add User"}
          </button>
        }
      />

      {showAddForm && (
        <section className="panel" style={{ marginBottom: "20px", border: "2px solid #0E9F6E" }}>
          <h3 style={{ marginTop: 0 }}>Create New User</h3>
          {addError && <p style={{ color: "#ef4444" }}>{addError}</p>}
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input value={newUser.fullName} onChange={(e) => setNew("fullName", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={newUser.email} onChange={(e) => setNew("email", e.target.value)} placeholder="jane@business.com" />
            </div>
            <div className="form-group">
              <label>Temporary Password *</label>
              <input value={newUser.password} onChange={(e) => setNew("password", e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={newUser.phone} onChange={(e) => setNew("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-group">
              <label>Business Name</label>
              <input value={newUser.businessName} onChange={(e) => setNew("businessName", e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={newUser.role} onChange={(e) => setNew("role", e.target.value)}>
                <option value="CLIENT">CLIENT</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
                <option value="MARKETING">MARKETING</option>
                <option value="SUBCONTRACTOR">SUBCONTRACTOR</option>
              </select>
            </div>
            <div className="form-group">
              <label>Segment</label>
              <select value={newUser.segment} onChange={(e) => setNew("segment", e.target.value)}>
                <option>General</option>
                <option>Website Clients</option>
                <option>Hosting Clients</option>
                <option>Digital Marketing Clients</option>
                <option>Print & Sign Clients</option>
                <option>Construction Clients</option>
                <option>VIP Clients</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={newUser.status} onChange={(e) => setNew("status", e.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>
          <div className="table-actions" style={{ marginTop: "12px" }}>
            <button className="green-btn" onClick={createUser} disabled={adding}>{adding ? "Creating..." : "Create User"}</button>
            <button className="delete-btn" onClick={() => { setShowAddForm(false); setNewUser(EMPTY_NEW_USER); }}>Cancel</button>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="form-group">
          <label>Filter by Segment</label>
          <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)}>
            <option>All</option>
            <option>General</option>
            <option>Website Clients</option>
            <option>Hosting Clients</option>
            <option>Digital Marketing Clients</option>
            <option>Print & Sign Clients</option>
            <option>Construction Clients</option>
            <option>VIP Clients</option>
          </select>
        </div>

        {error && <p style={{ color: "#ef4444" }}>{error}</p>}

        {editingUser && (
          <div className="panel" style={{ marginBottom: "20px", border: "2px solid #22A9E0" }}>
            <h3>Edit: {editingUser.fullName}</h3>
            <small style={{ color: "#64748b" }}>{editingUser.email}</small>

            <div className="form-grid" style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label>Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="CLIENT">CLIENT</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="MARKETING">MARKETING</option>
                  <option value="SUBCONTRACTOR">SUBCONTRACTOR</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISABLED">DISABLED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="form-group">
                <label>Segment</label>
                <select value={editSegment} onChange={(e) => setEditSegment(e.target.value)}>
                  <option>General</option>
                  <option>Website Clients</option>
                  <option>Hosting Clients</option>
                  <option>Digital Marketing Clients</option>
                  <option>Print & Sign Clients</option>
                  <option>Construction Clients</option>
                  <option>VIP Clients</option>
                </select>
              </div>
            </div>

            <div className="table-actions">
              <button className="green-btn" onClick={saveUserChanges} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              <button className="view-btn" onClick={() => resetPassword(editingUser.id, editingUser.email)}>Reset Password</button>
              <button className="delete-btn" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading users...</p>
        ) : (
          <>
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Segment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersPagination.paged.length === 0 ? (
                  <tr><td colSpan="7" style={{ color: "#64748b", textAlign: "center" }}>No users found.</td></tr>
                ) : (
                  usersPagination.paged.map((user) => (
                    <tr key={user.id}>
                      <td data-label="Name">{user.fullName || "N/A"}</td>
                      <td data-label="Business">{user.businessName || "—"}</td>
                      <td data-label="Email"><span className="users-table-email">{user.email}</span></td>
                      <td data-label="Role">
                        <span style={{ background: roleBadgeColor(user.role), color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                          {user.role}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span style={{ color: user.status === "ACTIVE" ? "#0E9F6E" : "#ef4444" }}>
                          {user.status}
                        </span>
                      </td>
                      <td data-label="Segment">{user.segment || "General"}</td>
                      <td>
                        <div className="table-actions">
                          <button className="view-btn" onClick={() => { setSelectedUser(user); setPage("User Details"); }}>View</button>
                          <button className="view-btn" onClick={() => { setEditingUser(user); setEditRole(user.role || "CLIENT"); setEditStatus(user.status || "ACTIVE"); setEditSegment(user.segment || "General"); }}>Edit</button>
                          <button className="delete-btn" onClick={() => resetPassword(user.id, user.email)}>Reset Pwd</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...usersPagination} onPageChange={usersPagination.setPage} />
          </>
        )}
      </section>
    </div>
  );
}
