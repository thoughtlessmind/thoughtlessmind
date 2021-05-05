import { Box, makeStyles, createStyles, Typography } from "@material-ui/core"
import { useState } from "react"
import ytPlaylistGif from "resources/images/ytPlaylistinfoSS.png"
import tooltipDemo from "resources/images/tooltipDemo.gif"
import ProjectCard from "./ProjectCard"

const useStyles = makeStyles((theme) =>
  createStyles({
    workPageContainer: {
      minHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
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
    }
  })
)

const Work = () => {
  const classes = useStyles()
  const [myProjects] = useState([
    {
      title: "YouTube Playlist Info",
      description:
        "A react app which calculates and shows the total time required to watch a complete YouTube playlist by using playlist url. User can play the list's video here and also open those videos in youtube directly.",
      repoLink: "https://github.com/thoughtlessmind/youtube-playlist-info",
      liveLink: "https://youtube-playlist-info.netlify.app",
      showcaseImage: ytPlaylistGif
    },
    {
      title: "css-only-tooltip",
      description:
        "A very lightweight tooltip utitlity library, made using only CSS with dynamic light and dark themes.",
      repoLink: "https://github.com/thoughtlessmind/css-only-tooltip",
      liveLink: "https://www.npmjs.com/package/css-only-tooltip",
      showcaseImage: tooltipDemo
    }
  ])
  return (
    <Box className={classes.workPageContainer} id='work-section'>
      <Typography variant='h5' className={classes.sectionHeading}>
        Work
      </Typography>
      {myProjects.map((project) => (
        <ProjectCard
          key={project.title}
          title={project.title}
          description={project.description}
          repoLink={project.repoLink}
          liveLink={project.liveLink}
          showcaseImage={project.showcaseImage}
        />
      ))}
    </Box>
  )
}

export default Work
