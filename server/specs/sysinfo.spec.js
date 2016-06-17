'use strict';

const proxyquire = require('proxyquire');
const test = require('tape');

const BPromise = require('bluebird');

let returnBadData = false;
const conexecStub = {
    conexec(cmd) {
        if (cmd.indexOf('free') === 0) {
            if (returnBadData) {
                returnBadData = false;
                return BPromise.resolve({ stdout: ['bad'] });
            }
            return BPromise.resolve({
                stdout: [
                    '             total       used       free     shared    buffers     cached',
                    'Mem:      20459460    8980252   11479208      78808    1384640    4367156',
                    '-/+ buffers/cache:    3228456   17231004',
                    'Swap:      7999484          0    7999484'
                ]
            });
        } else if (cmd.indexOf('df') === 0) {
            if (returnBadData) {
                returnBadData = false;
                return BPromise.resolve({ stdout: ['bad'] });
            }
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

const sysinfo = proxyquire('../src/util/sysinfo', { './conexec': conexecStub } );


test('=== sysinfo setup', (t) => {
    t.end();
});


test('getMemoryInfo returns appropriate information', (t) => {
    sysinfo.getMemoryInfo()
    .then((info) => {
        t.equal(info.total, 20459460);
        t.equal(info.used, 3228456);
        t.equal(info.free, 17231004);
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


test('getMemoryInfo fails gracefully on bad data', (t) => {
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
