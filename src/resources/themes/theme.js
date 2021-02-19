import { createMuiTheme, fade } from "@material-ui/core"

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      // main: "#0A192F",
      // main: "#1aeb6061",
      main: "#003049",
      dark: "#222"
    },
    secondary: {
      main: "#64ffda"
    },
    background: {
      paper: "#0A192F"
    },
    offWhite: {
      main: "rgb(136, 146, 176)"
    }
  },
  props: {
    MuiPaper: {
      elevation: 0,
      square: true
    }
  },
  overrides: {
    MuiTypography: {
      root: {
        // color: "rgb(136, 146, 176)"
        color: "rgb(187 187 187)"
      }
    },
    MuiButton: {
      root: {
        color: fade("#fff", 0.8),
        textTransform: "inherit"
      },
      textSizeSmall: {
        fontSize: "0.76rem"
      }
    }
  },
  custom: {
    fontFamily: {
      codeStyle: `"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "Lucida Console", Monaco, monospace`
    }
  }
})

export default theme
