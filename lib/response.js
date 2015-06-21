var

  /** async flow lib */
  $q = require('q'),

  /** server utilities / helper fns */
  util = require('../lib/util');

/* ==========================================================================
 Response - Wrapper for HTTP response.
 ========================================================================== */

/**
 * wrapper for HTTP response
 * @param error {Error|String} error from request
 * @param response {Object} response object
 * @returns {Response}
 * @constructor
 */
var Response = function(error, response) {
  if (!(this instanceof Response)) {
    return new Response(error, response);
  }

  this.error = error ? new Error(error.toString()) : null;
  this.response = response || null;
  this.status = (response || {}).status || null;
  this.body = (response || {}).body || null;
  this.header = (response || {}).header || null;

  return this;
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = Response;