import { createMuiTheme } from "@material-ui/core"

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#0A192F"
    },
    secondary: {
      main: "#64ffda"
    },
    background: {
      paper: "#0A192F"
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
        color: "rgb(136, 146, 176)"
      }
    },
    MuiButton: {
      root: {
        color: "rgb(136, 146, 176)",
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
