var gulp = require('gulp'),
prefixer = require('gulp-autoprefixer'),
csscomb = require('gulp-csscomb'),
gutil = require('gulp-util'),
browserify = require('gulp-browserify'),
concat = require('gulp-concat'),
cssmin = require('gulp-cssmin'),
jade = require('gulp-jade'),
exec = require('gulp-exec'),
plainExec = require('child_process').exec,
less = require('gulp-less'),
debowerify = require('debowerify'),
livereload = require('gulp-livereload'),
beautify = require('gulp-beautify'),
coffee = require('gulp-coffee'),
insert = require('gulp-insert'),
bower = require('bower'),
fs = require('fs');


//config paths
var srcBase="src/";
var srcPath = {base:srcBase,css:srcBase+'css/**/*.css',less:srcBase+'css/**/*.less',js:srcBase+'js/**/*.js',jade:srcBase+'jade/**/*.jade'};
var pubBase="public/";
var pubPath = {base:pubBase,css:{pub:pubBase+'css/',bower:srcBase+'css/bower/'},less:srcPath.base+'css',js:pubBase+'js/',jade:pubBase};

gulp.task('perltidy', function() {
  return gulp.src('index.pl')
  .pipe(exec('perl -c <%= file.path %>'))
  .pipe(exec('perltidy -b <%= file.path %>'))
  .pipe(exec('rm <%= file.path %>.bak'))
  .pipe(exec.reporter());
});

gulp.task('perlStart',function() {
  plainExec('MOJO_LISTEN="http://*:8081" MOJO_MODE="development" hypnotoad index.pl');
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

gulp.task('scriptsDebug', ['bower'], function() {
  return gulp.src([srcPath.js], {base: 'src/js/'})
  .pipe(beautify({indentSize: 2}))
  .pipe(gulp.dest('src/js/'))
  .pipe(browserify({
    insertGlobals: true,
    transform: ['debowerify'],
    debug: true
  }))
  .pipe(concat('dorfmap.min.js'))
  .pipe(gulp.dest(pubPath.js))
  .on('finish', function(){livereload.changed();});
});

gulp.task('scriptsRelease', ['bower'], function() {
  return gulp.src([srcPath.js], {base: 'src/js/'})
  .pipe(beautify({indentSize: 2}))
  .pipe(gulp.dest('src/js/'))
  .pipe(browserify({
    transform: [[{ global: true, beautify: true, mangle: false }, 'uglifyify'],'debowerify'],
    gzip: true,
    insertGlobals: true,
    debug: false
  }))
  .pipe(concat('dorfmap.min.js'))
  .pipe(gulp.dest(pubPath.js));
});

gulp.task('less', ['bower'], function(cb) {
  gulp.src(srcPath.less, {base:'src/css/'})
  .pipe(less({strictMath:true,strictUnit:true}))
  .pipe(prefixer([
    'Android >= 4',
    'Chrome >= 30',
    'Firefox >= 24', // Firefox 24 is the latest ESR
    'Explorer >= 9',
    'iOS >= 6',
    'Opera >= 24',
    'Safari >= 6']
  ))
  //.pipe(csscomb())
  .pipe(gulp.dest(pubPath.less))
  .on('finish',function(){cb()});
});

gulp.task('css', ['less'], function() {
  var depCss = ['angular-material/angular-material.css', 'opentip/css/opentip.css'];
  depCss=depCss.map(function(c) {return 'bower_components/'+c});
  depCss.unshift(srcPath.css);

  return gulp.src(depCss)
  .pipe(cssmin({keepSpecialComments:0}))
  .pipe(concat('dorfmap.min.css'))
  .pipe(gulp.dest(pubPath.css.pub))
  .on('finish', function(){livereload.changed();});
});



gulp.task('jade', ['bower'], function() {
  return gulp.src([srcPath.jade])
  .pipe(jade())
  .pipe(gulp.dest(pubPath.jade))
  .on('finish', function(){livereload.changed();});
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(srcPath.js, ['scriptsDebug', 'perlStart']);
  gulp.watch([srcPath.css], ['css', 'perlStart']);
  gulp.watch([srcPath.less], ['less']);
  gulp.watch([srcPath.jade], ['jade','perlStart']);
  gulp.watch('index.pl', ['perlStart']);
});

gulp.task('copyToServer', function() {
  plainExec('scripts/dev/copy-to-server');
});

gulp.task('bower', function(cb){
  bower.commands.install([], {save: true}, {})
  .on('end', function(installed){
    //socket-io-exception
    fs.writeFileSync('bower_components/socket.io-client/socket.io-client.js', fs.readFileSync('bower_components/socket.io-client/socket.io.js'));
    //opentip
    gulp.src(['bower_components/opentip/src/opentip.coffee'])
    .pipe(insert.append('window.Opentip=Opentip'))
    .pipe(gulp.dest('bower_components/opentip/comp/'))
    .on('finish',function() {
      gulp.src(['bower_components/opentip/comp/opentip.coffee','bower_components/opentip/src/adapter-native.coffee'])
      .pipe(coffee())
      .pipe(concat('opentip.js'))
      .pipe(gulp.dest('bower_components/opentip/lib/'))
      .on('finish', function(){cb()});
    })
  });
});

gulp.task('clean',function(){
  plainExec('rm -rf bower_components');
});

gulp.task('debug', ['debugIndicator','perltidy', 'jade', 'scriptsDebug', 'css', 'perlStart', 'watch']);
gulp.task('release', ['clean','releaseIndicator','perltidy','jade','scriptsRelease', 'css', 'perlStop']);
gulp.task('deploy', ['release', 'copyToServer']);

gulp.task('default', ['debug']);
