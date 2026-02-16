import React, { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { createDoctor, deleteDoctor, getDoctors, updateDoctor } from "../services/api";

type Doctor = {
  id: number;
  name: string;
  specialty?: string;
  rating?: number;
};

export default function AdminDoctorsPage() {
  const PAGE_SIZE = 6;
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [rating, setRating] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadDoctors() {
    setListLoading(true);
    try {
      const data = await getDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load doctors.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        specialty: specialty.trim(),
        rating: Number(rating),
      };
      if (editingId) {
        await updateDoctor(editingId, payload);
        setMessage("Doctor updated successfully.");
      } else {
        await createDoctor(payload);
        setMessage("Doctor created successfully.");
      }

      setName("");
      setSpecialty("");
      setRating("");
      setEditingId(null);
      await loadDoctors();
    } catch (err: any) {
      setMessage(err?.message || (editingId ? "Failed to update doctor." : "Failed to create doctor."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setMessage(null);
    setDeletingId(id);
    try {
      await deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      setMessage("Doctor deleted.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to delete doctor.");
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(doctor: Doctor) {
    setEditingId(doctor.id);
    setName(doctor.name || "");
    setSpecialty(doctor.specialty || "");
    setRating(String(doctor.rating ?? 0));
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setSpecialty("");
    setRating("");
    setMessage(null);
  }

  const filteredDoctors = useMemo(() => {
    const key = searchQuery.trim().toLowerCase();
    if (!key) return doctors;
    return doctors.filter((d) =>
      d.name.toLowerCase().includes(key) ||
      (d.specialty || "").toLowerCase().includes(key) ||
      String(d.id).includes(key)
    );
  }, [doctors, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const pageDoctors = filteredDoctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <div className="content-section active">
          <div className="content-header">
            <h2>Admin: Manage Doctors</h2>
          </div>

          {message && (
            <p style={{ color: message.toLowerCase().includes("success") ? "lightgreen" : "salmon" }}>
              {message}
            </p>
          )}

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div className="form-group">
              <label htmlFor="doctor-name">Doctor Name</label>
              <input
                id="doctor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="doctor-specialty">Specialty</label>
              <input
                id="doctor-specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="doctor-rating">Rating (0-5)</label>
              <input
                id="doctor-rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
              />
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Doctor" : "Create Doctor")}
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
            <h3 style={{ marginBottom: 12 }}>Existing Doctors</h3>
            <div className="form-group" style={{ maxWidth: 360 }}>
              <label htmlFor="doctor-search">Search</label>
              <input
                id="doctor-search"
                placeholder="Search by name, specialty, or ID"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {listLoading && <p>Loading doctors...</p>}
            {!listLoading && filteredDoctors.length === 0 && <p>No doctors found.</p>}
            {!listLoading && filteredDoctors.length > 0 && (
              <div className="appointment-list">
                {pageDoctors.map((doctor) => (
                  <div key={doctor.id} className="appointment-item">
                    <div className="appointment-info">
                      <h4>{doctor.name}</h4>
                      <p>Specialty: {doctor.specialty || "General Medicine"}</p>
                      <p>Rating: {doctor.rating ?? 0}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="edit-profile-btn"
                        onClick={() => startEdit(doctor)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => handleDelete(doctor.id)}
                        disabled={deletingId === doctor.id}
                      >
                        {deletingId === doctor.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!listLoading && filteredDoctors.length > 0 && (
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
