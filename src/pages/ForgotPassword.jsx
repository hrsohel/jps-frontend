import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

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
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to process request. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      {/* ── Left branding panel ── */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <img
            src="/assets/JPS%20Core-2.png"
            alt="JPS Core"
            className="auth-logo"
          />
          <h1 className="auth-brand-headline">
            Reset Your<br />Password
          </h1>
          <p className="auth-brand-sub">
            Enter your registered email and we'll send you a secure link to reset your password.
          </p>
          <ul className="auth-features">
            {["Build Websites & Apps", "Print & Brand Your Business", "Market Your Services Online", "Get Reliable IT Solutions", "Connect with Experts 24/7"].map((f) => (
              <li key={f}>
                <CheckCircle2 size={18} />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Mail size={28} color="#0E9F6E" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 10 }}>Check your inbox</h2>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                If <strong>{email}</strong> is registered, a password reset link has been sent. Check your inbox and spam folder.
              </p>
              <button className="auth-submit" onClick={() => setPage("Login")}>
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <h2>Forgot Password?</h2>
                <p>We'll send a reset link to your email</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="auth-error">{error}</div>}

                <div className="auth-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : "Send Reset Link"}
                </button>
              </form>

              <p className="auth-switch">
                Remember your password?{" "}
                <button type="button" className="auth-switch-link" onClick={() => setPage("Login")}>
                  Back to Login
                </button>
              </p>
            </>
          )}

          <p className="auth-copyright">
            © {new Date().getFullYear()} JPS Core. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
