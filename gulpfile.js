'use strict';

var gulp = require('gulp');
var clangFormat = require('clang-format');
var gulpFormat = require('gulp-clang-format');
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

gulp.task('clang', function() {
  return gulp.src(['src/**/*.ts'])
      .pipe(gulpFormat.checkFormat('file', clangFormat))
      .on('warning', function(e) {
    console.log(e);
  });
});

gulp.task('typings', function(done) {
  runSpawn(done, 'node', ['node_modules/typings/dist/bin.js', 'install']);
});

gulp.task('tsc', function(done) {
  runSpawn(done, 'node', ['node_modules/typescript/bin/tsc']);
});

gulp.task('prepublish', function(done) {
  runSequence(['typings', 'clang'], 'tsc', 'copy', done);
});

gulp.task('default',['prepublish']);
gulp.task('build',['prepublish']);

gulp.task('test', ['build'], function(done) {
  var opt_arg = [];
  opt_arg.push('node_modules/jasmine/bin/jasmine.js');
  runSpawn(done, 'node', opt_arg);
});
