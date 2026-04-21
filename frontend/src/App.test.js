import {
  buildSeatInventory,
  getBookingStatusLabel,
} from "./utils/booking";

test("buildSeatInventory creates searchable seats with booking state", () => {
  const seats = buildSeatInventory({
    bookings: [
      {
        seat: 2,
        name: "Alice",
        school_class: "TE22A",
        email: "alice@example.com",
        status: "unpaid",
        can_view_private: true,
      },
    ],
    consoleBookings: [],
    numSeats: 3,
    numConsoleSeats: 1,
  });

  expect(seats).toHaveLength(4);
  expect(seats[0].status).toBe("available");
  expect(seats[1].booking.name).toBe("Alice");
  expect(seats[1].searchableText).toContain("alice");
  expect(getBookingStatusLabel(seats[1].status)).toBe("Obetald");
});
