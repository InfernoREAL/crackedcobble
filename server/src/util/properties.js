/**
 * Module for reading/writing properties files in a format-preserving manner
 *
*/
'use strict';

const BPromise = require('bluebird');
const fs = BPromise.promisifyAll(require('fs'));


/**
 * Property file object representing the entries in a minecraft-style properties file.
 */
const propertyFile = {
    init() {
        this.lines = [];
        return this;
    },
    addComment(comment) {
        this.lines.push({ type: 'comment', value: comment });
    },
    addProperty(key, value) {
        this.lines.push({ type: 'property', key, value });
    },
    get(key) {
        const kv = this.lines.find((el) => el.key === key);
        if (kv) {
            return kv.value;
        }
    },
    set(key, value) {
        const kv = this.lines.find((el) => el.key === key);
        if (kv) {
            kv.value = value;
        } else {
            this.addProperty(key, value);
        }
    }
    // TODO - add write support
};


/**
 * propertyFile object factory function
 */
const createPropertyFile = () => {
    return Object.create(propertyFile).init();
};


/**
 * Parse the string specified in `data` as a property file. Returns a propertyFile object instance.
 */
const parse = (data) => {
    const props = createPropertyFile();
    const lines = data.toString().split(/\r?\n/).slice(0, -1);
    lines.forEach((line) => {
        line = line.trim();
        if (line.match(/^#/)) {
            return props.addComment(line.substr(1));
        }
        const kv = line.split('=').map((param) => param.trim());
        if (kv.length === 2) {
            kv[1] = kv[1].replace('\\', '');
            props.addProperty(kv[0], kv[1]);
        }
    });
    return props;
};

/**
 * Loads and parses `file` as a property file in a single step. Results are returned via Promise fulfillment.
 */
const load = (file) => {
    return fs.readFileAsync(file)
    .then((data) => {
        return parse(data);
    });
};

module.exports = {
    createPropertyFile,
    load,
    parse
};
