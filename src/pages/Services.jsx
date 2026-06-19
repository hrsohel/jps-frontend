import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiGet } from "../lib/api";

export default function Services({ setPage }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const data = await apiGet("/service-catalog/groups");
      // Include ALL services (not just featured) for the services page
      const groupsWithServices = await apiGet("/service-catalog/services");

      // Map services to their groups
      const groupMap = {};
      if (Array.isArray(data)) {
        data.forEach((g) => { groupMap[g.id] = { ...g, allServices: [] }; });
      }
      if (Array.isArray(groupsWithServices)) {
        groupsWithServices.forEach((s) => {
          if (groupMap[s.serviceGroupId]) {
            groupMap[s.serviceGroupId].allServices.push(s);
          }
        });
      }

      setGroups(Object.values(groupMap));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const staticImages = {
    "Website Services": "/assets/services/website-services.jpg",
    "Digital Marketing": "/assets/services/digital-marketing.jpg",
    "Branding & Signs": "/assets/services/branding-signs.jpg",
    "IT & Business Solutions": "/assets/services/IT-Solutions.jpg",
  };

  return (
    <div>
      <PageHeader
        title="Services"
        description="Explore our digital, marketing, branding, and IT solutions. Submit service requests and schedule consultations."
        actions={
          <button className="green-btn" onClick={() => setPage && setPage("Request Service")}>
            Request Service
          </button>
        }
      />

      {loading ? (
        <div className="panel"><p style={{ color: "#64748b" }}>Loading services...</p></div>
      ) : groups.length === 0 ? (
        <section className="panel">
          <h2>Available Services</h2>
          <p>Browse our service categories and submit a request to get started.</p>
          <div className="service-grid">
            {["Website Services", "Digital Marketing", "Branding & Signs", "IT & Business Solutions"].map((name) => (
              <div key={name} className="service-card">
                {staticImages[name] && <img src={staticImages[name]} alt={name} style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }} />}
                <h3>{name}</h3>
                <button className="view-btn" onClick={() => setPage && setPage("Request Service")}>Request Service</button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2>{group.name}</h2>
                {group.description && <p style={{ color: "#64748b" }}>{group.description}</p>}
              </div>
              <button className="green-btn" onClick={() => setPage && setPage("Request Service")}>
                Request Service
              </button>
            </div>

            {group.allServices && group.allServices.length > 0 ? (
              <div className="addon-grid">
                {group.allServices.map((service) => (
                  <div key={service.id} className="addon-card">
                    {service.featured && (
                      <span style={{ background: "#f59e0b", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", marginBottom: "8px", display: "inline-block" }}>
                        ⭐ Featured
                      </span>
                    )}
                    <h3>{service.title}</h3>
                    {service.description && <p>{service.description}</p>}
                    {service.startingPrice > 0 && (
                      <strong>Starting at ${service.startingPrice}</strong>
                    )}
                    <button className="view-btn" onClick={() => setPage && setPage("Request Service")}>
                      Request
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#64748b" }}>No services listed yet for this category.</p>
            )}
          </section>
        ))
      )}

      <section className="panel">
        <h2>How It Works</h2>
        <p>Every service follows a simple process designed to keep your project organized.</p>
        {["1. Request Service", "2. Upload Files & Requirements", "3. Consultation & Review", "4. Project Execution", "5. Delivery & Support"].map((step) => (
          <div key={step} className="row"><span>{step}</span></div>
        ))}
      </section>
    </div>
  );
}
