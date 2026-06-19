import { useState } from "react";

export default function Login({ setPage, setUser }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setPage("Dashboard");
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
          <h1>Welcome Back</h1>
          <p>Sign in and start building your business growth</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                padding: "12px",
                color: "#dc2626",
                marginBottom: "12px",
              }}
            >
              {error}
            </div>
          )}

          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "View"}
              </button>
            </div>
          </label>

          <button
            type="button"
            className="link-button"
            style={{ textAlign: "left" }}
            onClick={() => setPage("Forgot Password")}
          >
            Forgot Password?
          </button>

          <button className="primary-btn" disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account?</p>
          <button
            type="button"
            className="link-button"
            onClick={() => setPage("Create Account")}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
