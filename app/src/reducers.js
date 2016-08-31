const defaultState = {
    isNetworkActive: false,
    serverEdit: {
        active: false,
        errors: [],
        mcVersions: []
    },
    system: {
        status: {
            memoryUsage: 0,
            hostname: '',
            loadAvg: [0.0, 0.0, 0.0],
            diskUsage: 0
        }
    },
    servers: [],
    activeConsole: '',
    ws: window.io(),
    errors: []
};

const updateArray = (ar, idx, item) => {
    if (idx < 0) {
        return ar;
    }
    return [...ar.slice(0, idx), item, ...ar.slice(idx + 1)];
};

const debugFilter = ['SYSTEM_STATUS_RECEIVED'];

const reducer = (state = defaultState, action) => {
    const patch = (oldState, updates) => {
        return Object.assign({}, oldState, updates);
    };

    const skipLog = debugFilter.indexOf(action.type) >= 0;
    if (!skipLog) {
        console.log(action);
    }
    let newState = state;
    let idx = -1;
    switch (action.type) {
    case 'SYSTEM_STATUS_RECEIVED':
        newState = patch(state, { system: { status: action.status } });
        break;
    case 'SERVER_STATUS_RECEIVED':
        idx = state.servers.findIndex((el) => el.id === action.server.id);
        newState = patch(state, { servers: updateArray(state.servers, idx, action.server) });
        break;
    case 'SERVER_BULK_INFO_RECEIVED':
        newState = patch(state, { servers: action.servers });
        break;
    case 'SERVER_CREATE_REQUESTED':
        newState = patch(state, { isNetworkActive: true });
        break;
    case 'SERVER_CREATED':
        if (action.server.error) {
            newState = patch(state, {
                isNetworkActive: false,
                serverEdit: patch(state.serverEdit, { active: true, errors: [action.server.error] })
            });
        } else {
            newState =patch( state, {
                isNetworkActive: false,
                serverEdit: patch(state.serverEdit, { active: false, errors: [] })
            });
        }
        break;
    case 'SHOW_SERVER_CREATE':
        newState = patch(state, { serverEdit: patch(state.serverEdit, { active: true, errors: [] }) });
        break;
    case 'CANCEL_SERVER_CREATE':
        newState = patch(state, { serverEdit: patch(state.serverEdit, { active: false, errors: [] }) });
        break;
    case 'MINECRAFT_VERSIONS_RECEIVED':
        newState = patch(state, { serverEdit: patch(state.serverEdit, { mcVersions: action.versions }) });
        break;
    case 'OPEN_CONSOLE':
        newState = patch(state, { activeConsole: action.id });
        break;
    case 'CLOSE_CONSOLE':
        newState = patch(state, { activeConsole: '' });
        break;
    case 'ADD_ERROR':
        if (Array.isArray(action.error)) {
            newState = patch(state, { errors: [...action.error, ...state.errors].slice(-10) });
        } else {
            newState = patch(state, { errors: [action.error, ...state.errors].slice(-10) });
        }
        break;
    case 'CLEAR_ERROR':
        newState = patch(state, { errors: [] });
        break;
    }
    if (!skipLog) {
        console.log(newState);
    }
    return newState;
};

export default reducer;
