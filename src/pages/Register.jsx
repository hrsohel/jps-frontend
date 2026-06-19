import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function Register({ setPage }) {
  const [form, setForm] = useState({
    businessName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password) {
      setError("Full name, email, and password are required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      alert("Account created successfully! You can now log in.");
      setPage("Login");
    } catch (error) {
      console.error(error);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Create your JPS Client Portal account to manage projects, files, invoices, and support requests.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", padding: "12px", color: "#dc2626", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          <label>
            Business Name
            <input
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Optional"
            />
          </label>

          <label>
            Full Name *
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </label>

          <label>
            Email Address *
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label>
            Phone Number
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>

          <label>
            Password *
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "View"}
              </button>
            </div>
          </label>

          <label>
            Confirm Password *
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </label>

          <button className="primary-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <button type="button" className="link-button" onClick={() => setPage("Login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
