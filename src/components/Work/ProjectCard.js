import {
  Box,
  makeStyles,
  createStyles,
  Typography,
  fade,
  darken
} from "@material-ui/core"
import PropTypes from "prop-types"
import Github from "resources/svg/github-brands.svg"
import ExternalLink from "resources/svg/external-link-alt-solid.svg"

const useStyles = makeStyles((theme) =>
  createStyles({
    projectCardContainer: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(3),
      justifyContent: "space-between",
      height: 200,
      marginLeft: theme.spacing(2),
      padding: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      marginBottom: theme.spacing(2),
      // boxShadow: `2px 2px 7px 0px #000e15`
      boxShadow: `2px 2px 7px 0px ${darken(theme.palette.primary.main, 0.4)}`,
      transition: theme.transitions.create(["box-shadow"]),
      "&:hover": {
        boxShadow: `2px 2px 7px 0px ${darken(theme.palette.primary.main, 0.7)}`
      }
    },
    proejctTextContainer: {
      flexGrow: "2",
      "&>a": {
        marginBottom: theme.spacing(2),
        textDecoration: "none",
        position: "relative",
        display: "inline-block",
        "&:after": {
          position: "absolute",
          bottom: -3,
          left: 0,
          width: "30%",
          height: 1,
          background: theme.palette.secondary.main,
          content: "''",
          transition: theme.transitions.create(["width"])
        },
        "&:hover": {
          "&:after": {
            width: "90%"
          }
        }
      }
    },
    projectPic: {
      width: "auto",
      height: 180,
      flexGrow: "1",
      borderRadius: theme.shape.borderRadius
    },
    iconContainer: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(2),
      marginTop: theme.spacing(2),
      paddingLeft: theme.spacing(3),
      "&>a>svg": {
        height: 18,
        color: fade(theme.palette.common.white, 0.8),
        cursor: "pointer",
        transition: theme.transitions.create(["color", "transform"]),
        "&:hover": {
          color: theme.palette.secondary.main,
          // height: 20
          transform: "scale(1.2)"
        }
      }
    }
  })
)

const ProjectCard = (props) => {
  const { title, description, repoLink, liveLink, showcaseImage } = props
  const classes = useStyles()

  return (
    <Box className={classes.projectCardContainer}>
      <Box className={classes.proejctTextContainer}>
        <Typography variant='h6' component='a' href={liveLink}>
          {title}
        </Typography>
        <Typography variant='body2'>{description}</Typography>
        <Box className={classes.iconContainer}>
          <a href={repoLink}>
            <Github />
          </a>
          <a href={liveLink}>
            <ExternalLink />
          </a>
        </Box>
      </Box>
      {/* <Box> */}
      <img
        className={classes.projectPic}
        alt={`${title} demo`}
        src={showcaseImage}
      />
      {/* </Box> */}
    </Box>
  )
}

ProjectCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  repoLink: PropTypes.string.isRequired,
  liveLink: PropTypes.string.isRequired,
  showcaseImage: PropTypes.string.isRequired
}

export default ProjectCard
