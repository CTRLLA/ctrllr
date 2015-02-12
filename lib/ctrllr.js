var

  /** async flow lib */
  $q = require('q'),

  /** server utilities / helper fns */
  util = require('../lib/util'),

  log = new require('../lib/logger')({ publish: false }),

  /** test wrapper */
  Test = require('../lib/test'),

  /** data store */
  Store = require('../lib/store'),

  /** ctrllr interface */
  Interface = require('../lib/interface');

/* ==========================================================================
 CTRLLR - Testing library
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

  var alias = this;
  alias.init(config || null);

  return alias;
};

/**
 * sets up ctrllr instance config
 * @param config {Object} user-supplied configuration
 * @returns {CTRLLR}
 */
CTRLLR.prototype.init = function(config) {
  var
    alias = this,
    defaults = {
      port: 4040,
      timeout: 5000
    };

  // if `config` is an express server, nest in `config` object
  if (util.isExpressApp(config)) {
    config = { server: config };
  }

  // merge default options w/ user-supplied config
  alias.options = util.extend(defaults, config);

  alias.successes = 0;
  alias.failures = 0;
  alias.tests = [];
  alias.queue = [];
  alias.store = new Store();
  alias.interface = new Interface(this);

  alias._startedServer = false;

  return alias;
};

/**
 * gets the test that's being run
 * @returns {Test}
 */
CTRLLR.prototype.getActiveTest = function() {
  return this.queue[0] || null;
};

/**
 * gets the interface for the ctrllr instance
 * @returns {Interface}
 */
CTRLLR.prototype.getInterface = function() {
  return this.interface;
};

/**
 * gets the data store for the ctrllr instance
 * @returns {Store}
 */
CTRLLR.prototype.getStore = function() {
  return this.store;
};

/**
 * creates a test, adds to queue of tests to be run
 * @param config {Object} configuration for test
 * @returns {CTRLLR}
 */
CTRLLR.prototype.add = function(config) {
  var alias = this;

  // make sure config is an array
  if (!(config instanceof  Array)) {
    config = [config];
  }

  // iterate over config, create test instances and add to array of tests
  config.forEach(function(testConfig) {
    var test = new Test(testConfig);
    alias.tests.push(test);
  });

  return alias;
};

CTRLLR.prototype.initTest = function(test) {
  // find all `beforeEach` functions, add to test `before` array
  var
    alias = this,
    beforeEach = alias.options.beforeEach,
    afterEach = alias.options.afterEach,
    queue = [];

  // make sure global `beforeEach` set
  if (beforeEach) {
    beforeEach = [];
  }

  // make sure `beforeEach` is an array
  if (!(beforeEach instanceof Array)) {
    beforeEach = [beforeEach];
  }

  // iterate over all `beforeEach` functions, add to `queue`
  beforeEach.forEach(function(fn) {
    queue.push(fn);
  });

  if (!test.before) {
    // initialize `test.before` as array if not set
    test.before = [];
  } else if (!(test.before instanceof Array)) {
    // make sure `test.before` is an array
    test.before = [test.before]
  }

  // iterate over all `before` functions, add to `queue`
  test.before.forEach(function(fn) {
    queue.push(fn);
  });

  test.before = queue;

  ////////////////////
  ////////////////////

  // find all `afterEach` functions, add to test `after` array

  queue = [];

  // make sure global `afterEach` set
  if (afterEach) {
    afterEach = [];
  }

  // make sure `afterEach` is an array
  if (!(afterEach instanceof Array)) {
    afterEach = [afterEach];
  }

  // iterate over all `afterEach` functions, add to `queue`
  afterEach.forEach(function(fn) {
    queue.push(fn);
  });

  if (!test.after) {
    // initialize `test.after` as array if not set
    test.after = [];
  } else if (!(test.before instanceof Array)) {
    // make sure `test.after` is an array
    test.after = [test.after]
  }

  // iterate over all `after` functions, add to `queue`
  test.after.forEach(function(fn) {
    queue.push(fn);
  });

  test.after = queue;
};

/**
 * runs a test
 * @param test {Object} test to run
 * @returns {$q.promise}
 */
CTRLLR.prototype.run = function(test) {
  console.log('Running test.', test);

  var
    alias = this,
    deferred = $q.defer();

  // configure test
  alias.initTest(test);

  test
    .execute()
    .fin(function() {
      console.log('executed test.');
      return deferred.resolve(test);
    });

  return deferred.promise;
};

/**
 * executes all the tests, starts and stops server if provided
 * @returns {CTRLLR}
 */
CTRLLR.prototype.start = function() {
  var alias = this;

  $q.fcall(function() {
    var deferred = $q.defer();

    if (!alias.options.server || alias._startedServer) {
      deferred.resolve(false);
      return deferred.promise;
    }

    log.format('CTRLLR starting server...', 'cyan');
    alias.options.server.listen(alias.options.port, function() {
      log.format('CTRLLR running server on port: ' + alias.options.port, 'cyan');
      return deferred.resolve(alias.options.server);
    });

    return deferred.promise;
  }).then(function() {
    // add all tests to `queue`, i.e. the tests that need to be run
    alias.tests.forEach(function(test) {
      alias.queue.push(alias.run);
    });

    // call `recurse` function
    return util.recurse(alias.queue, function() {
      return [alias.tests[0]];
    }, alias);
  }).then(function() {
    alias.stop();
  }).fail(function(err) {
    log.error('Error starting CTRLLR tests.', err);
  });

  return alias;
};

/**
 * stops tests, server if provided; kills process
 * @returns {CTRLLR}
 */
CTRLLR.prototype.stop = function() {
  var alias = this;

  log.format('Completed tests.', 'cyan');
  // print('Completed tests.', 'cyan', 0);
  // print('Tests ran: ' + alias.test.length, 'green', 0);
  // print('Tests failed: ' + alias._failures, 'red', 0);

  process.exit(0);

  return alias;
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = CTRLLR;