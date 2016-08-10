'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var spawn = require('child_process').spawn;

var format = require('gulp-clang-format');
var clangFormat = require('clang-format');

/**
 * Runs a command from the command line as 'node <opt_arg>'.
 * @param {String|Array} opt_arg the filename and/or arguments to run.
 * @return {Promise}
 */
var runNodeCommand = (opt_arg) => {
    if (typeof opt_arg === 'string') {
        opt_arg = opt_arg.split(/\s/);
    } else {
        opt_arg = opt_arg || [];
    }
    var err;
    return new Promise((fulfill, reject) => {
        spawn('node', opt_arg, {stdio: 'inherit'})
            .on('error', (childError) => {
                err = err || childError;
            })
            .on('exit', (result) => {
                if (err) {
                    reject(err);
                } else {
                    fulfill(result);
                }
            });
    });
};

var typescriptCompile = () => {
    gutil.log('compiling typescript...');
    return runNodeCommand('node_modules/typescript/bin/tsc');
};

var installTypings = () => {
    gutil.log('installing typings...');
    return runNodeCommand(['node_modules/typings/dist/bin.js', 'install']);
};

var copyFilesToBuilt = () => {
    gutil.log('copying files to built...');
    return new Promise((fulfill) => {
        gulp.src(['config.json', 'package.json'])
            .pipe(gulp.dest('built/'))
            .on('end', () => {
                fulfill();
            });
    });
};

var checkFormat = () => {
    gutil.log('checking file formatting...');
    return new Promise((fulfill, reject) => {
        var err;
        gulp.src(['lib/**/*.ts'], {base: '.'})
            .pipe(format.checkFormat('file', clangFormat, {verbose: true, fail: true}))
            .on('error', (e) => {
                err = err || e;
            })
            .on('data', () => {
            }) // this 'data' event listener ensures the stream flows through to the 'end' event
            .on('end', () => {
                if (err) {
                    reject(err);
                } else {
                    fulfill();
                }
            });
    });
};

var autoFormat = () => {
    return checkFormat().then(() => {
        // do nothing if there are no formatting errors
    }, () => {
        // catch any error and auto-format the files
        gutil.log();
        gutil.log('... AUTO-FORMATTING FILES ...');
        gutil.log();
        return new Promise((fulfill) => {
            gulp.src(['lib/**/*.ts'], {base: '.'})
                .pipe(format.format('file', clangFormat))
                .pipe(gulp.dest('.'))
                .on('end', () => {
                    fulfill();
                });
        });
    });
};

var prePublish = () => {
    return Promise.all([
        installTypings(),
        autoFormat(),
    ]).then(() => {
        return typescriptCompile();
    }).then(() => {
        return copyFilesToBuilt();
    });
};

gulp.task('copy', () => {
    return copyFilesToBuilt();
});

gulp.task('format:enforce', () => {
    return checkFormat();
});

gulp.task('format', () => {
    return autoFormat();
});

gulp.task('typings', () => {
    return installTypings();
});

gulp.task('tsc', () => {
    return typescriptCompile();
});


['prepublish', 'default', 'build'].forEach((alias) => {
    gulp.task(alias, () => {
        return prePublish();
    });
});

gulp.task('test', () => {
    return prePublish().then(() => {
        gutil.log('running tests...');
        return runNodeCommand('node_modules/jasmine/bin/jasmine.js');
    });
});
