import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiGet, apiPost, apiDelete } from "../lib/api";

export default function AdminServicesPage() {
  const [groups, setGroups] = useState([]);
  const [services, setServices] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceGroupId, setServiceGroupId] = useState("");
  const [serviceFeatured, setServiceFeatured] = useState(false);
  const [serviceImage, setServiceImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroups();
    loadServices();
  }, []);

  async function loadGroups() {
    try {
      const data = await apiGet("/service-catalog/groups");
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadServices() {
    try {
      const data = await apiGet("/service-catalog/services");
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function createGroup() {
    if (!groupName.trim()) {
      alert("Group name is required");
      return;
    }

    try {
      setSaving(true);
      await apiPost("/service-catalog/groups", {
        name: groupName,
        description: groupDescription,
        imageUrl: groupImage,
        displayOrder: groups.length + 1,
      });

      setGroupName("");
      setGroupDescription("");
      setGroupImage("");
      await loadGroups();
      alert("Service Group Created");
    } catch (error) {
      alert(error.message || "Unable to create group");
    } finally {
      setSaving(false);
    }
  }

  async function createService() {
    if (!serviceGroupId) {
      alert("Please select a Service Group");
      return;
    }
    if (!serviceTitle.trim()) {
      alert("Service title is required");
      return;
    }

    try {
      setSaving(true);
      await apiPost("/service-catalog/services", {
        serviceGroupId: Number(serviceGroupId),
        title: serviceTitle,
        description: serviceDescription,
        startingPrice: Number(servicePrice || 0),
        featured: serviceFeatured,
        imageUrl: serviceImage,
        displayOrder: services.length + 1,
      });

      setServiceTitle("");
      setServiceDescription("");
      setServicePrice("");
      setServiceGroupId("");
      setServiceFeatured(false);
      setServiceImage("");
      await loadServices();
      await loadGroups();
      alert("Service created successfully");
    } catch (error) {
      alert(error.message || "Unable to create service");
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(id) {
    if (!confirm("Delete this service?")) return;
    try {
      await apiDelete(`/service-catalog/services/${id}`);
      await loadServices();
    } catch (error) {
      alert(error.message || "Unable to delete service");
    }
  }

  async function deleteGroup(id) {
    if (!confirm("Delete this service group? All services in this group will also be deleted.")) return;
    try {
      await apiDelete(`/service-catalog/groups/${id}`);
      await loadGroups();
      await loadServices();
    } catch (error) {
      alert(error.message || "Unable to delete group");
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin Services"
        description="Manage service groups, quick add-on services, pricing, and display order."
      />

      <section className="panel">
        <h2>Create Service</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Service Group *</label>
            <select
              value={serviceGroupId}
              onChange={(e) => setServiceGroupId(e.target.value)}
            >
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="Starter Website"
            />
          </div>

          <div className="form-group">
            <label>Starting Price ($)</label>
            <input
              type="number"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              placeholder="300"
            />
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              value={serviceImage}
              onChange={(e) => setServiceImage(e.target.value)}
              placeholder="/assets/services/starter-website.jpg"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            rows="3"
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <input
            type="checkbox"
            checked={serviceFeatured}
            onChange={(e) => setServiceFeatured(e.target.checked)}
          />
          Featured Service (shown on dashboard)
        </label>

        <button className="green-btn" onClick={createService} disabled={saving}>
          {saving ? "Creating..." : "Create Service"}
        </button>
      </section>

      <section className="panel">
        <h2>Create Service Group</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Group Name *</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Website Services"
            />
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              value={groupImage}
              onChange={(e) => setGroupImage(e.target.value)}
              placeholder="/assets/services/website-services.jpg"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            rows="2"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
          />
        </div>

        <button className="view-btn" onClick={createGroup} disabled={saving}>
          {saving ? "Creating..." : "Create Group"}
        </button>
      </section>

      <section className="panel">
        <h2>Service Groups ({groups.length})</h2>

        {groups.length === 0 ? (
          <p style={{ color: "#64748b" }}>No service groups yet.</p>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="row">
              <div>
                <strong>{group.name}</strong>
                <br />
                <small style={{ color: "#64748b" }}>{group.description}</small>
                <br />
                <small style={{ color: "#64748b" }}>{group.services?.length || 0} services</small>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <small>Order: {group.displayOrder}</small>
                <button className="delete-btn" onClick={() => deleteGroup(group.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="panel">
        <h2>Services ({services.length})</h2>

        {services.length === 0 ? (
          <p style={{ color: "#64748b" }}>No services yet.</p>
        ) : (
          services.map((service) => (
            <div key={service.id} className="row">
              <div>
                <strong>{service.title}</strong>
                <br />
                <small style={{ color: "#64748b" }}>
                  {service.serviceGroup?.name} &bull; ${service.startingPrice}
                  {service.featured && " &bull; ⭐ Featured"}
                </small>
              </div>
              <button className="delete-btn" onClick={() => deleteService(service.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
