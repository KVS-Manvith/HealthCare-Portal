import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getDoctors } from "../services/api";

type Doctor = { id: number; name: string; specialty?: string; rating?: number };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDoctors()
      .then((data) => setDoctors(data))
      .catch((e) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div className="content-section active">
          <div className="content-header">
            <h2>Doctors</h2>
          </div>

          {loading && <div className="loader active" />}
          {error && <div style={{ color: "#ff8a80" }}>{error}</div>}

          <div className="doctors-grid" style={{ marginTop: 20 }}>
            {doctors.map((d) => (
              <div key={d.id} className="doctor-card" title={d.specialty}>
                <div className="doctor-avatar">{d.name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
                <div className="doctor-name">{d.name}</div>
                <div className="doctor-specialty">{d.specialty || "General Medicine"}</div>
                <div className="doctor-rating">{d.rating ? `${d.rating} *` : "-"}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
