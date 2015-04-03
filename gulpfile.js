var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    browserify = require('browserify'),
    livereload = require('gulp-livereload'),
    plainExec = require('child_process').exec,
    del = require('del'),
    source = require('vinyl-source-stream'),
    bower = require('bower'),
    Q = require('q');

livereload({
  auto: false
});

//config paths
var srcBase = "src/";
var srcPath = {
  base: srcBase,
  css: srcBase + '**/*.css',
  less: srcBase + '**/*.less',
  js: srcBase + 'js/**/*.js',
  html: srcBase + 'js/**/*.html'
};

var pubBase = "public/";
var pubPath = {
  base: pubBase,
  css: {
    pub: pubBase + 'css/',
    bower: srcBase + 'css/bower/'
  },
  less: srcPath.base + 'css', 
  js: pubBase + 'js/',
};

gulp.task('perltidy', function() {
  return gulp.src('index.pl')
    .pipe(plugins.exec('perl -c <%= file.path %>'))
    .pipe(plugins.exec('perltidy -b <%= file.path %>'))
    .pipe(plugins.exec('rm <%= file.path %>.bak'));
});

gulp.task('perlStart',function() {
  plainExec('MOJO_LISTEN="http://*:8081" MOJO_MODE="development" hypnotoad index.pl');
});

gulp.task('perlStop',function() {
  plainExec('hypnotoad -s index.pl');
});

gulp.task('js', ['bower'], function() {
  var q2 = Q.defer();
  var q3 = Q.defer();
  var qr = Q.defer();
  var promises = [q2.promise,q3.promise];
  var bundle = browserify('./src/js/require.js', {
    fast: true
  });
  bundle = bundle.bundle();
  bundle
    .pipe(source('./vendor.js'))
    .pipe(plugins.if(plugins.util.env.type === 'deploy', plugins.streamify(plugins.uglify({
    mangle:false
  }))))
    .pipe(gulp.dest('public/js/'))
    .on('finish', function(){
    qr.resolve();
  });
  plugins.util.env.error = false;
  qr.promise.then(function() {
    gulp.src([srcPath.js, '!**/require.js'], {base: 'src/js/'})
      .pipe(plugins.if(plugins.util.env.type !== 'deploy', plugins.sourcemaps.init()))
      .pipe(plugins.babel())
      .pipe(plugins.concat('dorfmap.min.js'))
      .pipe(plugins.if(plugins.util.env.type !== 'deploy', plugins.sourcemaps.write()))
      .pipe(gulp.dest('public/js/'))
      .on('finish', function() {
      q3.resolve();
      del('.vendor/require.js');
    });
    q2.resolve();
  });
  return Q.all(promises).then(function() {
    if (!plugins.util.env.error) {
      livereload.changed();
    }
  });
});

gulp.task('less', ['bower'], function() {
  return gulp.src(srcPath.less, {base:'src/css/'})
    .pipe(plugins.less({strictMath:true, strictUnit:true}))
    .on('error', swallowError)
    .pipe(plugins.csslint({
    "important": false,
    "outline-none": false,
    "adjoining-classes":false
  }))
    .pipe(plugins.csslint.reporter())
    .on('error', swallowError)
    .pipe(plugins.autoprefixer())
    .on('error', swallowError)
    .pipe(gulp.dest(pubPath.less));
});

gulp.task('html', ['bower'], function() {
  var q1 = Q.defer();
  var q2 = Q.defer();
  var promises = [q1.promise, q2.promise];

  gulp.src('src/*.html')
    .pipe(gulp.dest('public/'))
    .on('finish', function() {
    q1.resolve();
  });

  gulp.src('src/js/**/*.html')
    .pipe(plugins.angularTemplatecache())
    .pipe(gulp.dest('public/js/'))
    .on('finish', function() {
    q2.resolve();
  });

  return Q.all(promises);
});

gulp.task('css', ['less'], function() {
  var depCss = ['angular-material/angular-material.css', 'angular-busy/dist/angular-busy.css'];
  depCss = depCss.map(function(c) {return 'bower_components/'+c;});
  depCss.unshift(srcPath.css);

  return gulp.src(depCss)
    .pipe(plugins.cssmin({keepSpecialComments:0}))
    .pipe(plugins.concat('dorfmap.min.css'))
    .pipe(gulp.dest(pubPath.css.pub));
});

gulp.task('watch', function() {
  plugins.util.env.watch=true;
  livereload({auto:true});
  livereload.listen();
  gulp.watch(srcPath.js, ['js', 'perlStart']);
  gulp.watch([srcPath.css], ['css', 'perlStart']);
  gulp.watch([srcPath.less], ['less']);
  gulp.watch([srcPath.html], ['html', 'perlStart']);
  gulp.watch('index.pl', ['perlStart']);
});

gulp.task('copyToServer', ['release'], function() {
  plainExec('scripts/dev/copy-to-server');
});

gulp.task('bower', function(cb){
  bower.commands.install([], {save: true}, {})
  .on('end', cb);
});

gulp.task('clean',function(){
  plainExec('rm -rf bower_components');
  plainExec('rm -rf .vendor');
  plugins.util.env.type='deploy';
});

gulp.task('debug', ['perltidy', 'js', 'css', 'perlStart', 'watch']);
gulp.task('release', ['clean','bower', 'perltidy', 'js', 'css', 'perlStop']);
gulp.task('deploy', ['copyToServer']);

gulp.task('default', ['debug']);

function swallowError(error) {
  plugins.util.env.error=true;
  console.log(error.toString());
  if (plugins.util.env.watch) {
    this.emit('end');
  } else {
    throw error;
  }
}
