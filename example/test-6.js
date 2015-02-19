var

  /** async flow lib */
  $q = require('q'),

  /** ctrllr config */
  config = require('../example/config'),

  /** ctrllr instance */
  ctrllr = new require('../lib/ctrllr')(config),

  /** tests */
  test7 = require('../example/spec-7');

ctrllr
  .add(test7)
  .addPlugin({
    name: 'basicAuth',
    before: function(ctrllr, request, value) {
      var deferred = $q.defer();

      setTimeout(function() {
        request.setHeader('Authorization', value);
        deferred.resolve(true);
      }, 1000);

      return deferred.promise;
    }
  })
  .addPlugin({
    name: 'customAssertion',
    after: function(ctrllr, response, value) {
      var deferred = $q.defer();

      setTimeout(function() {
        ctrllr.assert('value should equal true', function() {
          return true === value;
        });

        deferred.resolve(true);
      }, 1000);

      return deferred.promise;
    }
  })
  .start();