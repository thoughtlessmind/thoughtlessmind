import { Box, Divider, fade, makeStyles } from "@material-ui/core"
// import { Dev } from "resources/svg"
import Dev from "resources/svg/dev-brands.svg"
import LinkedIn from "resources/svg/linkedin-brands.svg"
import Twitter from "resources/svg/twitter-brands.svg"
import Github from "resources/svg/github-brands.svg"

const socialLinks = [
  {
    name: "Github",
    Icon: (props) => <Github {...props} />,
    link: "https://github.com/thoughtlessmind"
  },
  {
    name: "LinkedIn",
    Icon: (props) => <LinkedIn {...props} />,
    link: "https://www.linkedin.com/in/thoughtlessmind/"
  },
  {
    name: "Twitter",
    Icon: (props) => <Twitter {...props} />,
    link: "https://twitter.com/d_rajivkumar"
  },
  {
    name: "Dev",
    Icon: (props) => <Dev {...props} />,
    link: "https://dev.to/thoughtlessmind"
  }
]

const LeftSidebar = () => {
  // eslint-disable-next-line no-use-before-define
  const classes = useStyles()
  return (
    <Box className={classes.leftSideContainer}>
      {/* <Box component='ul' className={classes.linksContainer}> */}
      {socialLinks.map((link) => (
        <li key={link.name}>
          <a href={link.link} rel='noreferrer' target='_blank'>
            <link.Icon className={classes.socialLink} />
          </a>
        </li>
      ))}
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
    left: theme.spacing(5),
    // height: "100vh",
    width: theme.spacing(5),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: theme.spacing(16),
    // height:0,
    overflow: "hidden",
    animation: "$growVertically 2s 1",
    transformOrigin: "bottom",
    [theme.breakpoints.down("sm")]: {
      display: "none"
    }
  },
  "@keyframes growVertically": {
    "0%": {
      transform: "translateY(400px)"
    },
    "50%": {
      transform: "translateY(400px)"
    },
    "100%": {
      transform: "translateY(0px)"
    }
  },
  linksContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    flexDirection: "column",
    justifyContent: "flex-end",
    marginBottom: theme.spacing(16)
  },
  socialLink: {
    width: "18px",
    height: "18px",
    color: fade(theme.palette.common.white, 0.8),
    transition: theme.transitions.create(["color", "transform"]),
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.secondary.main,
      transform: "scale(1.1)"
    }
  },
  verticalLine: {
    height: theme.spacing(15),
    position: "absolute",
    bottom: 0,
    backgroundColor: theme.palette.secondary.main
  }
}))

export default LeftSidebar
