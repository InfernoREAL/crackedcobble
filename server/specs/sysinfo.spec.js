'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');

const BPromise = require('bluebird');

let returnBadData = false;
const conexecStub = {
    conexec(cmd) {
        if (cmd.indexOf('df') === 0) {
            if (returnBadData) {
                console.log('returning bad data!!!!!!!!!!!!!!!!!!111');
                returnBadData = false;
                return BPromise.resolve({ stdout: ['bad'] });
            }
            console.log('returning good data!!!!!!!!!!!!!!!!!!111');
            return BPromise.resolve({
                stdout: [
                    'Filesystem     1K-blocks      Used Available Use% Mounted on',
                    '/dev/sdb1      961301832 525893872 386553536  58% /opt'
                ]
            });
        } else {
            return BPromise.reject(new Error('Unknown command'));
        }
    }
};

const fsStub = {
    readFile(file, callback) {
        if (returnBadData) {
            return callback(null,
                'Buffers:         2443248 kB\n' +
                'Cached:          9782324 kB\n' +
                'SwapCached:           84 kB\n'
            );
        }
        return callback(null,
            'MemTotal:       20458460 kB\n' +
            'MemFree:          760168 kB\n' +
            'MemAvailable:   15611576 kB\n' +
            'Buffers:         2443248 kB\n' +
            'Cached:          9782324 kB\n' +
            'SwapCached:           84 kB\n'
        );
    }
};

const sysinfo = proxyquire('../src/util/sysinfo', { './conexec': conexecStub, 'fs': fsStub } );


test('=== sysinfo setup', (t) => {
    t.end();
});


test('getMemoryInfo returns appropriate information', (t) => {
    sysinfo.getMemoryInfo()
    .then((info) => {
        t.equal(info.total, 20458460);
        t.equal(info.used, 4846884);
        t.equal(info.free, 15611576);
        t.end();
    })
    .catch((err) => {
        t.fail(`Unexpected error ${err}`);
        t.end();
    });
});


test('getMemoryInfo fails gracefully on bad data', (t) => {
    returnBadData = true;
    sysinfo.getMemoryInfo()
    .then((info) => {
        t.fail(`Unexpected result ${info}`);
    })
    .catch((err) => {
        t.equals(0, err.message.indexOf('Could not parse'));
        t.end();
    });
});


test('getDiskUsage returns appropriate information', (t) => {
    returnBadData = false;
    sysinfo.getDiskUsage()
    .then((info) => {
        t.equal(info.size, 961301832);
        t.equal(info.used, 525893872);
        t.equal(info.available, 386553536);
        t.equal(info.usePercent, 58);
        t.end();
    })
    .catch((err) => {
        t.fail(`Unexpected error ${err}`);
        t.end();
    });
});


test('getDiskUsage fails gracefully on bad data', (t) => {
    returnBadData = true;
    sysinfo.getDiskUsage()
    .then((info) => {
        t.fail(`Unexpected result ${info}`);
    })
    .catch((err) => {
        t.equals(0, err.message.indexOf('Could not parse'));
        t.end();
    });
});


test('=== sysinfo cleanup', (t) => {
    t.end();
});
