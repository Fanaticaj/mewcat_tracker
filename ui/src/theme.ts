import { alpha, createTheme } from "@mui/material/styles";

const palette = {
  ash: "#d5cbbd",
  bark: "#5a4333",
  cloud: "#f3eadf",
  ember: "#ab7b59",
  fog: "#ebe2d7",
  moss: "#6d785d",
  night: "#2d231d",
  paper: "#fbf5ec",
  roseDust: "#b97e76",
  taupe: "#8b7868",
};

export const mewTheme = createTheme({
  palette: {
    background: {
      default: palette.ash,
      paper: palette.paper,
    },
    error: {
      main: "#9a584e",
    },
    primary: {
      main: palette.bark,
      dark: "#422f24",
      light: "#7a6354",
      contrastText: "#fffaf4",
    },
    secondary: {
      main: palette.taupe,
      dark: "#655549",
      light: "#b4a291",
      contrastText: palette.night,
    },
    success: {
      main: palette.moss,
      dark: "#536048",
      light: "#96a189",
      contrastText: "#f8f5ef",
    },
    text: {
      primary: palette.night,
      secondary: "#6b5a4d",
    },
    warning: {
      main: palette.ember,
      dark: "#8e6447",
      light: "#c89c79",
      contrastText: "#fff8f1",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif',
    h3: {
      fontFamily: '"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
    overline: {
      fontWeight: 800,
    },
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
          boxShadow: "0 10px 24px rgba(48, 36, 29, 0.08)",
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderRadius: 10,
        },
        contained: ({ theme }) => ({
          backgroundImage: `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          boxShadow: "0 10px 22px rgba(60, 43, 33, 0.16)",
          "&:hover": {
            boxShadow: "0 12px 24px rgba(60, 43, 33, 0.2)",
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: alpha(theme.palette.primary.main, 0.22),
          backgroundColor: alpha(theme.palette.background.paper, 0.7),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(6px)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          fontWeight: 700,
          backgroundColor: alpha(theme.palette.background.paper, 0.72),
        }),
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "::selection": {
          background: alpha(palette.ember, 0.28),
        },
        body: {
          background: `
            radial-gradient(circle at top, rgba(251,245,236,0.94), rgba(213,203,189,0.92) 38%, rgba(180,167,150,0.88) 100%),
            linear-gradient(180deg, #efe6d8 0%, #d5cbbd 42%, #b8ac9e 100%)
          `,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.background.paper, 0.82),
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: "none",
          borderColor: alpha(theme.palette.primary.main, 0.1),
        }),
      },
    },
  },
});

export const mewPalette = palette;
