module.exports = [
    {
        description: 'Auth endpoint security example.',
        method: 'GET',
        url: '/api/auth',
        expectStatus: 401
    },
    {
        description: 'Auth endpoint header example.',
        method: 'GET',
        url: '/api/auth',
        headers: { Authorization: 'password' },
        expectStatus: 200,
        expectJSON: true,
        expectKeyValue: {
            _id: 1
        }
    },
    {
        description: 'Auth endpoint 2',
        method: 'GET',
        url: '/api/auth',
        headers: { Authorization: 'password', Authorization2: 'password' },
        expectStatus: 200,
        expectJSON: true,
        expectKeyValue: {
            _id: 1
        }
    },
    {
        description: 'Auth endpoint custom header',
        method: 'GET',
        url: '/api/auth',
        headers: function() {
            return {
                Authorization: 'password'
            };
        },
        expectStatus: 200,
        expectJSON: true,
        expectKeyValue: {
            _id: 1
        }
    }
];