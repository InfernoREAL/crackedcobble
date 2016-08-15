'use strict';

const Readable = require('stream').Readable;
const proxyquire = require('proxyquire');
const test = require('tape');


const testDirs = ['foo', 'bar', 'baz'];
const testFiles = ['foo', 'readme.txt', 'bar', 'baz', 'blah.md', 'woo.hoo', 'ok'];
const goodJson = {
    answer: 42,
    question: 'Meaning?'
};


// Mock underlying fs utilities
let fsFailure = false;
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
        if (fsFailure) {
            throw new Error('File does not exist');
        }
        if (file === 'good.json') {
            return callback(null, JSON.stringify(goodJson));
        } else {
            return callback(null, '"broken": { json: not good');
        }
    },

    createReadStream() {
        const s = new Readable();
        if (fsFailure) {
            process.nextTick(() => {
                s.emit('error', new Error('File does not exist'));
            });
            return s;
        }
        s.push(JSON.stringify(goodJson));
        s.push(null);
        return s;
    }
};


test('=== fsutil setup', (t) => {
    fsFailure = false;
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


test('sha1sum returns the hex hash of a file', (t) => {
    fsutil.sha1sum('good.json')
    .then((res) => {
        t.equal(res, '5778bc442202f75ae10faf78f8ec690337304f5f');
        t.end();
    })
    .catch((err) => {
        t.fail(`Unexpected error ${err}`);
        t.end();
    });
});


test('sha1sum is rejected on error', (t) => {
    fsFailure = true;
    fsutil.sha1sum('foo.json')
    .then((res) => {
        fsFailure = false;
        t.fail(`Unexpected result ${res}`);
        t.end();
    })
    .catch((err) => {
        fsFailure = false;
        t.equal(err.toString(), 'Error: File does not exist');
        t.end();
    });
});


test('=== fsutil teardown', (t) => {
    t.end();
});
