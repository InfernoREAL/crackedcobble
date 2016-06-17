'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');

const fsStub = {
    readFile(file, callback) {
        callback(null, '# Properties file\nwoo=hoo\n yee\t  =  haw  \n\tanswer = 42\n\n #Two\nhi\t =\tthere\n');
    }
};

const props = proxyquire('../src/util/properties', { fs: fsStub });


test('=== properties setup', (t) => {
    t.end();
});


test('createPropertyFile factory creates indepenent instances', (t) => {
    const a = props.createPropertyFile();
    const b = props.createPropertyFile();

    a.set('answer', 42);
    b.set('answer', 34);

    t.equal(a.get('answer'), 42);
    t.equal(b.get('answer'), 34);

    a.addProperty('foo', 'bar');
    b.addProperty('foo', 'baz');

    t.equal(a.get('foo'), 'bar');
    t.equal(b.get('foo'), 'baz');
    t.end();
});


test('get returns undefined if no property', (t) => {
    const a = props.createPropertyFile();

    a.set('answer', 42);
    t.equal(a.get('answer'), 42);
    t.ok(typeof a.get('foo') === 'undefined');

    t.end();
});


test('set replaces existing property', (t) => {
    const a = props.createPropertyFile();

    a.set('answer', 42);
    t.equal(a.get('answer'), 42);
    a.set('answer', 8);
    t.equal(a.get('answer'), 8);
    t.equal(1, a.lines.length);
    t.end();
});


test('properties parse can parse a properties string', (t) => {
    const res = props.parse('# Properties file\nwoo=hoo\n yee\t  =  haw  \n\tanswer = 42\n\n #Two\nhi\t =\tthere\n');
    t.equal(res.get('woo'), 'hoo');
    t.equal(res.get('yee'), 'haw');
    t.equal(res.get('answer'), '42');
    t.equal(res.get('hi'), 'there');
    t.end();
});


test('properties load can parse a properties file', (t) => {
    props.load('foo')
    .then((res) => {
        t.equal(res.get('woo'), 'hoo');
        t.equal(res.get('yee'), 'haw');
        t.equal(res.get('answer'), '42');
        t.equal(res.get('hi'), 'there');
        t.end();
    })
    .catch((err) => {
        t.fail(`Unexpected error ${err}`);
        t.end();
    });
});


test('=== properties teardown', (t) => {
    t.end();
});
