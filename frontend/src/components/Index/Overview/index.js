import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import { useSelector, useDispatch } from "react-redux";
import { setBookingDialog } from "../../../redux/bookingActions";

import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "grid",
    gap: theme.spacing(3),
  },
  seatCard: {
    padding: theme.spacing(1.2),
    textAlign: "center",
    color: theme.palette.text.primary,
    cursor: "pointer",
    fontWeight: 700,
    transition: "transform 120ms ease, box-shadow 120ms ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 18px 36px rgba(17, 17, 17, 0.08)",
    },
  },
}));

function isEven(n) {
  return n % 2 === 0;
}

function isOdd(n) {
  return Math.abs(n % 2) === 1;
}

function getBookingAppearance(booking) {
  if (!booking) {
    return { backgroundColor: "rgba(255, 255, 255, 0.92)" };
  }

  if (booking.paid === null) {
    return { backgroundColor: "#d7e8ff" };
  }

  return {
    backgroundColor: booking.paid ? "#ff8a80" : "#ffe082",
  };
}

function getBookingLabel(booking) {
  if (!booking) {
    return "Ledig plats";
  }

  if (booking.paid === null) {
    return "Platsen är upptagen";
  }

  return `${booking.name} ${booking.school_class}`.trim();
}

function Overview() {
  const classes = useStyles();

  const bookings = useSelector((state) => state.bookingReducer.bookings);
  const consoleBookings = useSelector(
    (state) => state.bookingReducer.console_bookings
  );

  const dispatch = useDispatch();

  function Row(props) {
    return (
      <>
        {Array(parseInt(props.max, 10) - parseInt(props.min, 10) + 1)
          .fill()
          .map((_, idx) => parseInt(props.min, 10) + idx)
          .map((id) => {
            let tableSpacing = 0;
            if (isEven(props.min) && isEven(id)) {
              tableSpacing = 20;
            }
            if (isOdd(props.min) && isOdd(id)) {
              tableSpacing = 20;
            }
            const booking =
              props.seat_type === "standard"
                ? bookings.find((seat) => seat.seat === id)
                : consoleBookings.find((seat) => seat.seat === id);
            return (
              <Grid
                style={{ paddingLeft: `${tableSpacing}px` }}
                key={id}
                item
                xs={4}
                sm={2}
              >
                <Tooltip title={getBookingLabel(booking)} placement="top">
                  <Paper
                    style={getBookingAppearance(booking)}
                    className={classes.seatCard}
                    onClick={() =>
                      dispatch(setBookingDialog(true, id, props.seat_type))
                    }
                  >
                    {id}
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
      </>
    );
  }

  return (
    <div className={classes.root}>
      <div className="seat-section">
        <Typography className="seat-section-title">
          Platser för deltagare med egen dator eller konsol
        </Typography>
        <Grid container spacing={1}>
          <Grid container item xs={12} spacing={1}>
            <Row min={1} max={6} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={7} max={12} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={13} max={18} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={19} max={24} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={25} max={30} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={31} max={36} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={37} max={42} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={43} max={48} seat_type="standard" />
          </Grid>
          <Grid container item xs={12} spacing={1}>
            <Row min={49} max={55} seat_type="standard" />
          </Grid>
        </Grid>
      </div>

      <div className="seat-section">
        <Typography className="seat-section-title">
          Platser utan bordsplacering
        </Typography>
        <Grid container spacing={1}>
          <Grid container item xs={12} spacing={1}>
            <Row min={1} max={20} seat_type="console" />
          </Grid>
        </Grid>
      </div>
    </div>
  );
}

export default Overview;
