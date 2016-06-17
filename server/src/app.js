'use strict';

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const serversRouter = require('./servers').router;
const systemRouter = require('./system').router;

const settings = require('./settings');
console.log('Using settings: ');
console.log(settings);

app.use(bodyParser.json());

// TODO - replace with a more appropriate logger
app.use((req, res, next) => {
    console.log(req.url);
    next();
});

app.use('/servers', serversRouter);
app.use('/system', systemRouter);

app.use(express.static(settings.appPath));

const index = path.join(settings.appPath, 'index.html');
app.get('/', (req, res) => {
    res.sendFile(index);
});


app.listen(settings.port, () => {
    console.log(`CrackedCobble server started on port ${settings.port}`);
});
