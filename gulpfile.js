var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    gutil = require('gulp-util'),
    browserify = require('gulp-browserify'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    recess = require('gulp-recess'),
    jade = require('gulp-jade');

gulp.task('lint', function() {
  gulp.src('src/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
});

gulp.task('scripts', function() {
  gulp.src(['src/js/*.js'])
  .pipe(browserify({
    transform: [[{ global: true, beautify: false, mangle: false }, 'uglifyify']],
    insertGlobals: true,
    debug: false
  }))
  .pipe(concat('dorfmap.min.js'))
  .pipe(gulp.dest('public/js'));
});

gulp.task('csslint', function() {
    gulp.src('src/css/*.css')
    .pipe(recess({noOverqualifying: false, strictPropertyOrder: false}))
    .pipe(recess.reporter(stylish))
    .pipe(recess.reporter('fail'));
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

gulp.task('default', ['lint', 'csslint', 'scripts','css']);
