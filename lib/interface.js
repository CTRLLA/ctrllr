var

  /** async flow lib */
  $q = require('q'),

  /** server utilities / helper fns */
  util = require('../lib/util');

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
  return this;
};

/**
 * simple `assert` function
 * @param description {String} description of assertion
 * @param bool {Boolean|Function} whether or not it succeeded
 */
Interface.prototype.assert = function(description, bool) {
  if (typeof bool === 'function') {
    // if function passed, get result
    bool = bool();
  }

  if (bool === true) {
    printAssertion(true, 'Passed assertion: ' + description);
  } else {
    ++this.ctrllr._failures;
    printAssertion(false, 'Failed assertion: ' + description);
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