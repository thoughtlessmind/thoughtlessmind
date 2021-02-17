import { Box, darken, fade, makeStyles, Typography } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
  landingPageContainer: {
    height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    animation: "$slideDown 1.5s"
  },
  "@keyframes slideDown": {
    "0%": {
      // transform: "translate(0, -80%)"
      transform: "translate(-80%, 0)"
    },
    // "35%": {
    //   transform: "translate(0, -80%)"
    // },
    "100%": {
      transform: "translate(0, 0)"
    }
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
  },
  webWord: {
    zIndex: 20,
    position: "relative",
    color: "#fff",
    "&:after": {
      content: `""`,
      position: "absolute",
      bottom: 5,
      left: 0,
      backgroundColor: darken(theme.palette.secondary.main, 0.4),
      width: "100%",
      height: 16,
      zIndex: -2,
      transform: "skewX(307deg)",
      transition: theme.transitions.create([
        "transform",
        "bottom",
        "box-shadow"
      ]),
      boxShadow: "3px 3px 2px 1px #2323236b"
    },
    "&:hover": {
      "&:after": {
        // transform: "skewX(300deg)",
        bottom: 3,
        boxShadow: "none"
        // transform: "skewX(307deg) skewY(2deg)"
      }
    }
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
        I build things for the <span className={classes.webWord}>web</span>.
      </Typography>
      <Typography className={classes.tagline}>
        I&apos;m a software engineer based in New Delhi, India specializing in
        building exceptional, high-quality websites and web applications.
      </Typography>
    </Box>
  )
}

export default LandingPage
