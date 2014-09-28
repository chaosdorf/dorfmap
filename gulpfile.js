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
livereload = require('gulp-livereload'),
fs = require('fs');

var fatalLevel = "off";

//config paths
var srcBase="src/";
var srcPath = {base:srcBase,css:srcBase+'css/**/*.css',less:srcBase+'css/**/*.less',js:srcBase+'js/**/*.js',jade:srcBase+'jade/**/*.jade'};
var pubBase="public/";
var pubPath = {base:pubBase,css:{pub:pubBase+'css/',bower:srcBase+'css/bower/'},less:srcPath.base+'css',js:pubBase+'js/',jade:pubBase};

gulp.task('perltidy', function() {
  gulp.src('index.pl')
  .pipe(exec('perl -c <%= file.path %>'))
  .pipe(exec('perltidy -b <%= file.path %>'))
  .pipe(exec('rm <%= file.path %>.bak'))
  .pipe(exec.reporter());
});

gulp.task('perlStart',function() {
  plainExec('MOJO_LISTEN="http://*:8081" MOJO_MODE="development" hypnotoad index.pl');
  livereload.changed();
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
  fatalLevel = fatalLevel || 'off';
  gulp.src([srcPath.js])
  .pipe(jshint())
  .pipe(jshint.reporter(stylish))
  .pipe(jshint.reporter('fail'))
  .pipe(browserify({
    insertGlobals: true,
    transform: ['debowerify'],
    debug: true
  }))
  .pipe(concat('dorfmap.min.js'))
  .pipe(gulp.dest(pubPath.js));
});

gulp.task('scriptsRelease', ['bower'], function() {
  fatalLevel = fatalLevel || 'off';
  gulp.src([srcPath.js])
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
  .pipe(gulp.dest(pubPath.js));
});

gulp.task('less', ['bower'], function() {
  gulp.src(srcPath.less)
  .pipe(less())
  .pipe(gulp.dest(pubPath.less));
});

gulp.task('css', ['less'], function() {
  gulp.src([srcPath.css,'bower_components/**/*.css', '!bower_components/kendo-ui/**/*.css'])
  .pipe(cssmin({keepSpecialComments:0}))
  .pipe(concat('dorfmap.min.css'))
  .pipe(gulp.dest(pubPath.css.pub));
});



gulp.task('jade', ['bower'], function() {
  gulp.src([srcPath.jade])
  .pipe(jade())
  .pipe(gulp.dest(pubPath.jade));
});

gulp.task('watch', function() {
  fatalLevel = fatalLevel || 'off';
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
    //kendo-ui images & styles
    /*
    var styles = 'bower_components/kendo-ui/styles/';
    var images = [
    {dest:pubPath.base+'images/kendo/images/',loc:[styles+'images/',styles+'Silver/']},
    {dest:pubPath.base+'images/kendo/textures/',loc:[styles+'textures/']}];
    try {
    fs.mkdirSync(pubPath.base+'images/kendo');
  } catch(e){}
  for (h=0;h<images.length;h++) {
  try{
  fs.mkdirSync(images[h].dest);
} catch(e) {}
for (i=0;i<images[h].loc.length;i++) {
var files = fs.readdirSync(images[h].loc[i]);
for (j=0;j<files.length;j++) {
fs.writeFileSync(images[h].dest+files[j],fs.readFileSync(images[h].loc[i]+files[j]));
}
}
}
gulp.src([styles+'*silver.mi*',styles+'*.common.core.*'])
.pipe(concat('kendo.min.css'))
.pipe(replace('textures/','kendo/textures/'))
.pipe(replace('Silver/','images/kendo/images/'))
.pipe(gulp.dest(pubPath.css.bower));
*/
cb();
});
});

gulp.task('clean',function(){
  plainExec('rm -rf bower_components');
});

gulp.task('debug', ['debugIndicator','perltidy', 'jade', 'scriptsDebug', 'css', 'perlStart', 'watch']);
gulp.task('release', ['clean','releaseIndicator','perltidy','jade','scriptsRelease', 'css', 'perlStop']);
gulp.task('deploy', ['release', 'copyToServer']);

gulp.task('default', ['debug']);
