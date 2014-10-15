module.exports = [
    {
        description: 'Data store test',
        method: 'GET',
        url: '/api/auth',
        headers: { Authorization: 'password' },
        expectStatus: 200,
        before: function(ctrllr) {
            var store = ctrllr.getStore();

            store.set('foo', 'bar');
            ctrllr.assert('foo was set', store.get('foo') === 'bar');
            ctrllr.assert('foo is in the store', store.dump().foo === 'bar');
        },
        after: function(response, ctrllr) {
            var store = ctrllr.getStore();

            ctrllr.assert('foo is still set', store.get('foo') === 'bar');

            store.remove('foo');
            ctrllr.assert('foo can be removed', store.get('foo') === null);

            store.set('foo', 'bar');
            store.set('bar', 'baz');
            store.set('bam', 'bop');
            store.clear();

            ctrllr.assert('the store can be cleared', store.get('foo') === null);
            ctrllr.assert('the store can be cleared', store.get('bar') === null);
            ctrllr.assert('the store can be cleared', store.get('bam') === null);

            ctrllr.assert('the `assert` can be passed a function', function() {
                return true;
            });
        }
    }
];