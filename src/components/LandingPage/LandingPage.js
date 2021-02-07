import React from "react"
import { Box, makeStyles, Paper, Typography } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
  test: {
    color: theme.palette.primary.main
  }
}))

const LandingPage = () => {
  const classes = useStyles()
  return (
    <Box>
      <Typography color='secondary'>Hi, my name is</Typography>
      <Typography className={classes.test} variant='h2'>
        Rajiv Kumar.
      </Typography>
      <Typography variant='h2'>I build things for web.</Typography>
    </Box>
  )
}

export default LandingPage
