import { useScrollTrigger, Slide } from "@material-ui/core"
import PropTypes from "prop-types"

const HideOnScroll = (props) => {
  const { children, threshold = 0, direction = "down" } = props
  const trigger = useScrollTrigger({
    threshold
  })

  return (
    <Slide appear={false} direction={direction} in={!trigger}>
      {children}
    </Slide>
  )
}
HideOnScroll.propTypes = {
  children: PropTypes.element.isRequired,
  threshold: PropTypes.number,
  direction: PropTypes.string
}

HideOnScroll.defaultProps = {
  threshold: 0,
  direction: "down"
}

export default HideOnScroll
