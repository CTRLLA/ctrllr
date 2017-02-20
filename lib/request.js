var

  /** async flow lib */
  $q = require('q'),

  /** http request library */
  request = require('superagent'),

  /** server utilities / helper fns */
  util = require('../lib/util');

/* ==========================================================================
 Request - Class for making HTTP requests
 ========================================================================== */

/**
 * helper class for building HTTP requests
 * @returns {Request}
 * @constructor
 */
var Request = function(options) {
  if (!(this instanceof Request)) {
    return new Request(options);
  }

  var defaults = {
    // method: String
    // url: String
    // headers: Object
    // params: Object
    // data: Object

    method: 'GET'
  };

  this.config = util.extend(defaults, options || {});
  return this;
};

/**
 * sets a header
 * @param key {String} name of header
 * @param val {String} value to set
 */
Request.prototype.setHeader = function(key, val) {
  if (!this.config.headers) {
    this.config.headers = {};
  }

  this.config.headers[key] = val;
  return this;
};

/**
 * remove header from request
 * @param key
 * @returns {Request}
 */
Request.prototype.removeHeader = function(key) {
  if (!this.config.headers) {
    this.config.headers = {};
  }

  delete this.config.headers[key];
  return this;
}

/**
 * add query parameter to request
 * @param key {String} name of query parameter
 * @param val {String} value of query parameter
 * @returns {Request}
 */
Request.prototype.setParam = function(key, val) {
  if (!this.config.params) {
    this.config.params = {};
  }

  this.config.params[key] = val;
  return this;
};

/**
 * removes a query parameter from request
 * @param key {String} name of query parameter to remove
 * @returns {Request}
 */
Request.prototype.removeParam = function(key) {
  if (!this.config.params) {
    this.config.params = {};
  }

  delete this.config.params[key];
  return this;
};

/**
 * sets the HTTP request method
 * @param method {String}
 * @returns {Request}
 */
Request.prototype.setMethod = function(method) {
  // TODO: method validation

  this.config.method = method;
  return this;
};

/**
 * sets the url for the HTTP request
 * @param url {String}
 * @returns {Request}
 */
Request.prototype.setUrl = function(url) {
  this.config.url = url;
  return this;
};

/**
 * sets the relative path for the HTTP request
 * @param path {String}
 * @returns {Request}
 */
Request.prototype.setPath = function(path) {
  this.config.path = path;
  return this;
};

/**
 * returns the request object's configuration
 * @returns {Object}
 */
Request.prototype.getConfig = function() {
  return this.config;
};

/**
 * adds data to the request body
 * @param data {Object} data to send
 * @param shouldOverwrite {Boolean} specifies that existing data should be replaced
 * @returns {Request}
 */
Request.prototype.send = function(data, shouldOverwrite) {
  if (shouldOverwrite) {
    this.config.data = data;
  } else {
    if (!this.config.data) {
      this.config.data = {};
    }

    for (var k in data) {
      this.config.data[k] = data[k];
    }
  }

  return this;
};

/**
 * attaches a file to be sent
 * @param filePath {String} path to file to upload
 * @returns {Request}
 */
Request.prototype.attach = function(name, filePath) {
  if (!this.config.attachments) {
    this.config.attachments = {};
  }

  this.config.attachments[name] = filePath;
  return this;
};

/**
 * executes the request
 * @returns {promise|*|Q.promise}
 */
Request.prototype.execute = function() {
  var
    deferred = $q.defer(),
    method = (this.config.method || 'GET').toLowerCase(),
    r = request[method](this.config.url);

  if (this.config.headers) {
    for (var k in (this.config.headers || {})) {
      r.set(k, this.config.headers[k]);
    }
  }

  if (this.config.data) {
    r.send(this.config.data);
  }

  if (this.config.attachments) {
    for (var k in this.config.attachments) {
      r.attach(k, this.config.attachments[k]);
    }
  }

  // TODO: add query parameters to request
  r.end(function(error, response) {
    if (error) {
      return deferred.reject(error);
    }

    return deferred.resolve(response);
  });

  return deferred.promise;
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = Request;
