var

  /** async flow lib */
  $q = require('q'),

  /** server utilities / helper fns */
  util = require('../lib/util'),

  /** log helper */
  log = new require('../lib/logger')({ publish: false });

/* ==========================================================================
 Interface - Interface for interacting with ctrllr instance
 ========================================================================== */

/**
 * interface for modifying and interacting with tests
 * @param ctrllr {CTRLLR} ctrllr instance
 * @returns {Interface}
 * @constructor
 */
var Interface = function(ctrllr) {
  if (!(this instanceof Interface)) {
    return new Interface(ctrllr);
  }

  this.ctrllr = ctrllr;
  this.init(ctrllr.config);

  return this;
};

/**
 * sets configuration for operating the interface
 * @param config {Object} user-supplied configuration
 * @returns {Interface}
 */
Interface.prototype.init = function(config) {
  var
    alias = this,
    defaults = {
      // ...
    };

  alias.config = util.extend(defaults, config);
  return alias;
};

/**
 * simple `assert` function
 * @param description {String} description of assertion
 * @param bool {Boolean|Function} whether or not it succeeded
 * @param expectedValue {*} the expected value
 * @param actualValue {*} the value received
 */
Interface.prototype.assert = function(description, bool, expectedValue, actualValue) {
  var isSuccessful = true;

  if (typeof bool === 'function') {
    // if function passed, get result
    bool = bool();
  }

  if (bool === true) {
    log.assertion(true, 'Passed assertion: ' + description);
    ++this.ctrllr._successes;
  } else {
    isSuccessful = false;
    ++this.ctrllr._failures;
    log.assertion(false, 'Failed assertion: ' + description);
  }

  if (typeof expectedValue !== 'undefined' || typeof actualValue !== 'undefined') {
    log.assertionMeta(isSuccessful, 'EXPECTED: ' + expectedValue);
    log.assertionMeta(isSuccessful, 'RECEIVED: ' + actualValue);
  }
};

/**
 * gets the ctrllr instance's data store
 * @returns {Store}
 */
Interface.prototype.getStore = function() {
  return this.ctrllr.getStore();
};

/**
 * adds data to queue for post / put request
 * @param obj {Object} data to send
 */
Interface.prototype.send = function(obj) {
  var test = this.ctrllr.getActiveTest();

  // TODO: make sure obj is typeof 'object'
  for (var k in obj) {
    test._data[k] = obj[k];
  }
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = Interface;