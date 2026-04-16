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

import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";

import { fetchBookings } from "../redux/bookingActions";

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

  const numSeats = bookingReducer.num_seats || 0;
  const numConsoleSeats = bookingReducer.num_console_seats || 0;
  const bookedSeats = bookingReducer.bookings.length;
  const bookedConsoleSeats = bookingReducer.console_bookings.length;
  const remainingSeats = numSeats ? numSeats - bookedSeats : 0;
  const remainingConsoleSeats = numConsoleSeats
    ? numConsoleSeats - bookedConsoleSeats
    : 0;

  return (
    <div className="app-shell">
      <Nav />
      <Container className="page-shell" maxWidth={false}>
        <div className="hero-panel">
          <div className="hero-grid">
            <div>
              <p className="kicker">Bokning</p>
              <h1 className="hero-title">Boka din plats till nästa LAN</h1>
              <p className="hero-lead">
                Följ beläggningen live, välj rätt typ av plats och hantera
                betalningen direkt i samma system.
              </p>
              <div className="hero-actions">
                <BookingDialog
                  seat_type="standard"
                  title="Boka datorplats"
                  info="En vanlig plats innebär bordsplacering med plats för dator, stol och skärm under hela LAN-et. Har du konsol med dig måste du boka datorplats och ha med dig skärm."
                />
                <BookingDialog
                  seat_type="console"
                  title="Boka konsol- eller brädspelsplats"
                  info="En konsol- och brädspelsplats innebär ingen specifik bordsplacering men tillgång till klubbens spelområde."
                />
                <InfoDialog />
              </div>
            </div>

            <div className="meta-stack">
              <div className="meta-row">
                <span className="meta-label">LAN-datum</span>
                <span className="meta-value">{event.event_date || "Inte satt ännu"}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Kontakt</span>
                <span className="meta-value">{event.swish_name || "Styrelsen"}</span>
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
              <h2 className="section-title">Status just nu</h2>
              <p className="section-lead">
                Standardplatser har bordsplacering. Konsol- och brädspelsplatser
                saknar fast plats men bokas här på samma sätt.
              </p>
            </div>
            <div className="stats-grid">
              <div className="summary-card">
                <strong>Datorplatser</strong>
                <span>
                  {bookedSeats}/{numSeats || "-"} bokade, {remainingSeats} lediga
                </span>
              </div>
              <div className="summary-card">
                <strong>Konsol- och brädspelsplatser</strong>
                <span>
                  {bookedConsoleSeats}/{numConsoleSeats || "-"} bokade, {remainingConsoleSeats} lediga
                </span>
              </div>
              <div className="summary-card">
                <strong>Betalning och support</strong>
                <span>
                  Vid frågor om bokning, platsbyte eller betalning: kontakta {event.swish_name || "styrelsen"}.
                </span>
              </div>
            </div>
          </section>

          {(user.is_admin || true) && (
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">Verktyg</h2>
                <p className="section-lead">
                  Bokningsåtgärder för deltagare och administrativa verktyg för styrelsen.
                </p>
              </div>
              <div className="action-grid">
                <div className="action-card">
                  <strong>Boka plats</strong>
                  <span>Välj mellan fast datorplats eller plats utan bordsplacering.</span>
                </div>
                <div className="action-card">
                  <strong>Information</strong>
                  <span>Läs regler, checklista, betalningsinfo och praktiska detaljer.</span>
                </div>
                {user.is_admin ? (
                  <>
                    <div className="action-card">
                      <strong>Admin</strong>
                      <span>Hantera administratörer, användare och bokningar.</span>
                      <div className="hero-actions">
                        <AdminDialog />
                        <AdminUserDialog />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="action-card">
                    <strong>Dina uppgifter</strong>
                    <span>Klicka på din plats i översikten för att se betalningsstatus och QR-kod.</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="booking-board-card hero-panel">
            <div className="booking-board-header">
              <div>
                <p className="kicker">Översikt</p>
                <h2 className="section-title">Alla bokningslägen i realtid</h2>
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
                    Andra deltagares detaljer är dolda
                  </span>
                )}
              </div>
            </div>
            <Overview />
          </section>
        </div>

        {bookingReducer.error && <ErrorDialog message={bookingReducer.error} />}
        <SeatDialog />

        <Typography align="center" className="meta-footer" variant="caption" display="block">
          Kör <Link href="https://github.com/tullingedk/booking">tullingedk/booking</Link>{" "}
          {meta.version}, commit {meta.hash} ({meta.hashDate})
        </Typography>
      </Container>
    </div>
  );
}

export default Index;
