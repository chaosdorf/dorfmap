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
    less = require('gulp-less');

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
  plainExec('touch DEBUG_DO_NOT_COMMIT');
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
  .pipe(browserify({
    insertGlobals: true,
    debug: true
  }))
  .pipe(concat('dorfmap.min.js'))
  .pipe(gulp.dest('public/js'));
});

gulp.task('scriptsRelease', function() {
  gulp.src(['src/js/*.js'])
  .pipe(browserify({
    transform: [[{ global: true, beautify: false, mangle: false }, 'uglifyify']],
    insertGlobals: true,
    debug: false
  }))
  .pipe(concat('dorfmap.min.js'))
  .pipe(gulp.dest('public/js'));
});

gulp.task('less', function() {
  gulp.src(['src/css/*.less', 'src/css/libs/*.less'])
     .pipe(less())
     .pipe(gulp.dest('src/css'));
});

gulp.task('css', function() {
 gulp.src(['src/css/*.css', 'src/css/libs/*.css'])
    .pipe(cssmin())
    .pipe(concat('dorfmap.min.css'))
    .pipe(gulp.dest('public/css'));
});



gulp.task('jade', function() {
  gulp.src(['src/jade/*.jade','src/jade/templates/*.jade'],{base: 'src/jade'})
    .pipe(jade())
    .pipe(gulp.dest('public'));
});

gulp.task('watch', function() {
  gulp.watch('src/js/*.js', ['lint', 'scriptsDebug', 'perlStart']);
  gulp.watch(['src/css/*.css','src/css/lib/*.css'], ['css', 'perlStart']);
  gulp.watch(['src/css/*.less','src/css/lib/*.less'], ['less']);
  gulp.watch(['src/jade/*.jade','src/jade/templates/*.jade'], ['jade','perlStart']);
  gulp.watch('index.pl', ['perlStart']);
});

gulp.task('copyToServer', function() {
  plainExec('ssh root@feedback mount -o remount,rw /');
  plainExec('rsync -aP coordinates index.pl public scripts root@feedback:/root/dorfmap');
  plainExec('ssh root@feedback mount -o remount,ro /');
  plainExec('ssh root@feedback dorfmap_pull');
});

gulp.task('debug', ['debugIndicator','perltidy', 'jade', 'lint', 'scriptsDebug', 'less', 'css', 'perlStart', 'watch']);
gulp.task('release', ['releaseIndicator','perltidy','jade','lint','scriptsRelease','less', 'css', 'perlStop']);
gulp.task('deploy', ['release', 'copyToServer']);

gulp.task('default', ['debug']);
