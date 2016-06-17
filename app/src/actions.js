import fetch from 'isomorphic-fetch';

const fetchGet = (url) => {
    return fetch(url)
    .then((res) => {
        if (res.status >= 400) {
            throw (new Error(res.statusText));
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
            throw (new Error(res.statusText));
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

export default {
    refreshSystem,
    refreshServers,
    startServer,
    stopServer
};
