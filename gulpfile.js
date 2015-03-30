var gulp = require('gulp');

var jshint = require('gulp-jshint');
var map = require('vinyl-map');
var transform = require('vinyl-transform');
var browserify = require('browserify');
var UglifyJS = require('uglify-js');
var OptiPng = require('optipng');
var compass = require('gulp-compass');

function noopStream() {
  return map(function (fileContentBuffer) {
    return fileContentBuffer.toString();
  });
}

gulp.task('lint-js', function () {
  return gulp.
  src(['**/*.js', '!node_modules/**', '!static/dist/js/**', '!www/js/app.js']).
  pipe(jshint()).
  pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build-client-js', function () {
  var fileBrowserification = transform(function (filename) {
    return browserify(filename).bundle();
  });

  var fileMinification = map(function (fileContentBuffer) {
    return UglifyJS.minify(fileContentBuffer.toString(), {
      fromString: true
    }).code;
  });

  return gulp.src('static/src/js/**/main.js').
  pipe(fileBrowserification).
  pipe(process.env.NODE_ENV === 'production' ? fileMinification : noopStream()).
  pipe(gulp.dest('static/dist/js/'));
});

gulp.task('build-css', function () {
  return gulp.src('static/src/scss/**/main.scss').
  pipe(compass({
    config_file: '.compass-config.rb',
    css: 'static/dist/css',
    sass: 'static/src/scss',
    environment: process.env.NODE_ENV || 'development'
  })).
  pipe(gulp.dest('static/dist/css'));
});

gulp.task('optimize-img', ['build-css'], function () {
  if (process.env.NODE_ENV !== 'production') return;

  var fileOptimization = transform(function (filename) {
    return new OptiPng(['-o7']);
  });

  return gulp.src('static/dist/img/**/*.png').
  pipe(fileOptimization).
  pipe(gulp.dest('static/dist/img'));
});

gulp.task('lint', ['lint-js']);
gulp.task('build', ['build-client-js', 'build-css', 'optimize-img']);
gulp.task('default', ['lint', 'build']);

gulp.task('watch', function () {
  gulp.watch('static/src/js/**/*.js', ['lint-js', 'build-client-js']);
  gulp.watch('static/src/scss/**/*.scss', ['build-css']);
  gulp.watch('static/src/img/**/*.scss', ['build-css']);
});