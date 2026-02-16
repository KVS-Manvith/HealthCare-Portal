import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getCurrentUser } from "../utils/auth";
import { bookAppointment, getDoctors } from "../services/api";

type Doctor = {
  id: number;
  name: string;
  specialty?: string;
  rating?: number;
};

function AppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentReason, setAppointmentReason] = useState("");
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoctors() {
      setIsLoadingDoctors(true);
      setError(null);
      try {
        const data = await getDoctors();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load doctors");
      } finally {
        setIsLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const user = getCurrentUser();
    if (!user?.id) {
      setMessage("Please login again.");
      return;
    }
    if (!selectedDoctor) {
      setMessage("Please select a doctor.");
      return;
    }

    try {
      setSubmitLoading(true);
      await bookAppointment({
        userId: user.id,
        doctorId: selectedDoctor,
        date: appointmentDate,
        time: appointmentTime,
        reason: appointmentReason,
      });
      setMessage("Appointment booked successfully.");
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentReason("");
      setSelectedDoctor(null);
    } catch (err: any) {
      setMessage(err?.message || "Booking failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div className="content-section active">
          <h2>Book Appointment</h2>

          {message && (
            <p style={{ color: message.toLowerCase().includes("success") ? "lightgreen" : "salmon", marginBottom: 12 }}>
              {message}
            </p>
          )}

          {error && (
            <div style={{ color: "salmon", marginBottom: 12 }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <h3>Select a Doctor</h3>

          {isLoadingDoctors ? (
            <p style={{ color: "#aaa" }}>Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <p style={{ color: "orange" }}>No doctors available.</p>
          ) : (
            <div className="doctors-grid">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`doctor-card ${selectedDoctor === doctor.id ? "selected" : ""}`}
                  onClick={() => setSelectedDoctor(doctor.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedDoctor(doctor.id)}
                >
                  <div className="doctor-avatar">{(doctor.name || "?").charAt(0)}</div>
                  <h3 className="doctor-name">{doctor.name ?? "Unnamed"}</h3>
                  <p className="doctor-specialty">{doctor.specialty ?? "General"}</p>
                  <p className="doctor-rating">Rating: {doctor.rating ?? "N/A"}</p>
                </div>
              ))}
            </div>
          )}

          <div className="appointment-form active" style={{ marginTop: 20 }}>
            <h3>Appointment Details</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="appointment-date">Select Date</label>
                <input
                  id="appointment-date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="selected-doctor">Selected Doctor</label>
                <input
                  id="selected-doctor"
                  type="text"
                  value={doctors.find((d) => d.id === selectedDoctor)?.name || "No doctor selected"}
                  disabled
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="appointment-time">Select Time</label>
                <select id="appointment-time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} required>
                  <option value="">Select Time</option>
                  <option value="09:00:00">09:00 AM</option>
                  <option value="10:00:00">10:00 AM</option>
                  <option value="14:00:00">02:00 PM</option>
                  <option value="15:00:00">03:00 PM</option>
                  <option value="16:00:00">04:00 PM</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="appointment-reason">Reason for appointment</label>
                <textarea
                  id="appointment-reason"
                  rows={3}
                  placeholder="Describe symptoms..."
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={!selectedDoctor || !appointmentDate || !appointmentTime || !appointmentReason || submitLoading}
              >
                {submitLoading ? "Booking..." : "Book Appointment"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AppointmentsPage;
