module.exports = [
  {
    description: 'Url builder test',
    method: 'GET',
    basicAuth: 'password',
    customAssertion: true,
    url: '/api/auth',
    expectStatus: 200
  }
];