var

    /** logging service */
    log = new require('ctrl-logger')(),

    /** ctrllr config */
    config = require('./config'),

    /** ctrllr instance */
    ctrllr = new require('../../lib/ctrllr')(config),

    /** tests */
    test5 = require('./spec-5');

ctrllr
    .add(test5)
    .start();