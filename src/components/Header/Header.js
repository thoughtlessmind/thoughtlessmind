import {
  makeStyles,
  AppBar,
  Toolbar,
  Box,
  Typography,
  fade,
  useScrollTrigger,
  Button
} from "@material-ui/core"
import { HideOnScroll } from "globalComponents"
import Logo from "resources/svg/logo.svg"

const useStyles = makeStyles((theme) => ({
  appbarStyle: {
    transition: theme.transitions.create(["box-shadow"]),
    padding: theme.spacing(0, 4)
  },
  toolbarContainer: {
    // color: theme.palette.primary.main
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  navItemsContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    "&>a": {
      fontFamily: theme.custom.fontFamily.codeStyle,
      transition: theme.transitions.create(["color", "background-color"]),
      "&:hover": {
        backgroundColor: fade(theme.palette.secondary.main, 0.1),
        color: theme.palette.secondary.main
      }
    }
  },
  logoStyle: {
    animation: "$logoAnim 1s",
    cursor: "pointer"
    // left: "60px",
    // top: "20px",
    // transform: "translate(0%, 0%)"
  },
  "@keyframes logoAnim": {
    "0%": {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)"
    },
    "99%": {
      left: "56px",
      top: "10px",
      position: "fixed",
      transform: "translate(0%, 0%)"
    },
    "100%": {
      // transform: "rotate(360deg)",
      position: "relative"
    }
  },
  [theme.breakpoints.down("xs")]: {
    navItemsContainer: {
      display: "none"
    }
  }
}))

const navbarItems = ["About", "Experience", "Work", "Contact"]

const Header = () => {
  const classes = useStyles()
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0
  })

  return (
    <>
      <HideOnScroll threshold={100}>
        <AppBar
          className={classes.appbarStyle}
          position='sticky'
          elevation={trigger ? 8 : 0}
        >
          <Toolbar component='nav' className={classes.toolbarContainer}>
            <Box>
              {/* <Box>
                <Logo style={{ width: 40, height: 40 }} />
              </Box> */}
              <Box className={classes.logoStyle}>
                <Logo style={{ width: 45, height: 45 }} />
              </Box>
            </Box>
            <Box className={classes.navItemsContainer}>
              {navbarItems.map((item) => (
                <Button size='small' component='a' key={item}>
                  {item}
                </Button>
              ))}
              <Button
                target='_blank'
                component='a'
                variant='outlined'
                href='https://github.com/thoughtlessmind'
              >
                Github
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    </>
  )
}

export default Header
