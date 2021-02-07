import { Box, fade, makeStyles, Typography } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
  landingPageContainer: {
    height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    display: "flex",
    justifyContent: "center",
    flexDirection: "column"
  },
  test: {
    color: fade(theme.palette.common.white, "0.8"),
    fontWeight: 400
  },
  tagline: {
    maxWidth: "500px",
    padding: theme.spacing(4, 0),
    letterSpacing: "0.6px",
    wordSpacing: "0.6px"
  }
}))

const LandingPage = () => {
  const classes = useStyles()
  return (
    <Box className={classes.landingPageContainer}>
      <Typography color='secondary'>Hi, my name is</Typography>
      <Typography className={classes.test} variant='h2'>
        Rajiv Kumar.
      </Typography>
      <Typography variant='h2'>
        I build things for the <span>web</span>.
      </Typography>
      <Typography className={classes.tagline}>
        I&apos;m a software engineer based in New Delhi, India specializing in
        building exceptional, high-quality websites and web applications.
      </Typography>
    </Box>
  )
}

export default LandingPage
