var gulp = require('gulp');

var jshint = require('gulp-jshint');
var map = require('vinyl-map');
var transform = require('vinyl-transform');
var browserify = require('browserify');
var UglifyJS = require('uglify-js');
var OptiPng = require('optipng');
var compass = require('gulp-compass');
var duplex = require('duplexer');

function noopStream() {
  return map(function (fileContentBuffer) {
    return fileContentBuffer.toString();
  });
}

gulp.task('lint-js', function () {
  return gulp.
  src(['**/*.js', '!node_modules/**', '!static/dist/**']).
  pipe(jshint()).
  pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build-client-js', function () {
  var fileBrowserification = transform(function (filename) {
    return duplex(noopStream(), browserify(filename).bundle());
  });

  return gulp.src('static/src/js/**/main.js').
  pipe(fileBrowserification).
  on('error', function (error) {
    console.log('[ERROR] - JS build failed :', error.message);
    this.emit('end');
  }).
  pipe(gulp.dest('static/dist/dev/js/'));
});

gulp.task('minify-client-js', ['build-client-js'], function () {
  var fileMinification = map(function (fileContentBuffer) {
    return UglifyJS.minify(fileContentBuffer.toString(), {
      fromString: true
    }).code;
  });
  return gulp.src('static/dist/dev/js/**/*.js').
  pipe(fileMinification).
  pipe(gulp.dest('static/dist/prod/js/'));
});

gulp.task('build-css', function () {
  return gulp.src('static/src/scss/**/main.scss').
  pipe(compass({
    'config_file': 'static/src/compass-config-dev.rb',
    css: 'static/dist/dev/css',
    sass: 'static/src/scss',
    environment: 'development'
  })).
  on('error', function () {
    this.emit('end');
  }).
  pipe(gulp.dest('static/dist/dev/css'));
});

gulp.task('build-css-prod', function () {
  return gulp.src('static/src/scss/**/main.scss').
  pipe(compass({
    'config_file': 'static/src/compass-config-prod.rb',
    css: 'static/dist/prod/css',
    sass: 'static/src/scss',
    environment: 'production'
  })).
  on('error', function () {
    this.emit('end');
  }).
  pipe(gulp.dest('static/dist/prod/css'));
});

gulp.task('copy-img', function () {
  return gulp.src(['static/src/img/**/*.{png,svg,ico,jpg,gif}', '!static/src/img/sprite/**']).
  pipe(gulp.dest('static/dist/dev/img'));
});

gulp.task('copy-img-prod', ['copy-img'], function () {
  return gulp.src('static/dist/dev/img/**').pipe(gulp.dest('static/dist/prod/img'));
});

gulp.task('optimize-png', function () {
  var fileOptimization = transform(function () {
    return new OptiPng(['-o7']);
  });

  return gulp.src('static/src/img/**/*.png').
  pipe(fileOptimization).
  pipe(gulp.dest('static/src/img'));
});

if (process.env.NODE_ENV === 'production') {
  gulp.task('default', ['minify-client-js', 'build-css', 'build-css-prod', 'copy-img-prod']);
} else {
  gulp.task('lint', ['lint-js']);
  gulp.task('build', ['build-client-js', 'build-css', 'copy-img']);
  gulp.task('default', ['lint', 'build']);
  gulp.task('watch', function () {
    gulp.watch(['server.js', 'lib/**/*.js'], ['lint-js']);
    gulp.watch('static/src/img/**/*.{png,svg,ico,jpg,gif}', ['copy-img']);
    gulp.watch(['static/src/scss/**/*.scss', 'static/src/img/**/*.scss'], ['build-css']);
    gulp.watch('static/src/js/**/*.js', ['lint-js', 'build-client-js']);
  });
}
