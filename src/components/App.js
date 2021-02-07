import { Box, makeStyles, MuiThemeProvider } from "@material-ui/core"
import "../index.css"
import theme from "resources/themes"
import Header from "./Header/Header"
import LandingPage from "./LandingPage"
import LeftSidebar from "./LeftSidebar/LeftSidebar"
import RightSidebar from "./RightSidebar/RightSidebar"

const App = () => {
  const classes = useStyles()

  return (
    <MuiThemeProvider theme={theme}>
      <Box>
        <Header />
        <LeftSidebar />
        <RightSidebar />
        <Box className={classes.pageContainer}>
          <LandingPage />
        </Box>
      </Box>
    </MuiThemeProvider>
  )
}

const useStyles = makeStyles(() => ({
  pageContainer: {
    backgroundColor: theme.palette.primary.main,
    padding: theme.spacing(0, 22),
    [theme.breakpoints.down("md")]: {
      padding: theme.spacing(0, 20)
    },
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(0, 12)
    },
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(0, 4)
    }
  }
}))

export default App
