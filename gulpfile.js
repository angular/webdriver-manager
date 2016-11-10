'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var spawn = require('child_process').spawn;

var runSpawn = function(done, task, opt_arg) {
  opt_arg = typeof opt_arg !== 'undefined' ? opt_arg : [];
  var child = spawn(task, opt_arg, {stdio: 'inherit'});
  var running = false;
  child.on('close', function() {
    if (!running) {
      running = true;
      done();
    }
  });
  child.on('error', function() {
    if (!running) {
      console.error('gulp encountered a child error');
      running = true;
      done();
    }
  });
};

gulp.task('copy', function() {
  return gulp.src(['config.json', 'package.json'])
      .pipe(gulp.dest('built/'));
});

var tsGlobs = ['lib/**/*.ts', 'spec/**/*.ts'];

gulp.task('format:enforce', () => {
  const format = require('gulp-clang-format');
  const clangFormat = require('clang-format');
  return gulp.src(tsGlobs).pipe(
    format.checkFormat('file', clangFormat, {verbose: true, fail: true}));
});

gulp.task('format', () => {
  const format = require('gulp-clang-format');
  const clangFormat = require('clang-format');
  return gulp.src(tsGlobs, { base: '.' }).pipe(
    format.format('file', clangFormat)).pipe(gulp.dest('.'));
});

gulp.task('tsc', function(done) {
  runSpawn(done, process.execPath, ['node_modules/typescript/bin/tsc']);
});

gulp.task('prepublish', function(done) {
  runSequence('tsc', 'copy', done);
});

gulp.task('default',['prepublish']);
gulp.task('build',['prepublish']);

gulp.task('test', ['format', 'build'], function(done) {
  var opt_arg = [];
  opt_arg.push('node_modules/jasmine/bin/jasmine.js');
  runSpawn(done, process.execPath, opt_arg);
});
