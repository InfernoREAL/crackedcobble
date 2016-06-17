const defaultState = {
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

const reducer = (state = defaultState, action) => {
    console.log(action);
    let newState = state;
    switch (action.type) {
    case 'SYSTEM_STATUS_RECEIVED':
        newState = Object.assign({}, state, { system: { status: action.status } });
        break;
    case 'SERVER_BULK_INFO_RECEIVED':
        newState = Object.assign({}, state, { servers: action.servers });
        break;
    }
    console.log(newState);
    return newState;
};

export default reducer;
