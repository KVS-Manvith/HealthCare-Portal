import React, { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { createHospital, deleteHospital, getHospitals, updateHospital } from "../services/api";

type Hospital = {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
};

export default function AdminHospitalsPage() {
  const PAGE_SIZE = 6;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadHospitals() {
    setListLoading(true);
    try {
      const data = await getHospitals();
      setHospitals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load hospitals.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadHospitals();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        lat: Number(lat),
        lng: Number(lng),
      };
      if (editingId) {
        await updateHospital(editingId, payload);
        setMessage("Hospital updated successfully.");
      } else {
        await createHospital(payload);
        setMessage("Hospital created successfully.");
      }

      setName("");
      setAddress("");
      setPhone("");
      setLat("");
      setLng("");
      setEditingId(null);
      await loadHospitals();
    } catch (err: any) {
      setMessage(err?.message || (editingId ? "Failed to update hospital." : "Failed to create hospital."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setMessage(null);
    setDeletingId(id);
    try {
      await deleteHospital(id);
      setHospitals((prev) => prev.filter((h) => h.id !== id));
      setMessage("Hospital deleted.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to delete hospital.");
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(hospital: Hospital) {
    setEditingId(hospital.id);
    setName(hospital.name || "");
    setAddress(hospital.address || "");
    setPhone(hospital.phone || "");
    setLat(String(hospital.lat ?? ""));
    setLng(String(hospital.lng ?? ""));
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setAddress("");
    setPhone("");
    setLat("");
    setLng("");
    setMessage(null);
  }

  const filteredHospitals = useMemo(() => {
    const key = searchQuery.trim().toLowerCase();
    if (!key) return hospitals;
    return hospitals.filter((h) =>
      h.name.toLowerCase().includes(key) ||
      (h.address || "").toLowerCase().includes(key) ||
      (h.phone || "").toLowerCase().includes(key) ||
      String(h.id).includes(key)
    );
  }, [hospitals, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredHospitals.length / PAGE_SIZE));
  const pageHospitals = filteredHospitals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <div className="content-section active">
          <div className="content-header">
            <h2>Admin: Manage Hospitals</h2>
          </div>

          {message && (
            <p style={{ color: message.toLowerCase().includes("success") ? "lightgreen" : "salmon" }}>
              {message}
            </p>
          )}

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div className="form-group">
              <label htmlFor="hospital-name">Hospital Name</label>
              <input
                id="hospital-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hospital-address">Address</label>
              <input
                id="hospital-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hospital-phone">Phone</label>
              <input
                id="hospital-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hospital-lat">Latitude</label>
                <input
                  id="hospital-lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hospital-lng">Longitude</label>
                <input
                  id="hospital-lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Hospital" : "Create Hospital")}
            </button>
            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                style={{ width: "100%", marginTop: 10 }}
                onClick={cancelEdit}
              >
                Cancel Edit
              </button>
            )}
          </form>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Existing Hospitals</h3>
            <div className="form-group" style={{ maxWidth: 380 }}>
              <label htmlFor="hospital-search">Search</label>
              <input
                id="hospital-search"
                placeholder="Search by name, address, phone, or ID"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {listLoading && <p>Loading hospitals...</p>}
            {!listLoading && filteredHospitals.length === 0 && <p>No hospitals found.</p>}
            {!listLoading && filteredHospitals.length > 0 && (
              <div className="appointment-list">
                {pageHospitals.map((hospital) => (
                  <div key={hospital.id} className="appointment-item">
                    <div className="appointment-info">
                      <h4>{hospital.name}</h4>
                      <p>{hospital.address || "No address"}</p>
                      <p>{hospital.phone || "No phone"}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="edit-profile-btn"
                        onClick={() => startEdit(hospital)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => handleDelete(hospital.id)}
                        disabled={deletingId === hospital.id}
                      >
                        {deletingId === hospital.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!listLoading && filteredHospitals.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ color: "#b0c4de" }}>Page {page} of {totalPages}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="edit-profile-btn"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="edit-profile-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
