import React, { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getAppointments, getDoctors, getUserById, updateAppointmentStatus } from "../services/api";

type Appointment = {
  id: number;
  userId: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
};

type Doctor = {
  id: number;
  name: string;
};

export default function AdminAppointmentsPage() {
  const PAGE_SIZE = 8;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNames, setDoctorNames] = useState<Record<number, string>>({});
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "CANCELLED">("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const [appointmentData, doctorData] = await Promise.all([
        getAppointments(),
        getDoctors(),
      ]);

      const allAppointments = (Array.isArray(appointmentData) ? appointmentData : []) as Appointment[];
      setAppointments(allAppointments);

      const dMap: Record<number, string> = {};
      (doctorData as Doctor[]).forEach((doctor) => {
        dMap[doctor.id] = doctor.name;
      });
      setDoctorNames(dMap);

      const uniqueUserIds = [...new Set(allAppointments.map((a) => a.userId))];
      const users = await Promise.all(
        uniqueUserIds.map(async (id) => {
          try {
            const user = await getUserById(id);
            return { id, name: user.fullName || user.email || `#${id}` };
          } catch {
            return { id, name: `#${id}` };
          }
        })
      );
      const uMap: Record<number, string> = {};
      users.forEach((u) => {
        uMap[u.id] = u.name;
      });
      setUserNames(uMap);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleStatusUpdate(appointmentId: number, status: "PENDING" | "CONFIRMED" | "CANCELLED") {
    setMessage(null);
    setActionId(appointmentId);
    try {
      const updated = await updateAppointmentStatus(appointmentId, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: updated.status } : a))
      );
      setMessage(`Appointment #${appointmentId} set to ${status}.`);
    } catch (err: any) {
      setMessage(err?.message || "Failed to update appointment.");
    } finally {
      setActionId(null);
    }
  }

  const filtered = useMemo(() => {
    const byStatus = appointments.filter((a) => statusFilter === "ALL" || a.status === statusFilter);
    const key = searchQuery.trim().toLowerCase();
    if (!key) return byStatus;

    return byStatus.filter((a) =>
      String(a.id).includes(key) ||
      (userNames[a.userId] || "").toLowerCase().includes(key) ||
      (doctorNames[a.doctorId] || "").toLowerCase().includes(key) ||
      (a.reason || "").toLowerCase().includes(key) ||
      (a.date || "").toLowerCase().includes(key)
    );
  }, [appointments, statusFilter, searchQuery, userNames, doctorNames]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageAppointments = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div className="content-section active">
          <div className="content-header">
            <h2>Admin: Manage Appointments</h2>
          </div>

          {message && (
            <p style={{ color: message.toLowerCase().includes("failed") ? "salmon" : "lightgreen" }}>
              {message}
            </p>
          )}

          <div className="form-group" style={{ maxWidth: 240, marginTop: 12 }}>
            <label htmlFor="status-filter">Filter by Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED")}
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 360, marginTop: 12 }}>
            <label htmlFor="appointment-search">Search</label>
            <input
              id="appointment-search"
              placeholder="Search by ID, user, doctor, reason, date"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {loading && <p>Loading appointments...</p>}
          {!loading && filtered.length === 0 && <p>No appointments found.</p>}

          {!loading && filtered.length > 0 && (
            <div className="appointment-list" style={{ marginTop: 16 }}>
              {pageAppointments.map((a) => (
                <div key={a.id} className="appointment-item">
                  <div className="appointment-info">
                    <h4>Appointment #{a.id}</h4>
                    <p>User: {userNames[a.userId] || `#${a.userId}`}</p>
                    <p>Doctor: {doctorNames[a.doctorId] || `#${a.doctorId}`}</p>
                    <p>Date: {a.date} | Time: {a.time}</p>
                    <p>Reason: {a.reason}</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <div
                      className={`appointment-status ${a.status === "CONFIRMED" ? "status-confirmed" : a.status === "CANCELLED" ? "status-cancelled" : "status-pending"}`}
                    >
                      {a.status}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="edit-profile-btn"
                        disabled={actionId === a.id || a.status === "CONFIRMED"}
                        onClick={() => handleStatusUpdate(a.id, "CONFIRMED")}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="cancel-btn"
                        disabled={actionId === a.id || a.status === "CANCELLED"}
                        onClick={() => handleStatusUpdate(a.id, "CANCELLED")}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="edit-profile-btn"
                        disabled={actionId === a.id || a.status === "PENDING"}
                        onClick={() => handleStatusUpdate(a.id, "PENDING")}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length > 0 && (
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
      </main>
      <Footer />
    </div>
  );
}
