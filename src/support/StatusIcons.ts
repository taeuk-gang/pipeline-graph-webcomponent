import { TemplateResult, html, } from 'lit-html';
import { styleMap } from 'lit-html/directives/style-map';
import { Result } from '../PipelineGraphModel';
import './svg-spinner';
import { svgStatus, } from './svg-status';

export const nodeStrokeWidth = 3.5; // px.

export function getGroupForResult(result: Result, percentage: number, radius: number): TemplateResult {
    switch (result) {
        case Result.running:
        case Result.queued:
            return html`
            <svg-spinner 
                style=${styleMap({
                    display: `contents`
                })} 
                .radius="${radius}" 
                .result="${result}" 
                .percentage="${percentage}"
            ></svg-spinner>`;
        case Result.not_built:
        case Result.skipped:
        case Result.success:
        case Result.failure:
        case Result.paused:
        case Result.unstable:
        case Result.aborted:
        case Result.unknown:
            return svgStatus({
                radius,
                result,
            });
        default:
            console.error('Unexpected Result value', result);
            return svgStatus({
                radius,
                result: Result.unknown,
            });
    }
}
