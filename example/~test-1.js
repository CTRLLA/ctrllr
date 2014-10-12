var

    /** custom logging service */
    log = require('../lib/logger')(),

    /** test server */
    server = require('./server'),

    /** ctrllr testing lib */
    ctrllr = new require('../index.js')({
        port: 6060,
        server: server
    });

ctrllr
    .get('/api/users')
    .expectJSON()
    .expectStatus(200)
    .run();

ctrllr
    .post('/v1/users')
    .expectStatus(401)
    .expect
    .run();

log.debug("Running test.");