import React from 'react';
import ReactDOM from 'react-dom';

import { Navbar, Nav, NavItem, Glyphicon } from 'react-bootstrap';
import { FormGroup, FormControl, InputGroup, Button, Well } from 'react-bootstrap';

const ServerConsole = React.createClass({
    displayName: 'ServerConsole',
    propTypes: {
        server: React.PropTypes.object.isRequired,
        onConsoleClose: React.PropTypes.func.isRequired,
        ws: React.PropTypes.object.isRequired
    },
    getInitialState() {
        return {
            lines: []
        };
    },
    componentDidMount() {
        const { server, ws } = this.props;
        console.log(`joining room ${server.id}`);
        ws.emit('join', server.id);
        ws.on('line', this.onLine);
        this.consoleCmd.focus();
    },
    componentWillUnmount() {
        const { server, ws } = this.props;
        console.log(`leaving room ${server.id}`);
        ws.emit('leave', server.id);
        ws.removeListener('line', this.onLine);
    },
    onLine(line) {
        const { lines } = this.state;
        // Limit line logging to 1000 lines
        this.setState({ lines: [...lines.slice(-999), line] });
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    },
    onSubmit(evt) {
        evt.preventDefault();
        const { ws, server } = this.props;
        ws.emit('consoleInput', { server: server.id, input: this.consoleCmd.value });
        this.consoleCmd.value = '';
        this.consoleCmd.focus();
    },
    render() {
        const { server, onConsoleClose } = this.props;
        const { lines } = this.state;
        return (
            <div className="console-container">
                <div className="console-wrap">
                    <Navbar fluid fixedTop>
                        <Navbar.Header className="nav-xs-left">
                            <Navbar.Brand>Console - { server.name }</Navbar.Brand>
                        </Navbar.Header>
                        <Nav pullRight className="nav-xs-right">
                            <NavItem eventKey={ 1 } href="#" onClick={ onConsoleClose }>
                                <Glyphicon glyph="remove" />
                            </NavItem>
                        </Nav>
                    </Navbar>
                    <Well className="console-output" ref={ (ref) => this.consoleOutput = ReactDOM.findDOMNode(ref) }>
                        { lines.map((l, idx) => <div key={ `l${idx}` }>{ l }</div>) }
                    </Well>
                </div>
                <div className="console-footer">
                    <form onSubmit={ this.onSubmit }>
                        <FormGroup className="console-input">
                            <InputGroup>
                                <FormControl
                                    ref={ (ref) => this.consoleCmd = ReactDOM.findDOMNode(ref) }
                                    type="text"
                                    placeholder="Enter command"
                                />
                                <InputGroup.Button>
                                    <Button type="submit"><Glyphicon glyph="send"/></Button>
                                </InputGroup.Button>
                            </InputGroup>
                        </FormGroup>
                    </form>
                </div>
            </div>
        );
    }
});

export default ServerConsole;
