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
        after: function(response, assert) {
            assert('_id is defined.', typeof response.body._id !== 'undefined');
        },
        expectStatus: 200,
        expectJSON: true
    },
    {
        description: 'Deferred `after` function',
        method: 'POST',
        url: '/api/users',
        headers: { Authorization: 'password' },
        after: function(response, assert) {
            var deferred = require('q').defer();

            setTimeout(function() {
                assert('_id is defined.', typeof response.body._id !== 'undefined');
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
        after: function(response, assert) {
            var deferred = require('q').defer();

            setTimeout(function() {
                deferred.resolve(true);
                assert('true === true', true === true);
            }, 100);

            // deferred never resolved

            return deferred.promise;
        },
        expectStatus: 200,
        expectJSON: true
    }
];