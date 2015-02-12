var

  /** async flow lib */
  $q = require('q');

/* ==========================================================================
 Test - Configuration for a test
 ========================================================================== */

/**
 * test wrapper
 * @constructor
 * @returns {Test}
 */
var Test = function() {
  if (!(this instanceof Test)) {
    return new Test();
  }

  var alias = this;
  alias.headers = {};
  alias.data = {};
  alias.params = {};
  alias.before = [];
  alias.after = [];

  return alias;
};

/**
 * executes a test
 * @returns {$q.promise}
 */
Test.prototype.execute = function() {
  var
    alias = this,
    deferred = $q.defer();

  // TODO: execute real test
  setTimeout(function() {
    return deferred.resolve(alias);
  }, 300);

  return deferred.promise;
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = Test;