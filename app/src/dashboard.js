import React from 'react';

import { Grid, Row, Col, Clearfix } from 'react-bootstrap';

import HBarGauge from './hbargauge';
import ServerWidget from './serverwidget';

const Dashboard = React.createClass({
    displayName: 'Dashboard',
    propTypes: {
        status: React.PropTypes.object.isRequired,
        servers: React.PropTypes.array.isRequired,
        onServerStart: React.PropTypes.func.isRequired,
        onServerStop: React.PropTypes.func.isRequired,
        onConsole: React.PropTypes.func.isRequired
    },
    // Sm after every two, md after every 3
    render() {
        const { status, servers, onServerStart, onServerStop, onConsole } = this.props;
        return (
            <Grid>
                <Row>
                    <Col sm={ 6 } md={ 4 } className="dash-cell-container">
                        <div className="dash-cell">
                            <div className="dash-cell-header">SYSTEM STATUS</div>
                            <div className="dash-cell-content">
                                <HBarGauge
                                    label="MEMORY"
                                    barValue={ status.memoryUsage / 100.0 }
                                    textValue={ `${status.memoryUsage}` }
                                />
                                <HBarGauge
                                    label="LOAD 1M"
                                    barValue={ status.loadAvg[0] }
                                    textValue={ `${status.loadAvg[0]}` }
                                />
                                <HBarGauge
                                    label="LOAD 5M"
                                    barValue={ status.loadAvg[1] }
                                    textValue={ `${status.loadAvg[1]}` }
                                />
                                <HBarGauge
                                    label="LOAD 15M"
                                    barValue={ status.loadAvg[2] }
                                    textValue={ `${status.loadAvg[2]}` }
                                />
                                <HBarGauge
                                    label="DISK"
                                    barValue={ status.diskUsage / 100.0 }
                                    textValue={ `${status.diskUsage}` }
                                />
                            </div>
                        </div>
                    </Col>
                    {
                        servers.map((server, idx) => {
                            return (
                                <div key={ server.id }>
                                <Col sm={ 6 } md={ 4 } className="dash-cell-container">
                                    <ServerWidget
                                        id={ server.id }
                                        name={ server.name }
                                        url={ `${server.host}:${server.port}` }
                                        motd={ server.motd }
                                        numPlayers={ server.numPlayers }
                                        maxPlayers={ server.maxPlayers }
                                        mcVersion={ server.mcVersion }
                                        flavor={ server.flavor }
                                        mode={ server.mode }
                                        difficulty={ server.difficulty }
                                        hardcore={ server.hardcore }
                                        isActive={ server.isActive }
                                        onServerStart={ onServerStart }
                                        onServerStop={ onServerStop }
                                        onConsole = { onConsole }
                                    />
                                </Col>
                                { (idx + 2) % 2 === 0 ?
                                    <Clearfix visibleSmBlock />
                                :
                                    ''
                                }
                                { (idx + 2) % 3 === 0 ?
                                    <Clearfix visibleMdBlock />
                                :
                                    ''
                                }
                                </div>
                            );
                        })
                    }
                </Row>
            </Grid>
        );
    }
});

export default Dashboard;
