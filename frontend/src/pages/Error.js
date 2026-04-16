import React from "react";
import { useSelector } from "react-redux";

import { Container, Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import Link from "@material-ui/core/Link";

function Error(props) {
  const meta = useSelector((state) => state.systemMeta);

  return (
    <div className="app-shell">
      <Container className="page-shell page-shell-tight" maxWidth="md">
        <div className="hero-panel auth-card">
          <p className="kicker">Driftfel</p>
          <h1 className="hero-title">Bokningssystemet svarar inte som det ska</h1>
          <p className="hero-lead">
            Felet ligger sannolikt i backend eller nätverksanslutningen. Ladda
            om sidan först. Om problemet kvarstår, kontakta styrelsen.
          </p>
        </div>

        <div className="section-stack">
          <div className="section-card">
            <Alert severity="error">{props.error}</Alert>
          </div>
        </div>

        <Typography align="center" className="meta-footer" variant="caption" display="block">
          Kör <Link href="https://github.com/tullingedk/booking">tullingedk/booking</Link>{" "}
          {meta.version ? meta.version : "unknown"}, commit {meta.hash ? meta.hash : "unknown"} (
          {meta.hashDate ? meta.hashDate : "unknown"})
        </Typography>
      </Container>
    </div>
  );
}

export default Error;
