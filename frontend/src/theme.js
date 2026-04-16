import { createMuiTheme } from "@material-ui/core/styles";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#0055bb",
      dark: "#003d88",
      light: "#4b88d3",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5f6b7a",
      dark: "#32404f",
      contrastText: "#ffffff",
    },
    error: {
      main: "#bb2d3b",
    },
    warning: {
      main: "#d39b16",
    },
    background: {
      default: "#f6f9fc",
      paper: "rgba(255, 255, 255, 0.92)",
    },
    text: {
      primary: "#111111",
      secondary: "#4d4d4d",
    },
  },
  typography: {
    fontFamily: '"Roboto", Arial, sans-serif',
    h1: {
      fontSize: "2.6rem",
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "1.35rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: "1.1rem",
      fontWeight: 700,
      lineHeight: 1.25,
    },
    h5: {
      fontSize: "1rem",
      fontWeight: 700,
    },
    h6: {
      fontSize: "0.95rem",
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.7,
      letterSpacing: "0.01em",
    },
    body2: {
      fontSize: "0.95rem",
      lineHeight: 1.65,
      letterSpacing: "0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    caption: {
      fontSize: "0.82rem",
      lineHeight: 1.5,
      color: "#5f6b7a",
    },
  },
  shape: {
    borderRadius: 16,
  },
  overrides: {
    MuiCssBaseline: {
      "@global": {
        a: {
          color: "#0055bb",
        },
        "a:visited": {
          color: "#0055bb",
        },
      },
    },
    MuiAppBar: {
      colorPrimary: {
        backgroundColor: "rgba(255, 255, 255, 0.84)",
        color: "#111111",
        boxShadow: "0 8px 24px rgba(17, 17, 17, 0.06)",
        borderBottom: "1px solid rgba(17, 17, 17, 0.08)",
        backdropFilter: "blur(12px)",
      },
    },
    MuiToolbar: {
      root: {
        minHeight: 72,
      },
    },
    MuiPaper: {
      rounded: {
        borderRadius: 16,
      },
      elevation1: {
        boxShadow: "0 12px 28px rgba(17, 17, 17, 0.05)",
        border: "1px solid rgba(17, 17, 17, 0.06)",
        backgroundColor: "rgba(255, 255, 255, 0.88)",
      },
    },
    MuiButton: {
      root: {
        borderRadius: 999,
        padding: "0.75rem 1.2rem",
      },
      containedPrimary: {
        boxShadow: "0 10px 24px rgba(0, 85, 187, 0.22)",
      },
      outlinedPrimary: {
        backgroundColor: "rgba(255, 255, 255, 0.86)",
      },
    },
    MuiDialogPaper: {
      rounded: {
        borderRadius: 20,
      },
      paper: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 24px 60px rgba(17, 17, 17, 0.14)",
        border: "1px solid rgba(17, 17, 17, 0.06)",
      },
    },
    MuiDialogTitle: {
      root: {
        paddingBottom: 8,
      },
    },
    MuiDialogContent: {
      root: {
        paddingTop: 8,
      },
    },
    MuiInputBase: {
      root: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      },
      input: {
        borderRadius: 12,
      },
    },
    MuiOutlinedInput: {
      root: {
        borderRadius: 12,
      },
    },
    MuiMenu: {
      paper: {
        borderRadius: 16,
      },
    },
    MuiAvatar: {
      root: {
        border: "1px solid rgba(17, 17, 17, 0.08)",
      },
    },
  },
});

export default theme;
