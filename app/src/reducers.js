const defaultState = {
    isNetworkActive: false,
    serverEdit: {
        active: false,
        errors: []
    },
    system: {
        status: {
            memoryUsage: 0,
            hostname: '',
            loadAvg: [0.0, 0.0, 0.0],
            diskUsage: 0
        }
    },
    servers: []
};

const updateArray = (ar, idx, item) => {
    if (idx < 0) {
        return ar;
    }
    return [...ar.slice(0, idx), item, ...ar.slice(idx + 1)];
};

const reducer = (state = defaultState, action) => {
    console.log(action);
    let newState = state;
    let idx = -1;
    switch (action.type) {
    case 'SYSTEM_STATUS_RECEIVED':
        newState = Object.assign({}, state, { system: { status: action.status } });
        break;
    case 'SERVER_STATUS_RECEIVED':
        idx = state.servers.findIndex((el) => el.id === action.server.id);
        newState = Object.assign({}, state, { servers: updateArray(state.servers, idx, action.server) });
        break;
    case 'SERVER_BULK_INFO_RECEIVED':
        newState = Object.assign({}, state, { servers: action.servers });
        break;
    case 'SERVER_CREATE_REQUESTED':
        newState = Object.assign({}, state, { isNetworkActive: true });
        break;
    case 'SERVER_CREATED':
        if (action.server.error) {
            newState = Object.assign({}, state, {
                isNetworkActive: false,
                serverEdit: { active: true, errors: [action.server.error] }
            });
        } else {
            newState = Object.assign({}, state, {
                isNetworkActive: false,
                serverEdit: { active: false, errors: [] }
            });
        }
        break;
    case 'SHOW_SERVER_CREATE':
        newState = Object.assign({}, state, { serverEdit: { active: true, errors: [] } });
        break;
    case 'CANCEL_SERVER_CREATE':
        newState = Object.assign({}, state, { serverEdit: { active: false, errors: [] } });
        break;
    }
    console.log(newState);
    return newState;
};

export default reducer;
