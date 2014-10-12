CTRLLR
======

API testing made easy - **and it's got no vowels, so you know it's hip.**

Write your tests with JSON, add custom headers, provide functions to run before and after each test, use synchronous or asynchronous calls - the sky's the limit.

Usage
-----------
`test.js`

```
var spec = require('./spec'),
    ctrllr = new require('ctrllr')({
        baseUrl: 'http://localhost:9000'
    });

ctrllr
    .add(spec)
    .start();
```

`spec.js`

```
module.exports = {
    description: 'Users list endpoint.',
    method: 'GET',
    url: '/api/users',
    expectStatus: 200,
    expectJSON: true,
    expectArray: true,
    expectKeys: [
        '_id',
        'username'
    ]
}
```

Look in the [example](https://github.com/CtrlLA/ctrllr/tree/master/example) directory for more samples. The tests are are `test.js` and `test-2.js` while the specs are in `spec.js`, `spec-2.js`, etc.

Multiple Tests
--------------

`test.js`

```
var spec1 = require('./spec'),
    spec2 = require('./spec-2'),
    spec3 = require('./spec-3'),

    ctrllr = new require('ctrllr')({
        baseUrl: 'http://localhost:9000'
    });

ctrllr
    .add(spec1)
    .add(spec2)
    .add(spec3)
    .start();
```

A specification can also return an array of tests:

```
var specs = [{
    description: 'Test one',
    url: '/api/users',
    expectStatus: 200,
    expectKeys: [
        '_id',
        'username'
    ]
}, {
    description: 'Test two',
    url: '/api/users/1',
    expectStatus: 200,
    expectKeyValue: {
        _id: 1,
        username: 'ishmaelthedestroyer'
    }
}];

ctrllr.add(specs);
```

Options
-------

* **description** - `String` basic description of specification
* **method** - `String` request type `GET || POST || PUT || DELETE || OPTIONS`
* **url** - `String` url to request
* **headers** - `Object || Function` key / value pairs to add headers, can be function returning object
* **timeout** - max time for test to run (in milliseconds), defaults to 5000
* **expectStatus** - `Number` status to check for `200, 401, 500` etc
* **expectJSON** - `Boolean` should check response type for JSON
* **expectArray** - `Boolean` should check response type for Array
* **expectKeys** - `Array` keys to check for in response
* **expectKeyValue** - `Object` key / value pairs to check for
* **before** - `Function || Array` function or array of functions to call before test
* **after** - `Function || Array` function or array of functions to call after test
* **send** - `Object || Function` object or function that returns object to send in body of request

Before & After
--------------

You can specify functions to run before and after each test.

The `before` function is given a helper object which can be used to set headers or add data to send in the request object.
```
var spec = {
    // ...
    before: function(ctrllr) {
        ctrllr.setHeader('Authorization', 'token-goes-here');
        ctrllr.send({ foo: 'bar' });
    }
};
```

The `after` function is given access to the response body and a simple assert helper.
The `assert` helper accepts a description (string) and assertion (boolean).
```
var spec = {
    // ...
    after: function(response, assert) {
        assert('Response is successful', response.status === 200);
        assert('Response is an array', response.body instanceof Array);
    }
};
```

Both the `before` and `after` properties can either be functions or an array of functions to be called.
```
var spec = {
    // ...
    before: [
        function() {
            console.log('Running BEFORE function 1...');
        },
        function() {
            console.log('Running BEFORE function 2...');
        },
        function() {
            console.log('Running BEFORE function 3...');
        }
    ],
    after: [
        function() {
            console.log('Running AFTER function 1...');
        },
        function() {
            console.log('Running AFTER function 2...');
        }
    ]
};
```

Asychronous functions
---------------------

All the options that accept functions can return deferred promises for asynchronous calls.
**NOTE:** these functions will still be timed out if they run longer than the `timeout` value
```
var spec = {
    // ...
    before: function() {
        var deferred = require('q').defer();

        setTimeout(function() {
            deferred.resolve(true);
        }, 2000);

        return deferred.promise;
    }
};
```

Express server
--------------

If you're testing a Node server using Express, you pass the server to a `ctrllr` instance in the config block, and it will start and stop the server for the tests. In this case, you don't have to specify a `baseUrl`.

```
var spec = require('./spec'),
    app = require('./server'),
    ctrllr = new require('ctrllr')({
        server: app,
        port: 6060
    });

ctrllr
    .add(spec)
    .start();

```

Global configuration
--------------------

If you have `before` functions, `after` functions, or `headers` you want applied to each test, you can specify those when creating the ctrllr instance or by calling the `config` function.

These functions can also be asynchronous.

```
var ctrllr = require('ctrllr')({
    // ...
    before: function() {
        console.log('This will run before every test.');
    },
    after: function() {
        console.log('This will run after every test.');
    },
    headers: {
        Authorization: 'token'
    }
});
```

Maintainers
-----------

* [ishmaelthedestroyer](mailto:ishmaelthedestroyer@gmail.com), Ishmael P.
* [CTRL LA](mailto:hello@ctrl.la), CTRL LA

Copyright (c) 2014 CTRL LA. This software is licensed under the MIT License.