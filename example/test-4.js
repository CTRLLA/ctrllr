var

    /** logging service */
    log = new require('ctrl-logger')(),

    /** ctrllr config */
    config = require('./config'),

    /** ctrllr instance */
    ctrllr = new require('../lib/ctrllr')(config),

    /** tests */
    test6 = require('./spec-6');

ctrllr
    .add(test6)
    .start();