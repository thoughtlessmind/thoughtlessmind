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

const useStyles = makeStyles((theme) => ({
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
        <AppBar position='sticky' elevation={trigger ? 4 : 0}>
          <Toolbar className={classes.toolbarContainer}>
            <Typography>Logo</Typography>
            <Box className={classes.navItemsContainer}>
              {navbarItems.map((item) => (
                <Button size='small' component='a' key={item}>
                  {item}
                </Button>
              ))}
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    </>
  )
}

export default Header
