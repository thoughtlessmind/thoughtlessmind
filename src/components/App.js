import React from "react"
import { Box, makeStyles, createStyles, Typography } from "@material-ui/core"
import "../index.css"
import Header from "./Header/Header"

const App = () => {
  const classes = useStyles()

  return (
    <Box>
      <Header />
      <Typography variant='h2'>Hi</Typography>
    </Box>
  )
}

const useStyles = makeStyles((theme) => ({}))

export default App
