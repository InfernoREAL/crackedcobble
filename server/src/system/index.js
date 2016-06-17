'use strict';

const os = require('os');

const BPromise = require('bluebird');
const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

const settings = require('../settings');
const sysinfo = require('../util').sysinfo;

/**
 * Returns the CPU load, memory usage, and disk usage percentage from the host system.
 * Provide `diskPath` in the options object to specify disk path for usage percentage
 * (defaults to `/`)
 */
const getStatus = (options) => {
    const opts = Object.assign({ diskPath: '/' }, options);
    return BPromise.all([sysinfo.getMemoryInfo(), sysinfo.getDiskUsage(opts.diskPath)])
    .then((res) => {
        // We'll adjust load average for the number of cpus. This will give us 1.0 for all CPUs loaded.
        const numCpus = os.cpus().length;
        const memInfo = res[0];
        const diskInfo = res[1];
        const status = {
            memoryUsage: Math.round((memInfo.used / memInfo.total) * 100),
            hostname: os.hostname(),
            loadAvg: os.loadavg().map(a => Math.round(((a / numCpus) + .001) * 100) / 100),
            diskUsage: diskInfo.usePercent
        };
        return status;
    });
};

router.get('/status', (req, res) => {
    getStatus({ diskPath: settings.diskMonitorPath })
    .then((status) => {
        return res.json(status);
    })
    .catch((err) => {
        res.status(400).send(err.toString());
    });
});

module.exports = {
    router,
    getStatus
};
