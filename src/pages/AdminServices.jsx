import React, { useEffect, useState } from "react";
import { Star, Pencil, Trash2, Check, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { apiGet, apiPost, apiDelete, apiPut } from "../lib/api";

const BLANK_GROUP = { name: "", description: "", imageUrl: "", featured: false, isActive: true, displayOrder: 0 };
const BLANK_SERVICE = { title: "", description: "", startingPrice: "", imageUrl: "", featured: false, isActive: true, serviceGroupId: "" };

export default function AdminServicesPage() {
  const [groups, setGroups] = useState([]);
  const [services, setServices] = useState([]);

  // Create forms
  const [newGroup, setNewGroup] = useState(BLANK_GROUP);
  const [newService, setNewService] = useState(BLANK_SERVICE);
  const [saving, setSaving] = useState(false);

  // Inline edit state
  const [editGroupId, setEditGroupId] = useState(null);
  const [editGroupData, setEditGroupData] = useState({});
  const [editServiceId, setEditServiceId] = useState(null);
  const [editServiceData, setEditServiceData] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [g, s] = await Promise.all([
      apiGet("/service-catalog/groups").catch(() => []),
      apiGet("/service-catalog/services").catch(() => []),
    ]);
    setGroups(Array.isArray(g) ? g : []);
    setServices(Array.isArray(s) ? s : []);
  }

  // ── Create ──────────────────────────────────────
  async function createGroup() {
    if (!newGroup.name.trim()) { alert("Group name is required"); return; }
    try {
      setSaving(true);
      await apiPost("/service-catalog/groups", { ...newGroup, displayOrder: groups.length + 1 });
      setNewGroup(BLANK_GROUP);
      await loadAll();
    } catch (e) { alert(e.message || "Unable to create group"); }
    finally { setSaving(false); }
  }

  async function createService() {
    if (!newService.serviceGroupId) { alert("Please select a Service Group"); return; }
    if (!newService.title.trim()) { alert("Service title is required"); return; }
    try {
      setSaving(true);
      await apiPost("/service-catalog/services", {
        ...newService,
        serviceGroupId: Number(newService.serviceGroupId),
        startingPrice: Number(newService.startingPrice || 0),
        displayOrder: services.length + 1,
      });
      setNewService(BLANK_SERVICE);
      await loadAll();
    } catch (e) { alert(e.message || "Unable to create service"); }
    finally { setSaving(false); }
  }

  // ── Edit groups ──────────────────────────────────
  function startEditGroup(group) {
    setEditGroupId(group.id);
    setEditGroupData({
      name: group.name || "",
      description: group.description || "",
      imageUrl: group.imageUrl || "",
      featured: group.featured ?? false,
      isActive: group.isActive ?? true,
      displayOrder: group.displayOrder ?? 0,
    });
  }

  async function saveGroup() {
    if (!editGroupData.name.trim()) { alert("Group name is required"); return; }
    try {
      setEditSaving(true);
      await apiPut(`/service-catalog/groups/${editGroupId}`, editGroupData);
      setEditGroupId(null);
      await loadAll();
    } catch (e) { alert(e.message || "Unable to save group"); }
    finally { setEditSaving(false); }
  }

  // ── Edit services ────────────────────────────────
  function startEditService(svc) {
    setEditServiceId(svc.id);
    setEditServiceData({
      title: svc.title || "",
      description: svc.description || "",
      startingPrice: svc.startingPrice ?? "",
      imageUrl: svc.imageUrl || "",
      featured: svc.featured ?? false,
      isActive: svc.isActive ?? true,
      serviceGroupId: svc.serviceGroupId ?? "",
    });
  }

  async function saveService() {
    if (!editServiceData.title.trim()) { alert("Service title is required"); return; }
    try {
      setEditSaving(true);
      await apiPut(`/service-catalog/services/${editServiceId}`, {
        ...editServiceData,
        startingPrice: Number(editServiceData.startingPrice || 0),
      });
      setEditServiceId(null);
      await loadAll();
    } catch (e) { alert(e.message || "Unable to save service"); }
    finally { setEditSaving(false); }
  }

  // ── Delete ───────────────────────────────────────
  async function deleteGroup(id) {
    if (!confirm("Delete this group and all its services?")) return;
    try { await apiDelete(`/service-catalog/groups/${id}`); await loadAll(); }
    catch (e) { alert(e.message || "Unable to delete group"); }
  }

  async function deleteService(id) {
    if (!confirm("Delete this service?")) return;
    try { await apiDelete(`/service-catalog/services/${id}`); await loadAll(); }
    catch (e) { alert(e.message || "Unable to delete service"); }
  }

  return (
    <div>
      <PageHeader
        title="Admin Services"
        description="Manage service groups and services — edit, feature, or delete any entry."
      />

      {/* ── Create Service ── */}
      <section className="panel">
        <h2 style={{ marginBottom: 16 }}>Create Service</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Service Group *</label>
            <select value={newService.serviceGroupId} onChange={(e) => setNewService({ ...newService, serviceGroupId: e.target.value })}>
              <option value="">Select group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Title *</label>
            <input value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} placeholder="Starter Website" />
          </div>
          <div className="form-group">
            <label>Starting Price ($)</label>
            <input type="number" value={newService.startingPrice} onChange={(e) => setNewService({ ...newService, startingPrice: e.target.value })} placeholder="300" />
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input value={newService.imageUrl} onChange={(e) => setNewService({ ...newService, imageUrl: e.target.value })} placeholder="/assets/..." />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows="2" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
        </div>
        <label className="check-label">
          <input type="checkbox" checked={newService.featured} onChange={(e) => setNewService({ ...newService, featured: e.target.checked })} />
          Featured Service (shown on dashboard)
        </label>
        <button className="green-btn" onClick={createService} disabled={saving}>{saving ? "Creating..." : "Create Service"}</button>
      </section>

      {/* ── Create Group ── */}
      <section className="panel">
        <h2 style={{ marginBottom: 16 }}>Create Service Group</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Group Name *</label>
            <input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Website Services" />
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input value={newGroup.imageUrl} onChange={(e) => setNewGroup({ ...newGroup, imageUrl: e.target.value })} placeholder="/assets/..." />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows="2" value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} />
        </div>
        <label className="check-label">
          <input type="checkbox" checked={newGroup.featured} onChange={(e) => setNewGroup({ ...newGroup, featured: e.target.checked })} />
          Featured Group (shown on dashboard &amp; services page)
        </label>
        <button className="view-btn" onClick={createGroup} disabled={saving}>{saving ? "Creating..." : "Create Group"}</button>
      </section>

      {/* ── Service Groups list ── */}
      <section className="panel">
        <h2 style={{ marginBottom: 16 }}>Service Groups ({groups.length})</h2>
        {groups.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No service groups yet.</p>
        ) : groups.map((group) => (
          <div key={group.id}>
            {editGroupId === group.id ? (
              /* ── Inline edit form ── */
              <div className="admin-edit-row">
                <div className="form-grid" style={{ marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Group Name *</label>
                    <input value={editGroupData.name} onChange={(e) => setEditGroupData({ ...editGroupData, name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Image URL</label>
                    <input value={editGroupData.imageUrl} onChange={(e) => setEditGroupData({ ...editGroupData, imageUrl: e.target.value })} placeholder="/assets/..." />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Display Order</label>
                    <input type="number" value={editGroupData.displayOrder} onChange={(e) => setEditGroupData({ ...editGroupData, displayOrder: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Description</label>
                  <textarea rows="2" value={editGroupData.description} onChange={(e) => setEditGroupData({ ...editGroupData, description: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                  <label className="check-label" style={{ margin: 0 }}>
                    <input type="checkbox" checked={editGroupData.featured} onChange={(e) => setEditGroupData({ ...editGroupData, featured: e.target.checked })} />
                    Featured
                  </label>
                  <label className="check-label" style={{ margin: 0 }}>
                    <input type="checkbox" checked={editGroupData.isActive} onChange={(e) => setEditGroupData({ ...editGroupData, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="green-btn" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={saveGroup} disabled={editSaving}>
                    <Check size={15} />{editSaving ? "Saving..." : "Save"}
                  </button>
                  <button className="view-btn" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => setEditGroupId(null)}>
                    <X size={15} />Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Normal row ── */
              <div className="row">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <strong>{group.name}</strong>
                    {group.featured && (
                      <span className="badge badge-yellow" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                    {!group.isActive && <span className="badge badge-red">Inactive</span>}
                  </div>
                  <small style={{ color: "var(--muted)" }}>{group.description || "No description"}</small>
                  <br />
                  <small style={{ color: "var(--muted)" }}>{group.services?.length || 0} services &bull; Order: {group.displayOrder}</small>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <button className="icon-action-btn" title="Edit" onClick={() => startEditGroup(group)}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-action-btn danger" title="Delete" onClick={() => deleteGroup(group.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── Services list ── */}
      <section className="panel">
        <h2 style={{ marginBottom: 16 }}>Services ({services.length})</h2>
        {services.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No services yet.</p>
        ) : services.map((svc) => (
          <div key={svc.id}>
            {editServiceId === svc.id ? (
              /* ── Inline edit form ── */
              <div className="admin-edit-row">
                <div className="form-grid" style={{ marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Title *</label>
                    <input value={editServiceData.title} onChange={(e) => setEditServiceData({ ...editServiceData, title: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Service Group</label>
                    <select value={editServiceData.serviceGroupId} onChange={(e) => setEditServiceData({ ...editServiceData, serviceGroupId: Number(e.target.value) })}>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Starting Price ($)</label>
                    <input type="number" value={editServiceData.startingPrice} onChange={(e) => setEditServiceData({ ...editServiceData, startingPrice: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Image URL</label>
                    <input value={editServiceData.imageUrl} onChange={(e) => setEditServiceData({ ...editServiceData, imageUrl: e.target.value })} placeholder="/assets/..." />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Description</label>
                  <textarea rows="2" value={editServiceData.description} onChange={(e) => setEditServiceData({ ...editServiceData, description: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                  <label className="check-label" style={{ margin: 0 }}>
                    <input type="checkbox" checked={editServiceData.featured} onChange={(e) => setEditServiceData({ ...editServiceData, featured: e.target.checked })} />
                    Featured
                  </label>
                  <label className="check-label" style={{ margin: 0 }}>
                    <input type="checkbox" checked={editServiceData.isActive} onChange={(e) => setEditServiceData({ ...editServiceData, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="green-btn" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={saveService} disabled={editSaving}>
                    <Check size={15} />{editSaving ? "Saving..." : "Save"}
                  </button>
                  <button className="view-btn" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => setEditServiceId(null)}>
                    <X size={15} />Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Normal row ── */
              <div className="row">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <strong>{svc.title}</strong>
                    {svc.featured && (
                      <span className="badge badge-yellow" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                    {!svc.isActive && <span className="badge badge-red">Inactive</span>}
                  </div>
                  <small style={{ color: "var(--muted)" }}>
                    {svc.serviceGroup?.name} &bull; ${Number(svc.startingPrice || 0).toFixed(2)}
                    {svc.description && ` — ${svc.description.slice(0, 60)}${svc.description.length > 60 ? "…" : ""}`}
                  </small>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <button className="icon-action-btn" title="Edit" onClick={() => startEditService(svc)}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-action-btn danger" title="Delete" onClick={() => deleteService(svc.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
