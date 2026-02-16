import { clearCurrentUser, getAuthToken, getCurrentUser, getRefreshToken, setCurrentUser } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export type UserPayload = {
  id: number;
  fullName?: string;
  email: string;
  dob?: string | null;
  phone?: string | null;
  role?: string;
};

type AuthPayload = {
  token: string;
  refreshToken: string;
  user: UserPayload;
};

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json();

  let message = "Request failed";
  try {
    const body = await res.json();
    message = body?.error || body?.message || JSON.stringify(body);
  } catch {
    message = await res.text();
  }

  throw new Error(message || `Request failed (${res.status})`);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  const current = getCurrentUser();
  if (!refreshToken || !current) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const auth = (await res.json()) as AuthPayload;
    setCurrentUser({ ...auth.user, token: auth.token, refreshToken: auth.refreshToken });
    return true;
  } catch {
    return false;
  }
}

async function request(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retryOnAuthFail?: boolean } = {}
): Promise<Response> {
  const useAuth = options.auth !== false;
  const retryOnAuthFail = options.retryOnAuthFail !== false;

  const headers: HeadersInit = {
    ...(init.headers || {}),
  };
  if (useAuth) {
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (useAuth && retryOnAuthFail && res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearCurrentUser();
      return res;
    }

    const retryHeaders: HeadersInit = {
      ...(init.headers || {}),
      Authorization: `Bearer ${getAuthToken()}`,
    };
    res = await fetch(`${API_URL}${path}`, { ...init, headers: retryHeaders });
  }

  return res;
}

/* ---------- AUTH ---------- */
export async function login(email: string, password: string): Promise<AuthPayload> {
  const res = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }, { auth: false });
  return parseResponse<AuthPayload>(res);
}

export async function register(payload: {
  fullName: string;
  email: string;
  password: string;
  dob?: string | null;
  phone?: string | null;
}): Promise<AuthPayload> {
  const res = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, { auth: false });
  return parseResponse<AuthPayload>(res);
}

export async function logoutFromServer() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;
  await request("/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

/* ---------- USERS ---------- */
export async function getUserById(userId: number): Promise<UserPayload> {
  const res = await request(`/users/${userId}`, { method: "GET" });
  return parseResponse<UserPayload>(res);
}

export async function updateUser(
  userId: number,
  payload: { fullName: string; dob?: string | null; phone?: string | null }
): Promise<UserPayload> {
  const res = await request(`/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<UserPayload>(res);
}

/* ---------- DOCTORS ---------- */
export async function getDoctors() {
  const res = await request("/doctors", { method: "GET" }, { auth: false });
  return parseResponse<any[]>(res);
}

export async function createDoctor(payload: {
  name: string;
  specialty: string;
  rating: number;
}) {
  const res = await request("/doctors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<any>(res);
}

export async function updateDoctor(doctorId: number, payload: {
  name: string;
  specialty: string;
  rating: number;
}) {
  const res = await request(`/doctors/${doctorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<any>(res);
}

export async function deleteDoctor(doctorId: number) {
  const res = await request(`/doctors/${doctorId}`, { method: "DELETE" });
  return parseResponse<{ message: string }>(res);
}

/* ---------- HOSPITALS ---------- */
export async function getHospitals() {
  const res = await request("/hospitals", { method: "GET" }, { auth: false });
  return parseResponse<any[]>(res);
}

export async function createHospital(payload: {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}) {
  const res = await request("/hospitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<any>(res);
}

export async function updateHospital(hospitalId: number, payload: {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}) {
  const res = await request(`/hospitals/${hospitalId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<any>(res);
}

export async function deleteHospital(hospitalId: number) {
  const res = await request(`/hospitals/${hospitalId}`, { method: "DELETE" });
  return parseResponse<{ message: string }>(res);
}

/* ---------- APPOINTMENTS ---------- */
export async function bookAppointment(payload: {
  userId: number;
  doctorId: number;
  date: string;
  time: string;
  reason?: string;
}) {
  const res = await request("/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<any>(res);
}

export async function getUserAppointments(userId: number) {
  const res = await request(`/appointments/user/${userId}`, { method: "GET" });
  return parseResponse<any[]>(res);
}

export async function getAppointments(userId?: number) {
  const suffix = typeof userId === "number" ? `?userId=${userId}` : "";
  const res = await request(`/appointments${suffix}`, { method: "GET" });
  return parseResponse<any[]>(res);
}

export async function cancelAppointment(appointmentId: number) {
  const res = await request(`/appointments/${appointmentId}`, { method: "DELETE" });
  return parseResponse<any>(res);
}

export async function updateAppointmentStatus(
  appointmentId: number,
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
) {
  const res = await request(`/appointments/${appointmentId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseResponse<any>(res);
}
