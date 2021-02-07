import React from "react"
import {
  makeStyles,
  AppBar,
  Toolbar,
  Box,
  Typography,
  fade,
  useScrollTrigger
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
      cursor: "pointer",
      padding: theme.spacing(1, 2),
      backgroundColor: fade("#fff", 0.05),
      borderRadius: theme.shape.borderRadius,
      userSelect: "none",
      "&:hover": {
        backgroundColor: fade("#fff", 0.2)
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
      <HideOnScroll threshold={20}>
        <AppBar elevation={trigger ? 4 : 0}>
          <Toolbar className={classes.toolbarContainer}>
            <Typography>Logo</Typography>
            <Box className={classes.navItemsContainer}>
              {navbarItems.map((item) => (
                <Typography component='a' key={item}>
                  {item}
                </Typography>
              ))}
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    </>
  )
}

export default Header
