'use strict';

/**
 * This module contains default settings. Override by exporting your own settings in localsettings.js
 */

const path = require('path');

let localsettings = {};
try {
    localsettings = require('./localsettings');
} catch (e) {
    console.log('Warning: No localsettings.js. Using defaults...');
}

const defaults = {
    // appPath - Path to the client application code
    appPath: path.join(__dirname, '..', '..', 'app', 'build'),
    // assetPath - Path that will contain the minecraft and forge server executables
    assetPath: path.join(__dirname, 'minecraft'),
    // diskMonitorPath - The device/path to monitor disk usage on
    diskMonitorPath: '/',
    // modPath - Path that will cache mod packs for installing in servers
    modPath: path.join(__dirname, 'mods'),
    // port - The port to serve on
    port: 80,
    // serverBasePath - Base path that will contain the minecraft server instances
    serverBasePath: path.join(__dirname, 'servers')
};

module.exports = Object.assign({}, defaults, localsettings);
