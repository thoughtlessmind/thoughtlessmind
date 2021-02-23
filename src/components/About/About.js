import {
  Box,
  makeStyles,
  createStyles,
  Typography,
  fade
} from "@material-ui/core"
import ReactLogo from "resources/svg/react-logo.svg"
import GitLogo from "resources/svg/git-brand-logo.svg"
import HtmlLogo from "resources/svg/html5-logo.svg"
import Css3Logo from "resources/svg/css3-logo.svg"
import GithubLogo from "resources/svg/github-brand-logo.svg"
import JsLogo from "resources/svg/js-square-logo.svg"

const techs = [
  {
    name: "javascript",
    Icon: JsLogo,
    color: "#f0db4f"
  },
  {
    name: "reactjs",
    Icon: ReactLogo,
    color: "#61DBFB"
  },
  {
    name: "html",
    Icon: HtmlLogo,
    color: "#FF5733"
  },
  {
    name: "css",
    Icon: Css3Logo,
    color: "#264de4"
  },
  {
    name: "git",
    Icon: GitLogo,
    color: "#f44d27"
  },
  {
    name: "github",
    Icon: GithubLogo,
    color: "#000"
  }
]

const useStyles = makeStyles((theme) =>
  createStyles({
    aboutPageContainer: {
      // height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
      height: "100vh",
      padding: theme.spacing(2, 0),
      paddingTop: theme.mixins.toolbar.minHeight + 15
    },
    sectionHeading: {
      position: "relative",
      marginBottom: theme.spacing(2),
      color: theme.palette.common.white,
      "&:after": {
        content: "''",
        position: "absolute",
        width: "40%",
        height: 1,
        backgroundColor: theme.palette.offWhite.main,
        top: "50%",
        left: 150
      }
    },
    aboutText: {
      lineHeight: 1.3,
      letterSpacing: 0.3,
      wordSpacing: 0.6
    },
    contentContainer: {
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing(5),
      paddingTop: theme.spacing(4),
      height: "60%",
      "&> div:first-child": {
        width: "60%"
      },
      "&> div:last-child": {
        width: "40%"
      }
    },
    animContainer: {
      backgroundColor: fade("#fff", 0.1),
      height: " 30vh"
    },
    jsWordStyle: {
      position: "relative",
      background: "linear-gradient(to top, #ecec0654 39%, transparent 30%)",
      color: "#fff"
    },
    reactWordStyle: {
      background: "linear-gradient(to top, #61dafb7a 39%, transparent 30%)",
      color: "#fff"
    },
    logosContainer: {
      display: "flex",
      alignItems: "center",
      marginTop: theme.spacing(2),
      gap: theme.spacing(2),
      "&>svg": {
        width: 35,
        height: 35,
        cursor: "pointer",
        color: `${fade(theme.palette.common.white, 0.8)}`,
        transition: "color 0.3s",
        "&:hover": {
          "&.logo0": {
            color: techs[0].color
          },
          "&.logo1": {
            color: techs[1].color
          },
          "&.logo2": {
            color: techs[2].color
          },
          "&.logo3": {
            color: techs[3].color
          },
          "&.logo4": {
            color: techs[4].color
          },
          "&.logo5": {
            color: techs[5].color
          }
        }
      }
    },
    [theme.breakpoints.down("xs")]: {
      contentContainer: {
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
        gap: theme.spacing(5),
        paddingTop: theme.spacing(2),
        "&> div:first-child": {
          width: "100%"
        },
        "&> div:last-child": {
          display: "none"
        }
      }
    }
  })
)

const About = () => {
  const classes = useStyles()
  return (
    <Box className={classes.aboutPageContainer} id='about-section'>
      <Typography variant='h5' className={classes.sectionHeading}>
        About me
      </Typography>
      <Box className={classes.contentContainer}>
        <Box>
          <Typography className={classes.aboutText}>
            Hello! I&apos;m Rajiv, a frontend web developer who enjoys building
            things that live on the internet.
            {/* I develop websites
            and web apps that provide intuitive, pixel-perfect user interfaces
            with efficient and modern infrastrucures. */}
          </Typography>
          <Typography style={{ marginTop: 8 }} className={classes.aboutText}>
            I love working with{" "}
            <span className={classes.jsWordStyle}>Javascript</span> and web
            technologies. I majorly work with{" "}
            <span className={classes.reactWordStyle}>React</span> and frontend
            tools and technologies.
          </Typography>
          <Typography style={{ marginTop: 8 }} className={classes.aboutText}>
            Besides this, I strictly prefer writing well-documented readable
            code.
          </Typography>
          <Typography style={{ marginTop: 32 }} className={classes.aboutText}>
            Technologies I work with:
          </Typography>
          <Box className={classes.logosContainer}>
            {techs.map((item, index) => (
              <item.Icon key={item.name} className={`logo${index}`} />
            ))}
          </Box>
        </Box>
        <Box className={classes.animContainer}> </Box>
      </Box>
    </Box>
  )
}

export default About
