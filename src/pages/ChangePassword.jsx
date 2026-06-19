import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiPatch } from "../lib/api";

export default function ChangePassword({ user }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await apiPatch("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setError(error.message || "Unable to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Change Password"
        description="Update your account password."
      />

      <section className="panel">
        <h2>Change Password</h2>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              padding: "12px",
              color: "#dc2626",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #0E9F6E",
              borderRadius: "8px",
              padding: "12px",
              color: "#0E9F6E",
              marginBottom: "16px",
            }}
          >
            Password changed successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>

          <button type="submit" className="green-btn" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
