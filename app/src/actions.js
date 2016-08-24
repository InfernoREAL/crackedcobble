import fetch from 'isomorphic-fetch';

const fetchGet = (url) => {
    return fetch(url)
    .then((res) => {
        if (res.status >= 400) {
            return res.text()
            .then((text) => {
                throw (new Error(text));
            });
        }
        return res.json();
    });
};

const fetchPut = (url, payload) => {
    return fetch(url, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((res) => {
        if (res.status >= 400) {
            return res.text()
            .then((text) => {
                throw (new Error(text));
            });
        }
        return res.json();
    });
};

const fetchPost = (url, payload) => {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((res) => {
        if (res.status >= 400) {
            return res.text()
            .then((text) => {
                throw (new Error(text));
            });
        }
        return res.json();
    });
};

const fetchDelete = (url) => {
    return fetch(url, { method: 'DELETE' })
    .then((res) => {
        if (res.status >= 400) {
            return res.text()
            .then((text) => {
                throw (new Error(text));
            });
        }
        return res.json();
    });
};

const refreshSystem = () => {
    return (dispatch) => {
        return fetchGet('/system/status')
        .then((status) => {
            return dispatch({ type: 'SYSTEM_STATUS_RECEIVED', status });
        })
        .catch((err) => {
            console.log(err);
        });
    };
};

const refreshServers = () => {
    return (dispatch) => {
        return fetchGet('/servers/bulk-info')
        .then((servers) => {
            return dispatch({ type: 'SERVER_BULK_INFO_RECEIVED', servers });
        })
        .catch((err) => {
            console.log(err);
        });
    };
};

const startServer = (serverId) => {
    return (dispatch) => {
        return fetchPut(`/servers/${serverId}/status`, { active: true })
        .then(() => {
            return dispatch(refreshServers());
        })
        .catch((err) => {
            console.log(err);
        });
    };
};

const stopServer = (serverId) => {
    return (dispatch) => {
        return fetchPut(`/servers/${serverId}/status`, { active: false })
        .then(() => {
            return dispatch(refreshServers());
        })
        .catch((err) => {
            console.log(err);
        });
    };
};

const createServer = (server) => {
    return (dispatch) => {
        dispatch({ type: 'SERVER_CREATE_REQUESTED' });
        return fetchPost('/servers', server)
        .then((server) => {
            return dispatch({ type: 'SERVER_CREATED', server });
        })
        .catch((err) => {
            console.dir(err);
            return dispatch({ type: 'SERVER_CREATED', server: { error: err.toString() } });
        });
    };
};

const deleteServer = (server) => {
    return (dispatch) => {
        return fetchDelete(`/servers/${server}`)
        .then(() => {
            return dispatch({ type: 'SERVER_DELETED', server: { id: server } });
        })
        .catch((err) => {
            console.dir(err);
            return dispatch({ type: 'SERVER_DELETED', server: { error: err.toString() } });
        });
    };
};

const requestMinecraftVersions = () => {
    return (dispatch) => {
        return fetchGet('/assets/minecraft')
        .then((versions) => {
            return dispatch({ type: 'MINECRAFT_VERSIONS_RECEIVED', versions });
        })
        .catch((err) => {
            console.log(err);
        });
    };
};

export default {
    createServer,
    deleteServer,
    refreshSystem,
    refreshServers,
    requestMinecraftVersions,
    startServer,
    stopServer
};
