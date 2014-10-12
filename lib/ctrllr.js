var

    /** async flow lib */
    $q = require('q'),

    /** console coloring lib */
    colors = require('colors'),

    /** http request library */
    request = require('superagent'),

    /** server utilities / helper fns */
    util = require('../lib/util'),

    /** custom logging servive */
    log = new require('ctrl-logger')({ publish: false });

// TODO: max test run time

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

// basic helper fns

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

function printAssertion(success, msg) {
    for (var i = 0, len = 8; i < len; i++) {
        msg = ' ' + msg;
    }

    var color = success ? 'green' : 'red';
    msg = colors[color](msg);
    console.log(msg);
}

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

function formatBoolean(boolean) {
    return boolean.toString().toUpperCase();
}

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

/*
 function countdown(deferred, max, countdownDeferred, count) {
 countdownDeferred = countdownDeferred || $q.defer();

 setTimeout(function() {
 count = (count || 0) + 1000;

 if (count >= max) {
 console.log('Timing out.');
 return countdownDeferred.reject();
 }

 countdown(deferred, max, countdownDeferred, (count || 0) + 1000);
 }, 1000);

 return countdownDeferred.promise;
 }
 */

function before(config) {
    var
        deferred = $q.defer(),
        test = config.test,
        req = config.req;

    var Helper = function() {
        if (!(this instanceof Helper)) {
            return new Helper();
        }

        return this;
    };

    Helper.prototype.setHeader = function(key, value) {
        if (!test._headers) {
            test._headers = {};
        }

        test._headers[key] = value;
    };

    Helper.prototype.send = function(obj) {
        // TODO: make sure obj is typeof 'object'
        for (var k in obj) {
            test._data[k] = obj[k];
        }
    };

    var helper = new Helper();

    if (!test.before) {
        // no `before` function specified
        deferred.resolve(config);
    } else {
        // TODO: make sure `test.before` is typeof 'function'
        var result = test.before(helper);

        if (result && result.then) {
            // function returned promise

            result.then(function() {
                deferred.resolve(config);
            });
        } else if (result && typeof result === 'object') {
            deferred.resolve(config);
        } else {
            // function didn't return anything
            deferred.resolve(config);
        }
    }

    return deferred.promise;
}

function after(config) {
    var
        deferred = $q.defer(),
        ctrllr = config.ctrllr,
        test = config.test,
        res = config.res;

    if (!test.after) {
        console.log('No test.after');
        deferred.resolve(config);
    } else {
        // TODO: make sure `test.after` is typeof 'function'

        function assert(description, bool) {
            if (bool) {
                printAssertion(true, 'Passed assertion: ' + description);
            } else {
                ++ctrllr._failures;
                printAssertion(false, 'Failed assertion: ' + description);
            }
        }

        try {
            var result = test.after(res, assert);

            if (result && result instanceof Error) {
                ++ctrllr._failures;
                printAssertion(false, 'Failed assertion: ' + result.toString());
                deferred.resolve(config);
            } else if (result && result.then) {
                // function returned promise
                countdown(result, 2000)
                    .then(function() {
                        console.log('Firing success callback.');
                        deferred.resolve(config);
                    }).fail(function(err) {
                        console.log('Firing failed callback.');
                        ++ctrllr._failures;
                        printAssertion(false, '`after` function timed out.');
                        deferred.resolve(config);
                    });
            } else if (result && typeof result === 'object') {
                deferred.resolve(config);
            } else {
                // function didn't return anything
                deferred.resolve(config);
            }
        } catch (err) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: ' + err.toString());
            deferred.resolve(config);
        }
    }

    return deferred.promise;
}

function setHeaders(config) {
    var
        deferred = $q.defer(),
        test = config.test,
        req = config.req;

    if (test._headers) {
        for (var k in test._headers) {
            req.set(k, test._headers[k]);
        }
    }

    if (!test.headers) {
        // if no `headers` property, break
        deferred.resolve(config);
        return deferred.promise;

    } else if (test.headers.then) {
        // a promise is being returned
        test.headers.then(function(headers) {
            for (var k in headers) {
                req.set(k, headers[k]);
            }

            deferred.resolve(config);
        });
    } else if (typeof test.headers === 'function') {
        // if `headers` is a function
        var result = test.headers();

        // function returned promise
        if (result.then) {
            result.then(function(headers) {
                for (var k in headers) {
                    req.set(k, headers[k]);
                }

                deferred.resolve(config);
            });
        } else {
            for (var k in result) {
                req.set(k, result[k]);
            }

            deferred.resolve(config);
        }
    } else {
        for (var k in test.headers) {
            req.set(k, test.headers[k]);
        }

        deferred.resolve(config);
    }

    return deferred.promise;
}

function assert(config) {
    var
        deferred = $q.defer(),
        ctrllr = config.ctrllr,
        test = config.test,
        res = config.res;

    if (typeof test.expectStatus !== 'undefined') {
        if (res.status.toString() !== test.expectStatus.toString()) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectStatus - expected ' + test.expectStatus);
        } else {
            printAssertion(true, 'Passed assertion: expectStatus');
        }
    }

    if (typeof test.expectJSON !== 'undefined') {
        if ((typeof res.body === 'object') !== test.expectJSON) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectJSON - expected ' + formatBoolean(test.expectJSON));
        } else {
            printAssertion(true, 'Passed assertion: expectJSON');
        }
    }

    if (typeof test.expectArray !== 'undefined') {
        if ((res.body instanceof Array) !== test.expectArray) {
            ++ctrllr._failures;
            printAssertion(false, 'Failed assertion: expectArray - expected ' + formatBoolean(test.expectArray));
        } else {
            printAssertion(true, 'Passed assertion: expectArray');
        }
    }

    if (typeof test.expectKeys !== 'undefined') {
        var
            obj = res.body instanceof Array ? res.body[0] : res.body,
            hasAllKeys = true;

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

    this._tests = [];
    this._queue = [];
    this._failures = 0;
    this._startedServer = false;

    return this;
};

CTRLLR.prototype.config = function(config) {
    if (isExpressApp(config)) {
        this.options.server = config;
        return this;
    }

    // default config
    var defaults = {
        port: 4040
    };
    util.extend(defaults, config || {});

    this.options = this.options || {};
    for (var key in defaults) {
        this.options[key] = defaults[key];
    }

    return this;
};

CTRLLR.prototype.add = function(test) {
    var alias = this;

    if (test instanceof Array) {
        test.forEach(function(_test) {
            alias._tests.push(_test);
        });
    } else {
        alias._tests.push(test);
    }

    return alias;
};

CTRLLR.prototype.run = function(test, inQueue) {
    print('Running test: ' + (test.name || test.description), 'blue');

    var
        alias = this,
        buildUrl = function() {
            if (alias.options.server) {
                return 'http://localhost:' + alias.options.port + test.url;
            } else {
                return (alias.options.baseUrl || '') + test.url;
            }
        },
        makeRequest = function(req) {
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
                    log.error('Error preparing test.', err);
                    finish();
                });
        },
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

CTRLLR.prototype.start = function() {
    var alias = this;

    if (alias.options.server && !alias._startedServer) {
        (function() {
            var deferred = $q.defer();

            alias._serverInit = deferred.promise;
            alias.options.server.listen(alias.options.port, function() {
                deferred.resolve(alias.options.server);
            });

            print("CTRLLR running server on port: " + alias.options.port, 'cyan');
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

    print('Starting CTRLLR tests.', 'cyan');
    return alias;
};

CTRLLR.prototype.stop = function() {
    var alias = this;

    print('Completed tests.', 'cyan');
    print('Tests ran: ' + alias._tests.length, 'green');
    print('Tests failed: ' + alias._failures, 'red');

    process.exit(0);

    return alias;
};

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

module.exports = CTRLLR;