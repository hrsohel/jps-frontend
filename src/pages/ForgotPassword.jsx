import { useState } from "react";

export default function ForgotPassword({ setPage }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      setSent(true);
    } catch (err) {
      setError("Unable to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send you a reset link.</p>
        </div>

        {sent ? (
          <div>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #0E9F6E",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
                color: "#0E9F6E",
              }}
            >
              If that email is registered, a password reset link has been sent. Please check your inbox.
            </div>

            <button
              className="primary-btn"
              onClick={() => setPage("Login")}
            >
              Back to Login
            </button>
          </div>
        ) : (
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button className="primary-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

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
