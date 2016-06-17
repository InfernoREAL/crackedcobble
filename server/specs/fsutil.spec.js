'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');


const testDirs = ['foo', 'bar', 'baz'];
const testFiles = ['foo', 'readme.txt', 'bar', 'baz', 'blah.md', 'woo.hoo', 'ok'];
const goodJson = {
    answer: 42,
    question: 'Meaning?'
};


// Mock underlying fs utilities
const fsStub = {
    readdir(dir, callback) {
        callback(null, testFiles);
    },

    stat(file, callback) {
        if (testDirs.indexOf(file.replace('/testdir/', '')) >= 0) {
            return callback(null, { isDirectory: () => true });
        } else {
            return callback(null, { isDirectory: () => false });
        }
    },

    readFile(file, callback) {
        if (file === 'good.json') {
            return callback(null, JSON.stringify(goodJson));
        } else {
            return callback(null, '"broken": { json: not good');
        }
    }
};


test('=== fsutil setup', (t) => {
    t.end();
});


const fsutil = proxyquire('../src/util/fsutil', { fs: fsStub });


test('getDirectoryList returns only directories', (t) => {
    fsutil.getDirectoryList('/testdir')
    .then((list) => {
        t.deepEqual(list, testDirs);
        t.end();
    })
    .catch((err) => {
        t.fail(`Unexpected error ${err}`);
        t.end();
    });
});


test('isFsError is true for file system errors', (t) => {
    const fsErrors = [
        { code: 'EBUSY' }, { code: 'ENOENT' }, { code: 'EOF' }, { code: 'EACCES' }, { code: 'EAGAIN' },
        { code: 'EBADF' }, { code: 'EMFILE' }, { code: 'ENOTDIR' }, { code: 'EISDIR' }, { code: 'EEXIST' },
        { code: 'ENAMETOOLONG' }, { code: 'EPERM' }, { code: 'ELOOP' }, { code: 'ENOTEMPTY' }, { code: 'ENOSPC' },
        { code: 'EIO' }, { code: 'EROFS' }, { code: 'ENODEV' }, { code: 'ESPIPE' }, { code: 'ECANCELED' },
        { code: 'ENFILE' }, { code: 'EXDEV' }
    ];
    const otherErrors = [{ code: 'FOO' }, { code: 'BAR' }, { code: 'BAZ' }];
    fsErrors.forEach((err) => {
        t.ok(fsutil.isFsError(err));
    });
    otherErrors.forEach((err) => {
        t.notOk(fsutil.isFsError(err));
    });
    t.end();
});


test('loadJson works on good JSON files', (t) => {
    fsutil.loadJson('good.json')
    .then((res) => {
        t.deepEqual(res, goodJson);
        t.end();
    })
    .catch((err) => {
        t.fail(`Unexpected error ${err}`);
        t.end();
    });
});


test('loadJson throws errors on bad JSON files', (t) => {
    fsutil.loadJson('bad.json')
    .then((res) => {
        t.fail(`Unexpected result ${res}`);
        t.end();
    })
    .catch((err) => {
        t.equal(err.name, 'SyntaxError');
        t.end();
    });
});


test('=== fsutil teardown', (t) => {
    t.end();
});
