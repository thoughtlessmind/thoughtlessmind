import React from "react"
import { Box, makeStyles, Typography } from "@material-ui/core"
import "../index.css"
import Header from "./Header/Header"
import LandingPage from "./LandingPage"

const App = () => {
  const classes = useStyles()

  return (
    <Box>
      <Header />
      <LandingPage />
    </Box>
  )
}

const useStyles = makeStyles(() => ({}))

export default App
