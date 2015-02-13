var

  /** ctrllr config */
  config = require('../example/config'),

  /** ctrllr instance */
  ctrllr = new require('../lib/ctrllr')(config),

  /** tests */
  test6 = require('../example/spec-6');

ctrllr
  .add(test6)
  .start();