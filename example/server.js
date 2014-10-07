var

    /** custom logging service */
    log = new require('../lib/logger')(),

    /** express module */
    express = require('express'),

    /** server instance */
    app = express(),

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

/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */
/* # # # # # # # # # # # # # # # # # # # # */

// config routes

app.get('/api/users', function(req, res) {
    res.status(200).end([
        { _id: 1, username: 'foo' },
        { _id: 2, username: 'bar' },
        { _id: 3, username: 'baz' }
    ]);
});

app.get('/api/users/:id', function(req, res) {
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