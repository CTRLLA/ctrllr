var

  /** ctrllr config */
  config = require('../example/config'),

  /** ctrllr instance */
  ctrllr = new require('../lib/ctrllr')(config),

  /** tests */
  test1 = require('../example/spec-1'),
  test2 = require('../example/spec-2'),
  test3 = require('../example/spec-3'),
  test4 = require('../example/spec-4');

ctrllr
  .add(test1)
  .add(test2)
  .add(test3)
  .add(test4)
  .start();