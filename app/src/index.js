import 'babel-polyfill'; // Polyfill non-ES6 browsers

import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import thunk from 'redux-thunk';

import 'bootstrap-loader';

import reducer from './reducers';
const store = createStore(reducer, applyMiddleware(thunk));

import CrackedCobble from './crackedcobble';
const CrackedCobbleApp = connect((state) => state)(CrackedCobble);

ReactDOM.render(
    <Provider store={ store }>
        <CrackedCobbleApp />
    </Provider>
    , document.getElementById('container')
);
