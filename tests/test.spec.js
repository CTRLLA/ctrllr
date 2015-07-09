
/* ==========================================================================
 Internal variables & dependencies
 ========================================================================== */

var

  /** ctrllr test manager */
  Test = require('../lib/test'),

  /** ctrllr lib */
  CTRLLR = require('../lib/ctrllr'),

  /** ctrllr test interface */
  Interface = require('../lib/interface');

/* ==========================================================================
 Helper functions
 ========================================================================== */

function getServer() {
  var
    express = require('express'),
    app = express();

  app.post('/foo', function(req, res) {
    return res.end('bar');
  });

  return app;
}

/* ==========================================================================
 Tests
 ========================================================================== */

describe('test.js', function() {
  var test, ctrllr, _interface, server, myObj;

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  // initialize store instance before each test
  beforeEach(function(done) {
    server = getServer();
    ctrllr = new CTRLLR(server);
    _interface = new Interface(ctrllr);
    test = new Test(ctrllr.config, _interface);
    myObj = {};

    server.get('/foo', function(req, res, next) {
      myObj.foo = 'bar';
      return res.end();
    });

    server = server.listen(4040, function() {
      console.log('listening');
      done();
    });
  });

  // delete store after each test
  afterEach(function(done) {
    ctrllr = null;
    _interface = null;
    test = null;
    myObj = null;

    console.log('closing server');
    server.close(function() {
      console.log('closed server');
      server = null;
      done();
    });
  });

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  it('should set the headers in the `request` instance if an object is provided', function(done) {
    var headers = {
      'Authorization': 'username:password',
      'foo': 'bar'
    };

    test.config.headers = headers;

    test.setHeaders().fin(function() {
      var request = test.request;

      expect(request).toBeDefined();
      expect(request.config.headers).toBeDefined();
      expect(request.config.headers.Authorization).toEqual(headers.Authorization);
      expect(request.config.headers.foo).toEqual(headers.foo);

      done();
    });
  });

  it('should properly build a url in the `buildRequest` function', function(done) {
    var config = {
      path: '/foo',
      method: 'POST',
    };

    test.config.path = config.path;

    test.buildRequest().then(function() {
      var
        request = test.request,
        port = ctrllr.config.port,
        expectedUrl = 'http://localhost:4040/foo';

      expect(request).toBeDefined();
      expect(request.config.url).toBeDefined();
      expect(request.config.url).toEqual(expectedUrl);
    }).fail(function(err) {
      console.log('err', err);
      expect(err).toBeUndefined();
    }).fin(function() {
      done();
    });
  });

  it('should set the method in the `buildRequest` function', function(done) {
    var config = {
      path: '/foo',
      method: 'POST',
    };

    test.config.path = config.path;
    test.config.method = config.method;

    test.buildRequest().then(function() {
      var request = test.request;

      expect(request.config.method).toBeDefined();
      expect(request.config.method).toEqual(config.method);
    }).fail(function(err) {
      console.log('err', err);
      expect(err).toBeUndefined();
    }).fin(function() {
      done();
    });
  });

  it('should hit the specified url in the `execute` function', function(done) {
    var config = {
      path: '/foo',
      method: 'GET',
    };

    test.config.path = config.path;
    test.config.method = config.method;

    test.execute().then(function() {
      expect(myObj).toBeDefined();
      expect(myObj.foo).toBeDefined();
      expect(myObj.foo).toEqual('bar');
    }).fail(function(err) {
      console.log('err', err);
      expect(err).toBeUndefined();
    }).fin(function() {
      done();
    });
  });
});