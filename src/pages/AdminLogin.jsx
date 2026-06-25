import React, { useState } from "react";

export default function AdminLogin({ setAdminLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (email === "admin@jpscoreinc.com" && password === "admin123") {
      localStorage.setItem("adminLoggedIn", "true");
      setAdminLoggedIn(true);
      return;
    }

    alert("Invalid admin login");
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>Admin Login</h1>
        <p>Access the JPS Core admin dashboard.</p>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="green-btn" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
