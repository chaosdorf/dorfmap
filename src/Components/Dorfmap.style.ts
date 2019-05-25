import { makeStyles } from '@material-ui/styles';

export default makeStyles({
  '@global': {
    a: {
      textDecoration: 'none',
    },
    html: {
      fontFamily: 'Roboto, sans-serif',
    },
    '#wrapperWrapper': {
      position: 'relative',
      overflow: 'hidden',
    },
    '#dorfmapWrapper': {
      position: 'relative',
      overflow: 'auto',
    },
  },
});
