// vendored from https://github.com/sindresorhus/opn
'use strict';
var path = require('path');
var childProcess = require('child_process');
module.exports = function (target, opts) {
    if (typeof target !== 'string') {
        return Promise.reject(new Error('Expected a `target`'));
    }
    opts = Object.assign({ wait: true }, opts);
    var cmd;
    var appArgs = [];
    var args = [];
    var cpOpts = {};
    if (Array.isArray(opts.app)) {
        appArgs = opts.app.slice(1);
        opts.app = opts.app[0];
    }
    if (process.platform === 'darwin') {
        cmd = 'open';
        if (opts.wait) {
            args.push('-W');
        }
        if (opts.app) {
            args.push('-a', opts.app);
        }
    }
    else if (process.platform === 'win32') {
        cmd = 'cmd';
        args.push('/c', 'start', '""', '/b');
        target = target.replace(/&/g, '^&');
        if (opts.wait) {
            args.push('/wait');
        }
        if (opts.app) {
            args.push(opts.app);
        }
        if (appArgs.length > 0) {
            args = args.concat(appArgs);
        }
    }
    else {
        if (opts.app) {
            cmd = opts.app;
        }
        else {
            cmd = path.join(__dirname, 'xdg-open');
        }
        if (appArgs.length > 0) {
            args = args.concat(appArgs);
        }
        if (!opts.wait) {
            // `xdg-open` will block the process unless
            // stdio is ignored and it's detached from the parent
            // even if it's unref'd
            cpOpts.stdio = 'ignore';
            cpOpts.detached = true;
        }
    }
    args.push(target);
    if (process.platform === 'darwin' && appArgs.length > 0) {
        args.push('--args');
        args = args.concat(appArgs);
    }
    try {
        var cp_1 = childProcess.spawn(cmd, args, cpOpts);
        if (opts.wait) {
            return new Promise(function (resolve, reject) {
                cp_1.once('error', reject);
                cp_1.once('close', function (code) {
                    if (code > 0) {
                        console.log(new Error('Exited with code ' + code));
                        return;
                    }
                    resolve(cp_1);
                });
            });
        }
        cp_1.unref();
        return Promise.resolve(cp_1);
    }
    catch (e) {
        console.log('Failed to open: ' + target);
    }
};
