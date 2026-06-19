import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiPost } from "../lib/api";

const TICKET_CATEGORIES = [
  { label: "Website Support", value: "Website Support" },
  { label: "IT Support", value: "IT & Business Solutions" },
  { label: "Billing Help", value: "Billing Help" },
  { label: "Digital Marketing", value: "Digital Marketing" },
  { label: "Branding & Signs", value: "Branding & Signs" },
  { label: "General Request", value: "General Request" },
];

export default function Tickets({ user }) {
  const [form, setForm] = useState({
    category: "",
    subject: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.category || !form.subject || !form.description) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);

      // Submit as a service request (uses existing backend)
      await apiPost("/service-requests", {
        serviceGroup: form.category,
        projectTitle: form.subject,
        businessName: user?.businessName || user?.fullName || "Portal User",
        contactName: user?.fullName || "Portal User",
        email: user?.email || "",
        description: form.description,
      });

      setSubmitted(true);
      setForm({ category: "", subject: "", description: "" });
    } catch (err) {
      setError(err.message || "Unable to submit ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        description="Submit support requests, track issue resolution, and communicate directly with the JPS team."
        actions={<button className="green-btn" onClick={() => setSubmitted(false)}>Open Ticket</button>}
      />

      <section className="panel">
        <h2>Open a Support Ticket</h2>
        <p>Report website issues, IT problems, billing concerns, marketing updates, or service-related questions.</p>

        {submitted ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #0E9F6E", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
            <h3 style={{ color: "#0E9F6E" }}>Ticket Submitted!</h3>
            <p>Your support request has been submitted. Our team will review it shortly and reach out to you.</p>
            <button className="green-btn" style={{ marginTop: "12px" }} onClick={() => setSubmitted(false)}>
              Submit Another Ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", padding: "12px", color: "#dc2626", marginBottom: "16px" }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label>Support Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows="5"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue in detail. Include steps to reproduce, error messages, or any relevant information..."
                required
              />
            </div>

            <button type="submit" className="green-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        )}
      </section>

      <section className="panel">
        <h2>Support Information</h2>
        <p>For urgent issues, you can also reach us directly:</p>

        <div className="row"><span>Email</span><small>support@jpssupport.com</small></div>
        <div className="row"><span>Phone</span><small>Contact via portal message or email</small></div>
        <div className="row"><span>Response Time</span><small>Within 1 business day</small></div>
      </section>
    </div>
  );
}
