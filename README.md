# pipeline-graph-webcomponent

> [pipeline-graph](https://github.com/jenkinsci/ux-widget-framework/tree/master/packages/pipeline-graph) for web-component without framework.

![image-20210114142514993](https://i.loli.net/2021/01/14/3f62nTbYP8J1iQS.png)

## Installation

```bash
npm i pipeline-graph-webcomponent
```

## Local Demo

```bash
git clone https://github.com/taeuk-gang/pipeline-graph-webcomponent.git

npm i

npm start
```

To run a local development server that serves the basic demo located in `demo/index.html`

## Usage

```typescript
import 'pipeline-graph-webcomponent';

const stage = [
  {
    "name": "Stage-1",
    "children": [],
    "state": "SUCCESS",
    "completePercent": 100,
    "id": 1,
    "type": "STAGE"
  }
];
const layout = {
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
};
const selectedNode = {
  "name": "Stage-1",
  "children": [],
  "state": "SUCCESS",
  "completePercent": 100,
  "id": 1,
  "type": "STAGE"
}
```

```html
<pipeline-graph
  .stage=${stage}
  .layout=${layout}
  .selectNode=${selectNode}
  @click-node=${(event) => alert(event.detail.name)}
></pipeline-graph>
```
