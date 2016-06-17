import React from 'react';

import { Tab, Tabs } from 'react-bootstrap';

const ServerSettings = React.createClass({
    displayName: 'ServerSettings',
    getInitialState() {
        return {
            activeTab: 'general'
        };
    },
    switchTabs(key) {
        this.setState({ activeTab: key });
    },
    render() {
        const { activeTab } = this.state;
        return (
            <Tabs activeKey={ activeTab } onSelect={ this.switchTabs }>
                <Tab eventKey="general" title="General">
                    General settings go here...
                </Tab>
                <Tab eventKey="advanced" title="Advanced">
                    Advanced settings go here...
                </Tab>
                <Tab eventKey="mod" title="Mods">
                    Mod settings go here...
                </Tab>
            </Tabs>
        );
    }
});

export default ServerSettings;
