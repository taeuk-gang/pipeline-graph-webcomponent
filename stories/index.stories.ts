import { html, TemplateResult } from 'lit-html';
import '../pipeline-graph';

export default {
  title: 'Pipeline',
  component: 'pipeline-graph',
};

export const Example = ({
  stages,
  layout,
  selectedNode,
}: any): TemplateResult => {
  return html`
  <pipeline-graph
    .stages=${stages}
    .layout=${layout}
    .selectedStage=${selectedNode}
    @click-node=${(event: CustomEvent) => {
      console.log(event.detail);
    }}
  >
  </pipeline-graph>
  `;
}

Example.args = {
  stages: [
    {
      "name": "SUCCESS",
      "children": [],
      "state": "SUCCESS",
      "completePercent": 50,
      "id": 1587,
      "type": "STAGE"
    }, 
    {
      "name": "",
      "children": [
        {
          "name": "QUEUED",
          "children": [],
          "state": "QUEUED",
          "completePercent": 50,
          "id": 1589,
          "type": "PARALLEL",
        }, 
        {
          "name": "UNSTABLE",
          "children": [],
          "state": "UNSTABLE",
          "completePercent": 50,
          "id": 1590,
          "type": "PARALLEL",
        },
        {
          "name": "ABORTED",
          "children": [],
          "state": "ABORTED",
          "completePercent": 50,
          "id": 15923,
          "type": "PARALLEL",
        },
      ],
      "state": "ABORTED",
      "completePercent": 50,
      "id": 1588,
      "type": "STAGE"
    },
    {
      "name": "PAUSED",
      "children": [],
      "state": "PAUSED",
      "completePercent": 50,
      "id": 1595,
      "type": "STAGE"
    }, 
    {
      "name": "SKIPPED",
      "children": [],
      "state": "skipped",
      "completePercent": 50,
      "id": 1596,
      "type": "STAGE"
    }, 
    {
      "name": "",
      "children": [
        {
          "name": "RUNNING",
          "children": [],
          "state": "RUNNING",
          "completePercent": 50,
          "id": 1598,
          "type": "PARALLEL",
        }, 
        {
          "name": "NOT_BUILT",
          "children": [],
          "state": "NOT_BUILT",
          "completePercent": 50,
          "id": 1599,
          "type": "PARALLEL"
        },
        {
          "name": "FAILURE",
          "children": [],
          "state": "FAILURE",
          "completePercent": 50,
          "id": 159932,
          "type": "PARALLEL"
        },
      ],
      "state": "SKIPPED",
      "completePercent": 50,
      "id": 1597,
      "type": "STAGE"
    }, 
    {
      "name": "UNKNOWN",
      "children": [],
      "state": "UNKNOWN",
      "completePercent": 50,
      "id": 1600,
      "type": "STAGE"
    }
  ],
  layout: {
    nodeSpacingH: 120,
    parallelSpacingH: 120,
    nodeSpacingV: 70,
    nodeRadius: 12,
    terminalRadius: 7,
    curveRadius: 12,
    connectorStrokeWidth: 2,
    labelOffsetV: 20,
    smallLabelOffsetV: 15,
    ypStart: 55,
  },
  selectedNode: {
    "name": "SUCCESS",
    "children": [],
    "state": "SUCCESS",
    "completePercent": 50,
    "id": 1587,
    "type": "STAGE"
  },
};