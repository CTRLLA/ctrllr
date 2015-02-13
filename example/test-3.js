var

  /** ctrllr config */
  config = require('../example/config'),

  /** ctrllr instance */
  ctrllr = new require('../lib/ctrllr')(config),

  /** tests */
  test5 = require('../example/spec-5');

ctrllr
  .add(test5)
  .start();