'use strict';

const BPromise = require('bluebird');

const fs = BPromise.promisifyAll(require('fs'));
const conexec = require('./conexec').conexec;

/**
 * Get total, used, and "true" free memory info from a linux system.  Results are returned via
 * Promise fulfillment.
 */
const getMemoryInfo = () => {
    const attrs = {};
    return fs.readFileAsync('/proc/meminfo')
    .then((res) => {
        res.toString().split('\n').forEach((line) => {
            const kv = line.split(':');
            if (kv.length === 2) {
                attrs[kv[0].trim()] = kv[1].trim();
            }
        });
        if (!attrs.hasOwnProperty('MemTotal') || !attrs.hasOwnProperty('MemAvailable')) {
            return BPromise.reject(new Error('Could not parse output of /proc/meminfo.'));
        }
        const total = parseInt(attrs['MemTotal'], 10);
        const free = parseInt(attrs['MemAvailable'], 10);
        const used = total - free;
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
