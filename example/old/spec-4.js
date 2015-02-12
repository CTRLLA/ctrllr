module.exports = [
    {
        description: '`before` function',
        method: 'POST',
        url: '/api/users',
        before: function(ctrllr, request) {
            console.log('Calling spec-4 `before`');
            request.setHeader('Authorization', 'password');
        },
        send: {
            username: 'custom username'
        },
        expectStatus: 200,
        expectJSON: true,
        expectKeyValue: {
            username: 'custom username'
        }
    },


    {
        description: 'Deferred `before` function',
        method: 'POST',
        url: '/api/users',
        before: function(ctrllr, request) {
            var deferred = require('q').defer();

            setTimeout(function() {
                request.setHeader('Authorization', 'password');
                deferred.resolve(true);
            }, 100);

            return deferred.promise;
        },
        send: {
            username: 'custom username'
        },
        expectStatus: 200,
        expectJSON: true,
        expectKeyValue: {
            username: 'custom username'
        }
    },


    {
        description: '`after` function',
        method: 'POST',
        url: '/api/users',
        headers: { Authorization: 'password' },
        after: function(ctrllr, response) {
            console.log('Calling `after` fn.');
            ctrllr.assert('_id is defined.', function() {
                return typeof response.body._id !== 'undefined';
            });
        },
        expectStatus: 200,
        expectJSON: true
    },


    {
        description: 'Deferred `after` function',
        method: 'POST',
        url: '/api/users',
        headers: { Authorization: 'password' },
        after: function(ctrllr, response) {
            var deferred = require('q').defer();

            setTimeout(function() {
                ctrllr.assert('_id is defined.', function() {
                    return typeof response.body._id !== 'undefined';
                });

                ctrllr.assert('true is true', true === true);

                deferred.resolve();
            }, 1000);

            return deferred.promise;
        },
        expectStatus: 200,
        expectJSON: true
    },


    {
        description: '`before` & `after` timeout example',
        method: 'POST',
        url: '/api/users',
        headers: { Authorization: 'password' },
        before: function(response, request) {

        },
        after: function(ctrllr, response) {
            var deferred = require('q').defer();

            setTimeout(function() {
                ctrllr.assert('true === true', true === true);

                deferred.resolve(true);
            }, 100);

            return deferred.promise;
        },
        expectStatus: 200,
        expectJSON: true
    }
];