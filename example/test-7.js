var

  /** async flow lib */
  $q = require('q'),

  /** ctrllr config */
  config = require('../example/config-3'),

  /** ctrllr instance */
  ctrllr = new require('../lib/ctrllr')(config),

  /** tests */
  test7 = require('../example/spec-7');

ctrllr
  .add(test7)
  .start();