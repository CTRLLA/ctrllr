/* ==========================================================================
 Store - Data store
 ========================================================================== */

/**
 * data store
 * @constructor
 */
var Store = function() {
  if (!(this instanceof Store)) {
    return new Store();
  }

  /**
   * holds all data
   * @type {Object}
   */
  this.data = {};

  return this;
};

/**
 * get previously stored key
 * @param key {String|*}
 * @returns {*}
 */
Store.prototype.get = function(key) {
  if (typeof this.data[key.toString()] !== 'undefined') {
    return this.data[key.toString()];
  }

  return null;
};

/**
 * store data
 * @param key {String|*}
 * @param val {*}
 * @returns {*}
 */
Store.prototype.set = function(key, val) {
  this.data[key.toString()] = val;
  return val;
};

/**
 * remove data from store
 * @param key {String|*}
 */
Store.prototype.remove = function(key) {
  delete this.data[key];
};

/**
 * remove all items from data store
 */
Store.prototype.clear = function() {
  for (var k in this.data) {
    delete this[k];
  }

  this.data = {};
};

/**
 * returns all data in the store
 * @returns {Object}
 */
Store.prototype.dump = function() {
  /*
   // parse and stringify so the the object isn't passed by reference
   return JSON.parse(JSON.stringify(this.data));
   */

  return this.data;
};

/**
 * returns a stringified version of the data
 * @returns {string}
 */
Store.prototype.serialize = function() {
  try {
    return JSON.stringify(this.data);
  } catch (e) {
    return null;
  }
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = Store;