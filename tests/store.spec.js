
/* ==========================================================================
 Internal variables & dependencies
 ========================================================================== */

var

  /** ctrllr data store */
  Store = require('../lib/store');

/* ==========================================================================
 Tests
 ========================================================================== */

describe('store.js', function() {
  var store;

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  // initialize store instance before each test
  beforeEach(function() {
    store = new Store();
  });

  // delete store after each test
  afterEach(function() {
    store = null;
  });

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  it('it should be able to `get` and `set` strings', function() {
    console.log('running store.js test 1');
    var foo = 'bar';

    store.set('foo', foo);
    expect(store.get('foo')).toEqual(foo);
  });

  it('it should be able to `get` and `set` numbers', function() {
    var foo = 3;

    store.set('foo', foo);
    expect(store.get('foo')).toEqual(foo);
  });

  it('it should be able to `get` and `set` booleans', function() {
    var foo = true;

    store.set('foo', foo);
    expect(store.get('foo')).toEqual(foo);

    foo = false;

    store.set('foo', foo);
    expect(store.get('foo')).toEqual(foo);
  });

  it('it should be able to `remove` keys', function() {
    var foo = true;

    store.set('foo', foo);
    expect(store.get('foo')).toEqual(foo);

    store.remove('foo');

    expect(store.get('foo')).toBeUndefined();
  });

  it('it should be able to `clear` all keys', function() {
    var
      a = 'a',
      b = 1,
      c = true;

    store.set('a', a);
    store.set('b', b);
    store.set('c', c);

    store.clear();

    expect(store.get('a')).toBeUndefined();
    expect(store.get('b')).toBeUndefined();
    expect(store.get('c')).toBeUndefined();
  });

  it('it should be able to `serialize` all data', function() {
    var
      a = 'a',
      b = 1,
      c = true,
      serialized,
      unserialized;

    store.set('a', a);
    store.set('b', b);
    store.set('c', c);

    serialized = store.serialize();

    expect(typeof serialized).toEqual('string');
    unserialized = JSON.parse(serialized);

    expect(unserialized.a).toEqual(a);
    expect(unserialized.b).toEqual(b);
    expect(unserialized.c).toEqual(c);
  });
});