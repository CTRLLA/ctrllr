var

    /** logging service */
    log = new require('ctrl-logger')(),

    /** express module */
    express = require('express'),

    /** server instance */
    app = express(),

    /** helper for parsing requests, primarily POST **/
    bodyParser = require('body-parser'),

    /** simulate PUT and DELETE */
    methodOverride = require('method-override'),

    /** the port the server will listen to for requests */
    port = 4040;

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

// config server

/** log all requests to logger */
app.use(function(req, res, next) {
    log.info('%s %s', req.method, req.url);
    next();
});

// express helpers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride());

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

// config routes

app.get('/api/users', function(req, res) {
    res.status(200).send([
        { _id: 1, username: 'foo' },
        { _id: 2, username: 'bar' },
        { _id: 3, username: 'baz' }
    ]);
});

app.post('/api/users', function(req, res) {
    var auth;

    if (!(auth = req.headers.authorization)) {
        return res.status(401).end();
    } else if (auth !== 'password') {
        return res.status(401).end();
    }

    console.log('Sending success.');
    res.status(200).json({
        _id: 1,
        username: req.body.username
    });
});

app.get('/api/users/:id', function(req, res) {
    res.status(200).json({
        _id: 1,
        username: 'foo'
    });
});

app.get('/api/auth', function(req, res) {
    var auth;

    if (!(auth = req.headers.authorization)) {
        return res.status(401).end();
    } else if (auth !== 'password') {
        return res.status(401).end();
    }

    res.status(200).json({
        _id: 1,
        username: 'foo'
    });
});

app.get('/api/auth2', function(req, res) {
    var auth, auth2

    if (!(auth = req.headers.authorization)) {
        return res.status(401).end();
    } else if (!(auth2 = req.headers.authorization2)) {
        return res.status(401).end();
    } else if (auth !== 'password') {
        return res.status(401).end();
    } else if (auth2 !== 'password') {
        return res.status(401).end();
    }

    res.status(200).json({
        _id: 1,
        username: 'foo'
    });
});

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

module.exports = app;