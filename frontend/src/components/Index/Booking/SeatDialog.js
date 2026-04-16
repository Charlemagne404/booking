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

  const handleClose = () => {
    setError("");
    dispatch(setBookingDialog(false, null, null));
  };

  const changePaymentStatus = (paymentStatus) => {
    fetch(`${BACKEND_URL}/api/booking/${bookingReducer.dialog_id}`, {
      credentials: "include",
      method: "put",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paid: paymentStatus,
        seat_type: bookingReducer.dialog_seat_type,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.http_code === 200) {
          dispatch(fetchBookings());
        } else {
          setError(`Ett fel uppstod: ${data.message} (${data.http_code})`);
        }
      })
      .catch((e) => {
        setError(`Ett fel uppstod: ${e}`);
      });
  };

  const deleteBooking = () => {
    fetch(`${BACKEND_URL}/api/booking/${bookingReducer.dialog_id}`, {
      credentials: "include",
      method: "delete",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seat_type: bookingReducer.dialog_seat_type,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.http_code === 200) {
          dispatch(fetchBookings());
          handleClose();
        } else {
          setError(`Ett fel uppstod: ${data.message} (${data.http_code})`);
        }
      })
      .catch((e) => {
        setError(`Ett fel uppstod: ${e}`);
      });
  };

  const bookingTypeLabel =
    bookingReducer.dialog_seat_type === "standard"
      ? "Plats med bordsplacering"
      : "Plats utan bordsplacering";
  const hasPrivateBookingDetails = booking && booking.paid !== null;
  const avatarSeed = booking ? booking.email || booking.name || String(booking.seat) : "seat";

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
            src={booking && booking.picture_url ? booking.picture_url : `https://www.gravatar.com/avatar/${md5(avatarSeed)}`}
          />
          <div>
            <Typography variant="h6">{bookingTypeLabel} {bookingReducer.dialog_id}</Typography>
            <Typography variant="body2" color="textSecondary">
              {booking ? "Detaljer för vald plats" : "Platsen är ledig just nu"}
            </Typography>
          </div>
        </div>
      </DialogTitle>

      <DialogContent dividers>
        {!booking && (
          <div className="dialog-copy">
            <Typography gutterBottom>Den här platsen är ledig just nu.</Typography>
            <Typography color="textSecondary">
              Stäng dialogen och använd bokningsknappen för att välja platsen i rätt kategori.
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
                  Bokades: {booking.time_created || "Okänt"}
                </Typography>
                <Typography gutterBottom>
                  Modifierades senast: {booking.time_updated || "Inte ändrad ännu"}
                </Typography>
                <Typography gutterBottom>
                  Betalstatus:{" "}
                  <span className={`status-chip ${booking.paid ? "success" : "pending"}`}>
                    {booking.paid ? "Markerad som betald" : "Väntar på betalning"}
                  </span>
                </Typography>
              </>
            ) : (
              <Typography gutterBottom>
                <span className="status-chip hidden">Detaljer dolda</span>
              </Typography>
            )}

            {!hasPrivateBookingDetails && (
              <Typography color="textSecondary">
                Den här platsen är bokad av någon annan. Personuppgifter och betalningsdetaljer visas bara för bokningens ägare och administratörer.
              </Typography>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {hasPrivateBookingDetails && booking.paid === false && (
              <>
                <img
                  className="dialog-qr"
                  alt={`Swish QR-kod för plats ${bookingReducer.dialog_id}`}
                  src={`${BACKEND_URL}/api/booking/swish/${bookingReducer.dialog_seat_type}/${bookingReducer.dialog_id}?${performance.now()}`}
                />
                <Typography color="textSecondary">
                  Skanna QR-koden med Swish. Vid frågor om bokning, platsbyte eller betalning, kontakta {event.swish_name || "styrelsen"}.
                </Typography>
              </>
            )}
          </div>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Stäng
        </Button>
        {user.is_admin && booking && hasPrivateBookingDetails && (
          <>
            <Button variant="outlined" color="secondary" onClick={() => deleteBooking()}>
              Radera
            </Button>
            <Button onClick={() => changePaymentStatus(true)} color="primary">
              Markera som betald
            </Button>
            <Button onClick={() => changePaymentStatus(false)} color="secondary">
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
