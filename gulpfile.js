var gulp = require('gulp'),
jshint = require('gulp-jshint'),
stylish = require('jshint-stylish'),
gutil = require('gulp-util'),
browserify = require('gulp-browserify'),
concat = require('gulp-concat'),
cssmin = require('gulp-cssmin'),
jade = require('gulp-jade'),
exec = require('gulp-exec'),
plainExec = require('child_process').exec,
less = require('gulp-less'),
bower = require('bower'),
debowerify = require('debowerify'),
fs = require('fs');

var fatalLevel = require('yargs').argv.fatal;

gulp.task('perltidy', function() {
  gulp.src('index.pl')
  .pipe(exec('perl -c <%= file.path %>'))
  .pipe(exec('perltidy -b <%= file.path %>'))
  .pipe(exec('rm <%= file.path %>.bak'))
  .pipe(exec.reporter());
});

gulp.task('perlStart',function() {
  plainExec('MOJO_LISTEN="http://*:8081" MOJO_MODE="development" hypnotoad index.pl')
});

gulp.task('perlStop',function() {
  plainExec('hypnotoad -s index.pl')
});

gulp.task('debugIndicator', function() {
  //plainExec('touch DEBUG_DO_NOT_COMMIT');
});

gulp.task('releaseIndicator', function() {
  plainExec('rm -f DEBUG_DO_NOT_COMMIT');
})

gulp.task('lint', function() {
  gulp.src('src/js/*.js')
  .pipe(jshint())
  .pipe(jshint.reporter(stylish));
});

gulp.task('scriptsDebug', function() {
    gulp.src(['src/js/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'))
    .pipe(browserify({
      insertGlobals: true,
      transform: ['debowerify'],
      debug: true
    }))
    .pipe(concat('dorfmap.min.js'))
    .pipe(gulp.dest('public/js'));
});

gulp.task('scriptsRelease', function() {
  try {
    gulp.src(['src/js/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'))
    .pipe(browserify({
      transform: [[{ global: true, beautify: true, mangle: false }, 'uglifyify'],'debowerify'],
      gzip: true,
      insertGlobals: true,
      debug: false
    }))
    .pipe(concat('dorfmap.min.js'))
    .pipe(gulp.dest('public/js'));
  } catch(e) {}
});

gulp.task('less', function() {
  gulp.src(['src/css/*.less', 'src/css/libs/*.less'])
  .pipe(less())
  .pipe(gulp.dest('src/css'));
});

gulp.task('css', function() {
  gulp.src(['src/css/*.css', 'src/css/libs/*.css','bower_components/**/*.css'])
  .pipe(cssmin({keepSpecialComments:0}))
  .pipe(concat('dorfmap.min.css'))
  .pipe(gulp.dest('public/css'));
});



gulp.task('jade', function() {
  gulp.src(['src/jade/*.jade','src/jade/templates/*.jade'],{base: 'src/jade'})
  .pipe(jade())
  .pipe(gulp.dest('public'));
});

gulp.task('watch', function() {
  fatalLevel = fatalLevel || 'off';
  gulp.watch('src/js/*.js', ['lint', 'scriptsDebug', 'perlStart']);
  gulp.watch(['src/css/*.css','src/css/lib/*.css'], ['css', 'perlStart']);
  gulp.watch(['src/css/*.less','src/css/lib/*.less'], ['less']);
  gulp.watch(['src/jade/*.jade','src/jade/templates/*.jade'], ['jade','perlStart']);
  gulp.watch('index.pl', ['perlStart']);
});

gulp.task('copyToServer', function() {
  plainExec('scripts/dev/copy-to-server');
});

gulp.task('bower', function(cb){
  bower.commands.install([], {save: true}, {})
  .on('end', function(installed){
    cb();

    fs.writeFileSync('bower_components/socket.io-client/socket.io-client.js', fs.readFileSync('bower_components/socket.io-client/socket.io.js'));
  });
});

gulp.task('debug', ['debugIndicator','perltidy', 'jade', 'bower', 'scriptsDebug', 'less', 'css', 'perlStart', 'watch']);
gulp.task('release', ['releaseIndicator','perltidy','jade', 'bower','scriptsRelease','less', 'css', 'perlStop']);
gulp.task('deploy', ['release', 'copyToServer']);

gulp.task('default', ['debug']);
