import { Box, Divider, fade, makeStyles, Typography } from "@material-ui/core"

const RightSidebar = () => {
  const classes = useStyles()
  return (
    <Box className={classes.leftSideContainer}>
      {/* <Box component='ul' className={classes.linksContainer}> */}
      <Typography
        component='a'
        className={classes.linkStyle}
        href='mailto:me.rajiv21@gmail.com'
      >
        me.rajiv21@gmail.com
      </Typography>
      {/* </Box> */}
      <Divider orientation='vertical' className={classes.verticalLine} />
    </Box>
  )
}

const useStyles = makeStyles((theme) => ({
  leftSideContainer: {
    listStyle: "none",
    position: "fixed",
    bottom: "0",
    right: theme.spacing(5),
    left: "auto",
    // height: "100vh",
    width: theme.spacing(5),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: theme.spacing(16),
    animation: "$growVertically 2s 1",
    transformOrigin: "bottom",
    [theme.breakpoints.down("sm")]: {
      display: "none"
    }
  },
  "@keyframes growVertically": {
    "0%": {
      transform: "scaleY(0)"
    },
    "100%": {
      transform: "scaleY(1)"
    }
  },
  linkStyle: {
    writingMode: "vertical-rl",
    textDecoration: "none",
    fontFamily: theme.custom.fontFamily.codeStyle,
    fontSize: 12,
    padding: theme.spacing(1),
    letterSpacing: "0.1em",
    color: fade(theme.palette.common.white, 0.8),
    fontWeight: 300,
    transition: theme.transitions.create(["color"]),
    "&:hover": {
      color: theme.palette.secondary.main
    }
  },
  verticalLine: {
    height: theme.spacing(15),
    position: "absolute",
    bottom: 0,
    backgroundColor: theme.palette.secondary.main
  }
}))

export default RightSidebar
