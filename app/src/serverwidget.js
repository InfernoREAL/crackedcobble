import React from 'react';

import { Button, Glyphicon } from 'react-bootstrap';

import DonutGauge from './donutgauge';

const modeNames = [
    'Survival',
    'Creative',
    'Adventure',
    'Spectator',
    'Hardcore'
];

const difficultyNames = [
    'Peaceful',
    'Easy',
    'Normal',
    'Hard'
];

const ServerWidget = React.createClass({
    displayName: 'ServerWidget',
    propTypes: {
        id: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        url: React.PropTypes.string.isRequired,
        motd: React.PropTypes.string.isRequired,
        mcVersion: React.PropTypes.string.isRequired,
        flavor: React.PropTypes.string.isRequired,
        mode: React.PropTypes.number.isRequired,
        difficulty: React.PropTypes.number.isRequired,
        hardcore: React.PropTypes.bool.isRequired,
        maxPlayers: React.PropTypes.number.isRequired,
        numPlayers: React.PropTypes.number.isRequired,
        isActive: React.PropTypes.bool.isRequired,
        onServerStart: React.PropTypes.func.isRequired,
        onServerStop: React.PropTypes.func.isRequired
    },
    render() {
        const { id, name, url, motd, mcVersion, flavor, mode, difficulty, hardcore, maxPlayers, numPlayers, isActive,
            onServerStart, onServerStop } = this.props;
        return (
            <div className={ 'dash-cell' + (isActive ? ' server-active' : '') }>
                <div className="dash-cell-header">
                    <span className="pull-right">{ url }</span>
                    <span>{ name }</span>
                </div>
                <div className="dash-cell-content">
                    <div className="dash-cell-row">{ motd }</div>
                    <div className="pull-right">
                        <DonutGauge
                            barValue={ (numPlayers / maxPlayers) * 100 }
                            largeText={ `${numPlayers}` }
                            smallText={ ` / ${maxPlayers}` }
                        />
                    </div>
                    <div className="dash-cell-row"><span>{ mcVersion } / { flavor }</span></div>
                    <div className="dash-cell-row">
                        <span>{ modeNames[mode] } / { difficultyNames[difficulty] }
                            { hardcore ? ' HC' : '' }
                        </span>
                    </div>
                    <div className="dash-cell-action-bar">
                        { isActive ?
                            <Button onClick={ () => onServerStop(id) }><Glyphicon glyph="stop" /></Button>
                            :
                            <Button onClick={ () => onServerStart(id) }><Glyphicon glyph="play" /></Button>
                        }
                        <Button><Glyphicon glyph="console" /></Button>
                        <Button><Glyphicon glyph="pencil" /></Button>
                        <Button><Glyphicon glyph="trash" /></Button>
                    </div>
                </div>
            </div>
        );
    }
});

export default ServerWidget;
