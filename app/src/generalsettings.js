import React from 'react';

import { Form, FormGroup, FormControl, ControlLabel, Col, Checkbox, Radio } from 'react-bootstrap';

const GeneralSettings = React.createClass({
    displayName: 'GeneralSettings',
    propTypes: {
        name: React.PropTypes.string,
        mcVersion: React.PropTypes.string,
        mcVersions: React.PropTypes.array,
        port: React.PropTypes.number,
        gameMode: React.PropTypes.number,
        difficulty: React.PropTypes.number,
        hardcore: React.PropTypes.bool,
        motd: React.PropTypes.string,
        portForward: React.PropTypes.bool,
        nat: React.PropTypes.object.isRequired,
        setState: React.PropTypes.func.isRequired
    },
    onTextChange(field, evt) {
        this.props.setState({ [field]: evt.target.value });
    },
    onNumberChange(field, evt) {
        this.props.setState({ [field]: parseInt(evt.target.value, 10) || 0 });
    },
    onCheckboxChange(field, value) {
        this.props.setState({ [field]: value });
    },
    getValidationState(field) {
        const { name, port, motd } = this.props;
        switch (field) {
        case 'name':
            return (name.length > 0) ? '' : 'has-error';
        case 'port':
            return (port > 1023 && port < 65536) ? '' : 'has-error';
        case 'motd':
            return (motd.length > 0) ? '' : 'has-error';
        }
    },
    render() {
        const { name, mcVersion, mcVersions, port, gameMode, difficulty, hardcore, motd,
            portForward, nat, setState } = this.props;
        return (
            <Form horizontal className="tab-form">
                <FormGroup controlId="name" className={ this.getValidationState('name') }>
                    <Col componentClass={ ControlLabel } sm={ 2 }>Name</Col>
                    <Col sm={ 10 }>
                        <FormControl type="text" value={ name } onChange={ (e) => this.onTextChange('name', e) } />
                    </Col>
                </FormGroup>

                <FormGroup >
                    <Col componentClass={ ControlLabel } sm={ 2 }>MC Version</Col>
                    <Col sm={ 2 }>
                        <FormControl
                            componentClass="select"
                            id="mcVersion"
                            value={ mcVersion }
                            onChange={ (e) => this.onTextChange('mcVersion', e) }
                        >
                            { mcVersions.map(v => <option key={ v } value={ v }>{ v }</option>) }
                        </FormControl>
                    </Col>
                </FormGroup>
                <FormGroup className={ this.getValidationState('port') }>
                    <Col componentClass={ ControlLabel } sm={ 2 }>Port</Col>
                    <Col sm={ 2 }>
                        <FormControl
                            type="text"
                            id="port"
                            value={ port || '' }
                            onChange={ (e) => this.onNumberChange('port', e) }
                        />
                    </Col>
                </FormGroup>

                <FormGroup>
                    <Col componentClass={ ControlLabel } sm={ 2 }>Game Mode</Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="gameMode"
                            checked={ gameMode === 0 }
                            onChange={ () => setState({ gameMode: 0 }) }
                        >
                            Survival
                        </Radio>
                    </Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="gameMode"
                            checked={ gameMode === 1 }
                            onChange={ () => setState({ gameMode: 1 }) }
                        >
                            Creative
                        </Radio>
                    </Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="gameMode"
                            checked={ gameMode === 2 }
                            onChange={ () => setState({ gameMode: 2 }) }
                        >
                            Adventure
                        </Radio>
                    </Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="gameMode"
                            checked={ gameMode === 3 }
                            onChange={ () => setState({ gameMode: 3 }) }
                        >
                            Spectator
                        </Radio>
                    </Col>
                    <Col sm={ 2 }>
                        <Checkbox
                            inline
                            name="hardcore"
                            checked={ hardcore }
                            onChange={ () => this.onCheckboxChange('hardcore', !hardcore) }
                        >
                            Hardcore
                        </Checkbox>
                    </Col>
                </FormGroup>

                <FormGroup>
                    <Col componentClass={ ControlLabel } sm={ 2 }>Difficulty</Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="difficulty"
                            checked={ difficulty === 0 }
                            onChange={ () => setState({ difficulty: 0 }) }
                        >
                            Peaceful
                        </Radio>
                    </Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="difficulty"
                            checked={ difficulty === 1 }
                            onChange={ () => setState({ difficulty: 1 }) }
                        >
                            Easy
                        </Radio>
                    </Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="difficulty"
                            checked={ difficulty === 2 }
                            onChange={ () => setState({ difficulty: 2 }) }
                        >
                            Normal
                        </Radio>
                    </Col>
                    <Col sm={ 2 }>
                        <Radio
                            inline
                            name="difficulty"
                            checked={ difficulty === 3 }
                            onChange={ () => setState({ difficulty: 3 }) }
                        >
                            Hard
                        </Radio>
                    </Col>
                </FormGroup>

                <FormGroup controlId="motd" className={ this.getValidationState('motd') }>
                    <Col componentClass={ ControlLabel } sm={ 2 }>MOTD</Col>
                    <Col sm={ 10 }>
                        <FormControl
                            type="text"
                            value={ motd }
                            onChange={ (e) => this.onTextChange('motd', e) }
                        />
                    </Col>
                </FormGroup>

                <FormGroup controlId="portFoward">
                    <Col componentClass={ ControlLabel } sm={ 2 }>Open to Internet</Col>
                    <Col sm={ 10 }>
                        <Checkbox
                            inline
                            name="portFoward"
                            checked={ portForward }
                            onChange={ () => this.onCheckboxChange('portForward', !portForward) }
                        >
                            Enable { !nat.available &&
                                <span>(Please enable uPnP forwarding in your router to use this feature.)</span>
                            }
                        </Checkbox>
                    </Col>
                </FormGroup>
            </Form>
        );
    }
});

export default GeneralSettings;
