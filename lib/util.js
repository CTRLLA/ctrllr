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

/**
 * wraps async function to make sure it doesn't run too long
 * @param promise {Object} promise to watch
 * @param max {Number} max time in milliseconds
 * @returns {promise|*|Q.promise}
 */
exports.countdown = function(promise, max) {
  var
    deferred = $q.defer(),
    count = 0,
    id = setInterval(function() {
      count += 1000;

      if (max > 0 && count >= max) {
        clear();
        deferred.reject('Timed out.');
      }
    }, 1000),
    clear = function() {
      clearTimeout(id);
    };

  promise.then(function(val) {
    clear();
    deferred.resolve(val);
  }).fail(function(err) {
    clear();
    deferred.reject(err);
  });

  return deferred.promise;
};

/**
 * finds the value of a key inside an object;
 * accepts dotted notation
 * @param obj {Object} object to search
 * @param key {String} the key to search
 * @returns {*}
 */
exports.evalKeyValue = function(obj, key) {
  var
    regexArray = /\[(.*?)\]/,
    keys = key.split('.'),
    ref = obj,
    i = 0,
    tmp,
    k;

  if (keys.length === 1) {
    return ref[key];
  }

  // recursive check inside object
  while (i < keys.length) {
    // make sure not using array notation
    if (!keys[i].match(regexArray)) {
      k = keys[i];
      if (!ref.hasOwnProperty(k)) {
        return undefined;
      }

      ref = ref[k];
    } else {
      // if using array notation, get the key of the array
      k = keys[i].replace(regexArray, '');

      if (!ref.hasOwnProperty(k)) {
        return undefined;
      }

      ref = ref[k];

      // get the index of the item in the array
      k = keys[i].match(/\[(.*?)\]/)[1];

      if (!ref.hasOwnProperty(k)) {
        return undefined;
      }

      ref = ref[k];
    }

    ++i;
  }

  return ref;
};

/**
 * extracts a value from an object, function, or async function
 * @param val {Object|Function}
 * @param timeout {Number} max time to run an async function
 * @param args {Array} arguments to call function with (if function)
 */
exports.safeAsync = function(val, timeout, args) {
  var deferred = $q.defer();

  /**
   * waits for a promise, resolves deferred when resolved
   * @param promise
   */
  function evalPromise(promise) {
    // wrap in `countdown`
    exports.countdown(promise, timeout)
      .then(function(resolvedValue) {
        deferred.resolve(resolvedValue);
      }).fail(function(err) {
        deferred.reject(err);
      });
  }

  if (val && val.then) {
    // if promise passed
    evalPromise(val);
  } else if (typeof val === 'function') {
    // if function passed
    val = val.apply(this, args);

    if (val && val.then) {
      // if function returned promise
      evalPromise(val);
    } else {
      deferred.resolve(val);
    }
  } else {
    // regular object / value passed, resolve
    deferred.resolve(val);
  }

  return deferred.promise;
};

/**
 * checks if a variable is an instance of an express server
 * @param _app {Object} variable to check
 * @returns {boolean}
 */
exports.isExpressApp = function(_app) {
  return typeof _app.listen === 'function';
};

/**
 * formats boolean for printing to console
 * @param boolean {Boolean}
 * @returns {string}
 */
exports.formatBoolean = function(boolean) {
  return boolean.toString().toUpperCase();
};

/**
 * asynchronous recursive call on an array of functions
 * @params queue {Function|Array} function or array of functions to call
 * @params args {*} (optional) arguments to pass to each function
 * @params context {*} (optional) context to pass when calling the function
 * @returns {$q.promise}
 */
exports.recurse = function(queue, args, context) {
  var deferred = $q.defer();

  if (!queue || !queue.length) {
    deferred.resolve(false);
    return deferred.promise;
  }

  var
    safeContext = context || this,
    fn = queue instanceof Array ? queue[0] : queue,
    fnArgs = args ? (typeof args === 'function' ? args() : args) : null,
    result = args ? fn.apply(safeContext, fnArgs) : fn.call(safeContext);

  exports
    .safeAsync(result)
    .fin(function() {
      // if no more items in queue, exist
      if (!(queue instanceof  Array) || queue.length === 1) {
        return deferred.resolve(true);
      }

      // remove function from `queue`, call self
      queue.splice(0, 1);

      exports
        .recurse(queue, args, context)
        .fin(function() {
          return deferred.resolve(true);
        });
    });

  return deferred.promise;
};