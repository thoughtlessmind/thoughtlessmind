import React, { useEffect } from "react";
import {
  Box,
  makeStyles,
  createStyles,
  AppBar,
  Toolbar,
} from "@material-ui/core";

const Header = () => {
  const classes = useStyles();

  useEffect(() => {
    console.log("asdf");
  }, []);

  return (
    <AppBar>
      <Toolbar>HI</Toolbar>
    </AppBar>
  );
};

const useStyles = makeStyles((theme) => ({}));

export default Header;
