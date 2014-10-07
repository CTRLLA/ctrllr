/**
 * utility helper library
 * @module lib/util
 */

var

    /** async flow library */
    $q = require('q'),

    /** options parser */
    argv = require('optimist').argv,

    /** colors module for console */
    colors = require('colors'),

    /** uuid generator lib */
    uuid = require('node-uuid'),

    /** deep cloning lib */
    extend = require('xtend');

/**
 * makes sure global environment set
 * @param env
 */
exports.ensureEnv = function(env) {
    if (!process.env.NODE_ENV) {
        if (env) {
            process.env.NODE_ENV = env;
        } else if (typeof argv.environment !== 'undefined' && argv.environment === 'production') {
            process.env.NODE_ENV = 'production';
        } else if (typeof argv.environment !== 'undefined' && argv.environment === 'test') {
            process.env.NODE_ENV = 'test';
        } else {
            process.env.NODE_ENV = 'development';
        }

        if (typeof argv.usessl !== 'undefined' && argv.useSSL === 'true') {
            process.env.useSSL = 'true';
        } else {
            process.env.useSSL = 'false';
        }

        if (typeof argv.port !== 'undefined') {
            process.env.PORT = argv.port;
        }
    }

    /** custom variable, used to let other files know env has been set  */
    process.env.ENV_INIT = 'true';

    /** return if env set */
    if (process.env.NODE_ENV === env || (process.env.NODE_ENV && !env)) {
        return;
    }

    /** notify error if env still not set */
    console.log(colors.red('ERROR >> Proper environment not set!'), {
        env: process.env.NODE_ENV,
        expected: env
    });
};

/**
 * prototypical inheritance
 * @param ctor
 * @param superCtor
 * @returns {Object}
 */
exports.inherts = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writeable: true,
            configurable: true
        }
    });
    return ctor;
};

/**
 * extends object a with object b's functions and values
 * @param a {Object} target object
 * @param b {Object} reference object
 */
exports.extend = function(a, b) {
    for (var i = 0, ii = arguments.length; i < ii; i++) {
        if (b) {
            var keys = Object.keys(b);
            for (var j = 0, jj = keys.length; j < jj; j++) {
                var key = keys[j];
                a[key] = b[key];
            }
        }
    }

    return a;
};

/**
 * generate uuid
 * @returns {String}
 */
exports.uuid = function() {
    return uuid.v1();
};

/**
 * deep clones an object
 * @param obj {*}
 * @returns {*}
 */
exports.clone = function(obj) {
    return extend(obj);
};

/**
 * generate random string
 * @param length {Number} desired length of string
 * @returns {String}
 */
exports.random = function(length) {
    var
        token = '',
        list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm' +
            'nopqrstuvwxyz0123456789';

    while (token.length < length) {
        token += list.charAt(Math.floor(Math.random() * list.length));
    }

    return token;
};

/**
 * wraps a function with deferreds
 * @param fn {Function} function to wrap
 * @returns {Object} instance of promise
 */
exports.mockAsync = function(fn) {
    var deferred = $q.defer();

    setTimeout(function() {
        deferred.resolve(fn && fn());
    }, 0);

    return deferred.promise;
};