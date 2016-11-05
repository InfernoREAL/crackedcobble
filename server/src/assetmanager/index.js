'use strict';
/**
 * AssetManager - Downloads and manages versions of Minecraft, Forge, etc.
 */

const BPromise = require('bluebird');
const fs = BPromise.promisifyAll(require('fs'));
const path = require('path');

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

const fsutil = require('../util/fsutil');
const mc = require('./minecraft');
const nat = require('./nat');

// Settings
const settings = require('../settings.js');
const assetPath = settings.assetPath;

// Websocket for announcing events
let sio = null;
const registerSocketIo = (io) => {
    sio = io;
};


//=======================
// Asset manager services
//=======================

/**
 * Downloads any missing minecraft servers
 */
const downloadMinecraftServers = (assetPath) => {
    // First get list of missing or corrupt servers
    console.log('Checking for new minecraft servers...');
    BPromise.filter(mc.getServerList(), (server) => {
        const serverPath = path.join(assetPath, `minecraft_server_${server.id}.jar`);
        return fsutil.sha1sum(serverPath)
        .then((sha1) => {
            return sha1 !== server.server.sha1;
        })
        .catch(() => {
            return true;
        });
    })
    .then((servers) => {
        // Download serially to be nice to the Minecraft download servers
        return BPromise.each(servers, (server) => {
            console.log(`Downloading ${server.id}...`);
            return mc.downloadServer(server, assetPath)
            .then(() => {
                console.log(`Server ${server.id} downloaded successfully.`);
                if (sio) {
                    sio.emit('newMinecraftVersion', server.id);
                }
            })
            .catch((err) => {
                console.log(`Unable to download ${server.id}: ${err.toString()}`);
                return BPromise.resolve();
            });
        });
    })
    .then(() => {
        console.log('Minecraft server download complete.');
    });
};


/**
 * Checks every hour for new versions of assets
 */
const keepUpToDate = () => {
    // Grab latest servers
    downloadMinecraftServers(assetPath);
    BPromise.delay(3600000).then(keepUpToDate);
};


//======================
// Web service interface
//======================

router.get('/minecraft', (req, res) => {
    const sorter = (a, b) => {
        const aVer = a.split('.').map((x) => parseInt(x, 10));
        const bVer = b.split('.').map((x) => parseInt(x, 10));
        // Some servers don't have patch levels, assign to 0
        if (aVer.length === 2) {
            aVer.push(0);
        }
        if (bVer.length === 2) {
            bVer.push(0);
        }
        if (aVer[0] === bVer[0]) {
            if (aVer[1] === bVer[1]) {
                return (aVer[2] < bVer[2]) ? 1 : -1;
            }
            return (aVer[1] < bVer[1]) ? 1 : -1;
        }
        return (aVer[0] < bVer[0]) ? 1 : -1;
    };
    return fs.readdirAsync(assetPath).map((file) => {
        const match = /^minecraft_server_(.*)\.jar$/.exec(file);
        console.log(match);
        return match ? match[1] : null;
    })
    .then((versions) => {
        return res.json(versions.filter((v) => v).sort(sorter));
    })
    .catch((err) => {
        return res.status(400).send(err.toString());
    });
});


router.get('/nat', (req, res) => {
    nat.getNatStatus()
    .then((status) => {
        return res.json(status);
    })
    .catch((err) => {
        return res.status(400).send(err.toString());
    });
});


module.exports = {
    keepUpToDate,
    registerSocketIo,
    router
};
