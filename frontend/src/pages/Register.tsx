import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../services/api";
import { setCurrentUser } from "../utils/auth";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill all required fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const auth = await apiRegister({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        dob: dob || null,
      });
      setCurrentUser({ ...auth.user, token: auth.token, refreshToken: auth.refreshToken });
      setSuccess("Registration successful. Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
    } catch (err: any) {
      setError(err?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form-container" id="signUpFormContainer">
        <div className="logo">
          <i className="fas fa-heartbeat logo-icon" />
          <span className="logo-text">HealthCare+</span>
        </div>

        <h2>Create an Account</h2>

        <form onSubmit={handleSubmit} id="signUpForm">
          {error && <p id="signUpError" className="error-message">{error}</p>}
          {success && <div className="success" style={{ marginBottom: 12 }}>{success}</div>}

          <div className="form-group">
            <label htmlFor="signUpName">Full Name</label>
            <input id="signUpName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="signUpDob">Date of Birth</label>
            <input id="signUpDob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="signUpEmail">Email</label>
            <input id="signUpEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="signUpPassword">Password</label>
            <input id="signUpPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-toggle">
          Already have an account? <Link to="/" id="showLoginLink">Login</Link>
        </p>
      </div>
    </div>
  );
}
