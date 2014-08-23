var gulp = require('gulp'),
    gutil = require('gulp-util'),
    browserify = require('gulp-browserify'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin');

gulp.task('scripts', function() {
  // Single point of entry (make sure not to src ALL your files, browserify will figure it out for you)
  gulp.src(['src/js/overview-angular.js'])
  .pipe(browserify({
    insertGlobals: true,
    debug: false
  }))
  // Bundle to a single file
  .pipe(concat('dorfmap.min.js'))
  // Output it to our dist folder
  .pipe(gulp.dest('public/js'));
});

gulp.task('css', function() {
 gulp.src('src/css/*.css')
    .pipe(cssmin())
    .pipe(concat('dorfmap.min.css'))
    .pipe(gulp.dest('public/css'));
});

gulp.task('default', ['scripts','css']);