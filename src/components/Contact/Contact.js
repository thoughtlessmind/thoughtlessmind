import React from "react"
import {
  Box,
  makeStyles,
  createStyles,
  Typography,
  Button,
  Divider,
  fade
} from "@material-ui/core"
import Stackoverflow from "resources/svg/stack-overflow-brands.svg"
import Dev from "resources/svg/dev-brands.svg"
import Github from "resources/svg/github-brands.svg"

const socialLinks = [
  {
    name: "Stackoverflow",
    Icon: (props) => <Stackoverflow {...props} />,
    link: "https://stackoverflow.com/users/11222282/rajiv"
  },
  {
    name: "Dev",
    Icon: (props) => <Dev {...props} />,
    link: "https://dev.to/thoughtlessmind"
  },
  {
    name: "Github",
    Icon: (props) => <Github {...props} />,
    link: "https://github.com/thoughtlessmind"
  }
]
const useStyles = makeStyles((theme) =>
  createStyles({
    contactContaine: {
      // minHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
      minHeight: "100vh",
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
    helloButton: {
      padding: theme.spacing(2, 4),
      display: "block",
      textAlign: "center",
      margin: "0 auto",
      width: 150,
      marginTop: theme.spacing(2)
    },
    iconsContainer: {
      marginTop: theme.spacing(3),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(4),
      "&>svg": {
        width: theme.spacing(3),
        cursor: "pointer",
        color: fade(theme.palette.common.white, 0.8),
        transition: theme.transitions.create("transform"),
        "&:hover": {
          color: theme.palette.secondary.main,
          transform: "scale(1.1)"
        }
      }
    }
  })
)

const Contact = () => {
  const classes = useStyles()
  return (
    <Box className={classes.contactContaine} id='contact-section'>
      <Typography className={classes.sectionHeading} variant='h5'>
        Contact
      </Typography>
      <Box p={3}>
        <Typography align='center'>
          If you&apos;ve found anything intersing here or just wana have some
          technical chitchat, feel free to drop a mail. <br />
          I&apos;ll try my best to answer.
        </Typography>
        <Button
          component='a'
          href='mailto:me.rajiv21@gmail.com'
          variant='outlined'
          size='large'
          color='secondary'
          className={classes.helloButton}
        >
          Say Hello
        </Button>
      </Box>
      <Divider style={{ margin: "32px auto", width: "80%" }} />
      <Box p={3}>
        <Typography align='center'>
          Me and other works can be found here:
        </Typography>
        <Box className={classes.iconsContainer}>
          {socialLinks.map((link) => (
            <link.Icon />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default Contact
