var

    /** custom logging service */
    log = require('../lib/logger')(),

    /** test server */
    server = require('./server'),

    /** ctrllr testing lib */
    ctrllr = new require('../index.js')(server);

ctrllr
    .config({ port: 6060 })
    .start();

log.debug("Running test.");