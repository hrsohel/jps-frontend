import React from "react";

export default function AdminDashboard() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Manage customers, service requests, projects, invoices,
            services, marketing, and system settings.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Service Requests</h3>
          <strong>0</strong>
        </div>

        <div className="stat-card">
          <h3>Projects</h3>
          <strong>0</strong>
        </div>

        <div className="stat-card">
          <h3>Invoices</h3>
          <strong>0</strong>
        </div>

        <div className="stat-card">
          <h3>Customers</h3>
          <strong>0</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Administration</h2>

        <div className="service-grid">
          <div className="service-card">
            <h3>Users</h3>
            <p>Create and manage portal users.</p>
          </div>

          <div className="service-card">
            <h3>Services</h3>
            <p>Manage service groups and catalog items.</p>
          </div>

          <div className="service-card">
            <h3>Projects</h3>
            <p>Track project delivery and status.</p>
          </div>

          <div className="service-card">
            <h3>Invoices</h3>
            <p>Manage billing and payments.</p>
          </div>

          <div className="service-card">
            <h3>Email Campaigns</h3>
            <p>Send marketing communications.</p>
          </div>

          <div className="service-card">
            <h3>Settings</h3>
            <p>Manage system configuration.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
