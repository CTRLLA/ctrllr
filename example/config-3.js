var

  /** async flow lib */
  $q = require('q');

module.exports = {
  port: 6060,
  server: require('../example/server'),
  timeout: 5000,
  plugins: [
    {
      name: 'basicAuth',
      before: function(ctrllr, request, value) {
        var deferred = $q.defer();

        setTimeout(function() {
          request.setHeader('Authorization', value);
          deferred.resolve(true);
        }, 1000);

        return deferred.promise;
      }
    },
    {
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
    }
  ]
};