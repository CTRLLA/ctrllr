var

  /** express server */
  server = require('../example/server'),

  /** ctrllr instance */
  ctrllr = new require('../lib/ctrllr')({
    port: 6060,
    server: server,
    proxy: 'http://192.168.0.3:8888'
  }),

  /** tests */
  test1 = require('../example/spec-1');

ctrllr
  .add(test1)
  .start();
