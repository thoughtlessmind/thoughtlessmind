import React from "react"
import { Box, makeStyles, Typography } from "@material-ui/core"

const useStyles = makeStyles(() => ({}))

const LandingPage = () => {
  const classes = useStyles()
  return (
    <Box>
      <Typography>Hi, my name is</Typography>
      <Typography variant='h2'>Rajiv Kumar.</Typography>
      <Typography variant='h2'>I build things for web.</Typography>
    </Box>
  )
}

export default LandingPage
