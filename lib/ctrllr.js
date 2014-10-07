var

    /** async flow lib */
    $q = require('q'),

    /** http request library */
    request = require('superagent'),

    /** server utilities / helper fns */
    util = require('../lib/util'),

    /** custom logging servive */
    log = new require('../lib/logger')();

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

// basic helper fns

/**
 * checks if a variable is an instance of an express server
 * @param _app {Object} variable to check
 * @returns {boolean}
 */
function isExpressApp(_app) {
    if (typeof _app.listen === 'function') {
        return true;
    }

    return false;
}

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

var CTRLLR = function(config) {
    if (!(this instanceof CTRLLR)) {
        return new CTRLLR(config);
    }

    if (config) {
        this.config(config);
    }

    return this;
};

CTRLLR.prototype.config = function(config) {
    if (isExpressApp(config)) {
        this.server = config;
        return this;
    }

    // default config
    var defaults = {
        port: 4040
    };
    util.extend(defaults, config || {});

    this.options = {};
    for (var key in defaults) {
        this.options[key] = defaults[key];
    }

    return this;
};

CTRLLR.prototype.start = function() {
    if (this.server) {
        this.server.listen(this.options.port);
        log.info("CTRLLR running server on port: " + this.options.port);
    }

    return this;
};

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

module.exports = CTRLLR;