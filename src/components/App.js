import React from "react"
import {
  Box,
  makeStyles,
  MuiThemeProvider,
  Typography
} from "@material-ui/core"
import "../index.css"
import theme from "resources/themes"
import Header from "./Header/Header"
import LandingPage from "./LandingPage"

const App = () => {
  const classes = useStyles()

  return (
    <MuiThemeProvider theme={theme}>
      <Box>
        <Header />
        <Box className={classes.pageContainer}>
          <LandingPage />
        </Box>
      </Box>
    </MuiThemeProvider>
  )
}

const useStyles = makeStyles(() => ({
  pageContainer: {
    backgroundColor: theme.palette.primary.main
  }
}))

export default App
