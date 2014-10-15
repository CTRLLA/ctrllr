module.exports = [
    {
        description: '`before` function',
        method: 'POST',
        url: '/api/users',
        before: function(ctrllr) {
            ctrllr.setHeader('Authorization', 'password');
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
        before: function(ctrllr) {
            var deferred = require('q').defer();

            setTimeout(function() {
                ctrllr.setHeader('Authorization', 'password');
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
        after: function(response, ctrllr) {
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
        after: function(response, ctrllr) {
            var deferred = require('q').defer();

            setTimeout(function() {
                ctrllr.assert('_id is defined.', function() {
                    return typeof response.body._id !== 'undefined';
                });

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
        before: function(response, assert) {

        },
        after: function(response, ctrllr) {
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