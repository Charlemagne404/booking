import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import Nav from "../components/Index/Nav";
import Overview from "../components/Index/Overview";
import AdminDialog from "../components/Index/AdminDialog";
import AdminUserDialog from "../components/Index/AdminUserDialog";
import BookingDialog from "../components/Index/BookingDialog";
import InfoDialog from "../components/Index/InfoDialog";
import SeatDialog from "../components/Index/Booking/SeatDialog";
import ErrorDialog from "../components/ErrorDialog";

import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";

import { fetchBookings, setBookingDialog } from "../redux/bookingActions";
import {
  formatBookingTime,
  getBookingStatusLabel,
  getSeatTypeMeta,
} from "../utils/booking";

function CapacityCard({ title, capacity, emphasis }) {
  const toneClass = emphasis ? "metric-card metric-card-strong" : "metric-card";

  return (
    <div className={`summary-card ${toneClass}`}>
      <span className="metric-label">{title}</span>
      <strong className="metric-value">
        {capacity.booked}/{capacity.total}
      </strong>
      <span className="metric-copy">
        {capacity.available} lediga, {capacity.unpaid} obetalda
      </span>
      <div className="progress-track" aria-hidden="true">
        <span
          className="progress-fill"
          style={{ width: `${capacity.occupancy_rate}%` }}
        />
      </div>
      <span className="metric-footer">
        Beläggning {capacity.occupancy_rate}% • betalningar klara{" "}
        {capacity.payment_completion_rate}%
      </span>
    </div>
  );
}

function Index() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const meta = useSelector((state) => state.systemMeta);
  const event = useSelector((state) => state.event);
  const bookingReducer = useSelector((state) => state.bookingReducer);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchBookings());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const emptyCapacity = {
    total: 0,
    booked: 0,
    available: 0,
    paid: 0,
    unpaid: 0,
    occupancy_rate: 0,
    payment_completion_rate: 0,
  };
  const summary = bookingReducer.summary || {
    overall: emptyCapacity,
    standard: emptyCapacity,
    console: emptyCapacity,
  };
  const myBookings = bookingReducer.my_bookings || [];
  const adminInsights = bookingReducer.admin_insights;
  const canBookStandard = !myBookings.some(
    (booking) => booking.seat_type === "standard"
  );
  const canBookConsole = !myBookings.some(
    (booking) => booking.seat_type === "console"
  );

  const openSeat = (seat, seatType) => {
    dispatch(setBookingDialog(true, seat, seatType));
  };

  const totalLiveSeats = summary.overall.total;
  const totalLiveBookings = summary.overall.booked;

  return (
    <div className="app-shell">
      <Nav />
      <Container className="page-shell" maxWidth={false}>
        <div className="hero-panel">
          <div className="hero-grid">
            <div>
              <p className="kicker">Livebokning</p>
              <h1 className="hero-title">Boka plats, följ trycket och hantera allt från samma vy</h1>
              <p className="hero-lead">
                Systemet visar beläggning i realtid, dina egna bokningar,
                betalstatus och administrativa signaler utan att du behöver hoppa
                mellan flera dialoger.
              </p>
              <div className="hero-actions">
                {canBookStandard && (
                  <BookingDialog
                    seat_type="standard"
                    title="Boka datorplats"
                    info="En vanlig plats innebär bordsplacering med plats för dator, stol och skärm under hela LAN-et. Har du konsol med dig måste du boka datorplats och ha med dig skärm."
                  />
                )}
                {canBookConsole && (
                  <BookingDialog
                    seat_type="console"
                    title="Boka konsol- eller brädspelsplats"
                    info="En konsol- och brädspelsplats innebär ingen specifik bordsplacering men tillgång till klubbens spelområde."
                  />
                )}
                <InfoDialog />
              </div>
              <div className="hero-note">
                <span className="status-chip hidden">
                  {totalLiveBookings}/{totalLiveSeats || "-"} platser bokade just nu
                </span>
                <span className="helper-text">
                  Öppna valfri plats i kartan för detaljer, betalningsstatus eller
                  snabb bokning.
                </span>
              </div>
            </div>

            <div className="meta-stack">
              <div className="meta-row">
                <span className="meta-label">LAN-datum</span>
                <span className="meta-value">
                  {event.event_date || "Inte satt ännu"}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Kontakt</span>
                <span className="meta-value">{event.swish_name || "Styrelsen"}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Swish</span>
                <span className="meta-value">
                  {event.swish_phone || "Visas i betalningsvyn"}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Inloggad som</span>
                <span className="meta-value">
                  {user.name} {user.is_admin ? "(admin)" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-stack">
          <section className="section-card">
            <div className="section-header">
              <h2 className="section-title">Beläggning och betalningar</h2>
              <p className="section-lead">
                Kapaciteten uppdateras var femte sekund. Betalningsgraden visar
                hur stor del av redan bokade platser som markerats som betalda.
              </p>
            </div>
            <div className="stats-grid stats-grid-large">
              <CapacityCard
                title="Totalt"
                capacity={summary.overall}
                emphasis={true}
              />
              <CapacityCard title="Datorplatser" capacity={summary.standard} />
              <CapacityCard
                title="Konsol- och brädspelsplatser"
                capacity={summary.console}
              />
            </div>
          </section>

          <section className="section-card">
            <div className="section-header">
              <h2 className="section-title">Dina bokningar och nästa steg</h2>
              <p className="section-lead">
                Här ser du direkt vad du redan har bokat och vad som återstår
                innan eventet.
              </p>
            </div>
            <div className="dashboard-grid">
              <div className="detail-grid">
                {myBookings.length > 0 ? (
                  myBookings.map((booking) => {
                    const seatTypeMeta = getSeatTypeMeta(booking.seat_type);

                    return (
                      <div className="callout-card personal-booking-card" key={booking.seat_type}>
                        <div className="card-pill-row">
                          <span className="card-pill">{seatTypeMeta.shortLabel}</span>
                          <span
                            className={`status-chip ${
                              booking.paid ? "success" : "pending"
                            }`}
                          >
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </div>
                        <h3 className="card-title">
                          {booking.seat_type_label} {booking.seat}
                        </h3>
                        <p className="card-copy">
                          Bokad för {booking.name}, klass {booking.school_class}.
                          {booking.paid
                            ? " Betalningen är markerad som klar."
                            : " Betalning väntar fortfarande."}
                        </p>
                        <div className="meta-list">
                          <span>Bokad {formatBookingTime(booking.time_created)}</span>
                          <span>
                            Senast ändrad {formatBookingTime(booking.time_updated)}
                          </span>
                        </div>
                        <div className="hero-actions">
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => openSeat(booking.seat, booking.seat_type)}
                          >
                            Öppna plats
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="callout-card empty-state-card">
                    <h3 className="card-title">Ingen bokning ännu</h3>
                    <p className="card-copy">
                      Du har fortfarande hela systemet öppet framför dig. Välj en
                      ledig plats direkt i seat explorer eller boka från
                      huvudknapparna ovan.
                    </p>
                  </div>
                )}
              </div>

              <div className="callout-card support-card">
                <h3 className="card-title">Det här behöver du ha koll på</h3>
                <div className="support-points">
                  <div>
                    <strong>Betalning</strong>
                    <span>
                      Obetalda bokningar visar QR-kod i platsvyn. Mottagare är{" "}
                      {event.swish_name || "styrelsen"}.
                    </span>
                  </div>
                  <div>
                    <strong>Support</strong>
                    <span>
                      Vid platsbyte, avbokning eller problem med betalningen:
                      kontakta {event.swish_name || "styrelsen"}{" "}
                      {event.swish_phone ? `på ${event.swish_phone}` : ""}.
                    </span>
                  </div>
                  <div>
                    <strong>Regler</strong>
                    <span>
                      Datorplatser har fast placering. Konsol- och
                      brädspelsplatser bokas i samma system men utan specifik
                      bordsplats.
                    </span>
                  </div>
                </div>
                {user.is_admin ? (
                  <div className="hero-actions">
                    <AdminDialog />
                    <AdminUserDialog />
                  </div>
                ) : (
                  <div className="hero-note">
                    <span className="helper-text">
                      Klicka på din plats i kartan om du vill se QR-kod eller din
                      nuvarande betalstatus.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {user.is_admin && adminInsights && (
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">Adminöversikt</h2>
                <p className="section-lead">
                  Prioritera obetalda bokningar, se vilka klasser som fyller upp
                  snabbast och hoppa direkt till rätt plats.
                </p>
              </div>
              <div className="admin-grid">
                <div className="callout-card admin-panel">
                  <div className="panel-header">
                    <h3 className="card-title">Obetalt just nu</h3>
                    <span className="card-pill">
                      {adminInsights.unpaid_bookings.length} väntar
                    </span>
                  </div>
                  <div className="list-stack">
                    {adminInsights.unpaid_bookings.slice(0, 6).map((booking) => (
                      <button
                        className="list-row-button"
                        key={`${booking.seat_type}-${booking.seat}`}
                        onClick={() => openSeat(booking.seat, booking.seat_type)}
                        type="button"
                      >
                        <span>
                          {booking.name} • {booking.seat_type_label} {booking.seat}
                        </span>
                        <span className="helper-text">{booking.school_class}</span>
                      </button>
                    ))}
                    {adminInsights.unpaid_bookings.length === 0 && (
                      <p className="helper-text">Alla aktuella bokningar är markerade som betalda.</p>
                    )}
                  </div>
                </div>

                <div className="callout-card admin-panel">
                  <div className="panel-header">
                    <h3 className="card-title">Senaste aktivitet</h3>
                    <span className="card-pill">Live</span>
                  </div>
                  <div className="list-stack">
                    {adminInsights.recent_activity.map((booking) => (
                      <button
                        className="list-row-button"
                        key={`recent-${booking.seat_type}-${booking.seat}`}
                        onClick={() => openSeat(booking.seat, booking.seat_type)}
                        type="button"
                      >
                        <span>
                          {booking.name} • {booking.seat_type_label} {booking.seat}
                        </span>
                        <span className="helper-text">
                          {formatBookingTime(booking.time_updated || booking.time_created)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="callout-card admin-panel">
                  <div className="panel-header">
                    <h3 className="card-title">Klasser med flest bokningar</h3>
                    <span className="card-pill">
                      {adminInsights.unique_classes} klasser
                    </span>
                  </div>
                  <div className="class-stats">
                    {adminInsights.class_breakdown.slice(0, 6).map((item) => (
                      <div className="class-stat-row" key={item.school_class}>
                        <div className="class-stat-copy">
                          <strong>{item.school_class}</strong>
                          <span>{item.count} bokningar</span>
                        </div>
                        <div className="class-stat-bar" aria-hidden="true">
                          <span
                            style={{
                              width: `${
                                summary.overall.booked > 0
                                  ? (item.count / summary.overall.booked) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {adminInsights.class_breakdown.length === 0 && (
                      <p className="helper-text">Ingen klassdata tillgänglig ännu.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="booking-board-card hero-panel">
            <div className="booking-board-header">
              <div>
                <p className="kicker">Seat Explorer</p>
                <h2 className="section-title">Kartvy, filter och snabböppning</h2>
              </div>
              <div className="booking-legend">
                <span className="legend-item">
                  <span className="legend-swatch available" />
                  Ledig
                </span>
                <span className="legend-item">
                  <span className="legend-swatch unpaid" />
                  Bokad, obetald
                </span>
                <span className="legend-item">
                  <span className="legend-swatch paid" />
                  Bokad, markerad som betald
                </span>
                {!user.is_admin && (
                  <span className="legend-item">
                    <span className="legend-swatch hidden" />
                    Upptagen, detaljer dolda
                  </span>
                )}
              </div>
            </div>
            <Overview />
          </section>
        </div>

        {bookingReducer.error && <ErrorDialog message={bookingReducer.error} />}
        <SeatDialog />

        <Typography
          align="center"
          className="meta-footer"
          variant="caption"
          display="block"
        >
          Kör{" "}
          <Link href="https://github.com/tullingedk/booking">tullingedk/booking</Link>{" "}
          {meta.version}, commit {meta.hash} ({meta.hashDate})
        </Typography>
      </Container>
    </div>
  );
}

export default Index;
