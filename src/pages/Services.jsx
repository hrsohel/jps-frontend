import React, { useEffect, useState } from "react";
import { ArrowRight, Phone, CheckCircle2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { apiGet } from "../lib/api";

const STATIC_GROUPS = [
  {
    key: "Website Services",
    description: "Professional website design, app development, hosting and maintenance.",
    image: "/assets/premium-web-design-showcase-01.png",
    addons: ["E-Commerce Store", "Business Website", "Mobile App Development", "Website Maintenance"],
  },
  {
    key: "Digital Marketing",
    description: "SEO, advertising, social media management and lead management.",
    image: "/assets/digital-marketing.jpg",
    addons: ["SEO Package", "Social Media Management", "Google & Meta Ads", "Email Marketing"],
  },
  {
    key: "Branding & Signs",
    description: "Store signs, apparel branding, vehicle graphics, yard signs and promotional products.",
    image: "/assets/branding-signs.jpg",
    addons: ["Logo & Brand Identity", "Vehicle Graphics", "Yard Signs & Banners", "Apparel Branding"],
  },
  {
    key: "IT & Business Solutions",
    description: "Technology support, automation, CRM and business systems.",
    image: "/assets/ecommerce-shopping-experience-male.png",
    addons: ["IT Support & Helpdesk", "CRM Setup", "Business Automation", "Network Solutions"],
  },
];

export default function Services({ setPage }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const [groupData, serviceData] = await Promise.all([
        apiGet("/service-catalog/groups").catch(() => []),
        apiGet("/service-catalog/services").catch(() => []),
      ]);

      const groupMap = {};
      if (Array.isArray(groupData)) {
        groupData.forEach((g) => { groupMap[g.id] = { ...g, allServices: [] }; });
      }
      if (Array.isArray(serviceData)) {
        serviceData.forEach((s) => {
          if (groupMap[s.serviceGroupId]) groupMap[s.serviceGroupId].allServices.push(s);
        });
      }
      setGroups(Object.values(groupMap));
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  // Merge API data with static fallbacks
  const displayGroups = STATIC_GROUPS.map((sg) => {
    const apiGroup = groups.find((g) => g.name === sg.key);
    const apiAddons = apiGroup?.allServices?.filter((s) => s.isActive !== false).slice(0, 4) || [];
    return {
      id: apiGroup?.id || sg.key,
      name: sg.key,
      description: apiGroup?.description || sg.description,
      image: apiGroup?.imageUrl || sg.image,
      addons: apiAddons.length >= 2 ? apiAddons.map((s) => s.title) : sg.addons,
    };
  });

  return (
    <div>
      <PageHeader
        title="Our Services"
        description="Professional solutions built for businesses that want to grow. Choose a service to get started."
        actions={
          <button className="green-btn" onClick={() => setPage && setPage("Request Service")}>
            Request Service
          </button>
        }
      />

      {/* ── How It Works ── */}
      <div className="hiw-section">
        <h2 className="hiw-title">How It Works</h2>
        <p className="hiw-subtitle">From sign-up to delivery — here's what to expect when you work with JPS Core.</p>
        <div className="hiw-steps">
          {[
            { n: "01", title: "Register",               desc: "Create your free account." },
            { n: "02", title: "Submit Request",          desc: "Tell us what you need." },
            { n: "03", title: "Project Review",          desc: "We review and discuss your goals." },
            { n: "04", title: "Approve Proposal",        desc: "Review and approve pricing." },
            { n: "05", title: "Project Execution",       desc: "Our team gets to work." },
            { n: "06", title: "Delivery & Support",      desc: "Receive your project and ongoing support." },
          ].map(({ n, title, desc }, i, arr) => (
            <React.Fragment key={n}>
              <div className="hiw-step">
                <div className="hiw-num">{n}</div>
                <div className="hiw-step-body">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
              {i < arr.length - 1 && <div className="hiw-connector" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="panel"><p style={{ color: "var(--muted)" }}>Loading services...</p></div>
      ) : (
        <div className="svc-page-grid">
          {displayGroups.map((group) => (
            <div key={group.id} className="svc-group-card">
              {/* Card image */}
              {group.image && (
                <div className="svc-group-img-wrap">
                  <img src={group.image} alt={group.name} className="svc-group-img" />
                  <div className="svc-group-img-overlay" />
                </div>
              )}

              {/* Card body */}
              <div className="svc-group-body">
                <h2 className="svc-group-title">{group.name}</h2>
                <p className="svc-group-desc">{group.description}</p>

                {/* Action buttons */}
                <div className="svc-group-btns">
                  <button
                    className="svc-btn-primary"
                    onClick={() => setPage && setPage("Request Service")}
                  >
                    <ArrowRight size={16} />
                    Request Service
                  </button>
                  <button
                    className="svc-btn-secondary"
                    onClick={() => setPage && setPage("Appointments")}
                  >
                    <Phone size={15} />
                    Connect Live
                  </button>
                </div>

                {/* Featured addons — 2×2 grid */}
                {group.addons.length > 0 && (
                  <div className="svc-addons-grid">
                    {group.addons.slice(0, 4).map((addon) => (
                      <div key={addon} className="svc-addon-chip">
                        <CheckCircle2 size={14} />
                        {addon}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
