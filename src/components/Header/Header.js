import {
  makeStyles,
  AppBar,
  Toolbar,
  Box,
  fade,
  useScrollTrigger,
  Button
} from "@material-ui/core"
import { HideOnScroll } from "globalComponents"
import Logo from "resources/svg/logo.svg"

const useStyles = makeStyles((theme) => ({
  appbarStyle: {
    transition: theme.transitions.create(["box-shadow"]),
    padding: theme.spacing(0, 8),
    overflow: "hidden"
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
    animation: "$slideLeft 2s",
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
    cursor: "pointer",
    height: 45
  },
  "@keyframes logoAnim": {
    "0%": {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)"
    },
    "99%": {
      left: "88px",
      top: "10px",
      position: "fixed",
      transform: "translate(0%, 0%)"
    },
    "100%": {
      // transform: "rotate(360deg)",
      position: "relative"
    }
  },
  "@keyframes logoAnimMobile": {
    "0%": {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)"
    },
    "99%": {
      left: "36px",
      top: "8px",
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
    },
    appbarStyle: {
      padding: theme.spacing(0, 2)
    },
    logoStyle: {
      animation: "$logoAnimMobile 1s"
    }
  },
  "@keyframes slideLeft": {
    //   from: {
    //     transform: "translate(80%, 0)"
    //   },
    //   to: {
    //     transform: "translate(0, 0)"
    //   }
    // }
    "0%": {
      transform: "translate(120%, 0)"
    },
    "35%": {
      transform: "translate(120%, 0)"
    },
    "100%": {
      transform: "translate(0, 0)"
    }
  }
}))

const navbarItems = ["About", "Work", "Contact"]

const Header = () => {
  const classes = useStyles()
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0
  })

  const handleNavigation = (navTarget) => {
    document.getElementById("about-section").scrollIntoView({
      behavior: "smooth",
      block: "start"
    })
    // document.getElementById(navTarget).scrollIntoView(true)
  }

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
                <Button
                  size='small'
                  onClick={handleNavigation}
                  component='a'
                  key={item}
                >
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
