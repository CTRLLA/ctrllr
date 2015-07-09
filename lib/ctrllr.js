var

  /** async flow lib */
  $q = require('q'),

  /** server utilities / helper fns */
  util = require('../lib/util'),

  /** log helper */
  log = new require('../lib/logger')({ publish: false }),

  /** default plugins before & after helpers */
  plugins = require('../lib/plugins'),

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

  // merge default config w/ user-supplied config
  alias.config = util.extend(defaults, config);

  alias._successes = 0;
  alias._failures = 0;
  alias.tests = [];
  alias.queue = [];
  alias.store = new Store();
  alias.interface = new Interface(this);

  alias._startedServer = false;

  if (alias.config.plugins) {
    alias.addPlugin(alias.config.plugins);
  }

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
 * @param path {String} path to test
 * @returns {CTRLLR}
 */
CTRLLR.prototype.add = function(config, path) {
  var
    alias = this,
    ctrllrInterface = alias.getInterface();

  // make sure config is an array
  if (!(config instanceof  Array)) {
    config = [config];
  }

  // iterate over config, create test instances and add to array of tests
  config.forEach(function(testConfig) {
    if (alias.config.transform) {
      testConfig = alias.config.transform(testConfig, path);
    }

    if (!alias.config.filter || alias.config.filter(testConfig)) {
      var test = new Test(testConfig, ctrllrInterface);
      alias.tests.push(test);
    }
  });

  return alias;
};

/**
 * configures a test w/ additional functions, formats for execution
 * @param test {Test} test instance
 * @returns {Test}
 */
CTRLLR.prototype.initTest = function(test) {
  // find all `beforeEach` functions, add to test `before` array
  var
    alias = this,
    beforeEach = alias.config.beforeEach,
    afterEach = alias.config.afterEach,
    queue = [];

  // NOTE: here, global `beforeEach` functions are added BEFORE the test's `before` function(s)
  // this way, the global `beforeEach` can execute any necessary setup blocks

  if (!beforeEach) {
    // make sure `beforeEach` is defined
    beforeEach = [];
  } else if (!(beforeEach instanceof Array)) {
    // make sure `beforeEach` is an array
    beforeEach = [beforeEach];
  }

  // iterate over all `beforeEach` functions, add to `queue`
  // unless config explicitly states `beforeEach: false`
  if (test.config.beforeEach !== false) {
    beforeEach.forEach(function(fn) {
      queue.push(fn);
    });
  }

  if (!test.config.before) {
    // initialize `test.before` as array if not set
    test.config.before = [];
  } else if (!(test.config.before instanceof Array)) {
    // make sure `test.before` is an array
    test.config.before = [test.config.before]
  }

  // iterate over all `before` functions, add to `queue`
  test.config.before.forEach(function(fn) {
    queue.push(fn);
  });

  // iterate over all `test.config` looking for plugins
  Object.keys(test.config).forEach(function(key) {
    // iterate over plugins, check if has `before` function & is the
    plugins.forEach(function(plugin) {
      if (plugin.hasOwnProperty('before') && plugin.name === key) {
        queue.push(function(ctrllr, request) {
          return plugin.before(ctrllr, request, test.config[key]);
        });
      }
    });
  });

  test.config.before = queue;

  ////////////////////
  ////////////////////

  // find all `afterEach` functions, add to test `after` array

  queue = [];

  if (!test.config.after) {
    // initialize `test.after` as array if not set
    test.config.after = [];
  } else if (!(test.config.after instanceof Array)) {
    // make sure `test.after` is an array
    test.config.after = [test.config.after]
  }

  // iterate over all `after` functions, add to `queue`
  test.config.after.forEach(function(fn) {
    queue.push(fn);
  });

  // iterate over all `test.config` looking for plugins
  Object.keys(test.config).forEach(function(key) {
    // iterate over plugins, check if has `before` function & is the
    plugins.forEach(function(plugin) {
      if (plugin.hasOwnProperty('after') && plugin.name === key) {
        queue.push(function(ctrllr, response) {
          return plugin.after(ctrllr, response, test.config[key]);
        });
      }
    });
  });

  // NOTE: here, global `afterEach` functions are added AFTER the test's `after` function(s)
  // this way, the global `afterEach` can clean up after

  if (!afterEach) {
    // make sure `afterEach` is defined
    afterEach = [];
  } else if (!(afterEach instanceof Array)) {
    // make sure `afterEach` is an array
    afterEach = [afterEach];
  }

  // iterate over all `afterEach` functions, add to `queue`
  // unless config explicitly states `afterEach: false`
  if (test.config.afterEach !== false) {
    afterEach.forEach(function(fn) {
      queue.push(fn);
    });
  }

  test.config.after = queue;

  return test;
};

/**
 * adds a plugin to the available plugins
 * @param plugin {Object|Array} plugin or array of plugins to add
 * @returns {CTRLLR}
 */
CTRLLR.prototype.addPlugin = function(plugin) {
  var array = plugin instanceof Array ? plugin : [plugin];

  array.forEach(function(_plugin) {
    plugins.push(_plugin);
  });

  return this;
};

/**
 * runs a test
 * @param test {Object} test to run
 * @returns {$q.promise}
 */
CTRLLR.prototype.run = function(test) {
  log.format('Running test: ' + (test.config.description || ''), 'blue');

  var
    alias = this,
    deferred = $q.defer();

  // configure test
  alias.initTest(test);

  test
    .execute()
    .fin(function() {
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

    if (!alias.config.server || alias._startedServer) {
      deferred.resolve(false);
      return deferred.promise;
    }

    log.format('CTRLLR starting server...', 'cyan');
    alias.config.server.listen(alias.config.port, function() {
      log.format('CTRLLR running server on port: ' + alias.config.port, 'cyan');
      return deferred.resolve(alias.config.server);
    });

    return deferred.promise;
  }).then(function() {
    // add all tests to `queue`, i.e. the tests that need to be run
    alias.tests.forEach(function(test) {
      alias.queue.push(alias.run);
    });

    var index = 0;
    return util.recurse(alias.queue, function() {
      // get the test at the current index, increment each time
      var test = alias.tests[index];
      index++;

      return [test];
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