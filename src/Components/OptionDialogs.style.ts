import { makeStyles } from '@material-ui/styles';

export default makeStyles({
  OptionDialogs: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '5px',
    marginLeft: '10px',
    '@media (min-width: 800px)': {
      width: '70%',
    },
  },
});
