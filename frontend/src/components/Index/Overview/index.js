import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import { setBookingDialog } from "../../../redux/bookingActions";
import {
  buildSeatInventory,
  getBookingStatusLabel,
  getSeatTypeMeta,
} from "../../../utils/booking";

const STANDARD_ROWS = [
  [1, 6],
  [7, 12],
  [13, 18],
  [19, 24],
  [25, 30],
  [31, 36],
  [37, 42],
  [43, 48],
  [49, 55],
];
const CONSOLE_ROWS = [[1, 20]];
const STATUS_FILTERS = ["all", "available", "unpaid", "paid", "hidden"];
const TYPE_FILTERS = ["all", "standard", "console"];

function getSeatButtonClass(status, isMatched) {
  return [
    "seat-map-button",
    `seat-map-button-${status}`,
    isMatched ? "" : "is-muted",
  ]
    .filter(Boolean)
    .join(" ");
}

function getStatusChipClass(status) {
  if (status === "paid") {
    return "status-chip success";
  }

  if (status === "unpaid") {
    return "status-chip pending";
  }

  return "status-chip hidden";
}

function getSeatDescription(seat) {
  if (!seat.booking) {
    return "Ledig plats";
  }

  if (seat.booking.can_view_private) {
    return `${seat.booking.name} • ${getBookingStatusLabel(seat.status)}`;
  }

  return "Upptagen plats";
}

function Overview() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const bookingReducer = useSelector((state) => state.bookingReducer);

  const [searchTerm, setSearchTerm] = useState("");
  const [seatTypeFilter, setSeatTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const seatInventory = buildSeatInventory({
    bookings: bookingReducer.bookings,
    consoleBookings: bookingReducer.console_bookings,
    numSeats: bookingReducer.num_seats,
    numConsoleSeats: bookingReducer.num_console_seats,
  });
  const seatLookup = new Map(seatInventory.map((seat) => [seat.id, seat]));
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSeats = seatInventory.filter((seat) => {
    const matchesType =
      seatTypeFilter === "all" || seat.seat_type === seatTypeFilter;
    const matchesStatus =
      statusFilter === "all" || seat.status === statusFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      seat.searchableText.includes(normalizedSearch);

    return matchesType && matchesStatus && matchesSearch;
  });
  const filteredSeatIds = new Set(filteredSeats.map((seat) => seat.id));
  const activeFilterCount = [seatTypeFilter, statusFilter].filter(
    (value) => value !== "all"
  ).length + (normalizedSearch ? 1 : 0);

  const openSeat = (seat, seatType) => {
    dispatch(setBookingDialog(true, seat, seatType));
  };

  const renderSeatRow = (seatType, start, end) => {
    const seats = Array.from({ length: end - start + 1 }, (_, index) => {
      const seatNumber = start + index;
      return seatLookup.get(`${seatType}-${seatNumber}`);
    }).filter(Boolean);

    return (
      <div className="seat-map-row" key={`${seatType}-${start}-${end}`}>
        {seats.map((seat) => (
          <button
            className={getSeatButtonClass(
              seat.status,
              activeFilterCount === 0 || filteredSeatIds.has(seat.id)
            )}
            key={seat.id}
            onClick={() => openSeat(seat.seat, seat.seat_type)}
            title={getSeatDescription(seat)}
            type="button"
          >
            <span className="seat-map-number">{seat.seat}</span>
            <span className="seat-map-meta">
              {seat.booking?.can_view_private
                ? seat.booking.name
                : getBookingStatusLabel(seat.status)}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="seat-explorer">
      <div className="seat-explorer-toolbar">
        <div className="seat-filter-group seat-filter-search">
          <TextField
            fullWidth
            label="Sök plats"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={
              user.is_admin
                ? "Sök på plats, namn, klass eller e-post"
                : "Sök på platsnummer eller din bokning"
            }
            value={searchTerm}
            variant="outlined"
          />
        </div>

        <div className="seat-filter-group">
          {TYPE_FILTERS.map((filter) => (
            <button
              className={`filter-chip ${
                seatTypeFilter === filter ? "active" : ""
              }`}
              key={filter}
              onClick={() => setSeatTypeFilter(filter)}
              type="button"
            >
              {filter === "all" ? "Alla kategorier" : getSeatTypeMeta(filter).shortLabel}
            </button>
          ))}
        </div>

        <div className="seat-filter-group">
          {STATUS_FILTERS.map((filter) => (
            <button
              className={`filter-chip ${
                statusFilter === filter ? "active" : ""
              }`}
              key={filter}
              onClick={() => setStatusFilter(filter)}
              type="button"
            >
              {filter === "all" ? "Alla statusar" : getBookingStatusLabel(filter)}
            </button>
          ))}
        </div>

        <div className="seat-toolbar-meta">
          <span className="helper-text">
            {filteredSeats.length} av {seatInventory.length} platser matchar
          </span>
          {activeFilterCount > 0 && (
            <Button
              color="primary"
              onClick={() => {
                setSearchTerm("");
                setSeatTypeFilter("all");
                setStatusFilter("all");
              }}
            >
              Rensa filter
            </Button>
          )}
        </div>
      </div>

      <div className="seat-explorer-layout">
        <div className="seat-result-panel">
          <div className="panel-header">
            <h3 className="card-title">Matchande platser</h3>
            <span className="card-pill">Snabböppning</span>
          </div>
          <div className="list-stack">
            {filteredSeats.slice(0, 14).map((seat) => (
              <button
                className="seat-result-row"
                key={`result-${seat.id}`}
                onClick={() => openSeat(seat.seat, seat.seat_type)}
                type="button"
              >
                <div className="seat-result-copy">
                  <strong>
                    {seat.seat_type_label} {seat.seat}
                  </strong>
                  <span>{getSeatDescription(seat)}</span>
                </div>
                <span className={getStatusChipClass(seat.status)}>
                  {seat.statusLabel}
                </span>
              </button>
            ))}
            {filteredSeats.length === 0 && (
              <div className="empty-state-card seat-result-empty">
                <h3 className="card-title">Inga träffar</h3>
                <p className="card-copy">
                  Testa att rensa filtren eller sök på ett annat platsnummer,
                  namn eller klass.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="seat-map-panel">
          <div className="seat-section">
            <div className="panel-header">
              <h3 className="card-title">Datorplatser</h3>
              <span className="helper-text">
                Fast placering med bord och stol
              </span>
            </div>
            <div className="seat-map-grid">
              {STANDARD_ROWS.map(([start, end]) =>
                renderSeatRow("standard", start, end)
              )}
            </div>
          </div>

          <div className="seat-section">
            <div className="panel-header">
              <h3 className="card-title">Konsol- och brädspelsplatser</h3>
              <span className="helper-text">
                Bokas här men utan specifik bordsplacering
              </span>
            </div>
            <div className="seat-map-grid seat-map-grid-console">
              {CONSOLE_ROWS.map(([start, end]) =>
                renderSeatRow("console", start, end)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
