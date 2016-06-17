import React from 'react';

import { Form, FormGroup, FormControl, ControlLabel, Checkbox, Col } from 'react-bootstrap';

const AdvancedSettings = React.createClass({
    displayName: 'AdvancedSettings',
    propTypes: {
        seed: React.PropTypes.string,
        playerLimit: React.PropTypes.number.isRequired,
        javaArgs: React.PropTypes.string,
        onlineMode: React.PropTypes.bool.isRequired,
        announceAchievements: React.PropTypes.bool.isRequired,
        enableSnooper: React.PropTypes.bool.isRequired,
        spawnAnimals: React.PropTypes.bool.isRequired,
        spawnMonsters: React.PropTypes.bool.isRequired,
        spawnNpcs: React.PropTypes.bool.isRequired,
        generateStructures: React.PropTypes.bool.isRequired,
        allowFlight: React.PropTypes.bool.isRequired,
        allowNether: React.PropTypes.bool.isRequired,
        pvp: React.PropTypes.bool.isRequired,
        enableCommandBlock: React.PropTypes.bool.isRequired,
        bonusChest: React.PropTypes.bool.isRequired,
        levelType: React.PropTypes.string.isRequired,
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
        const { seed, playerLimit } = this.props;
        switch (field) {
        case 'seed':
            return (seed >= 0) ? '' : 'has-error';
        case 'playerLimit':
            return (playerLimit > 0) ? '' : 'has-error';
        }
    },
    render() {
        const { seed, playerLimit, javaArgs, onlineMode, announceAchievements, enableSnooper, spawnAnimals,
                spawnMonsters, spawnNpcs, generateStructures, allowFlight, allowNether, pvp, enableCommandBlock,
                bonusChest, levelType } = this.props;

        return (
            <Form horizontal className="tab-form">
                <FormGroup controlId="seed" className={ this.getValidationState('seed') }>
                    <Col componentClass={ ControlLabel } sm={ 2 }>Seed</Col>
                    <Col sm={ 10 }>
                        <FormControl
                            type="text"
                            placeholder="Random"
                            value={ seed }
                            onChange={ (e) => this.onTextChange('seed', e) }
                        />
                    </Col>
                </FormGroup>

                <FormGroup controlId="playerLimit" className={ this.getValidationState('playerLimit') }>
                    <Col componentClass={ ControlLabel } sm={ 2 }>Player Limit</Col>
                    <Col sm={ 10 }>
                        <FormControl
                            type="text"
                            value={ playerLimit || '' }
                            onChange={ (e) => this.onNumberChange('playerLimit', e) }
                        />
                    </Col>
                </FormGroup>

                <FormGroup >
                    <Col componentClass={ ControlLabel } sm={ 2 }>Level Type</Col>
                    <Col sm={ 3 }>
                        <FormControl
                            componentClass="select"
                            id="levelType"
                            value={ levelType }
                            onChange={ (e) => this.onTextChange('levelType', e) }
                        >
                            <option value="DEFAULT">Default</option>
                            <option value="FLAT">Flat</option>
                            <option value="LARGEBIOMES">Large Biomes</option>
                            <option value="AMPLIFIED">Amplified</option>
                        </FormControl>
                    </Col>
                </FormGroup>

                <FormGroup>
                    <Col componentClass={ ControlLabel } sm={ 2 }>Options</Col>
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ onlineMode }
                            onChange={ () => this.onCheckboxChange('onlineMode', !onlineMode) }
                        >
                            Online Mode
                        </Checkbox>
                    </Col>
                    <Col sm={ 5 }>
                        <Checkbox
                            inline
                            checked={ pvp }
                            onChange={ () => this.onCheckboxChange('pvp', !pvp) }
                        >
                            Player vs Player Mode
                        </Checkbox>
                    </Col>
                </FormGroup>

                <FormGroup>
                    <Col sm={ 2 } />
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ bonusChest }
                            onChange={ () => this.onCheckboxChange('bonusChest', !bonusChest) }
                        >
                            Bonus Chest
                        </Checkbox>
                    </Col>
                    <Col sm={ 4 }>
                        <Checkbox
                            inline
                            checked={ enableCommandBlock }
                            onChange={ () => this.onCheckboxChange('enableCommandBlock', !enableCommandBlock) }
                        >
                            Enable Command Block
                        </Checkbox>
                    </Col>
                </FormGroup>

                <FormGroup>
                    <Col sm={ 2 } />
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ enableSnooper }
                            onChange={ () => this.onCheckboxChange('enableSnooper', !enableSnooper) }
                        >
                            Enable Snooper
                        </Checkbox>
                    </Col>
                    <Col sm={ 4 }>
                        <Checkbox
                            inline
                            checked={ announceAchievements }
                            onChange={ () => this.onCheckboxChange('announceAchievements', !announceAchievements) }
                        >
                            Announce Achievements
                        </Checkbox>
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col sm={ 2 } />
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ spawnAnimals }
                            onChange={ () => this.onCheckboxChange('spawnAnimals', !spawnAnimals) }
                        >
                            Spawn Animals
                        </Checkbox>
                    </Col>
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ spawnMonsters }
                            onChange={ () => this.onCheckboxChange('spawnMonsters', !spawnMonsters) }
                        >
                            Spawn Monsters
                        </Checkbox>
                    </Col>
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ spawnNpcs }
                            onChange={ () => this.onCheckboxChange('spawnNpcs', !spawnNpcs) }
                        >
                            Spawn NPCs
                        </Checkbox>
                    </Col>
                </FormGroup>

                <FormGroup>
                    <Col sm={ 2 } />
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ allowNether }
                            onChange={ () => this.onCheckboxChange('allowNether', !allowNether) }
                        >
                            Allow Nether
                        </Checkbox>
                    </Col>
                    <Col sm={ 3 }>
                        <Checkbox
                            inline
                            checked={ allowFlight }
                            onChange={ () => this.onCheckboxChange('allowFlight', !allowFlight) }
                        >
                            Allow Flight
                        </Checkbox>
                    </Col>
                    <Col sm={ 4 }>
                        <Checkbox
                            inline
                            checked={ generateStructures }
                            onChange={ () => this.onCheckboxChange('generateStructures', !generateStructures) }
                        >
                            Generate Structures
                        </Checkbox>
                    </Col>
                </FormGroup>

                <FormGroup controlId="javaArgs">
                    <Col componentClass={ ControlLabel } sm={ 2 }>Java Args</Col>
                    <Col sm={ 10 }>
                        <FormControl
                            type="text"
                            placeholder="Auto"
                            value={ javaArgs }
                            onChange={ (e) => this.onTextChange('javaArgs', e) }
                        />
                    </Col>
                </FormGroup>
            </Form>
        );
    }
});

export default AdvancedSettings;
