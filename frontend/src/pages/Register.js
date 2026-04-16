import React, { useState } from "react";

import {
  Container,
  TextField,
  Button,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Register() {
  const [password, setPassword] = useState("");
  const [schoolClass, setSchoolClass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }

    fetch(`${BACKEND_URL}/api/auth/register`, {
      credentials: "include",
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: password,
        school_class: schoolClass,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.http_code === 200) {
          window.location.reload();
        } else {
          setError(`${data.message} (${data.http_code})`);
        }
      })
      .catch((e) => {
        setError(`Ett fel uppstod: ${e}`);
      });
  };

  return (
    <div className="app-shell">
      <Container className="page-shell page-shell-tight" maxWidth="md">
        <div className="hero-panel auth-card">
          <div className="hero-grid">
            <div>
              <p className="kicker">Första gången här</p>
              <h1 className="hero-title">Slutför registreringen</h1>
              <p className="hero-lead">
                Du är redan inloggad. Ange registreringslösenordet och din klass
                för att kunna boka plats på LAN:et.
              </p>
            </div>

            <div className="meta-stack">
              <div className="meta-row">
                <span className="meta-label">Behövs</span>
                <span className="meta-value">Registreringslösenord från styrelsen</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Efteråt</span>
                <span className="meta-value">Du kommer direkt in i bokningsvyn</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-stack">
          <div className="section-card">
            <form className="form-stack" onSubmit={handleSubmit} noValidate autoComplete="off">
              <TextField
                label="Lösenord"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Ange registreringslösenordet från datorklubbens styrelse."
                fullWidth
              />
              <TextField
                label="Klass"
                variant="outlined"
                value={schoolClass}
                onChange={(e) => setSchoolClass(e.target.value)}
                helperText="Ange namnet på din klass."
                fullWidth
              />
              <div className="hero-actions">
                <Button variant="contained" color="primary" type="submit">
                  Registrera
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  href={`${BACKEND_URL}/api/auth/logout`}
                >
                  Logga ut
                </Button>
              </div>
            </form>
            {error && <Alert severity="error">{error}</Alert>}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Register;
