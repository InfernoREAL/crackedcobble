'use strict';

/**
 * Manages official minecraft versions
 */

const BPromise = require('bluebird');

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fetch = require('isomorphic-fetch');

const manifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

/**
 * Gets the minecraft version manifest.
 * Example:
    { latest: { snapshot: '16w32b', release: '1.10.2' },
      versions:
       [ { id: '16w32b',
           type: 'snapshot',
           time: '2016-08-11T14:37:12+00:00',
           releaseTime: '2016-08-11T14:34:29+00:00',
           url: 'https://launchermeta.mojang.com/mc/game/d76d4048851e5d74aed8ecf37826c74fb08f0a84/16w32b.json' },
         { id: '1.10.2',
           type: 'release',
           time: '2016-07-22T08:46:23+00:00',
           releaseTime: '2016-06-23T09:17:32+00:00',
           url: 'https://launchermeta.mojang.com/mc/game/1920a2b4e996bae0af1a67d38d63706bac10ac47/1.10.2.json' }
       ]
    }
*/
const getManifest = () => {
    return fetch(manifestUrl)
    .then(res => {
        return res.json();
    });
};


/**
 * Returns a list of server records containing the server version, sha1 hash and download url.
 *
 * Example:
   {
     id: '1.10.2',
     server: {
       sha1: '3d501b23df53c548254f5e3f66492d178a48db63',
       size: 9459897,
       url: 'https://launcher.mojang.com/mc/game/1.10.2/server/3d501b23df53c548254f5e3f66492d178a48db63/server.jar'
     }
   }
 */
const getServerList = () => {
    return getManifest()
    .then(manifest => {
        return BPromise.map(manifest.versions.filter((v) => v.type === 'release'), (version) => {
            return fetch(version.url)
            .then(body => {
                return body.json();
            })
            .then((info) => {
                return { id: version.id, server: info.downloads.server };
            });
        })
        .then((servers) => {
            // Filter out versions that do not have servers
            return servers.filter((s) => s.server);
        });
    });
};


/**
 * Given a server record (from getServerList), download the minecraft server version and store it in
 * assetPath.  The sha1 sum of the downloaded file will be verified.
 */
const downloadServer = (serverRec, assetPath) => {
    return fetch(serverRec.server.url)
    .then((res) => {
        return new BPromise( (resolve, reject) => {
            const name = `minecraft_server_${serverRec.id}.jar`;
            const out = fs.createWriteStream(path.join(assetPath, `./${name}`));
            const hash = crypto.createHash('sha1');
            hash.setEncoding('hex');
            res.body.pipe(hash);
            res.body.pipe(out);
            res.body.on('end', () => {
                const sum = hash.read();
                if (sum !== serverRec.server.sha1) {
                    return reject(`File hash mismatch. Expected ${serverRec.server.sha1}, got ${sum}.`);
                }
                return resolve(name);
            });
            res.body.on('error', err => {
                return reject(err);
            });

            out.on('error', err => {
                return reject(err);
            });
        });
    });
};

module.exports = {
    getManifest,
    getServerList,
    downloadServer
};
