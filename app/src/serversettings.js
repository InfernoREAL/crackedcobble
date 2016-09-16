import React from 'react';

import { Row, Col, Tab, Tabs, ButtonGroup, Button, Alert, Glyphicon } from 'react-bootstrap';

import GeneralSettings from './generalsettings';
import AdvancedSettings from './advancedsettings';

const ServerSettings = React.createClass({
    displayName: 'ServerSettings',
    propTypes: {
        onClose: React.PropTypes.func.isRequired,
        onCreate: React.PropTypes.func.isRequired,
        onUpdate: React.PropTypes.func.isRequired,
        isNetworkActive: React.PropTypes.bool.isRequired,
        serverEdit: React.PropTypes.object.isRequired,
        servers: React.PropTypes.array.isRequired
    },
    getInitialState() {
        const { serverEdit, servers } = this.props;
        let server = null;
        if (serverEdit.serverId) {
            server = servers.find((s) => s.id === serverEdit.serverId);
        }
        if (server) {
            return {
                activeTab: 'general',
                general: {
                    id: server.id,
                    name: server.name,
                    mcVersion: server.mcVersion,
                    port: server.port,
                    gameMode: server.mode,
                    difficulty: server.difficulty,
                    hardcore: server.hardcore,
                    motd: server.motd
                },
                advanced: {
                    seed: server.seed,
                    playerLimit: server.maxPlayers,
                    javaArgs: server.javaArgs,
                    onlineMode: server.onlineMode,
                    announceAchievements: server.announceAchievements,
                    enableSnooper: server.enableSnooper,
                    spawnAnimals: server.spawnAnimals,
                    spawnMonsters: server.spawnMonsters,
                    spawnNpcs: server.spawnNpcs,
                    generateStructures: server.generateStructures,
                    allowFlight: server.allowFlight,
                    allowNether: server.allowNether,
                    pvp: server.pvp,
                    bonusChest: server.bonusChest,
                    enableCommandBlock: server.enableCommandBlock,
                    levelType: server.levelType
                },
                errors: serverEdit.errors || []
            };
        } else {
            return {
                activeTab: 'general',
                general: {
                    id: null,
                    name: 'Server 1',
                    mcVersion: serverEdit.mcVersions[0] || '',
                    port: 25562,
                    gameMode: 0,
                    difficulty: 2,
                    hardcore: false,
                    motd: 'Welcome to Server 1'
                },
                advanced: {
                    seed: '',
                    playerLimit: 20,
                    javaArgs: [],
                    onlineMode: true,
                    announceAchievements: true,
                    enableSnooper: true,
                    spawnAnimals: true,
                    spawnMonsters: true,
                    spawnNpcs: true,
                    generateStructures: true,
                    allowFlight: false,
                    allowNether: true,
                    pvp: true,
                    bonusChest: false,
                    enableCommandBlock: false,
                    levelType: 'DEFAULT'
                },
                errors: serverEdit.errors || []
            };
        }
    },
    componentWillReceiveProps(nextProps) {
        if (this.props.serverEdit !== nextProps.serverEdit) {
            const general = Object.assign({}, this.state.general);
            // Specify a default server version is the list of versions has been provided
            if (general.mcVersion === '' && nextProps.serverEdit.mcVersions.length > 0) {
                general.mcVersion = nextProps.serverEdit.mcVersions[0];
            }
            this.setState({ general, errors: nextProps.serverEdit.errors });
        }
    },
    switchTabs(key) {
        this.setState({ activeTab: key });
    },
    setGeneralState(state) {
        this.setState({ general: Object.assign({}, this.state.general, state) });
    },
    setAdvancedState(state) {
        this.setState({ advanced: Object.assign({}, this.state.advanced, state) });
    },
    createServer() {
        const errors = this.validateSettings();
        if (errors.length) {
            return this.setState({ errors });
        }
        this.props.onCreate({ general: this.state.general, advanced: this.state.advanced });
    },
    updateServer() {
        const errors = this.validateSettings();
        if (errors.length) {
            return this.setState({ errors });
        }
        this.props.onUpdate({ general: this.state.general, advanced: this.state.advanced });
    },
    validateSettings() {
        const errors = [];
        const { general, advanced } = this.state;
        if (general.name.length < 1) {
            errors.push('The server must have a name.');
        }
        if (general.port < 1024 || general.port > 65536) {
            errors.push('Port must be in the range 1024 to 65535.');
        }
        if (general.motd.length < 1) {
            errors.push('The server must have a message of the day (MOTD) entry.');
        }
        if (advanced.playerLimit < 1) {
            errors.push('The player limit must be at least 1.');
        }
        return errors;
    },
    renderTabs() {
        const { activeTab, general, advanced } = this.state;
        return (
            <Tabs id="server-settings-tabs" activeKey={ activeTab } onSelect={ this.switchTabs }>
                <Tab eventKey="general" title="General">
                    <GeneralSettings
                        mcVersions={ this.props.serverEdit.mcVersions }
                        { ...general }
                        setState={ this.setGeneralState }
                    />
                </Tab>
                <Tab eventKey="advanced" title="Advanced">
                    <AdvancedSettings { ...advanced } setState={ this.setAdvancedState }/>
                </Tab>
                <Tab eventKey="mod" title="Mods">
                    Mod settings go here...
                </Tab>
            </Tabs>
        );
    },
    render() {
        const { isNetworkActive, onClose } = this.props;
        const { errors, general } = this.state;
        const errorList = errors.map( (e, i) => <li key={ i }>{ e }</li>);
        return (
            <div>
                { errors.length ?
                    <Row className="side-padded">
                        <Alert bsStyle="danger"><ul>{ errorList }</ul></Alert>
                    </Row>
                :
                    ''
                }
                <Row>
                    <Col sm={ 12 }>
                        { this.renderTabs() }
                    </Col>
                </Row>
                <Row className="side-padded">
                    <Col xs={ 2 } sm={ 8 } />
                    { isNetworkActive ?
                        <h1 className="network-activity"><Glyphicon className="spinning" glyph="refresh" /></h1>
                    :
                        <div>
                            <Col xs={ 5 } sm={ 2 }>
                                <ButtonGroup vertical block>
                                    <Button onClick={ onClose }>Cancel</Button>
                                </ButtonGroup>
                            </Col>
                            <Col xs={ 5 } sm={ 2 }>
                                <ButtonGroup vertical block>
                                    <Button
                                        bsStyle="primary"
                                        onClick={ general.id ? this.updateServer : this.createServer }
                                    >{ general.id ? 'Update' : 'Create' }</Button>
                                </ButtonGroup>
                            </Col>
                        </div>
                    }
                </Row>
            </div>
        );
    }
});

export default ServerSettings;
