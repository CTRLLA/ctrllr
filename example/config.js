module.exports = {
    port: 6060,
    server: require('./server'),
    timeout: 5000,
    before: [
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
    after: function() {
        console.log('Running after...');
    }
};