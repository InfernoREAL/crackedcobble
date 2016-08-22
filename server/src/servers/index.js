'use strict';

const BPromise = require('bluebird');
const fs = BPromise.promisifyAll(require('fs'));
const cp = require('child_process');
const path = require('path');
const os = require('os');
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

let sio = null;
const registerSocketIo = (io) => {
    sio = io;
};

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
        numPlayers: server ? server.numPlayers : 0
    };
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
        info.mode = parseInt(serverProps.get('gamemode'), 0);
        info.difficulty = parseInt(serverProps.get('difficulty'), 10);
        info.hardcore = serverProps.get('hardcore') === 'true' ? true : false;
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
        // Fill in any command parameters that are not specified
        const startup = Object.assign({}, {
            command: 'java',
            javaArgs: ['-Xmx1024M', '-Xms1024M'],
            jar: path.join(assetPath, `minecraft_server_${info.mcVersion}.jar`),
            serverArgs: ['nogui']
        }, info.startup);
        const jar = startup.jar.startsWith('/') ? startup.jar : path.join(assetPath, startup.jar);
        const cmdLine = [].concat(startup.javaArgs, ['-jar', jar], startup.serverArgs);
        console.log(`Starting server ${serverId} with cmd: ${startup.command} ${cmdLine.join(' ')}`);
        const server = {
            info,
            numPlayers: 0,
            process: cp.spawn(startup.command, cmdLine, { cwd: serverPath })
        };
        console.log(`Server ${serverId} started with pid ${server.process.pid}`);
        // Mark this server as active
        activeServers[serverId] = server;

        // Send an status update for this server
        const sendStatusUpdate = () => {
            getServerInfo(serverId)
            .then((info) => {
                sio.emit('serverStatusChange', info);
            })
            .catch((err) => {
                console.log(`Failed to get server status: ${err.toString()}`);
            });
        };

        const rmServer = () => {
            if (server.con) {
                server.con.close();
            }
            delete activeServers[serverId];
        };
        sendStatusUpdate();

        // Handle process events for the server
        server.process.on('close', (code) => {
            console.log(`Server ${serverId} exited with code ${code}`);
            rmServer();
            sendStatusUpdate();
        });
        server.process.on('error', (err) => {
            console.log(`An error occured: ${err.toString()}`);
            rmServer();
            sendStatusUpdate();
        });

        // Create a console connection to allow interaction with the server
        server.con = rl.createInterface(server.process.stdout, null);
        server.con.on('line', (line) => {
            // Send a status update when the number of players are listed
            let m = line.match(/There are (\d+)\/\d+ players online/);
            if (m) {
                server.numPlayers = parseInt(m[1], 10);
                sendStatusUpdate();
            }
            // When a player joins or leaves, get the number of players online
            m = line.match(/joined the game/);
            if (m) {
                console.log('listing players due to a new player joining');
                server.process.stdin.write('list\n');
            }
            m = line.match(/left the game/);
            if (m) {
                console.log('listing players due to a new player leaving');
                server.process.stdin.write('list\n');
            }
            // Send output line to all remote consoles
            sio.to(serverId).emit('line', line);
        });
        server.con.on('close', () => {
            server.con = null;
        });
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


/**
 * Utility that turns a server name into an id. All non-word characters are converted to underscores.
 */
const nameToId = (name) => {
    return name.trim().toLowerCase().replace(/\W+?/g, '_');
};


/**
 * Utility that updates a properties file object with settings from the server creator/editor.
 */
const updateServerProperties = (propFile, info) => {
    const general = info.general;
    const advanced = info.advanced;
    propFile.addProperty('allow-nether', advanced.allowNether);
    propFile.addProperty('gamemode', general.gameMode);
    propFile.addProperty('difficulty', general.difficulty);
    propFile.addProperty('hardcore', general.hardcore);
    propFile.addProperty('spawn-monsters', advanced.spawnMonsters);
    propFile.addProperty('announce-player-achievements', advanced.announceAchievements);
    propFile.addProperty('pvp', advanced.pvp);
    propFile.addProperty('snooper-enabled', advanced.enableSnooper);
    propFile.addProperty('level-type', advanced.levelType);
    propFile.addProperty('enable-command-block', advanced.enableCommandBlock);
    propFile.addProperty('max-players', advanced.playerLimit);
    propFile.addProperty('server-port', general.port);
    propFile.addProperty('spawn-npcs', advanced.spawnNpcs);
    propFile.addProperty('allow-flight', advanced.allowFlight);
    propFile.addProperty('spawn-animals', advanced.spawnAnimals);
    propFile.addProperty('generate-structures', advanced.generateStructures);
    propFile.addProperty('online-mode', advanced.onlineMode);
    propFile.addProperty('level-seed', advanced.seed);
    propFile.addProperty('motd', general.motd);
};


/**
 * Creates a new server using the parameters contained in info
 */
const createServer = (info) => {
    console.log(info);
    // Create server id
    const serverId = nameToId(info.general.name);
    const serverPath = path.join(serverBasePath, serverId);
    const d = new Date().toString().split(' ');
    const timeStamp = `${d[0]} ${d[1]} ${d[2]} ${d[4]} ${d[6].replace(/[()]/g, '')} ${d[3]}`;

    // Make server directory
    return fs.mkdirAsync(serverPath)
    .then(() => {
        // Create eula.txt
        const eula = path.join(serverPath, 'eula.txt');
        return fs.writeFileAsync(eula,
            '#By changing the setting below to TRUE you are indicating your agreement to our EULA ' +
            '(https://account.mojang.com/documents/minecraft_eula).\n' +
            `#${timeStamp}\n` +
            'eula=true\n');
    })
    .then(() => {
        // Create server.properties
        const propFile = props.createPropertyFile();
        propFile.addComment('Minecraft server properties');
        propFile.addComment(timeStamp);
        updateServerProperties(propFile, info);
        return propFile.save(path.join(serverPath, serverPropertiesFile));
    })
    .then(() => {
        // Create crackedcobble.json
        const config = {
            name: info.general.name,
            mcVersion: info.general.mcVersion,
            host: os.hostname(),
            flavor: 'vanilla',
            startup: {}
        };
        // Put in custom args if provided
        const javaArgs = info.advanced.javaArgs.filter(a => a.trim().length > 0);
        if (javaArgs.length > 0) {
            config.startup.javaArgs = javaArgs;
        }
        // Tell minecraft to generate the bonus chest if desired
        if (info.advanced.bonusChest) {
            config.startup.serverArgs = ['nogui', '--bonusChest'];
        }
        return fs.writeFile(path.join(serverPath, serverControlFile), JSON.stringify(config, 0, 4));
    })
    .then(() => {
        // Server has been created, notify interested parties asynchronously
        getServerInfo(serverId)
        .then((info) => {
            sio.emit('serverAdded', info);
        })
        .catch((err) => {
            console.log(`Unable to get server status: ${err.toString()}`);
        });
        return null;
    });
};


/**
 * Event handler for console input. Writes the input cmd to the specified server's console.
 *
 * Event contains:
 * {
 *   server: <server id>,
 *   input: <console input string>
 * }
 */
const onConsoleInput = (evt) => {
    const server = activeServers[evt.server];
    if (server) {
        server.process.stdin.write(`${evt.input}\n`);
    }
};

// Webservice interface

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


router.post('/', (req, res) => {
    createServer(req.body)
    .then(() => {
        return res.json({});
    })
    .catch((err) => {
        // Make a friendlier error message for the common situation of a user trying to create
        // a server that already exists
        let errString = err.toString();
        if (errString.indexOf('EEXIST') >= 0) {
            errString = `Server ${req.body.general.name} already exists`;
        }
        return res.status(400).send(errString);
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
    createServer,
    getServerInfo,
    getServerList,
    onConsoleInput,
    registerSocketIo,
    router
};
