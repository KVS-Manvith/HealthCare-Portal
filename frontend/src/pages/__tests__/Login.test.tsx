import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Login from "../Login";
import * as api from "../../services/api";

vi.mock("../../services/api", () => ({
  login: vi.fn(),
}));

describe("Login page", () => {
  it("logs in and navigates to dashboard", async () => {
    vi.mocked(api.login).mockResolvedValue({
      token: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: 101,
        email: "demo@healthcare.local",
        fullName: "Demo Patient",
        role: "PATIENT",
      },
    } as any);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "demo@healthcare.local");
    await user.type(screen.getByLabelText("Password"), "demo123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith("demo@healthcare.local", "demo123");
    });
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();

    const stored = localStorage.getItem("hc_user");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toMatchObject({
      id: 101,
      email: "demo@healthcare.local",
      token: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("shows an API error when login fails", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("Invalid credentials"));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "bad@healthcare.local");
    await user.type(screen.getByLabelText("Password"), "wrong-pass");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
