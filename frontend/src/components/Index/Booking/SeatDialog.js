import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import md5 from "md5";

import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Alert from "@material-ui/lab/Alert";
import Avatar from "@material-ui/core/Avatar";

import MoveSeatDialog from "./MoveSeatDialog";
import EditDialog from "./EditDialog";

import { fetchBookings, setBookingDialog } from "../../../redux/bookingActions";
import {
  formatBookingTime,
  getBookingStatusLabel,
  getSeatTypeMeta,
} from "../../../utils/booking";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function SeatDialog() {
  const bookingReducer = useSelector((state) => state.bookingReducer);
  const user = useSelector((state) => state.user);
  const event = useSelector((state) => state.event);
  const dispatch = useDispatch();

  const booking =
    bookingReducer.dialog_seat_type === "standard"
      ? bookingReducer.bookings.find(
          (seat) => seat.seat === bookingReducer.dialog_id
        )
      : bookingReducer.console_bookings.find(
          (seat) => seat.seat === bookingReducer.dialog_id
        );
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const bookingType = bookingReducer.dialog_seat_type;
  const bookingTypeLabel = getSeatTypeMeta(bookingType).label;
  const hasPrivateBookingDetails = booking && booking.can_view_private;
  const avatarSeed = booking
    ? booking.email || booking.name || String(booking.seat)
    : "seat";
  const alreadyBookedThisType = bookingReducer.my_bookings.some(
    (userBooking) => userBooking.seat_type === bookingType
  );
  const canBookSeatDirectly =
    bookingReducer.dialog_open && !booking && !alreadyBookedThisType;

  const handleClose = () => {
    setError("");
    setBusyAction("");
    dispatch(setBookingDialog(false, null, null));
  };

  const runBookingMutation = (url, method, body, onSuccess) => {
    setBusyAction(method);
    setError("");

    fetch(url, {
      credentials: "include",
      method: method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.http_code === 200) {
          dispatch(fetchBookings());
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setError(`Ett fel uppstod: ${data.message} (${data.http_code})`);
        }
      })
      .catch((e) => {
        setError(`Ett fel uppstod: ${e}`);
      })
      .finally(() => {
        setBusyAction("");
      });
  };

  const changePaymentStatus = (paymentStatus) => {
    runBookingMutation(
      `${BACKEND_URL}/api/booking/${bookingReducer.dialog_id}`,
      "put",
      {
        paid: paymentStatus,
        seat_type: bookingType,
      }
    );
  };

  const deleteBooking = () => {
    runBookingMutation(
      `${BACKEND_URL}/api/booking/${bookingReducer.dialog_id}`,
      "delete",
      {
        seat_type: bookingType,
      },
      handleClose
    );
  };

  const bookSeat = () => {
    runBookingMutation(`${BACKEND_URL}/api/booking/book`, "post", {
      seat: bookingReducer.dialog_id,
      seat_type: bookingType,
    });
  };

  return (
    <Dialog
      open={bookingReducer.dialog_open}
      onClose={handleClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="dialog-title">
        <div className="inline-avatar-title">
          <Avatar
            alt={booking ? booking.name : bookingTypeLabel}
            src={
              booking && booking.picture_url
                ? booking.picture_url
                : `https://www.gravatar.com/avatar/${md5(avatarSeed)}`
            }
          />
          <div>
            <Typography variant="h6">
              {bookingTypeLabel} {bookingReducer.dialog_id}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {booking
                ? "Detaljer för vald plats"
                : "Platsen är ledig och kan bokas direkt härifrån"}
            </Typography>
          </div>
        </div>
      </DialogTitle>

      <DialogContent dividers>
        {!booking && (
          <div className="dialog-copy">
            <Typography gutterBottom>
              Den här platsen är ledig just nu.
            </Typography>
            <Typography color="textSecondary">
              {alreadyBookedThisType
                ? "Du har redan en aktiv bokning i den här kategorin. Kontakta administratör om du behöver flytta eller radera den."
                : "Du kan boka platsen direkt från den här dialogen utan att gå tillbaka till formuläret."}
            </Typography>
          </div>
        )}

        {booking && (
          <div className="dialog-copy">
            <Typography gutterBottom>
              Bokad av: {booking.name}
              {user.is_admin && hasPrivateBookingDetails && (
                <EditDialog variable="name" initial_value={booking.name} />
              )}
            </Typography>

            {hasPrivateBookingDetails ? (
              <>
                <Typography gutterBottom>
                  Klass: {booking.school_class}
                  {user.is_admin && (
                    <EditDialog
                      variable="school_class"
                      initial_value={booking.school_class}
                    />
                  )}
                </Typography>

                {user.is_admin && (
                  <Typography gutterBottom>
                    Email: {booking.email}
                    <EditDialog variable="email" initial_value={booking.email} />
                  </Typography>
                )}

                <Typography gutterBottom>
                  Bokades: {formatBookingTime(booking.time_created)}
                </Typography>
                <Typography gutterBottom>
                  Modifierades senast: {formatBookingTime(booking.time_updated)}
                </Typography>
                <Typography gutterBottom>
                  Betalstatus:{" "}
                  <span
                    className={`status-chip ${
                      booking.paid ? "success" : "pending"
                    }`}
                  >
                    {getBookingStatusLabel(booking.status)}
                  </span>
                </Typography>
                {booking.is_owner && !user.is_admin && (
                  <Typography color="textSecondary">
                    Det här är din bokning. Du kan visa betalningsdetaljer här och
                    kontakta styrelsen om du behöver hjälp med flytt eller
                    avbokning.
                  </Typography>
                )}
              </>
            ) : (
              <Typography gutterBottom>
                <span className="status-chip hidden">Detaljer dolda</span>
              </Typography>
            )}

            {!hasPrivateBookingDetails && (
              <Typography color="textSecondary">
                Den här platsen är bokad av någon annan. Personuppgifter och
                betalningsdetaljer visas bara för bokningens ägare och
                administratörer.
              </Typography>
            )}

            {hasPrivateBookingDetails && booking.paid === false && (
              <>
                <img
                  className="dialog-qr"
                  alt={`Swish QR-kod för plats ${bookingReducer.dialog_id}`}
                  src={`${BACKEND_URL}/api/booking/swish/${bookingType}/${bookingReducer.dialog_id}?${performance.now()}`}
                />
                <div className="meta-list">
                  <span>Mottagare: {event.swish_name || "Styrelsen"}</span>
                  {event.swish_phone && <span>Swish: {event.swish_phone}</span>}
                  <span>
                    Referens: {bookingTypeLabel} {bookingReducer.dialog_id}
                  </span>
                </div>
                <Typography color="textSecondary">
                  Skanna QR-koden med Swish. Vid frågor om bokning, platsbyte
                  eller betalning, kontakta {event.swish_name || "styrelsen"}.
                </Typography>
              </>
            )}
          </div>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Stäng
        </Button>

        {canBookSeatDirectly && (
          <Button
            color="primary"
            disabled={busyAction !== ""}
            onClick={bookSeat}
            variant="contained"
          >
            Boka platsen
          </Button>
        )}

        {user.is_admin && booking && hasPrivateBookingDetails && (
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={busyAction !== ""}
              onClick={deleteBooking}
            >
              Radera
            </Button>
            <Button
              color="primary"
              disabled={busyAction !== ""}
              onClick={() => changePaymentStatus(true)}
            >
              Markera som betald
            </Button>
            <Button
              color="secondary"
              disabled={busyAction !== ""}
              onClick={() => changePaymentStatus(false)}
            >
              Markera som obetald
            </Button>
            <MoveSeatDialog />
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default SeatDialog;
