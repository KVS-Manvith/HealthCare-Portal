import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import AdminAppointmentsPage from "./pages/AdminAppointments";
import AdminDoctorsPage from "./pages/AdminDoctors";
import AdminHospitalsPage from "./pages/AdminHospitals";
import AppointmentsPage from "./pages/Appointments";
import AppointmentsList from "./pages/AppointmentsList";
import Dashboard from "./pages/Dashboard";
import DoctorsPage from "./pages/Doctors";
import HospitalsPage from "./pages/Hospitals";
import Login from "./pages/Login";
import ProfilePage from "./pages/Profile";
import Register from "./pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/doctors" element={<PrivateRoute><DoctorsPage /></PrivateRoute>} />
        <Route path="/hospitals" element={<PrivateRoute><HospitalsPage /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
        <Route path="/my-appointments" element={<PrivateRoute><AppointmentsList /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route
          path="/admin/hospitals"
          element={<RoleRoute roles={["ADMIN"]}><AdminHospitalsPage /></RoleRoute>}
        />
        <Route
          path="/admin/doctors"
          element={<RoleRoute roles={["ADMIN"]}><AdminDoctorsPage /></RoleRoute>}
        />
        <Route
          path="/admin/appointments"
          element={<RoleRoute roles={["ADMIN"]}><AdminAppointmentsPage /></RoleRoute>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
