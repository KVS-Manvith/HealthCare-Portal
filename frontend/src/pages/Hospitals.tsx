import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getHospitals } from "../services/api";

type Hospital = {
  id: number;
  name: string;
  address?: string;
  phone?: string;
};

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filtered, setFiltered] = useState<Hospital[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getHospitals();
        setHospitals(res);
        setFiltered(res);
      } catch (e: any) {
        setError(e?.message || "Failed to load hospitals.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSearch(value: string) {
    setSearch(value);

    if (!value.trim()) {
      setFiltered(hospitals);
      return;
    }

    const key = value.toLowerCase();
    const list = hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(key) ||
        (h.address || "").toLowerCase().includes(key)
    );
    setFiltered(list);
  }

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div className="content-section active">
          <div className="content-header">
            <h2>Nearby Hospitals</h2>
          </div>

          <div className="search-bar-container" style={{ marginTop: 12 }}>
            <i className="fas fa-search search-icon" />
            <input
              id="hospitalSearchInput"
              type="text"
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {loading && <div className="loader active" />}
          {error && <p style={{ color: "salmon", marginTop: 12 }}>{error}</p>}

          <div className="hospital-list" style={{ marginTop: 20 }}>
            {!loading && filtered.length === 0 && (
              <p style={{ color: "orange" }}>No hospitals found.</p>
            )}

            {filtered.map((h) => (
              <div key={h.id} className="hospital-item">
                <div className="hospital-icon">
                  <i className="fas fa-hospital" />
                </div>

                <div className="hospital-info">
                  <h4>{h.name}</h4>
                  <p>{h.address || "No address available"}</p>
                  <p className="hospital-distance">
                    <i className="fas fa-phone" /> {h.phone || "No phone"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
