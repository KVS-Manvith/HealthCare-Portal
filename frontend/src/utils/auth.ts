export type CurrentUser = {
  id: number;
  fullName?: string;
  email: string;
  dob?: string | null;
  phone?: string | null;
  role?: string;
  token: string;
  refreshToken: string;
};

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem("hc_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("hc_user");
    return null;
  }
}

export function getAuthToken(): string | null {
  return getCurrentUser()?.token || null;
}

export function getRefreshToken(): string | null {
  return getCurrentUser()?.refreshToken || null;
}

export function setCurrentUser(user: CurrentUser) {
  localStorage.setItem("hc_user", JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem("hc_user");
}

export function logout() {
  clearCurrentUser();
}
