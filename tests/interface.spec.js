
/* ==========================================================================
 Internal variables & dependencies
 ========================================================================== */

var

  /** ctrllr lib */
  CTRLLR = require('../lib/ctrllr'),

  /** ctrllr test interface */
  Interface = require('../lib/interface'),

  /** mock server for testing */
  server = require('./server.mock');

/* ==========================================================================
 Tests
 ========================================================================== */

describe('util.js', function() {
  var ctrllr, _interface;

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  // initialize ctrllr & interface instances before each test
  beforeEach(function() {
    ctrllr = new CTRLLR(server);
    _interface = new Interface(ctrllr);
  });

  // delete store after each test
  afterEach(function() {
    ctrllr = null;
    _interface = null;
  });

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  it ('should increment `ctrllr._successes` on a successful assert', function() {
    expect(ctrllr._successes).toEqual(0);

    _interface.assert('true === true', true === true);

    expect(ctrllr._successes).toEqual(1);
  });

  it ('should increment `ctrllr._failures` on a failed assert', function() {
    expect(ctrllr._failures).toEqual(0);

    _interface.assert('true === false', true === false);

    expect(ctrllr._failures).toEqual(1);
  });
});