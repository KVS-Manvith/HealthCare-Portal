import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { setCurrentUser } from "../utils/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const auth = await login(email.trim(), password);
      setCurrentUser({ ...auth.user, token: auth.token, refreshToken: auth.refreshToken });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form-container" id="loginFormContainer">
        <div className="logo">
          <i className="fas fa-heartbeat logo-icon" />
          <span className="logo-text">HealthCare+</span>
        </div>

        <h2>Login to Your Account</h2>

        <form onSubmit={handleSubmit} id="loginForm">
          {error && <p id="loginError" className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <input id="loginPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="submit-btn">{loading ? "Logging in..." : "Login"}</button>
        </form>

        <p className="auth-toggle">
          Don&apos;t have an account? <Link to="/register" id="showSignUpLink">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
