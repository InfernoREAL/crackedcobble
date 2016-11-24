import React from 'react';

import { Navbar, Nav, NavItem, Grid, Row, Modal, Glyphicon, Button, Overlay, Collapse } from 'react-bootstrap';

import Dashboard from './dashboard';
import ServerConsole from './serverconsole';
import ServerSettings from './serversettings';

import actions from './actions';

const CrackedCobble = React.createClass({
    displayName: 'CrackedCobble',
    propTypes: {
        dispatch: React.PropTypes.func.isRequired,
        system: React.PropTypes.object.isRequired,
        servers: React.PropTypes.array.isRequired,
        isNetworkActive: React.PropTypes.bool.isRequired,
        serverEdit: React.PropTypes.object.isRequired,
        activeConsole: React.PropTypes.string.isRequired,
        ws: React.PropTypes.object.isRequired,
        errors: React.PropTypes.array.isRequired
    },
    getInitialState() {
        return { showDeleteConfirmDialog: false, showResetConfirmDialog: false, server: null };
    },
    componentDidMount() {
        const { dispatch, ws } = this.props;

        dispatch(actions.refreshSystem());
        dispatch(actions.refreshServers());

        ws.on('systemStatus', (status) => {
            return dispatch({ type: 'SYSTEM_STATUS_RECEIVED', status });
        });
        ws.on('serverStatusChange', (server) => {
            return dispatch({ type: 'SERVER_STATUS_RECEIVED', server });
        });
        ws.on('serverAdded', () => {
            return dispatch(actions.refreshServers());
        });
        ws.on('serverUpdated', () => {
            return dispatch(actions.refreshServers());
        });
        ws.on('serverRemoved', () => {
            return dispatch(actions.refreshServers());
        });
        ws.on('serverError', (err) => {
            return dispatch({ type: 'ADD_ERROR', error: err });
        });
        // FIXME - do something useful with this
        ws.on('newMinecraftVersion', (version) => {
            console.log(`New minecraft version available: ${version}`);
        });
    },
    componentWillUnmount() {
        clearInterval(this.systemStatusInterval);
        clearInterval(this.serverStatusInterval);
        this.systemStatusInterval = null;
        this.serverStatusInterval = null;
    },
    onErrorHide() {
        this.props.dispatch({ type: 'CLEAR_ERROR' });
    },
    onCreate(evt) {
        evt.preventDefault();
        this.props.dispatch(actions.requestMinecraftVersions());
        this.props.dispatch(actions.requestNatStatus());
        this.props.dispatch({ type: 'SHOW_SERVER_CREATE' });
    },
    cancelCreate() {
        this.props.dispatch({ type: 'CANCEL_SERVER_CREATE' });
    },
    onServerStart(serverId) {
        this.props.dispatch(actions.startServer(serverId));
    },
    onServerStop(serverId) {
        this.props.dispatch(actions.stopServer(serverId));
    },
    onCreateServer(server) {
        console.log('creating server...');
        console.log(server);
        this.props.dispatch(actions.createServer(server));
    },
    onUpdateServer(server) {
        console.log('updating server...');
        console.log(server);
        this.props.dispatch(actions.updateServer(server));
    },
    onConsoleOpen(consoleId) {
        this.props.dispatch({ type: 'OPEN_CONSOLE', id: consoleId });
    },
    onConsoleClose() {
        this.props.dispatch({ type: 'CLOSE_CONSOLE' });
    },
    requestServerDeletion(server) {
        this.setState({ showDeleteConfirmDialog: true, server });
    },
    hideDeleteConfirmDialog() {
        this.setState({ showDeleteConfirmDialog: false, server: null });
    },
    requestMapReset(server) {
        this.setState({ showResetConfirmDialog: true, server });
    },
    hideResetConfirmDialog() {
        this.setState({ showResetConfirmDialog: false, server: null });
    },
    onServerDelete(server) {
        console.log(`deleting server ${server}!`);
        this.props.dispatch(actions.deleteServer(server));
        this.hideDeleteConfirmDialog();
    },
    onServerEdit(server) {
        console.log(`editing server ${server}`);
        this.props.dispatch(actions.requestMinecraftVersions());
        this.props.dispatch(actions.requestNatStatus());
        this.props.dispatch({ type: 'SHOW_SERVER_EDIT', server });
    },
    onResetMap(server) {
        console.log(`resetting map for server ${server}`);
        this.props.dispatch(actions.resetMap(server));
        this.hideResetConfirmDialog();
    },
    renderDashboard() {
        const { isNetworkActive, serverEdit, system, servers, errors } = this.props;
        const { showDeleteConfirmDialog, showResetConfirmDialog, server } = this.state;
        // Find the server name for displaying the edit modal
        const editServer = serverEdit.serverId ? servers.find((s) => s.id === serverEdit.serverId) : null;

        return (
            <Grid fluid>
                <Row style={ { marginTop: 65 } }>
                    <Navbar fluid fixedTop>
                        <Navbar.Header className="nav-xs-left">
                            <Navbar.Brand>CrackedCobble</Navbar.Brand>
                        </Navbar.Header>
                        <Nav pullRight className="nav-xs-right">
                            <NavItem eventKey={ 1 } href="#" onClick={ this.onCreate }>
                                <Glyphicon glyph="plus" />
                            </NavItem>
                        </Nav>
                    </Navbar>
                </Row>
                <Row>
                    <Dashboard
                        status={ system.status }
                        servers={ servers }
                        onServerStart={ this.onServerStart }
                        onServerStop={ this.onServerStop }
                        onConsole={ this.onConsoleOpen }
                        onServerDelete={ this.requestServerDeletion }
                        onServerEdit={ this.onServerEdit }
                        onResetMap ={ this.requestMapReset }
                    />
                </Row>
                <Modal
                    show={ serverEdit.active }
                    onHide={ this.cancelCreate }
                    dialogClassName="wide-modal"
                    backdrop="static"
                >
                    <Modal.Header closeButton>
                        { editServer ?
                            <Modal.Title>Edit server { editServer.name }...</Modal.Title>
                        :
                            <Modal.Title>Create Server...</Modal.Title>
                        }
                    </Modal.Header>
                    <Modal.Body>
                        <ServerSettings
                            isNetworkActive={ isNetworkActive }
                            serverEdit={ serverEdit }
                            servers={ servers }
                            onClose={ this.cancelCreate }
                            onCreate={ this.onCreateServer }
                            onUpdate={ this.onUpdateServer }
                        />
                    </Modal.Body>
                </Modal>
                <Modal show={ showDeleteConfirmDialog } onHide={ this.hideDeleteConfirmDialog } backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Delete server...</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    Permanently delete server '{ server }'?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={ () => this.onServerDelete(server) }>Yes</Button>
                        <Button bsStyle="primary" onClick={ this.hideDeleteConfirmDialog }>No</Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={ showResetConfirmDialog } onHide={ this.hideResetConfirmDialog } backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Reset map...</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    Reset map for server '{ server }'?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={ () => this.onResetMap(server) }>Yes</Button>
                        <Button bsStyle="primary" onClick={ this.hideResetConfirmDialog }>No</Button>
                    </Modal.Footer>
                </Modal>

                <Overlay
                    animation={ Collapse }
                    show={ errors.length > 0 }
                    rootClose={ true }
                    onHide={ this.onErrorHide }
                >
                    <div key="toast" className="error-toast">
                        <div className="error-message alert-danger">
                            { errors.map((e, idx) => <p key={ `e${idx}` }>{ e }</p>) }
                        </div>
                    </div>
                </Overlay>
            </Grid>
        );
    },
    renderConsole() {
        const { activeConsole, servers, ws } = this.props;
        const server = servers.find((s) => s.id === activeConsole);
        return (
            <ServerConsole server={ server } onConsoleClose={ this.onConsoleClose } ws={ ws }/>
        );
    },
    render() {
        if (this.props.activeConsole) {
            return this.renderConsole();
        } else {
            return this.renderDashboard();
        }
    }
});

export default CrackedCobble;
