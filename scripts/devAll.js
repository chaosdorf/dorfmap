// @flow
const childProcess = require('child_process');

childProcess.exec('npm run dev:server');
childProcess.spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
});
