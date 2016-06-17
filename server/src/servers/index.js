'use strict';

const BPromise = require('bluebird');
const fs = BPromise.promisifyAll(require('fs'));
const cp = require('child_process');
const path = require('path');
const rl = require('readline');

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

const fsutil = require('../util/fsutil');
const props = require('../util/properties');

// Settings
const settings = require('../settings.js');
const serverBasePath = settings.serverBasePath;
const assetPath = settings.assetPath;

// Constants
const serverPropertiesFile = 'server.properties';
const serverControlFile = 'crackedcobble.json';

// Active server map
const activeServers = {};

/**
 * Returns an array of minecraft server instances in the form:
 * [
 *   {
 *      name: 'Human readable name',
 *      id: 'server_id_string'
 *   },
 *   ...
 * ]
 *
 * Results are returned via Promise fulfillment.
 *
 */
const getServerList = () => {
    return fsutil.getDirectoryList(serverBasePath)
    .then((dirs) => {
        return BPromise.filter(dirs, (dir) => {
            const dirPath = path.join(serverBasePath, dir);
            return fs.accessAsync(path.join(dirPath, serverPropertiesFile), fs.W_OK)
            .then(() => {
                return fs.accessAsync(path.join(dirPath, serverControlFile), fs.W_OK);
            })
            .then(() => {
                return true;
            })
            .catch(fsutil.isFsError, function (err) {
                console.log(`Could not access server files: ${err}`);
                return false;
            });
        })
        .then((serverIds) => {
            // Get the control file to determine the human readable name of the server
            return BPromise.map(serverIds, (server) => {
                return fsutil.loadJson(path.join(serverBasePath, server, serverControlFile))
                .then((csControl) => {
                    return {
                        name: csControl.name,
                        id: server
                    };
                });
            });
        });
    });
};


/**
 * Returns the status of the specified `serverId` in the form:
 * {
 *    active: true if server is started, false otherwise,
 *    numPlayers: Number of players currently on the server
 * }
 *
 * Results are returned via Promise fulfillment.
 *
 */
const getServerStatus = (serverId) => {
    const server = activeServers[serverId];
    const status = {
        active: server ? true : false,
        numPlayers: 0
    };
    if (status.active) {
        return new BPromise((resolve, reject) => {
            const con = rl.createInterface(server.process.stdout, null);
            let parsedOutput = false;
            con.on('line', (line) => {
                const m = line.match(/There are (\d+)\/\d+ players online/);
                if (m) {
                    parsedOutput = true;
                    status.numPlayers = parseInt(m[1], 10);
                    con.close();
                    return resolve(status);
                }
            });
            con.on('close', () => {
                if (!parsedOutput) {
                    return reject('Unable to read number of players');
                }
            });
            // Try to get a player count
            server.process.stdin.write('\nlist\n');
        });
    }
    return BPromise.resolve(status);
};


/**
 * Returns information about the specified `serverId` in the form:
 * {
 *   name: 'Server name',
 *   mcVersion: 'minecraft version`,
 *   host: 'hostname or IP of server',
 *   flavor: 'type of server [ vanillia | forge ]',
 *   id: 'server_id',
 *   port: numeric port the server is running on,
 *   motd: 'message of the day for the server',
 *   mode: numeric game mode 0-3,
 *   difficulty: numeric game difficulty 0-4,
 *   maxPlayers: max number of players allowed on server,
 *   numPlayers: number of players active on server,
 *   isActive: true if server is started, false otherwise
 * }
 *
 * Results are returned via Promise fulfillment.
 *
 */
const getServerInfo = (serverId) => {
    const serverPath = path.join(serverBasePath, serverId);

    return BPromise.all([
        fsutil.loadJson(path.join(serverPath, serverControlFile)),
        props.load(path.join(serverPath, serverPropertiesFile))
    ])
    .then((res) => {
        const info = res[0];
        const serverProps = res[1];
        info.id = serverId;
        info.port = parseInt(serverProps.get('server-port'), 0);
        info.motd = serverProps.get('motd');
        info.mode = (serverProps.get('hardcore') === 'true' ? 4 : parseInt(serverProps.get('gamemode'), 0));
        info.difficulty = parseInt(serverProps.get('difficulty'), 10);
        info.maxPlayers = parseInt(serverProps.get('max-players'), 10);
        info.numPlayers = 0;
        info.isActive = activeServers.hasOwnProperty(serverId);
        if (info.isActive) {
            return getServerStatus(serverId)
            .then((status) => {
                info.numPlayers = status.numPlayers;
                return info;
            });
        }
        return info;
    })
    .catch(fsutil.isFsError, (err) => {
        console.log(err);
        throw new Error(`Unable to open control/properties file for server ${serverId}`);
    });
};


/**
 * Starts server specified by `serverId`.
 */
const activateServer = (serverId) => {
    const serverPath = path.join(serverBasePath, serverId);
    return fsutil.loadJson(path.join(serverPath, serverControlFile))
    .then((info) => {
        const mcPath = path.join(assetPath, `minecraft_server_${info.mcVersion}.jar`);
        const server = {
            info,
            process: cp.spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', mcPath, 'nogui'], { cwd: serverPath })
        };
        console.log(`Server ${serverId} started with pid ${server.process.pid}`);
        server.process.on('close', (code) => {
            console.log(`Server ${serverId} exited with code ${code}`);
            delete activeServers[serverId];
        });
        server.process.on('error', (err) => {
            console.log(`An error occured: ${err.toString()}`);
            delete activeServers[serverId];
        });
        activeServers[serverId] = server;
    });
};


/**
 * Stops server specified by `serverId`.
 */
const deactivateServer = (serverId) => {
    const server = activeServers[serverId];
    if (server) {
        server.process.stdin.write('\nstop\n');
    }
    return BPromise.resolve();
};


router.get('/bulk-info', (req, res) => {
    return getServerList()
    .then((serverList) => {
        return BPromise.map(serverList, (server) => {
            return getServerInfo(server.id);
        });
    })
    .then((servers) => {
        return res.json(servers);
    })
    .catch((err) => {
        console.log('caught:');
        return res.status(400).send(err.toString());
    });
});


router.get('/:id/status', (req, res) => {
    getServerStatus(req.params.id)
    .then((status) => {
        return res.json(status);
    })
    .catch((err) => {
        res.status(400).send(err.toString());
    });
});


router.put('/:id/status', (req, res) => {
    if (req.body.active) {
        if (activeServers.hasOwnProperty(req.params.id)) {
            return res.status(400).send('Server already started');
        }
        activateServer(req.params.id)
        .then(() => {
            return res.json({});
        })
        .catch((err) => {
            return res.status(400).send(`Unable to start server: ${err.toString()}.`);
        });
    } else {
        deactivateServer(req.params.id)
        .then(() => {
            return res.json({});
        })
        .catch((err) => {
            return res.status(400).send(`Unable to stop server: ${err.toString()}.`);
        });
    }
});


router.get('/:id', (req, res) => {
    getServerInfo(req.params.id)
    .then((info) => {
        return res.json(info);
    })
    .catch((err) => {
        console.log('caught:');
        return res.status(400).send(err.toString());
    });
});


router.get('/', (req, res) => {
    getServerList()
    .then((servers) => {
        return res.json(servers);
    })
    .catch((err) => {
        console.log('caught:');
        return res.status(400).send(err.toString());
    });
});

module.exports = {
    router,
    getServerInfo,
    getServerList
};
