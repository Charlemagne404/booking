import React, { useState } from "react";
import { useDispatch } from "react-redux";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Alert from "@material-ui/lab/Alert";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Link from "@material-ui/core/Link";

import { fetchBookings } from "../../redux/bookingActions";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function BookingDialog(props) {
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState([]);
  const [error, setError] = useState("");
  const [seat, setSeat] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
    setError("");
    updateAvailableSeatList();
  };

  const handleClose = () => {
    setOpen(false);
    setSeat("");
  };

  const updateAvailableSeatList = () => {
    fetch(`${BACKEND_URL}/api/booking/available`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.http_code === 200) {
          if (props.seat_type === "standard") {
            setAvailable(data.response.available_seats.map((a) => a));
          } else if (props.seat_type === "console") {
            setAvailable(data.response.available_console_seats.map((a) => a));
          } else {
            setError(
              `Allvarligt felaktigt meddelande från server: ${data.message} (${data.http_code})`
            );
          }
        } else {
          setError(`Ett fel uppstod: ${data.message} (${data.http_code})`);
        }
      })
      .catch((e) => {
        setError(`Ett fel uppstod: ${e}`);
      });
  };

  const handleSubmit = () => {
    if (seat === "") {
      setError("Välj en plats innan du fortsätter.");
      return;
    }

    fetch(`${BACKEND_URL}/api/booking/book`, {
      credentials: "include",
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seat: seat,
        seat_type: props.seat_type,
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

  return (
    <div>
      <Button variant="contained" color={props.seat_type === "standard" ? "primary" : "secondary"} onClick={handleClickOpen}>
        {props.title}
      </Button>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" fullWidth maxWidth="sm">
        <DialogTitle id="form-dialog-title">{props.title}</DialogTitle>
        <DialogContent>
          <DialogContentText className="dialog-copy">
            Använd formuläret nedan för att boka en plats. Registrera dig som
            medlem på <Link href="https://member.tgdk.se">member.tgdk.se</Link>{" "}
            innan du bokar. {props.info}
          </DialogContentText>

          <FormControl variant="outlined" fullWidth>
            <InputLabel id="booking-dialog-select-form">Plats</InputLabel>
            <Select
              labelId="booking-dialog-select-form"
              id="booking-help-label"
              value={seat}
              onChange={(e) => setSeat(e.target.value)}
              label="Plats"
            >
              {Array.from(available).map((object) => (
                <MenuItem key={object} value={object}>
                  {object}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Välj en ledig plats ur listan.</FormHelperText>
          </FormControl>

          {available.length === 0 && !error && (
            <p className="empty-note">Det finns inga lediga platser i den här kategorin just nu.</p>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Avbryt
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Boka
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BookingDialog;
