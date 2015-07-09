
/* ==========================================================================
 Internal variables & dependencies
 ========================================================================== */

var

  /** ctrllr test manager */
  Test = require('../lib/test'),

  /** ctrllr lib */
  CTRLLR = require('../lib/ctrllr'),

  /** ctrllr test interface */
  Interface = require('../lib/interface'),

  /** mock server for testing */
  server = require('./server.mock');


/* ==========================================================================
 Tests
 ========================================================================== */

describe('test.js', function() {
  var test, ctrllr, _interface;

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  // initialize store instance before each test
  beforeEach(function() {
    ctrllr = new CTRLLR(server);
    _interface = new Interface(ctrllr);
    test = new Test(_interface);
  });

  // delete store after each test
  afterEach(function() {
    ctrllr = null;
    _interface = null;
    test = null;
  });

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */
});