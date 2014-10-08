var gulp = require('gulp'),
csslint = require('gulp-csslint'),
prefixer = require('gulp-autoprefixer'),
uglify = require('gulp-uglify'),
source = require('vinyl-source-stream'),
streamify = require('gulp-streamify'),
gutil = require('gulp-util'),
browserify = require('browserify'),
concat = require('gulp-concat'),
concatSource = require('gulp-concat-sourcemap'),
cssmin = require('gulp-cssmin'),
jade = require('gulp-jade'),
exec = require('gulp-exec'),
plainExec = require('child_process').exec,
less = require('gulp-less'),
debowerify = require('debowerify'),
livereload = require('gulp-livereload'),
jshint = require('gulp-jshint'),
coffee = require('gulp-coffee'),
insert = require('gulp-insert'),
newer = require('gulp-newer'),
gzip = require('gulp-gzip'),
bower = require('bower'),
del = require('del'),
fs = require('fs'),
Q = require('q');

livereload({auto:false});

//config paths
var srcBase="src/";
var srcPath = {base:srcBase,css:srcBase+'**/*.css',less:srcBase+'**/*.less',js:srcBase+'js/**/*.js',jade:srcBase+'jade/**/*.jade'};
var pubBase="public/";
var pubPath = {base:pubBase,css:{pub:pubBase+'css/',bower:srcBase+'css/bower/'},less:srcPath.base+'css',js:pubBase+'js/',jade:pubBase};

gulp.task('perltidy', function() {
  return gulp.src('index.pl')
  .pipe(exec('perl -c <%= file.path %>'))
  .pipe(exec('perltidy -b <%= file.path %>'))
  .pipe(exec('rm <%= file.path %>.bak'));
});

gulp.task('perlStart',function() {
  plainExec('MOJO_LISTEN="http://*:8081" MOJO_MODE="development" hypnotoad index.pl');
});

gulp.task('perlStop',function() {
  plainExec('hypnotoad -s index.pl')
});

gulp.task('js', ['bower'], function() {
  var q = Q.defer();
  var q2 = Q.defer();
  var q3 = Q.defer();
  var qr = Q.defer();
  var promises = [q.promise,q2.promise,q3.promise];
  gulp.src('src/js/require.js')
  .pipe(gulp.dest('.vendor/ref/'))
  .pipe(newer('.vendor/ref/'))
  .pipe(gulp.dest('.vendor/'))
  .on('finish', function() {
    if (fs.existsSync('./.vendor/require.js')) {
      var bundle = browserify('./.vendor/require.js', {
        fast: true
      });
      bundle=bundle.bundle();
      bundle
      .pipe(source('./vendor.js'))
      .pipe(gutil.env.type==='deploy'?streamify(uglify({mangle:false})):gutil.noop())
      .pipe(gulp.dest('./.vendor/'))
      .on('finish',function(){
        qr.resolve();
      });
    } else {
      qr.resolve();
    }
    q.resolve();
  });
  gutil.env.error=false;
  qr.promise.then(function() {
    gulp.src([srcPath.js], {base: 'src/js/'})
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .on('error', swallowError)
    .pipe(gulp.dest('src/js/'))
    .on ('finish', function() {
      gulp.src(['.vendor/vendor.js',srcPath.js,'!src/js/require.js'], {base: 'src/js/'})
      .pipe(gutil.env.type==='deploy' ? concat('dorfmap.min.js') : concatSource('dorfmap.min.js',{sourcesContent:true}))
      .pipe(gulp.dest('public/js/'))
      .pipe(gzip())
      .pipe(gulp.dest('public/js/'))
      .on('finish',function(){
        q3.resolve();
        del('.vendor/require.js');
      });
    });
    q2.resolve();
  });
  return Q.all(promises).then(function() {
    if (!gutil.env.error) {
      livereload.changed();
    }
  });
})

gulp.task('less', ['bower'], function() {
  return gulp.src(srcPath.less, {base:'src/css/'})
  .pipe(less({strictMath:true,strictUnit:true}))
  .on('error', swallowError)
  .pipe(csslint({
    "important": false,
    "outline-none": false,
    "adjoining-classes":false
  }))
  .pipe(csslint.reporter())
  .on('error', swallowError)
  .pipe(prefixer([
    'Android >= 4',
    'Chrome >= 30',
    'Firefox >= 24', // Firefox 24 is the latest ESR
    'Explorer >= 9',
    'iOS >= 6',
    'Opera >= 24',
    'Safari >= 6']
  ))
  .on('error', swallowError)
  .pipe(gulp.dest(pubPath.less));
});

gulp.task('css', ['less'], function() {
  var depCss = ['angular-material/angular-material.css', 'opentip/css/opentip.css','angular-busy/dist/angular-busy.css'];
  depCss=depCss.map(function(c) {return 'bower_components/'+c});
  depCss.unshift(srcPath.css);

  return gulp.src(depCss)
  .pipe(cssmin({keepSpecialComments:0}))
  .pipe(concat('dorfmap.min.css'))
  .pipe(gulp.dest(pubPath.css.pub))
  .on('finish', function() {
    livereload.changed();
  });
});

gulp.task('jade', ['bower'], function() {
  var q = Q.defer();
  var promises = [];
  promises.push(q);
  gulp.src([srcPath.jade])
  .pipe(jade())
  .on('error', swallowError)
  .pipe(gulp.dest(pubPath.jade))
  .on('finish', function(){q.resolve();});
  var q = Q.defer();
  promises.push(q.promise);
  gulp.src(['src/js/**/Templates/**/*.jade'])
  .pipe(jade())
  .pipe(gulp.dest(pubPath.jade))
  .on('finish', function(){q.resolve()})
  return Q.all(promises).then(function() {
    livereload.changed();
  });
});

gulp.task('watch', function() {
  gutil.env.watch=true;
  livereload({auto:true});
  livereload.listen();
  gulp.watch(srcPath.js, ['js', 'perlStart']);
  gulp.watch([srcPath.css], ['css', 'perlStart']);
  gulp.watch([srcPath.less], ['less']);
  gulp.watch([srcPath.jade,'src/js/**/Templates/**/*.jade'], ['jade','perlStart']);
  gulp.watch('index.pl', ['perlStart']);
});

gulp.task('copyToServer', ['release'], function() {
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
  plainExec('rm -rf .vendor');
  gutil.env.type='deploy';
});


gulp.task('debug', ['perltidy', 'jade', 'js', 'css', 'perlStart', 'watch']);
gulp.task('release', ['clean','perltidy','jade','js', 'css', 'perlStop']);
gulp.task('deploy', ['copyToServer']);

gulp.task('default', ['debug']);

function swallowError(error) {
  gutil.env.error=true;
  console.log(error.toString());
  if (gutil.env.watch) {
    this.emit('end');
  } else {
    throw error;
  }
}
