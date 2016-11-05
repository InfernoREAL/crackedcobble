import React from 'react';
import { Row, Col } from 'react-bootstrap';
import snap from 'snapsvg';

const HBarGauge = React.createClass({
    displayName: 'HBarGauge',
    propTypes: {
        label: React.PropTypes.string.isRequired,
        barValue: React.PropTypes.number.isRequired,
        textValue: React.PropTypes.string.isRequired
    },
    componentDidMount() {
        this.drawGauge();
    },
    componentDidUpdate() {
        this.drawGauge();
    },
    drawGauge() {
        let { barValue } = this.props;
        barValue = Math.min(1.0, barValue);
        const scale = ((1.0 - barValue) % 1.0) + 1.0;
        const paper = snap(this.svg);
        paper.clear();
        const g = paper.gradient(`l(0, 0, ${scale}, 0)#00e21a-#fcff11:75-#fcff11:85-#ff2d0b:95-#ff2d0b`);
        paper.rect(0, 0, 100, 24).attr({ fill: '#cccccc' });
        paper.rect(0, 0, (100 * barValue), 24).attr({ fill: g });
    },
    render() {
        const { label, textValue } = this.props;
        return (
            <Row>
                <Col xs={ 3 } className="hbar-label">{ label }</Col>
                <Col xs={ 6 } className="hbar-gauge">
                    <svg viewBox="0 0 100 24" preserveAspectRatio="none" ref={ c => this.svg = c } />
                </Col>
                <Col xs={ 3 }className="hbar-value">{ textValue }</Col>
            </Row>
        );
    }
});

export default HBarGauge;
