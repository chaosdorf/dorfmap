import { makeStyles } from '@material-ui/styles';

export default makeStyles({
  lamp: {
    position: 'absolute',
  },
  writeable: {
    cursor: 'pointer',
    transition: '300ms linear',
    '&:hover': {
      transform: 'scale(1.3)',
    },
  },
});
