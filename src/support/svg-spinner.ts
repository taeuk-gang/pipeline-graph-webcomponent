import { nodeStrokeWidth } from './StatusIcons';
import { Result } from '../PipelineGraphModel';
import { LitElement, customElement, svg, } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

function describeArcAsPath(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

    const d = ['M', start.x, start.y, 'A', radius, radius, 0, arcSweep, 0, end.x, end.y].join(' ');

    return d;
}

export interface Props {
    percentage: number;
    radius: number;
    result: string;
}

@customElement(`svg-spinner`)
export class SvgSpinner extends LitElement {
    // Properties
    static get properties() {
        return {
            radius: { type: Number, },
            result: { type: String, },
            percentage: { type: Number, },
        }
    }

    percentage = 0;
    radius = 0;
    result = ``;

    // Data
    infiniteRotationRunning = false;
    infiniteRotateDegrees = 0;
    isEdgeOrIE = ('MSInputMethodContext' in window && 'documentMode' in document) || window.navigator.userAgent.indexOf('Edge') > -1;
    requestAnimationFrameId = 0; // Callback handle
    animatedElement?: SVGElement;

    // Lifecycle
    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        this.infiniteRotationRunning = false;
        this.infiniteRotateDegrees = 0;

        super.connectedCallback();
    }

    infiniteLoadingTimer = () => {
        this.infiniteRotateDegrees += 1.5;

        if (this.infiniteRotateDegrees >= 360) {
            this.infiniteRotateDegrees = 0;
        }

        this.animatedElement!.setAttribute('transform', `rotate(${this.infiniteRotateDegrees})`);
        this.requestAnimationFrameId = requestAnimationFrame(this.infiniteLoadingTimer);
    };

    disconnectedCallback() {
        cancelAnimationFrame(this.requestAnimationFrameId);
        super.disconnectedCallback();
    }

    render() {
        const { result } = this;
        const radius = this.radius || 12;
        const insideRadius = radius - 0.5 * nodeStrokeWidth;

        let percentage = this.percentage;
        const groupClasses = ['PWGx-progress-spinner', result];

        if (result === Result.queued) {
            percentage = 0;
        } else if (typeof percentage !== 'number' || isNaN(percentage) || percentage < 0) {
            percentage = 0;
        } else if (percentage === 100) {
            groupClasses.push('pc-over-100');
            percentage = 0;
        } else if (percentage > 100) {
            groupClasses.push('spin');
            percentage = 25;

            if (!this.infiniteRotationRunning && this.isEdgeOrIE) {
                requestAnimationFrame(this.infiniteLoadingTimer);

                this.infiniteRotationRunning = true;
            }
        }

        const rotate = (percentage / 100) * 360;
        const d = describeArcAsPath(0, 0, insideRadius, 0, rotate);

        const innerRadius = insideRadius / 3;        

        return svg`
        <svg style=${styleMap({
            width: "1px",
            height: "1px",
            overflow: "visible",
        })}>
            <g class="${groupClasses.join(' ')}">
                <circle cx="0" cy="0" r="${radius}" class="halo" stroke-width="${nodeStrokeWidth}" />
                <circle cx="0" cy="0" r="${insideRadius}" class="statusColor" stroke-width="${nodeStrokeWidth}" />
                <circle cx="0" cy="0" r="${innerRadius}" class="inner statusColor" />
                ${percentage ? svg`<path class="${result}" fill="none" stroke-width="${nodeStrokeWidth}" d="${d}"></path>` : svg``}
            </g>
        </svg>
        `;
    }
}
