const SEAT_TYPE_META = {
  standard: {
    label: "Datorplats",
    shortLabel: "Dator",
    pluralLabel: "Datorplatser",
  },
  console: {
    label: "Konsol- eller brädspelsplats",
    shortLabel: "Konsol",
    pluralLabel: "Konsol- och brädspelsplatser",
  },
};

export function getSeatTypeMeta(seatType) {
  return (
    SEAT_TYPE_META[seatType] || {
      label: seatType,
      shortLabel: seatType,
      pluralLabel: seatType,
    }
  );
}

export function getBookingStatus(booking) {
  if (!booking) {
    return "available";
  }

  if (booking.status) {
    return booking.status;
  }

  if (booking.paid === null) {
    return "hidden";
  }

  return booking.paid ? "paid" : "unpaid";
}

export function getBookingStatusLabel(status) {
  switch (status) {
    case "available":
      return "Ledig";
    case "paid":
      return "Betald";
    case "unpaid":
      return "Obetald";
    case "hidden":
      return "Upptagen";
    default:
      return status;
  }
}

export function formatBookingTime(value) {
  if (!value) {
    return "Inte tillgängligt";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function buildSeatInventory({
  bookings,
  consoleBookings,
  numSeats,
  numConsoleSeats,
}) {
  const bookingMaps = {
    standard: new Map(bookings.map((booking) => [booking.seat, booking])),
    console: new Map(consoleBookings.map((booking) => [booking.seat, booking])),
  };

  const seatTypes = [
    { seat_type: "standard", max: numSeats || 0 },
    { seat_type: "console", max: numConsoleSeats || 0 },
  ];

  return seatTypes.flatMap(({ seat_type, max }) => {
    const meta = getSeatTypeMeta(seat_type);

    return Array.from({ length: max }, (_, index) => {
      const seat = index + 1;
      const booking = bookingMaps[seat_type].get(seat) || null;
      const status = getBookingStatus(booking);
      const searchableParts = [
        String(seat),
        meta.label,
        meta.pluralLabel,
        status,
        booking?.name,
        booking?.email,
        booking?.school_class,
      ].filter(Boolean);

      return {
        id: `${seat_type}-${seat}`,
        seat,
        seat_type,
        seat_type_label: meta.label,
        seat_type_plural_label: meta.pluralLabel,
        status,
        statusLabel: getBookingStatusLabel(status),
        booking,
        searchableText: searchableParts.join(" ").toLowerCase(),
      };
    });
  });
}
