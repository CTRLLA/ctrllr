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
 * extracts a value from an object, function, or async function
 * @param val {Object|Function}
 * @param timeout {Number} max time to run an async function
 * @param args {Array} arguments to call function with (if function)
 */
function safeAsync(val, timeout, args) {
    var deferred = $q.defer();

    /**
     * waits for a promise, resolves deferred when resolved
     * @param promise
     */
    function evalPromise(promise) {
        // wrap in `countdown`
        countdown(promise, timeout)
            .then(function(resolvedValue) {
                deferred.resolve(resolvedValue);
            }).fail(function(err) {
                deferred.reject(err);
            });
    }

    if (val && val.then) {
        // if promise passed
        evalPromise(val);
    } else if (typeof val === 'function') {
        // if function passed
        val = val.apply(this, args);

        if (val && val.then) {
            // if function returned promise
            evalPromise(val);
        } else {
            deferred.resolve(val);
        }
    } else {
        // regular object / value passed, resolve
        deferred.resolve(val);
    }

    return deferred.promise;
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
                deferred.reject('Timed out.');
            }
        }, 1000),
        clear = function() {
            clearTimeout(id);
        };

    promise.then(function(val) {
        clear();
        deferred.resolve(val);
    }).fail(function(err) {
        clear();
        deferred.reject(err);
    });

    return deferred.promise;
}

/* ==========================================================================
 Request builder - These functions build and transform each test.
 ========================================================================== */

/**
 * calls all functions specified to run before a test
 * @param config.request {Object} request configuration
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function before(config) {
    var
        deferred = $q.defer(),
        request = config.request,
        ctrllr = config.ctrllr,
        test = config.test;

    var queue = [];

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

    // find all test `before` function(s)
    // NOTE: here, the test's `before` function(s) are added AFTER global `after` functions
    // this way, the test's `before` function(s) are fired right before a test
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

    /** recursive function for running all `before` functions */
    function run() {
        if (!queue.length) {
            // if no more functions in queue, get outta here
            deferred.resolve(config);
        } else {
            // calls safeAsync with the `queue[0]` being the target value
            // also gives it a max timeout and the additional arguments
            // to pass if queue[0] is a function
            var
                timeout = test.timeout || ctrllr.options.timeout,
                args = [
                    ctrllr.getHelper(),
                    request
                ];

            safeAsync(queue[0], timeout, args)
                .fin(function() {
                    queue.splice(0, 1);
                    run();
                });
        }
    }

    // start recursive call
    run();

    return deferred.promise;
}

/**
 * calls all functions specified to run after a test
 * @param config.response {Object} response object
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function after(config) {
    var
        deferred = $q.defer(),
        response = config.response,
        ctrllr = config.ctrllr,
        test = config.test,
        queue = [];

    // find all test `after` function(s)
    // NOTE: here, the test's `after` function(s) are added BEFORE global `after` functions
    // this way, the test's `after` function(s) are fired right after
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

    /** recursive function for running all `after` functions */
    function run() {
        if (!queue.length) {
            // if no more functions in queue, get outta here
            deferred.resolve(config);
        } else {
            // calls safeAsync with the `queue[0]` being the target value
            // also gives it a max timeout and the additional arguments
            // to pass if queue[0] is a function
            var
                timeout = test.timeout || ctrllr.options.timeout,
                args = [
                    ctrllr.getHelper(),
                    response
                ];

            safeAsync(queue[0], timeout, args)
                .fin(function() {
                    queue.splice(0, 1);
                    run();
                });
        }
    }

    // start recursive call
    run();

    return deferred.promise;
}

/**
 * sets headers inside request object
 * @param config.request {Object} request configuration
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function setHeaders(config) {
    var
        deferred = $q.defer(),
        request = config.request,
        ctrllr = config.ctrllr,
        test = config.test;

    // calls safeAsync with `test.headers` being the target value
    // also gives it a max timeout and the ctrllr helper to pass
    // to `test.headers` as an argument if it is a function
    var
        timeout = test.timeout || ctrllr.options.timeout,
        args = [ctrllr.getHelper()];

    safeAsync(test.headers, timeout, args)
        .then(function(headers) {
            if (headers) {
                for (var k in headers) {
                    request.setHeader(k, headers[k]);
                    // request.headers[k] = headers[k];
                }
            }

            deferred.resolve(config);
        }).fail(function(err) {
            return deferred.reject(err);
        });

    return deferred.promise;
}

/**
 * executes a request object, builds a response
 * @param config.request {Object} request configuration
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test spec
 * @returns {Q.promise}
 */
function makeRequest(config) {
    var
        deferred = $q.defer(),
        request = config.request,
        ctrllr = config.ctrllr,
        test = config.test;

    // calls safeAsync with `test.path` or `test.url` being the target value
    // also gives it a max timeout and the ctrllr helper to pass
    // to `test.path || `test.url` as an argument if it is a function
    var
        urlConfig = test.path || test.url || request.getConfig().url || '/',
        timeout = test.timeout || ctrllr.options.timeout,
        args = [ctrllr.getHelper()];

    safeAsync(urlConfig, timeout, args)
        .then(function(url) {
            var fullUrl;

            // if server specified
            if (ctrllr.options.server) {
                fullUrl = 'http://localhost:' + ctrllr.options.port + (url || '');
            } else {
                if (!ctrllr.options.baseUrl || !test.baseUrl || !test.url) {
                    throw new Error('No `server`, `baseUrl`, or `url` specified.');
                }

                fullUrl = (ctrllr.options.baseUrl || test.baseUrl || '') + url;
            }

            // set url
            request.setUrl(fullUrl);

            if (test.method) {
                request.setMethod(test.method);
            }

            if (test.send) {
                request.send(test.send);
            }

            // make request
            request
                .execute()
                .then(function(res) {
                    deferred.resolve({
                        response: new Response(null, res),
                        ctrllr: ctrllr,
                        test: test
                    });
                }).fail(function(err) {
                    deferred.resolve({
                        response: new Response(err, null),
                        ctrllr: ctrllr,
                        test: test
                    });
                });
        }).fail(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
}

/**
 * checks response against specifications
 * @param config.ctrllr {Object} ctrllr instance
 * @param config.test {Object} test specification
 * @param config.req {Object} request object
 * @returns {promise|*|Q.promise}
 */
function processAssertions(config) {
    var
        deferred = $q.defer(),
        response = config.response,
        ctrllr = config.ctrllr,
        test = config.test;

    // check response status if `expectStatus` provided
    if (typeof test.expectStatus !== 'undefined') {
        if (response.status.toString() !== test.expectStatus.toString()) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectStatus - expected ' + test.expectStatus);
        } else {
            printAssertion(true, 'Passed assertion: expectStatus');
        }
    }

    // check response type if `expectJSON` provided
    if (typeof test.expectJSON !== 'undefined') {
        if ((typeof response.body === 'object') !== test.expectJSON) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectJSON - expected ' + formatBoolean(test.expectJSON));
        } else {
            printAssertion(true, 'Passed assertion: expectJSON');
        }
    }

    // check response type if `expectArray` provided
    if (typeof test.expectArray !== 'undefined') {
        if ((response.body instanceof Array) !== test.expectArray) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectArray - expected ' + formatBoolean(test.expectArray));
        } else {
            printAssertion(true, 'Passed assertion: expectArray');
        }
    }

    // make sure response has keys if `expectKeys` provided
    if (typeof test.expectKeys !== 'undefined') {
        var
            obj = response.body instanceof Array ? response.body[0] : response.body,
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
            obj = response.body instanceof Array ? response.body[0] : response.body,
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
 * @param bool {Boolean|Function} whether or not it succeeded
 */
Helper.prototype.assert = function(description, bool) {
    if (typeof bool === 'function') {
        // if function passed, get result
        bool = bool();
    }

    if (bool === true) {
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
 Request - Class for making HTTP requests
 ========================================================================== */

/**
 * helper class for building HTTP requests
 * @returns {Request}
 * @constructor
 */
var Request = function(options) {
    if (!(this instanceof Request)) {
        return new Request(options);
    }

    var defaults = {
        // method: String
        // url: String
        // headers: Object
        // params: Object
        // data: Object

        method: 'GET'
    };

    this.config = util.extend(defaults, options || {});
    return this;
};

/**
 * sets a header
 * @param key {String} name of header
 * @param val {String} value to set
 */
Request.prototype.setHeader = function(key, val) {
    if (!this.config.headers) {
        this.config.headers = {};
    }

    this.config.headers[key] = val;
    return this;
};

/**
 * remove header from request
 * @param key
 * @returns {Request}
 */
Request.prototype.removeHeader = function(key) {
    if (!this.config.headers) {
        this.config.headers = {};
    }

    delete this.config.headers[key];
    return this;
}

/**
 * add query parameter to request
 * @param key {String} name of query parameter
 * @param val {String} value of query parameter
 * @returns {Request}
 */
Request.prototype.setParam = function(key, val) {
    if (!this.config.params) {
        this.config.params = {};
    }

    this.config.params[key] = val;
    return this;
};

/**
 * removes a query parameter from request
 * @param key {String} name of query parameter to remove
 * @returns {Request}
 */
Request.prototype.removeParam = function(key) {
    if (!this.config.params) {
        this.config.params = {};
    }

    delete this.config.params[key];
    return this;
};

/**
 * sets the HTTP request method
 * @param method {String}
 * @returns {Request}
 */
Request.prototype.setMethod = function(method) {
    // TODO: method validation

    this.config.method = method;
    return this;
};

/**
 * sets the url for the HTTP request
 * @param url {String}
 * @returns {Request}
 */
Request.prototype.setUrl = function(url) {
    this.config.url = url;
    return this;
};

/**
 * sets the relative path for the HTTP request
 * @param path {String}
 * @returns {Request}
 */
Request.prototype.setPath = function(path) {
    this.config.path = path;
    return this;
};

/**
 * returns the request object's configuration
 * @returns {Object}
 */
Request.prototype.getConfig = function() {
    return this.config;
};

/**
 * adds data to the request body
 * @param data {Object} data to send
 * @param append {Boolean} specifies that existing data shouldn't be overriden
 * @returns {Request}
 */
Request.prototype.send = function(data, append) {
    if (!append) {
        this.config.data = data;
    } else {
        if (!this.config.data) {
            this.config.data = {};
        }

        for (var k in data) {
            this.config.data[k] = data[k];
        }
    }

    return this;
};

/**
 * executes the request
 * @returns {promise|*|Q.promise}
 */
Request.prototype.execute = function() {
    var
        deferred = $q.defer(),
        method = (this.config.method || 'GET').toLowerCase(),
        r = request[method](this.config.url);

    if (this.config.headers) {
        for (var k in (this.config.headers || {})) {
            r.set(k, this.config.headers[k]);
        }
    }

    if (this.config.data) {
        r.send(this.config.data);
    }

    // TODO: add query parameters to request
    r.end(function(error, response) {
        if (error) {
            return deferred.reject(error);
        }

        return deferred.resolve(response);
    });

    return deferred.promise;
};

/* ==========================================================================
 Response - Wrapper for HTTP response.
 ========================================================================== */

/**
 * wrapper for HTTP response
 * @param error {Error|String} error from request
 * @param response {Object} response object
 * @returns {Response}
 * @constructor
 */
var Response = function(error, response) {
    if (!(this instanceof Response)) {
        return new Response(error, response);
    }

    this.error = error ? new Error(error.toString()) : null;
    this.response = response || null;
    this.status = (response || {}).status || null;
    this.body = (response || {}).body || null;

    return this;
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
        req = new Request(),
        config = {
            ctrllr: alias,
            request: req,
            test: test
        };

    // start test flow
    (function() {
        var deferred = $q.defer();

        // make sure server initialized
        if (alias.options.server) {
            alias._serverInit.then(function() {
                deferred.resolve(config);
            });
        } else {
            deferred.resolve(config);
        }

        return deferred.promise;
    })().then(before)
        .then(setHeaders)
        .then(makeRequest)
        .then(processAssertions)
        .then(after)
        .fin(function() {
            // removes tests from queue, calls next one if in queue
            if (!inQueue || (alias._queue && alias._queue.length === 1)) {
                // if not running test in suite or last test in suite, end tests
                alias.stop();
            } else {
                // remove test from queue, start next test
                alias._queue.splice(0, 1);
                alias.run(alias._queue[0], true);
            }
        });

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