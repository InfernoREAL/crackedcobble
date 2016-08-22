'use strict';

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const sio = require('socket.io')(server);

const assetsRes = require('./assetmanager');
const serversRes = require('./servers');
const systemRes = require('./system');

const settings = require('./settings');
console.log('Using settings: ');
console.log(settings);

app.use(bodyParser.json());

// TODO - replace with a more appropriate logger
app.use((req, res, next) => {
    console.log(req.url);
    next();
});

app.use('/assets', assetsRes.router);
app.use('/servers', serversRes.router);
app.use('/system', systemRes.router);

app.use(express.static(settings.appPath));

const index = path.join(settings.appPath, 'index.html');
app.get('/', (req, res) => {
    res.sendFile(index);
});

sio.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected.`);
    socket.on('close', () => {
        console.log(`Socket ${socket.id} disconnected.`);
    });
    // Room support on socket
    socket.on('join', (server) => {
        socket.join(server);
    });
    socket.on('leave', (server) => {
        socket.leave(server);
    });
    socket.on('consoleInput', serversRes.onConsoleInput);
});

// Monitor system status ever 5 seconds
systemRes.startMonitor(sio, 5000);

assetsRes.registerSocketIo(sio);
serversRes.registerSocketIo(sio);

// Keep our minecraft jars up to date
assetsRes.keepUpToDate();

server.listen(settings.port, () => {
    console.log(`CrackedCobble server started on port ${settings.port}`);
});
