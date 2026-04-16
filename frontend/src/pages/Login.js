import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Container, Button, CircularProgress } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Login() {
  const meta = useSelector((state) => state.systemMeta);

  const [loginUrl, setLoginUrl] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/login`)
      .then((response) => response.json())
      .then((data) => {
        setLoginUrl(data.response.login_url);
      })
      .catch((e) => {
        setError(`Ett fel uppstod: ${e}`);
      });
  }, []);

  return (
    <div className="app-shell">
      <Container className="page-shell page-shell-tight" maxWidth="md">
        <div className="hero-panel auth-card">
          <div className="hero-grid">
            <div>
              <p className="kicker">Tullinge gymnasium datorklubb</p>
              <h1 className="hero-title">Bokningssystem för nästa LAN</h1>
              <p className="hero-lead">
                Logga in med ditt Google-konto för att se bokningsläget, välja
                plats och hantera betalning inför LAN:et.
              </p>

              <div className="hero-actions">
                {loginUrl && (
                  <Button variant="contained" color="primary" href={loginUrl}>
                    Logga in med Google
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="primary"
                  href="https://member.tgdk.se"
                >
                  Bli medlem först
                </Button>
              </div>

              {!loginUrl && !error && (
                <div className="hero-actions">
                  <CircularProgress size={28} />
                </div>
              )}

              {error && <Alert severity="error">{error}</Alert>}
            </div>

            <div className="meta-stack">
              <div className="meta-row">
                <span className="meta-label">Integritet</span>
                <span className="meta-value">Sessionscookie används för inloggning</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Kontakt</span>
                <span className="meta-value">
                  <Link href="mailto:info@tgdk.se">info@tgdk.se</Link>
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Förening</span>
                <span className="meta-value">Tullinge Gymnasium Datorklubb</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-stack">
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Innan du bokar</h2>
              <p className="section-lead">
                Medlemskap krävs. Personuppgifter används bara för att hantera
                bokningen och rensas efter evenemanget.
              </p>
            </div>

            <div className="info-grid">
              <div className="summary-card">
                <strong>1. Logga in</strong>
                <span>Använd ditt Google-konto för att starta en säker session.</span>
              </div>
              <div className="summary-card">
                <strong>2. Registrera dig</strong>
                <span>Ange registreringslösenordet om du inte redan är upplagd.</span>
              </div>
            </div>
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

export default Login;
