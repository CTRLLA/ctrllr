module.exports = {
  port: 6060,
  server: require('../example/server'),
  timeout: 5000,
  beforeEach: [
    function() {
      console.log('before function 1')
    },
    function() {
      console.log('before function 2')
    },
    function() {
      var deferred = require('q').defer();
      console.log('before function 3');

      setTimeout(function() {
        deferred.resolve(true);
      }, 50);

      return deferred.promise;
    }
  ],
  afterEach: function() {
    console.log('Running after...');
  },
  filter: function(test) {
    return test.tags && test.tags.indexOf('users') > -1;
  }
};