import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AppointmentsPage from "../Appointments";
import * as api from "../../services/api";

vi.mock("../../components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("../../components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../../services/api", () => ({
  getDoctors: vi.fn(),
  bookAppointment: vi.fn(),
}));

describe("Appointments page", () => {
  it("loads and displays doctors", async () => {
    vi.mocked(api.getDoctors).mockResolvedValue([
      { id: 11, name: "Dr. Kavya Reddy", specialty: "Pediatrics", rating: 4.6 },
    ] as any);

    localStorage.setItem(
      "hc_user",
      JSON.stringify({
        id: 1,
        email: "demo@healthcare.local",
        token: "token",
        refreshToken: "refresh",
      })
    );

    render(
      <MemoryRouter>
        <AppointmentsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Dr. Kavya Reddy")).toBeInTheDocument();
    expect(api.getDoctors).toHaveBeenCalledTimes(1);
  });

  it("books an appointment for the selected doctor", async () => {
    vi.mocked(api.getDoctors).mockResolvedValue([
      { id: 33, name: "Dr. Arjun Chowdary", specialty: "Orthopedics", rating: 4.4 },
    ] as any);
    vi.mocked(api.bookAppointment).mockResolvedValue({ id: 1001 } as any);

    localStorage.setItem(
      "hc_user",
      JSON.stringify({
        id: 7,
        email: "demo@healthcare.local",
        token: "token",
        refreshToken: "refresh",
      })
    );

    render(
      <MemoryRouter>
        <AppointmentsPage />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(await screen.findByText("Dr. Arjun Chowdary"));
    await user.type(screen.getByLabelText("Select Date"), "2026-12-01");
    await user.selectOptions(screen.getByLabelText("Select Time"), "09:00:00");
    await user.type(screen.getByLabelText("Reason for appointment"), "Routine checkup");
    await user.click(screen.getByRole("button", { name: "Book Appointment" }));

    await waitFor(() => {
      expect(api.bookAppointment).toHaveBeenCalledWith({
        userId: 7,
        doctorId: 33,
        date: "2026-12-01",
        time: "09:00:00",
        reason: "Routine checkup",
      });
    });

    expect(await screen.findByText("Appointment booked successfully.")).toBeInTheDocument();
  });
});
