'use strict';

const BPromise = require('bluebird');

const crypto = require('crypto');
const fs = BPromise.promisifyAll(require('fs'));
const path = require('path');

const fsErrors = [
    'EBUSY', 'ENOENT', 'EOF', 'EACCES', 'EAGAIN', 'EBADF', 'EMFILE', 'ENOTDIR', 'EISDIR', 'EEXIST',
    'ENAMETOOLONG', 'EPERM', 'ELOOP', 'ENOTEMPTY', 'ENOSPC', 'EIO', 'EROFS', 'ENODEV', 'ESPIPE',
    'ECANCELED', 'ENFILE', 'EXDEV'
];


/**
 * Returns true if the node js error object is a filesystem error.
 */
const isFsError = (err) => {
    return err.code && fsErrors.indexOf(err.code) >= 0;
};


/**
 * Given `basePath`, returns a list of first-level sub directories. Results are returned via Promise fulfillment.
 */
const getDirectoryList = (basePath) => {
    return fs.readdirAsync(basePath)
    .then((fileList) => {
        return BPromise.filter(fileList, (file) => {
            return fs.statAsync(path.join(basePath, file))
            .then((stat) => {
                return stat.isDirectory();
            });
        });
    });
};


/**
 * Loads and parses `jsonFile` in a single step. Results are returned via Promise fulfillment.
 */
const loadJson = (jsonFile) => {
    return fs.readFileAsync(jsonFile)
    .then((rawJson) => {
        return JSON.parse(rawJson);
    });
};


/**
 * Returns the sha1 hash of the specified file
 */
const sha1sum = (file) => {
    return new BPromise( (resolve, reject) => {
        const inStream = fs.createReadStream(file);
        const hash = crypto.createHash('sha1');
        hash.setEncoding('hex');
        inStream.pipe(hash);
        inStream.on('end', () => {
            return resolve(hash.read());
        });
        inStream.on('error', err => {
            return reject(err);
        });
    });
};

module.exports = {
    getDirectoryList,
    isFsError,
    loadJson,
    sha1sum
};
