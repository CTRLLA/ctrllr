var

  /** async flow lib */
  $q = require('q'),

  /** server utilities / helper fns */
  util = require('../lib/util');

// TODO: test-level timeout

/* ==========================================================================
 Plugins for modifying tests, assertions, custom before & after functions, etc
 ========================================================================== */

module.exports = [
  {
    name: 'expectStatus',
    after: function(ctrllr, response, value) {
      ctrllr.assert('should have status code: ' + value, function() {
        return response.status.toString() === value.toString();
      });
    }
  },


  {
    name: 'expectJSON',
    after: function(ctrllr, response, value) {
      var message = value.toString() === 'true' ?
        'should return JSON' : 'should NOT return JSON';

      ctrllr.assert(message, function() {
        return value.toString() === (typeof response.body === 'object').toString();
      });
    }
  },


  {
    name: 'expectArray',
    after: function(ctrllr, response, value) {
      var message = value.toString() === 'true' ?
        'should return an array' : 'should NOT return an array';

      ctrllr.assert(message, function() {
        return value.toString() === (response.body instanceof Array).toString();
      });
    }
  },


  {
    name: 'expectKeys',
    after: function(ctrllr, response, value) {
      var
        obj = response.body instanceof Array ? response.body[0] : response.body,
        evaluatedValue;

      // TODO: make sure response is object
      // TODO: make sure `expectKeys` is array

      for (var i = 0, len = value.length; i < len; i++) {
        evaluatedValue = util.evalKeyValue(obj, value[i]);
        ctrllr.assert('should contain the key `' + value[i] + '` in the response', function() {
          return typeof evaluatedValue !== 'undefined';
        });
      }
    }
  },


  {
    name: 'expectKeyValue',
    after: function(ctrllr, response, value) {
      var
        obj = response.body instanceof Array ? response.body[0] : response.body,
        valueExpected,
        valueActual;

      // TODO: make sure response is object
      // TODO: make sure `expectKeys` is array

      for (var key in value) {
        if (value.hasOwnProperty(key)) {
          valueExpected = util.evalKeyValue(obj, key);
          valueActual = util.evalKeyValue(value, key);

          ctrllr.assert('should contain the key `' + key + '` in the response and have the value `' + value[key] + '`', function() {
            return valueExpected === valueActual;
          }, valueExpected, valueActual);
        }
      }
    }
  }
];