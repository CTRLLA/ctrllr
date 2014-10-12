var

    /** logging service */
    log = new require('ctrl-logger')(),

    /** ctrllr config */
    config = require('./config'),

    /** ctrllr instance */
    ctrllr = new require('../lib/ctrllr')(config),

    /** tests */
    test1 = require('./spec'),
    test2 = require('./spec-2'),
    test3 = require('./spec-3'),
    test4 = require('./spec-4');

ctrllr
    .add(test1)
    .add(test2)
    .add(test3)
    .add(test4)
    .start();