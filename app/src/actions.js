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
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
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
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
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
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
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
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
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
            return dispatch({ type: 'SERVER_CREATED', server: { error: err.toString() } });
        });
    };
};

const updateServer = (server) => {
    return (dispatch) => {
        dispatch({ type: 'SERVER_UPDATE_REQUESTED' });
        return fetchPut(`/servers/${server.general.id}`, server)
        .then((server) => {
            return dispatch({ type: 'SERVER_UPDATED', server });
        })
        .catch((err) => {
            return dispatch({ type: 'SERVER_UPDATED', server: { error: err.toString() } });
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
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
        });
    };
};

const resetMap = (server) => {
    return (dispatch) => {
        return fetchDelete(`/servers/${server}/map`)
        .then(() => {
            return dispatch({ type: 'MAP_RESET', server: { id: server } });
        })
        .catch((err) => {
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
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
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
        });
    };
};

const requestNatStatus = () => {
    return (dispatch) => {
        return fetchGet('/assets/nat')
        .then((status) => {
            return dispatch({ type: 'NAT_STATUS_RECEIVED', status });
        })
        .catch((err) => {
            console.log(err);
            return dispatch({ type: 'ADD_ERROR', error: err.toString() });
        });
    };
};

export default {
    createServer,
    updateServer,
    deleteServer,
    refreshSystem,
    refreshServers,
    requestMinecraftVersions,
    requestNatStatus,
    resetMap,
    startServer,
    stopServer
};
