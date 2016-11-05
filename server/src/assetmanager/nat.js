'use strict';

const BPromise = require('bluebird');
const natUpnp = require('nat-upnp');
const nat = natUpnp.createClient();
BPromise.promisifyAll(nat);

const getNatStatus = () => {
    return nat.findGatewayAsync()
    .then(() => {
        return nat.getMappingsAsync({ local: true });
    })
    .then((mappings) => {
        return { available: true, mappings };
    })
    .catch((err) => {
        console.log(`NAT error: ${err.toString()}`);
        return { available: false };
    });
};


const openPort = (port, desc) => {
    console.log('openPort', port, desc);
    return nat.findGatewayAsync()
    .then(() => {
        return nat.portMappingAsync({
            public: port,
            private: port,
            ttl: 0,
            description: `cc:${desc}`
        });
    });
};


const closePort = (port) => {
    return nat.findGatewayAsync()
    .then(() => {
        return nat.portUnmappingAsync({ public: port });
    });
};


module.exports = {
    getNatStatus,
    openPort,
    closePort
};
