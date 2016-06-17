import React from 'react';
import snap from 'snapsvg';

// Utility functions
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

function drawArc(paper, x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    return paper.path(`M${start.x},${start.y}A${radius},${radius},0,0,0,${end.x},${end.y}`);
}

const DonutGauge = React.createClass({
    displayName: 'DonutGauge',
    propTypes: {
        barValue: React.PropTypes.number.isRequired,
        largeText: React.PropTypes.string,
        smallText: React.PropTypes.string
    },
    componentDidMount() {
        this.drawGauge();
    },
    componentDidUpdate() {
        this.drawGauge();
    },
    drawGauge() {
        const { barValue, largeText, smallText } = this.props;
        const paper = snap(this.svg);
        paper.clear();
        var adjustedValue = (270 + (barValue * 1.8)) % 360;
        drawArc(paper, 50, 50, 44, 270, 90).attr({
            stroke: '#cccccc',
            strokeWidth: 12,
            fillOpacity: 0
        });
        drawArc(paper, 50, 50, 44, 270, adjustedValue).attr({
            stroke: '#00e21a',
            strokeWidth: 12,
            fillOpacity: 0
        });
        const txt = paper.text(50, 46, [largeText, smallText]).attr({
            stroke: 'black',
            fill: 'black',
            fontFamily: 'arial, sans-serif',
            fontSize: 28,
            strokeWidth: 1,
            textAnchor: 'middle',
            textRendering: 'optimizeLegibility'
        });
        txt.selectAll('tspan')[1].attr({ fontSize: 16 });
    },
    render() {
        return (
            <div className="donut-gauge">
                <svg viewBox="0 0 100 50" ref={ c => this.svg = c } />
            </div>
        );
    }
});

export default DonutGauge;
