'use strict';

const BPromise = require('bluebird');

const conexec = require('./conexec').conexec;

/**
 * Get total, used, and "true" free memory info from a linux system.  Results are returned via
 * Promise fulfillment.
 */
const getMemoryInfo = () => {
    return conexec('free')
    .then((res) => {
        // free output is expected to look like:
        //              total       used       free     shared    buffers     cached
        // Mem:      20459460   19033724    1425736     154264    2035948    7667748
        // -/+ buffers/cache:    9330028   11129432
        // Swap:      7999484        424    7999060
        if (res.stdout.length < 3) {
            return BPromise.reject(new Error('Could not parse output of "free" command.'));
        }
        const total = parseInt(res.stdout[1].split(/[\t ]+/)[1], 10);
        const cols = res.stdout[2].split(/[\t ]+/);
        const used = parseInt(cols[2], 10);
        const free = parseInt(cols[3], 10);
        return {
            total,
            used,
            free
        };
    });
};


/**
 * Gets the size, used amount, and available amount of 1K bytes for the specified path (or device).
 * Also gets the use percentage of the path/device.  Results are returned via Promise fulfillment.
 */
const getDiskUsage = (path) => {
    // expects output to be like
    // Filesystem     1K-blocks      Used Available Use% Mounted on
    // /dev/sda1      480587984 449206992   6961792  99% /srv
    return conexec('df', [path])
    .then((res) => {
        if (res.stdout.length < 2) {
            return BPromise.reject(new Error('Could not parse output of "df" command.'));
        }
        const cols = res.stdout[1].split(/[\t ]+/);
        return {
            size: parseInt(cols[1], 10),
            used: parseInt(cols[2], 10),
            available: parseInt(cols[3], 10),
            usePercent: parseInt(cols[4].slice(0, -1), 10)
        };
    });
};

module.exports = {
    getMemoryInfo,
    getDiskUsage
};
