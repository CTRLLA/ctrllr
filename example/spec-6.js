module.exports = [
  {
    description: 'Url builder test',
    method: 'GET',
    url: function() {
      return '/api/auth'
    },
    expectStatus: 401
  },
  {
    description: 'Async url builder test',
    method: 'GET',
    url: function() {
      var deferred = require('q').defer();

      setTimeout(function() {
        deferred.resolve('/api/users/1');
      }, 500);

      return deferred.promise;
    },
    expectJSON: true,
    expectKeyValue: {
      _id: 1
    }
  }
];