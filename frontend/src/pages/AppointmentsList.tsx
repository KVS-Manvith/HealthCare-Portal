import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { cancelAppointment, getDoctors, getUserAppointments } from "../services/api";
import { getCurrentUser } from "../utils/auth";

type Appointment = {
  id: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
  status: string;
};

type Doctor = {
  id: number;
  name: string;
};

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNames, setDoctorNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      const user = getCurrentUser();
      if (!user?.id) {
        setError("Please login again.");
        setLoading(false);
        return;
      }

      try {
        const [appointmentData, doctorData] = await Promise.all([
          getUserAppointments(user.id),
          getDoctors(),
        ]);
        setAppointments(appointmentData);

        const names: Record<number, string> = {};
        (doctorData as Doctor[]).forEach((doctor) => {
          names[doctor.id] = doctor.name;
        });
        setDoctorNames(names);
      } catch (err: any) {
        setError(err?.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  async function handleCancel(appointmentId: number) {
    setActionError(null);
    setCancellingId(appointmentId);
    try {
      const updated = await cancelAppointment(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: updated.status } : a))
      );
    } catch (err: any) {
      setActionError(err?.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div className="content-section active">
          <h2>My Appointments</h2>

          {loading && <p>Loading appointments...</p>}
          {error && <p style={{ color: "salmon" }}>{error}</p>}
          {actionError && <p style={{ color: "salmon" }}>{actionError}</p>}

          {!loading && !error && appointments.length === 0 && (
            <p>No appointments booked yet.</p>
          )}

          {!loading && !error && appointments.length > 0 && (
            <div className="appointment-list" style={{ marginTop: 20 }}>
              {appointments.map((a) => (
                <div key={a.id} className="appointment-item">
                  <div className="appointment-info">
                    <h4>Doctor: {doctorNames[a.doctorId] || `#${a.doctorId}`}</h4>
                    <p>Date: {a.date} | Time: {a.time}</p>
                    <p>Reason: {a.reason}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div
                      className={`appointment-status ${a.status === "CONFIRMED" ? "status-confirmed" : a.status === "CANCELLED" ? "status-cancelled" : "status-pending"}`}
                    >
                      {a.status}
                    </div>
                    {a.status === "PENDING" && (
                      <button
                        type="button"
                        className="cancel-btn"
                        style={{ width: 150 }}
                        onClick={() => handleCancel(a.id)}
                        disabled={cancellingId === a.id}
                      >
                        {cancellingId === a.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
