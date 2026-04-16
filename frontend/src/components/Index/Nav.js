import React, { useState } from "react";
import { useSelector } from "react-redux";

import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Avatar from "@material-ui/core/Avatar";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";

function Nav() {
  const user = useSelector((state) => state.user);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <div style={{ flexGrow: 1 }}>
          <Typography className="top-nav-title" variant="h6">
            Tullinge gymnasium datorklubb
          </Typography>
          <Typography className="top-nav-subtitle" variant="body2">
            LAN-bokning och platsöversikt
          </Typography>
        </div>

        <div className="user-badge">
          <div className="user-badge-copy">
            <span className="user-badge-role">{user.is_admin ? "Admin" : "Medlem"}</span>
            <span className="user-badge-name">{user.name}</span>
            <span className="user-badge-class">{user.school_class}</span>
          </div>
          <IconButton
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar alt={user.name} src={user.avatar} />
          </IconButton>
        </div>

        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={open}
          onClose={handleClose}
        >
          <MenuItem
            onClick={() => {
              window.location.replace(`${BACKEND_URL}/api/auth/logout`);
            }}
          >
            Logga ut
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Nav;
