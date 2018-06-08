var

  /** async flow lib */
  $q = require('q'),

  /** log wrapper */
  log = new require('../lib/logger')({ publish: false }),

  /** server utilities / helper fns */
  util = require('../lib/util'),

  /** http request wrapper */
  Request = require('../lib/request'),

  /** http response wrapper */
  Response = require('../lib/response');

/* ==========================================================================
 Test - Configuration for a test
 ========================================================================== */

/**
 * test wrapper
 * @params config {Object} configuration for test
 * @params ctrllrInterface {Interface} interface between the test and controller
 * @constructor
 * @returns {Test}
 */
var Test = function(config, ctrllrInterface) {
  if (!(this instanceof Test)) {
    return new Test(config, ctrllrInterface);
  }

  var alias = this;

  alias.interface = ctrllrInterface;

  alias.config = util.extend({
    timeout: 5000,
    headers: {},
    data: {},
    params: {},
    before: [],
    after: []
  }, config);

  alias.request = new Request({
    proxy: ctrllrInterface.getProxy()
  });
  alias.response = null;

  return alias;
};

/**
 * sets the headers on the `Request` object
 * @returns {$q.promise}
 */
Test.prototype.setHeaders = function() {
  var
    alias = this,
    deferred = $q.defer(),
    request = alias.request,
    ctrllrInterface = alias.interface,
    timeout = alias.config.timeout,
    args = [ctrllrInterface];

  // calls safeAsync with `test.headers` being the target value
  // also gives it a max timeout and the ctrllr helper to pass
  // to `test.headers` as an argument if it is a function
  util
    .safeAsync(alias.config.headers, timeout, args)
    .then(function(headers) {
      if (!headers) {
        return deferred.resolve(true);
      }

      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          request.setHeader(key, headers[key]);
        }
      }

      return deferred.resolve();
    })
    .fail(function(err) {
      return deferred.reject('Error setting headers.', err);
    });

  return deferred.promise;
};

/**
 * builds the `Request` object from the configuration
 * @returns {$q.promise}
 */
Test.prototype.buildRequest = function() {
  var
    alias = this,
    deferred = $q.defer(),
    request = alias.request,
    ctrllrInterface = alias.interface,
    urlConfig = alias.config.path || alias.config.url || request.getConfig().url || '/',
    timeout = alias.config.timeout,
    args = [ctrllrInterface];

  // calls safeAsync with `test.path` or `test.url` being the target value
  // also gives it a max timeout and the ctrllr helper to pass
  // to `test.path || `test.url` as an argument if it is a function
  util.safeAsync(urlConfig, timeout, args)
    .then(function(url) {
      var fullUrl;

      // if server specified
      if (ctrllrInterface.config.server) {
        fullUrl = 'http://localhost:' + ctrllrInterface.config.port + (url || '');
      } else {
        if (!alias.config.baseUrl || !ctrllrInterface.config.baseUrl || !alias.config.url) {
          throw new Error('No `server`, `baseUrl`, or `url` specified.');
        }

        fullUrl = (alias.config.baseUrl || ctrllrInterface.config.baseUrl || '') + url;
      }

      // set url
      request.setUrl(fullUrl);

      // check for supplied method
      if (alias.config.method) {
        request.setMethod(alias.config.method);
      }

      // check for supplied data to send in the BODY
      if (alias.config.send) {
        request.send(alias.config.send);
      }

      // check for supplied file attachments
      var attachments = request.getConfig().attachments;
      if (attachments) {
        for (var i = 0, len = attachments.length; i < len; i++) {
          request.attach(attachments[i]);
        }
      }

      return deferred.resolve(alias);
    })
    .fail(function(err) {
      return deferred.reject(err);
    });

  return deferred.promise;
};

/**
 * executes the test, (calls all before, after, custom header functions, assertions, etc)
 * @returns {$q.promise}
 */
Test.prototype.execute = function() {
  var
    alias = this,
    deferred = $q.defer(),
    before = alias.config.before,
    beforeArgs = [
      alias.interface,
      alias.request
    ];

  util
    // run all before functions
    .recurse(before, beforeArgs, alias)
    .then(function() {
      return alias.setHeaders();
    })
    .then(function() {
      return alias.buildRequest();
    })
    .then(function() {
      if (alias.config.run) {
        return util.safeAsync(alias.config.run, alias.config.timeout, [ alias.interface ]);
      }

      var deferred = $q.defer();

      alias.request
        .execute()
        .then(function(res) {
          var response = new Response(null, res);
          alias.response = response;
          return deferred.resolve(response);
        })
        .fail(function(err) {
          var response = new Response(err, null);
          alias.response = response;
          return deferred.resolve(response);
        });

      return deferred.promise;
    })
    .then(function() {
      var
        after = alias.config.after,
        afterArgs = [
          alias.interface,
          alias.response || undefined
        ];

      return util.recurse(after, afterArgs, alias);
    })
    .then(function() {
      return deferred.resolve(alias);
    })
    .fail(function(err) {
      log.error('Failed to execute test.', err);
      return deferred.reject(err);
    });

  return deferred.promise;
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = Test;
