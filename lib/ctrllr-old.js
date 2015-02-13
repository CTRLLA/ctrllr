var

  /** async flow lib */
  $q = require('q'),

  /** server utilities / helper fns */
  util = require('../lib/util');

// TODO: test-level timeout

/* ==========================================================================
 Request builder - These functions build and transform each test.
 ========================================================================== */

/**
 * calls all functions specified to run before a test
 * @param config.request {Object} request configuration
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function before(config) {
  var
    deferred = $q.defer(),
    request = config.request,
    ctrllr = config.ctrllr,
    test = config.test;

  var queue = [];

  // find all global `before` functions
  if (ctrllr.options.before) {
    if (ctrllr.options.before instanceof Array) {
      // if array, add each one to `queue`
      ctrllr.options.before.forEach(function(fn) {
        queue.push(fn);
      });
    } else {
      // if function, add to `queue`
      queue.push(ctrllr.options.before);
    }
  }

  // find all test `before` function(s)
  // NOTE: here, the test's `before` function(s) are added AFTER global `after` functions
  // this way, the test's `before` function(s) are fired right before a test
  if (test.before) {
    if (test.before instanceof Array) {
      // if array, add each one to `queue`
      test.before.forEach(function(fn) {
        queue.push(fn);
      });
    } else {
      // if function, add to `queue`
      queue.push(test.before);
    }
  }

  /** recursive function for running all `before` functions */
  function run() {
    if (!queue.length) {
      // if no more functions in queue, get outta here
      deferred.resolve(config);
    } else {
      // calls safeAsync with the `queue[0]` being the target value
      // also gives it a max timeout and the additional arguments
      // to pass if queue[0] is a function
      var
        timeout = test.timeout || ctrllr.options.timeout,
        args = [
          ctrllr.getHelper(),
          request
        ];

      safeAsync(queue[0], timeout, args)
        .fin(function() {
          queue.splice(0, 1);
          run();
        });
    }
  }

  // start recursive call
  run();

  return deferred.promise;
}

/**
 * calls all functions specified to run after a test
 * @param config.response {Object} response object
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function after(config) {
  var
    deferred = $q.defer(),
    response = config.response,
    ctrllr = config.ctrllr,
    test = config.test,
    queue = [];

  // find all test `after` function(s)
  // NOTE: here, the test's `after` function(s) are added BEFORE global `after` functions
  // this way, the test's `after` function(s) are fired right after
  if (test.after) {
    if (test.after instanceof Array) {
      // if array, add each one to `queue`
      test.after.forEach(function(fn) {
        queue.push(fn);
      });
    } else {
      // if function, add to `queue`
      queue.push(test.after);
    }
  }

  // find all global `after` functions
  if (ctrllr.options.after) {
    if (ctrllr.options.after instanceof Array) {
      // if array, add each one to `queue`
      ctrllr.options.after.forEach(function(fn) {
        queue.push(fn);
      });
    } else {
      // if function, add to `queue`
      queue.push(ctrllr.options.after);
    }
  }

  /** recursive function for running all `after` functions */
  function run() {
    if (!queue.length) {
      // if no more functions in queue, get outta here
      deferred.resolve(config);
    } else {
      // calls safeAsync with the `queue[0]` being the target value
      // also gives it a max timeout and the additional arguments
      // to pass if queue[0] is a function
      var
        timeout = test.timeout || ctrllr.options.timeout,
        args = [
          ctrllr.getHelper(),
          response
        ];

      safeAsync(queue[0], timeout, args)
        .fin(function() {
          queue.splice(0, 1);
          run();
        });
    }
  }

  // start recursive call
  run();

  return deferred.promise;
}

/**
 * sets headers inside request object
 * @param config.request {Object} request configuration
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function setHeaders(config) {
  var
    deferred = $q.defer(),
    request = config.request,
    ctrllr = config.ctrllr,
    test = config.test;

  // calls safeAsync with `test.headers` being the target value
  // also gives it a max timeout and the ctrllr helper to pass
  // to `test.headers` as an argument if it is a function
  var
    timeout = test.timeout || ctrllr.options.timeout,
    args = [ctrllr.getHelper()];

  safeAsync(test.headers, timeout, args)
    .then(function(headers) {
      if (headers) {
        for (var k in headers) {
          request.setHeader(k, headers[k]);
          // request.headers[k] = headers[k];
        }
      }

      deferred.resolve(config);
    }).fail(function(err) {
      return deferred.reject(err);
    });

  return deferred.promise;
}

/**
 * executes a request object, builds a response
 * @param config.request {Object} request configuration
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function makeRequest(config) {
  var
    deferred = $q.defer(),
    request = config.request,
    ctrllr = config.ctrllr,
    test = config.test;

  // calls safeAsync with `test.path` or `test.url` being the target value
  // also gives it a max timeout and the ctrllr helper to pass
  // to `test.path || `test.url` as an argument if it is a function
  var
    urlConfig = test.path || test.url || request.getConfig().url || '/',
    timeout = test.timeout || ctrllr.options.timeout,
    args = [ctrllr.getHelper()];

  safeAsync(urlConfig, timeout, args)
    .then(function(url) {
      var fullUrl;

      // if server specified
      if (ctrllr.options.server) {
        fullUrl = 'http://localhost:' + ctrllr.options.port + (url || '');
      } else {
        if (!ctrllr.options.baseUrl || !test.baseUrl || !test.url) {
          throw new Error('No `server`, `baseUrl`, or `url` specified.');
        }

        fullUrl = (ctrllr.options.baseUrl || test.baseUrl || '') + url;
      }

      // set url
      request.setUrl(fullUrl);

      if (test.method) {
        request.setMethod(test.method);
      }

      if (test.send) {
        request.send(test.send);
      }

      var attachments = request.getConfig().attachments || null;
      if (attachments) {
        for (var i = 0, len = attachments.length; i < len; i++) {
          request.attach(attachments[i]);
        }
      }

      // make request
      request
        .execute()
        .then(function(res) {
          deferred.resolve({
            response: new Response(null, res),
            ctrllr: ctrllr,
            test: test
          });
        }).fail(function(err) {
          deferred.resolve({
            response: new Response(err, null),
            ctrllr: ctrllr,
            test: test
          });
        });
    }).fail(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
}

/**
 * checks response against specifications
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test specification
 * @param config.req {Object} request object
 * @returns {promise|*|Q.promise}
 */
function processAssertions(config) {
  var
    deferred = $q.defer(),
    response = config.response,
    ctrllr = config.ctrllr,
    test = config.test;

  // check response status if `expectStatus` provided
  if (typeof test.expectStatus !== 'undefined') {
    if (response.status.toString() !== test.expectStatus.toString()) {
      ++ctrllr._failures;
      printAssertion(false, 'Failed assertion: expectStatus');
      printAssertionMeta(false, 'EXPECTED: ' + test.expectStatus);
      printAssertionMeta(false, 'RECEIVED: ' + response.status.toString());
    } else {
      printAssertion(true, 'Passed assertion: expectStatus ' + test.expectStatus);
    }
  }

  // check response type if `expectJSON` provided
  if (typeof test.expectJSON !== 'undefined') {
    if ((typeof response.body === 'object') !== test.expectJSON) {
      ++ctrllr._failures;
      printAssertion(false, 'Failed assertion: expectJSON - expected ' + formatBoolean(test.expectJSON));
    } else {
      printAssertion(true, 'Passed assertion: expectJSON');
    }
  }

  // check response type if `expectArray` provided
  if (typeof test.expectArray !== 'undefined') {
    if ((response.body instanceof Array) !== test.expectArray) {
      ++ctrllr._failures;
      printAssertion(false, 'Failed assertion: expectArray - expected ' + formatBoolean(test.expectArray));
    } else {
      printAssertion(true, 'Passed assertion: expectArray');
    }
  }

  // make sure response has keys if `expectKeys` provided
  if (typeof test.expectKeys !== 'undefined') {
    var
      obj = response.body instanceof Array ? response.body[0] : response.body,
      val;

    // TODO: make sure response is object
    // TODO: make sure `expectKeys` is array

    for (var i = 0, len = test.expectKeys.length; i < len; i++) {
      val = evalKeyValue(obj, test.expectKeys[i]);
      if (val === undefined) {
        ++ctrllr._failures;
        printAssertion(false, 'Failed assertion: expectKeys - expected `' + test.expectKeys[i] + '`');
      } else {
        printAssertion(true, 'Passed assertion: expectKeys `' + test.expectKeys[i] + '`');
      }
    }
  }

  // make sure key/value pairs match if `expectKeyValue` object provided
  if (typeof test.expectKeyValue !== 'undefined') {
    var
      obj = response.body instanceof Array ? response.body[0] : response.body,
      val;

    for (var k in test.expectKeyValue) {
      val = evalKeyValue(obj, k);
      if (val !== test.expectKeyValue[k]) {
        ++ctrllr._failures;
        printAssertion(false, 'Failed assertion: expectKeyValue - { ' + k + ' : ' + test.expectKeyValue[k] + ' }');
        printAssertionMeta(false, 'EXPECTED: ' + test.expectKeyValue[k]);
        printAssertionMeta(false, 'RECEIVED: ' + val);
      } else {
        printAssertion(true, 'Passed assertion: expectKeyValue - { ' + k + ' : ' + test.expectKeyValue[k] + ' }');
      }
    }
  }

  deferred.resolve(config);
  return deferred.promise;
}

/* ==========================================================================
 CTRLLR - Testing library instance
 ========================================================================== */

/**
 * testing library
 * @param config
 * @returns {CTRLLR}
 * @constructor
 */
var CTRLLR = function(config) {
  if (!(this instanceof CTRLLR)) {
    return new CTRLLR(config);
  }

  if (config) {
    this.config(config);
  }

  this.store = new Store();
  this.helper = new Helper(this);

  this._tests = [];
  this._queue = [];
  this._failures = 0;
  this._startedServer = false;

  return this;
};

/**
 * add global configs
 * @param config
 * @returns {CTRLLR}
 */
CTRLLR.prototype.config = function(config) {
  if (isExpressApp(config)) {
    this.options.server = config;
    return this;
  }

  // default config
  var defaults = {
    port: 4040,
    timeout: 5000
  };

  util.extend(defaults, config || {});

  this.options = this.options || {};
  for (var key in defaults) {
    this.options[key] = defaults[key];
  }

  return this;
};

/**
 * add test to queue
 * @param test {Object} test specs
 * @returns {CTRLLR}
 */
CTRLLR.prototype.add = function(test) {
  var alias = this;

  if (test instanceof Array) {
    // if array provided, add each individual tests to queue
    test.forEach(function(_test) {
      alias._tests.push(_test);
    });
  } else {
    alias._tests.push(test);
  }

  return alias;
};

/**
 * run individual test
 * @param test {Object} test to run
 * @param inQueue {Boolean} whether in queue, calls next test after complete if so
 * @returns {CTRLLR}
 */
CTRLLR.prototype.run = function(test, inQueue) {
  print('Running test: ' + (test.name || test.description), 'blue', 0);

  var
    alias = this,
    req = new Request(),
    config = {
      ctrllr: alias,
      request: req,
      test: test
    };

  // start test flow
  (function() {
    var deferred = $q.defer();

    // make sure server initialized
    if (alias.options.server) {
      alias._serverInit.then(function() {
        deferred.resolve(config);
      });
    } else {
      deferred.resolve(config);
    }

    return deferred.promise;
  })().then(before)
    .then(setHeaders)
    .then(makeRequest)
    .then(processAssertions)
    .then(after)
    .fin(function() {
      // removes tests from queue, calls next one if in queue
      if (!inQueue || (alias._queue && alias._queue.length === 1)) {
        // if not running test in suite or last test in suite, end tests
        alias.stop();
      } else {
        // remove test from queue, start next test
        alias._queue.splice(0, 1);
        alias.run(alias._queue[0], true);
      }
    });

  return alias;
};

/**
 * starts tests, server if provided
 * @returns {CTRLLR}
 */
CTRLLR.prototype.start = function() {
  var alias = this;

  if (alias.options.server && !alias._startedServer) {
    (function() {
      var deferred = $q.defer();

      alias._serverInit = deferred.promise;
      alias.options.server.listen(alias.options.port, function() {
        deferred.resolve(alias.options.server);
      });

      print("CTRLLR running server on port: " + alias.options.port, 'cyan', 0);
    })();
  }

  alias._tests.forEach(function(test) {
    alias._queue.push(test);
  });

  if (alias._queue.length) {
    alias.run(alias._queue[0], true);
  } else {
    alias.stop();
  }

  print('Starting CTRLLR tests.', 'cyan', 0);
  return alias;
};

CTRLLR.prototype.getActiveTest = function() {
  return this._queue[0];
};

/**
 * stops tests, server if provided; kills process
 * @returns {CTRLLR}
 */
CTRLLR.prototype.stop = function() {
  var alias = this;

  print('Completed tests.', 'cyan', 0);
  print('Tests ran: ' + alias._tests.length, 'green', 0);
  print('Tests failed: ' + alias._failures, 'red', 0);

  process.exit(0);

  return alias;
};

/**
 * gets the ctrllr instance's helper
 * @returns {Store}
 */
CTRLLR.prototype.getHelper = function() {
  return this.helper;
};

/**
 * gets the ctrllr instance's data store
 * @returns {Store}
 */
CTRLLR.prototype.getStore = function() {
  return this.store;
};

/* ==========================================================================
 ----------------------------------------------------------------------------
 ========================================================================== */

module.exports = CTRLLR;