import React from "react";

import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { Alert, AlertTitle } from "@material-ui/lab";
import { Typography } from "@material-ui/core";

function ErrorDialog(props) {
  return (
    <Dialog
      open={true}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="alert-dialog-title">Ett fel uppstod</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" component="div">
          <Alert severity="error">
            <AlertTitle>Ett fel uppstod</AlertTitle>
            {props.message}
          </Alert>
          <Typography style={{ marginTop: 12 }}>
            Din webbläsare verkar ha tappat anslutningen till servern eller fått ett oväntat svar. Ladda om sidan för att försöka igen.
          </Typography>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}

export default ErrorDialog;
