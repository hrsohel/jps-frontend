import { useState } from "react";

export default function ResetPassword({ setPage, resetToken }) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.newPassword || form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError("Invalid or missing reset token.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, newPassword: form.newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }

      alert("Password reset successfully! Please log in with your new password.");
      setPage("Login");
    } catch (err) {
      setError("Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your new password below.</p>
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
            New Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
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

          <label>
            Confirm New Password
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </label>

          <button className="primary-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => setPage("Login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
