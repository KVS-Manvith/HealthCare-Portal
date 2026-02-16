import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Register from "../Register";
import * as api from "../../services/api";

vi.mock("../../services/api", () => ({
  register: vi.fn(),
}));

describe("Register page", () => {
  it("shows validation error when passwords do not match", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full Name"), "New Patient");
    await user.type(screen.getByLabelText("Email"), "new@healthcare.local");
    await user.type(screen.getByLabelText("Password"), "pass123");
    await user.type(screen.getByLabelText("Confirm Password"), "different123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(api.register).not.toHaveBeenCalled();
  });

  it("registers and redirects to dashboard", async () => {
    vi.mocked(api.register).mockResolvedValue({
      token: "new-access-token",
      refreshToken: "new-refresh-token",
      user: {
        id: 202,
        email: "new@healthcare.local",
        fullName: "New Patient",
        role: "PATIENT",
      },
    } as any);

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full Name"), "New Patient");
    await user.type(screen.getByLabelText("Email"), "new@healthcare.local");
    await user.type(screen.getByLabelText("Password"), "pass123");
    await user.type(screen.getByLabelText("Confirm Password"), "pass123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Registration successful. Redirecting to dashboard...")).toBeInTheDocument();
    expect(api.register).toHaveBeenCalledWith({
      fullName: "New Patient",
      email: "new@healthcare.local",
      password: "pass123",
      dob: null,
    });

    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    }, { timeout: 3000 });

    const stored = localStorage.getItem("hc_user");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toMatchObject({
      id: 202,
      email: "new@healthcare.local",
      token: "new-access-token",
      refreshToken: "new-refresh-token",
    });
  });
});
