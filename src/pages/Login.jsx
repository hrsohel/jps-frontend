import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const features = [
  "Build Websites & Apps",
  "Print & Brand Your Business",
  "Market Your Services Online",
  "Get Reliable IT Solutions",
  "Connect with Experts 24/7",
];

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
            Your Business,<br />Our Priority.
          </h1>
          <p className="auth-brand-sub">
            The all-in-one client portal built for businesses that want to grow with confidence.
          </p>
          <ul className="auth-features">
            {features.map((f) => (
              <li key={f}>
                <CheckCircle2 size={18} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* decorative blobs */}
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>Welcome Back</h2>
            <p>Sign in and start growing your business</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label>Password</label>
                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() => setPage("Forgot Password")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => setPage("Create Account")}
            >
              Create Account
            </button>
          </p>

          <p className="auth-copyright">
            © {new Date().getFullYear()} JPS Support Services. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
