import React from "react"
import { makeStyles, AppBar, Toolbar } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
  test: {
    color: theme.palette.primary.main
  }
}))

const Header = () => {
  const classes = useStyles()

  return (
    <AppBar>
      <Toolbar className={classes.test}>HI</Toolbar>
    </AppBar>
  )
}

export default Header
