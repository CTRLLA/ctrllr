var

    /** async flow lib */
    $q = require('q'),

    /** console coloring lib */
    colors = require('colors'),

    /** http request library */
    request = require('superagent'),

    /** server utilities / helper fns */
    util = require('../lib/util');

// TODO: test-level timeout

/* ==========================================================================
 Helper functions
 ========================================================================== */

/**
 * styles and prints message to console
 * @param msg {String} message to print
 * @param color {String} color of message
 * @param indent {Number} spaces to indent
 */
function print(msg, color, indent) {
    if (indent) {
        for (var i = 0, len = indent; i < len; i++) {
            msg = ' ' + msg;
        }
    }

    if (color) {
        msg = colors[color](msg);
    }
    console.log(msg);
}

/**
 * prints assertion result to console
 * @param success {Boolean} whether or not the assertion passed
 * @param msg {String} message to print
 */
function printAssertion(success, msg) {
    for (var i = 0, len = 8; i < len; i++) {
        msg = ' ' + msg;
    }

    var color = success ? 'green' : 'red';
    msg = colors[color](msg);
    console.log(msg);
}

/**
 * prints test meta to console
 * @param success {Boolean} status of assertion
 * @param msg {String} message to print
 */
function printAssertionMeta(success, msg) {
    for (var i = 0, len = 16; i < len; i++) {
        msg = ' ' + msg;
    }

    var color = success ? 'green' : 'red';
    msg = colors[color](msg);
    console.log(msg);
}

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

/**
 * formats boolean for printing to console
 * @param boolean {Boolean}
 * @returns {string}
 */
function formatBoolean(boolean) {
    return boolean.toString().toUpperCase();
}

/**
 * wraps async function to make sure it doesn't run too long
 * @param promise {Object} promise to watch
 * @param max {Number} max time in milliseconds
 * @returns {promise|*|Q.promise}
 */
function countdown(promise, max) {
    var
        deferred = $q.defer(),
        count = 0,
        id = setInterval(function() {
            count += 1000;

            if (count >= max) {
                clear();
                deferred.reject();
            }
        }, 1000),
        clear = function() {
            clearTimeout(id);
        };

    promise.then(function() {
        clear();
        deferred.resolve();
    }).fail(function() {
        clear();
        deferred.resolve();
    });

    return deferred.promise;
}

/**
 * calls all functions specified to run before a test
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test specification
 * @param config.req {Object} request object
 * @returns {promise|*|Q.promise}
 */
function before(config) {
    var
        deferred = $q.defer(),
        ctrllr = config.ctrllr,
        test = config.test,
        req = config.req;

    var queue = [];

    /** recursive function for running all `before` functions */
    function run() {
        if (!queue.length) {
            // if no more functions in queue, get outta here
            deferred.resolve(config);
        } else {
            var
                fn = queue[0],
                result = fn(ctrllr.getHelper());

            // TODO: make sure `fn` is typeof 'function'
            if (result && result.then) {
                // function returned promise, wrap in `countdown`
                countdown(result, ctrllr.options.timeout)
                    .then(function() {
                        result.then(function() {
                            queue.splice(0, 1);
                            run();
                        }).fail(function() {
                            queue.splice(0, 1);
                            run();
                        });
                    }).fail(function(err) {
                        printAssertion(false, '`before` function timed out.');
                        queue.splice(0, 1);
                        run();
                    });
            } else {
                queue.splice(0, 1);
                run();
            }
        }
    }

    // find all global `before` functions
    if (ctrllr.options.before) {
        if (ctrllr.options.before instanceof Array) {
            // if array, add each one to `queue`
            ctrllr.options.before.forEach(function(fn) {
                queue.push(fn);
            });
        } else {
            // if function, add to `queue`
            queue.push(ctrllr.options.before);
        }
    }

    // find all test `before` functions
    if (test.before) {
        if (test.before instanceof Array) {
            // if array, add each one to `queue`
            test.before.forEach(function(fn) {
                queue.push(fn);
            });
        } else {
            // if function, add to `queue`
            queue.push(test.before);
        }
    }

    // start recursive call
    run();

    return deferred.promise;
}


/**
 * calls all functions specified to run after a test
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test specification
 * @param config.res {Object} response object
 * @returns {promise|*|Q.promise}
 */
function after(config) {
    var
        deferred = $q.defer(),
        ctrllr = config.ctrllr,
        test = config.test,
        res = config.res,
        queue = [];

    /** recursive function for running all `after` functions */
    function run() {
        if (!queue.length) {
            // if no more functions in queue, get outta here
            deferred.resolve(config);
        } else {
            var
                fn = queue[0],
                result = fn(res, ctrllr.getHelper());

            // TODO: make sure `fn` is typeof `function`
            if (result && result instanceof Error) {
                // if result was an error, log the failure
                ++ctrllr._failures;
                printAssertion(false, 'Failed assertion: ' + result.toString());
                queue.splice(0, 1);
                run();
            } else if (result && result.then) {
                // function returned promise, wrap in `countdown`
                countdown(result, ctrllr.options.timeout)
                    .then(function() {
                        result.then(function() {
                            queue.splice(0, 1);
                            run();
                        }).fail(function() {
                            ++ctrllr._failures;
                            queue.splice(0, 1);
                        })
                    }).fail(function(err) {
                        printAssertion(false, '`after` function timed out.');
                        queue.splice(0, 1);
                        run();
                    });
            } else {
                queue.splice(0, 1);
                run();
            }
        }
    }

    // find all global `after` functions
    if (ctrllr.options.after) {
        if (ctrllr.options.after instanceof Array) {
            // if array, add each one to `queue`
            ctrllr.options.after.forEach(function(fn) {
                queue.push(fn);
            });
        } else {
            // if function, add to `queue`
            queue.push(ctrllr.options.after);
        }
    }

    // find all test `after` functions
    if (test.after) {
        if (test.after instanceof Array) {
            // if array, add each one to `queue`
            test.after.forEach(function(fn) {
                queue.push(fn);
            });
        } else {
            // if function, add to `queue`
            queue.push(test.after);
        }
    }

    // start recursive call
    run();

    return deferred.promise;
}


/**
 * sets headers inside request object
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test specification
 * @param config.req {Object} request object
 * @returns {promise|*|Q.promise}
 */
function setHeaders(config) {
    var
        deferred = $q.defer(),
        ctrllr = config.ctrllr,
        test = config.test,
        req = config.req;

    // check for headers added with `helper` instance
    if (test._headers) {
        for (var k in test._headers) {
            req.set(k, test._headers[k]);
        }
    }

    // check for headers specified in test
    if (!test.headers) {
        // if no `headers` property, break
        deferred.resolve(config);
        return deferred.promise;
        /*
         } else if (test.headers.then) {
         // a promise is being returned, wrap in `countdown`
         //  countdown(test.headers, ctrllr.options.timeout)
         test.headers.then(function(headers) {
         for (var k in headers) {
         req.set(k, headers[k]);
         }

         deferred.resolve(config);
         });
         */
    } else if (typeof test.headers === 'function') {
        // if `headers` is a function, call it
        var result = test.headers();

        if (result.then) {
            // function returned promise, wrap in countdown
            countdown(result, ctrllr.options.timeout)
                .then(function(headers) {
                    for (var k in headers) {
                        req.set(k, headers[k]);
                    }

                    deferred.resolve(config);
                }).fail(function() {
                    printAssertion(false, '`headers` function timed out.');
                });
        } else {
            // function returned object, add to request headers
            for (var k in result) {
                req.set(k, result[k]);
            }

            deferred.resolve(config);
        }
    } else {
        // `headers` is an object, add to request headers
        for (var k in test.headers) {
            req.set(k, test.headers[k]);
        }

        deferred.resolve(config);
    }

    return deferred.promise;
}

/**
 * checks response against specifications
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test specification
 * @param config.req {Object} request object
 * @returns {promise|*|Q.promise}
 */
function assert(config) {
    var
        deferred = $q.defer(),
        ctrllr = config.ctrllr,
        test = config.test,
        res = config.res;

    // check response status if `expectStatus` provided
    if (typeof test.expectStatus !== 'undefined') {
        if (res.status.toString() !== test.expectStatus.toString()) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectStatus - expected ' + test.expectStatus);
        } else {
            printAssertion(true, 'Passed assertion: expectStatus');
        }
    }

    // check response type if `expectJSON` provided
    if (typeof test.expectJSON !== 'undefined') {
        if ((typeof res.body === 'object') !== test.expectJSON) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectJSON - expected ' + formatBoolean(test.expectJSON));
        } else {
            printAssertion(true, 'Passed assertion: expectJSON');
        }
    }

    // check response type if `expectArray` provided
    if (typeof test.expectArray !== 'undefined') {
        if ((res.body instanceof Array) !== test.expectArray) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectArray - expected ' + formatBoolean(test.expectArray));
        } else {
            printAssertion(true, 'Passed assertion: expectArray');
        }
    }

    // make sure response has keys if `expectKeys` provided
    if (typeof test.expectKeys !== 'undefined') {
        var
            obj = res.body instanceof Array ? res.body[0] : res.body,
            hasAllKeys = true;

        // TODO: make sure response is object
        // TODO: make sure `expectKeys` is array

        for (var i = 0, len = test.expectKeys.length; i < len; i++) {
            if (!obj.hasOwnProperty(test.expectKeys[i])) {
                ++ctrllr._failures;
                hasAllKeys = false;
                printAssertion(false, 'Failed assertion: expectKeys - expected ' + test.expectKeys[i]);
            }
        }

        if (hasAllKeys) {
            printAssertion(true, 'Passed assertion: expectKeys');
        }
    }

    // make sure key/value pairs match if `expectKeyValue` object provided
    if (typeof test.expectKeyValue !== 'undefined') {
        var
            obj = res.body instanceof Array ? res.body[0] : res.body,
            allKeysMatch = true;

        for (var k in test.expectKeyValue) {
            if (obj[k] !== test.expectKeyValue[k]) {
                ++ctrllr._failures;
                allKeysMatch = false;
                printAssertion(false, 'Failed assertion: expectKeyValue - expected ' + k + ':' + test.expectKeyValue[k]);
                printAssertionMeta(false, 'EXPECTED: ' + k + ' : ' + test.expectKeyValue[k]);
                printAssertionMeta(false, 'RECEIVED: ' + k + ' : ' + obj[k]);

            }
        }

        if (allKeysMatch) {
            printAssertion(true, 'Passed assertion: expectKeyValue');
        }
    }

    deferred.resolve(config);
    return deferred.promise;
}

/* ==========================================================================
 Store - Data store
 ========================================================================== */

/**
 * data store
 * @constructor
 */
var Store = function() {
    if (!(this instanceof Store)) {
        return new Store();
    }

    /**
     * holds all data
     * @type {Object}
     */
    this.data = {};

    return this;
};

/**
 * get previously stored key
 * @param key {String|*}
 * @returns {*}
 */
Store.prototype.get = function(key) {
    if (typeof this.data[key.toString()] !== 'undefined') {
        return this.data[key.toString()];
    }

    return null;
};

/**
 * store data
 * @param key {String|*}
 * @param val {*}
 * @returns {*}
 */
Store.prototype.set = function(key, val) {
    this.data[key.toString()] = val;
    return val;
};

/**
 * remove data from store
 * @param key {String|*}
 */
Store.prototype.remove = function(key) {
    delete this.data[key];
};

/**
 * remove all items from data store
 */
Store.prototype.clear = function() {
    for (var k in this.data) {
        delete this[k];
    }

    this.data = {};
};

/**
 * returns all data in the store
 * @returns {Object}
 */
Store.prototype.dump = function() {
    /*
     // parse and stringify so the the object isn't passed by reference
     return JSON.parse(JSON.stringify(this.data));
     */

    return this.data;
};

/**
 * returns a stringified version of the data
 * @returns {string}
 */
Store.prototype.serialize = function() {
    try {
        return JSON.stringify(this.data);
    } catch (e) {
        return null;
    }
};

/* ==========================================================================
 Helper - Interface for interacting with ctrllr instance
 ========================================================================== */

/**
 * helper passed to `before` functions for altering test
 * @param ctrllr {CTRLLR} ctrllr instance
 * @returns {*}
 * @constructor
 */
var Helper = function(ctrllr) {
    if (!(this instanceof Helper)) {
        return new Helper(ctrllr);
    }

    this.ctrllr = ctrllr;
    return this;
};

/**
 * simple `assert` function
 * @param description {String} description of assertion
 * @param bool {Boolean} whether or not it succeeded
 */
Helper.prototype.assert = function(description, bool) {
    if (bool) {
        printAssertion(true, 'Passed assertion: ' + description);
    } else {
        ++this.ctrllr._failures;
        printAssertion(false, 'Failed assertion: ' + description);
    }
};

/**
 * gets the ctrllr instance's data store
 * @returns {Store}
 */
Helper.prototype.getStore = function() {
    return this.ctrllr.getStore();
};

/**
 * sets header for test
 * @param key {String} name of header to set
 * @param value {String} value of header to set
 */
Helper.prototype.setHeader = function(key, value) {
    var test = this.ctrllr.getActiveTest();

    if (!test._headers) {
        test._headers = {};
    }

    test._headers[key] = value;
};

/**
 * adds data to queue for post / put request
 * @param obj {Object} data to send
 */
Helper.prototype.send = function(obj) {
    var test = this.ctrllr.getActiveTest();

    // TODO: make sure obj is typeof 'object'
    for (var k in obj) {
        test._data[k] = obj[k];
    }
};

/* ==========================================================================
 CTRLLR - Testing library instance
 ========================================================================== */

/**
 * testing library
 * @param config
 * @returns {CTRLLR}
 * @constructor
 */
var CTRLLR = function(config) {
    if (!(this instanceof CTRLLR)) {
        return new CTRLLR(config);
    }

    if (config) {
        this.config(config);
    }

    this.store = new Store();
    this.helper = new Helper(this);

    this._tests = [];
    this._queue = [];
    this._failures = 0;
    this._startedServer = false;

    return this;
};

/**
 * add global configs
 * @param config
 * @returns {CTRLLR}
 */
CTRLLR.prototype.config = function(config) {
    if (isExpressApp(config)) {
        this.options.server = config;
        return this;
    }

    // default config
    var defaults = {
        port: 4040,
        timeout: 5000
    };
    util.extend(defaults, config || {});

    this.options = this.options || {};
    for (var key in defaults) {
        this.options[key] = defaults[key];
    }

    return this;
};

/**
 * add test to queue
 * @param test {Object} test specs
 * @returns {CTRLLR}
 */
CTRLLR.prototype.add = function(test) {
    var alias = this;

    if (test instanceof Array) {
        // if array provided, add each individual tests to queue
        test.forEach(function(_test) {
            alias._tests.push(_test);
        });
    } else {
        alias._tests.push(test);
    }

    return alias;
};

/**
 * run individual test
 * @param test {Object} test to run
 * @param inQueue {Boolean} whether in queue, calls next test after complete if so
 * @returns {CTRLLR}
 */
CTRLLR.prototype.run = function(test, inQueue) {
    print('Running test: ' + (test.name || test.description), 'blue', 0);

    var
        alias = this,

        /**
         * builds request url from global config & test
         * @returns {String} url
         */
        buildUrl = function() {
            if (alias.options.server) {
                return 'http://localhost:' + alias.options.port + test.url;
            } else {
                return (alias.options.baseUrl || '') + test.url;
            }
        },

        /**
         * builds new request object & calls all before & after fns
         */
        makeRequest = function() {
            var req = request[(test.method || 'GET').toLowerCase()](buildUrl());

            // setHeaders({ test: test, req: req, ctrllr: alias })
            before({ test: test, req: req, ctrllr: alias })
                .then(setHeaders)
                .then(function(config) {
                    if (test.send) {
                        // TODO: make sure typeof `test.send` === 'object'
                        req.send(test.send);
                    }

                    config.req.end(function(err, res) {
                        var config = {
                            test: test,
                            ctrllr: alias,
                            res: res
                        };

                        assert(config)
                            .then(after)
                            .then(finish);
                    });
                }).fail(function(err) {
                    print('Error preparing test: ' + err, 'red', 0);
                    finish();
                });
        },

        /**
         * removes tests from queue, calls next one if in queue
         */
        finish = function() {
            if (!inQueue || (alias._queue && alias._queue.length === 1)) {
                // if not running test in suite or last test in suite, end tests
                alias.stop();
            } else {
                // remove test from queue, start next test
                alias._queue.splice(0, 1);
                alias.run(alias._queue[0], true);
            }
        };

    if (alias.options.server) {
        // if managing express server, make sure server initialized before making request
        alias._serverInit.then(function() {
            makeRequest();
        });
    } else {
        // otherwise, start test
        makeRequest();
    }

    return alias;
};

/**
 * starts tests, server if provided
 * @returns {CTRLLR}
 */
CTRLLR.prototype.start = function() {
    var alias = this;

    if (alias.options.server && !alias._startedServer) {
        (function() {
            var deferred = $q.defer();

            alias._serverInit = deferred.promise;
            alias.options.server.listen(alias.options.port, function() {
                deferred.resolve(alias.options.server);
            });

            print("CTRLLR running server on port: " + alias.options.port, 'cyan', 0);
        })();
    }

    alias._tests.forEach(function(test) {
        alias._queue.push(test);
    });

    if (alias._queue.length) {
        alias.run(alias._queue[0], true);
    } else {
        alias.stop();
    }

    print('Starting CTRLLR tests.', 'cyan', 0);
    return alias;
};

CTRLLR.prototype.getActiveTest = function() {
    return this._queue[0];
};

/**
 * stops tests, server if provided; kills process
 * @returns {CTRLLR}
 */
CTRLLR.prototype.stop = function() {
    var alias = this;

    print('Completed tests.', 'cyan', 0);
    print('Tests ran: ' + alias._tests.length, 'green', 0);
    print('Tests failed: ' + alias._failures, 'red', 0);

    process.exit(0);

    return alias;
};

/**
 * gets the ctrllr instance's helper
 * @returns {Store}
 */
CTRLLR.prototype.getHelper = function() {
    return this.helper;
};

/**
 * gets the ctrllr instance's data store
 * @returns {Store}
 */
CTRLLR.prototype.getStore = function() {
    return this.store;
};

/* ==========================================================================
 ----------------------------------------------------------------------------
 ========================================================================== */

module.exports = CTRLLR;