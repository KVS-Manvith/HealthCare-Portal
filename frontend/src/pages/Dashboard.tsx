import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getCurrentUser } from "../utils/auth";

export default function Dashboard() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div>
      <Header />
      <main style={{ padding: "40px 20px", maxWidth: 1200, margin: "0 auto" }}>
        <section className="welcome-section" style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 36, color: "#fff", marginBottom: 10 }}>Healthcare Services</h1>
          <p style={{ color: "#b0c4de", maxWidth: 800 }}>
            Your healthcare management space for appointments, doctors, hospitals, and profile details.
          </p>
        </section>

        <section className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
          <Link to="/appointments" className="service-card" style={{ textDecoration: "none" }}>
            <div style={{ padding: 30 }}>
              <div className="service-icon"><i className="fas fa-calendar-check" /></div>
              <h3 style={{ color: "#fff", marginTop: 16 }}>Book Appointment</h3>
              <p style={{ color: "#b0c4de" }}>Book a new consultation with a doctor.</p>
            </div>
          </Link>

          <Link to="/my-appointments" className="service-card" style={{ textDecoration: "none" }}>
            <div style={{ padding: 30 }}>
              <div className="service-icon"><i className="fas fa-list-check" /></div>
              <h3 style={{ color: "#fff", marginTop: 16 }}>My Appointments</h3>
              <p style={{ color: "#b0c4de" }}>Review your booked appointments and status.</p>
            </div>
          </Link>

          <Link to="/hospitals" className="service-card" style={{ textDecoration: "none" }}>
            <div style={{ padding: 30 }}>
              <div className="service-icon"><i className="fas fa-hospital" /></div>
              <h3 style={{ color: "#fff", marginTop: 16 }}>Hospitals</h3>
              <p style={{ color: "#b0c4de" }}>Find hospitals and healthcare facilities nearby.</p>
            </div>
          </Link>

          <Link to="/doctors" className="service-card" style={{ textDecoration: "none" }}>
            <div style={{ padding: 30 }}>
              <div className="service-icon"><i className="fas fa-user-md" /></div>
              <h3 style={{ color: "#fff", marginTop: 16 }}>Doctors</h3>
              <p style={{ color: "#b0c4de" }}>Browse doctors by specialty and rating.</p>
            </div>
          </Link>

          {isAdmin && (
            <Link to="/admin/appointments" className="service-card" style={{ textDecoration: "none" }}>
              <div style={{ padding: 30 }}>
                <div className="service-icon"><i className="fas fa-user-shield" /></div>
                <h3 style={{ color: "#fff", marginTop: 16 }}>Admin Appointments</h3>
                <p style={{ color: "#b0c4de" }}>Review and update patient appointment statuses.</p>
              </div>
            </Link>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
