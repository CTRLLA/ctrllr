module.exports = {
    description: 'Users list endpoint.',
    method: 'GET',
    url: '/api/users',
    expectStatus: 200,
    expectJSON: true,
    expectArray: true,
    expectKeys: [
        '_id',
        'username'
    ]
};