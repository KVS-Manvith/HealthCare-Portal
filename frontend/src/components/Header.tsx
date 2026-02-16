import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutFromServer } from "../services/api";
import { clearCurrentUser, getCurrentUser } from "../utils/auth";

export default function Header() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutFromServer();
    } catch {
      // Ignore network errors and still clear local session.
    }
    clearCurrentUser();
    navigate("/", { replace: true });
  }

  return (
    <header style={{ background: "#3b5fd6", padding: "12px 20px", color: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="fas fa-heartbeat" style={{ fontSize: 22 }} />
          <Link to="/dashboard" style={{ color: "white", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
            HealthCare+
          </Link>
        </div>

        {user ? (
          <>
            <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/appointments" style={{ color: "white", textDecoration: "none" }}>Book</Link>
              <Link to="/my-appointments" style={{ color: "white", textDecoration: "none" }}>My Appointments</Link>
              <Link to="/doctors" style={{ color: "white", textDecoration: "none" }}>Doctors</Link>
              <Link to="/hospitals" style={{ color: "white", textDecoration: "none" }}>Hospitals</Link>
              {user.role === "ADMIN" && (
                <>
                  <Link to="/admin/appointments" style={{ color: "white", textDecoration: "none" }}>Admin Appointments</Link>
                  <Link to="/admin/hospitals" style={{ color: "white", textDecoration: "none" }}>Admin Hospitals</Link>
                  <Link to="/admin/doctors" style={{ color: "white", textDecoration: "none" }}>Admin Doctors</Link>
                </>
              )}
              <Link to="/profile" style={{ color: "white", textDecoration: "none" }}>Profile</Link>
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>{user.fullName || user.email}</span>
              <button onClick={handleLogout} style={{ padding: "8px 12px", borderRadius: 20, border: "none", cursor: "pointer" }}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link to="/" style={{ color: "white", textDecoration: "none" }}>Login</Link>
            <Link to="/register" style={{ color: "white", textDecoration: "none" }}>Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}
