module.exports = [
    {
        description: 'Single user test one.',
        method: 'GET',
        url: '/api/users/1',
        expectStatus: 200,
        expectJSON: true,
        expectKeys: [
            '_id',
            'username'
        ]
    },
    {
        description: 'Single user test two.',
        method: 'GET',
        url: '/api/users/1',
        expectStatus: 200,
        expectJSON: true,
        expectKeyValue: {
            _id: 1
        }
    }
];