import { html, css, LitElement, svg, } from 'lit-element';
import { spread } from '@open-wc/lit-helpers';

import { nodeStrokeWidth, getGroupForResult } from './support/StatusIcons';
import './support/truncating-label';
import {
	CompositeConnection,
	decodeResultValue,
	defaultLayout,
	NodeLabelInfo,
	LayoutInfo,
	NodeColumn,
	NodeInfo,
	StageInfo,
	StageNodeInfo,
	Result,
} from './PipelineGraphModel';
import { layoutGraph, sequentialStagesLabelOffset } from './PipelineGraphLayout';

// import MainStyle from './styles/main.css';
import { styleMap } from 'lit-html/directives/style-map';

type SVGChildren = Array<any>;

interface Props {
	stages: Array<StageInfo>;
	layout?: Partial<LayoutInfo>;
	selectedStage?: StageInfo;
}

interface State {
	nodeColumns: Array<NodeColumn>;
	connections: Array<CompositeConnection>;
	bigLabels: Array<NodeLabelInfo>;
	smallLabels: Array<NodeLabelInfo>;
	branchLabels: Array<NodeLabelInfo>;
	measuredWidth: number;
	measuredHeight: number;
	layout: LayoutInfo;
	selectedStage?: StageInfo;
}

function connectorKey(leftNode: NodeInfo, rightNode: NodeInfo) {
	return 'c_' + leftNode.key + '_to_' + rightNode.key;
}

export class PipelineGraph extends LitElement {    
	// # Properties
	static get properties() {
		return {
			stages: { type: Array, },
			layout: { type: Object },
			selectedStage: { type: Object, },
		}
	}

	stages: StageInfo[] = [];
	layout: LayoutInfo = {
		nodeSpacingH: 120,
		parallelSpacingH: 120,
		nodeSpacingV: 70,
		nodeRadius: 12,
		terminalRadius: 7,
		curveRadius: 12,
		connectorStrokeWidth: 3,
		labelOffsetV: 20,
		smallLabelOffsetV: 15,
		ypStart: 55,
	};
	selectedStage: StageInfo = {
		"name": "Init",
		"children": [],
		"state": "success" as Result.success,
		"completePercent": 50,
		"id": 1587,
		"type": "STAGE",
		"title": "Init Title"
	};

	// # Data
	nodeColumns: Array<NodeColumn> =  [];
	connections: Array<CompositeConnection> = [];
	bigLabels: Array<NodeLabelInfo> = [];
	smallLabels: Array<NodeLabelInfo> = [];
	branchLabels: Array<NodeLabelInfo> = [];
	measuredWidth = 0;
	measuredHeight = 0;

	// # Lifecycle
	connectedCallback() {
		this.stagesUpdated(this.stages);

		super.connectedCallback();
	}  

	update(changedProperties: Map<string, any>) {
		// beforeUpdate
		let newState;
		let needsLayout = false;
		if (this.layout != changedProperties.get('layout')) {
			newState = Object.assign({}, newState, {layout: Object.assign({}, defaultLayout, this.layout)});
			needsLayout = true;
		}
		if (this.selectedStage !== changedProperties.get('selectedStage')) {
			newState = Object.assign({}, newState, {selectedStage: this.selectedStage});
		}
		if (this.stages !== changedProperties.get('stages')) {
			needsLayout = true;
		}
		const doLayoutIfNeeded = () => {
			if (needsLayout) {
				this.stagesUpdated(this.stages);
			}
		};
		if (newState) {
			doLayoutIfNeeded();
		} else {
			doLayoutIfNeeded();
		}

		super.update(changedProperties);
		// afterUpdate
	}

	// # Methods
	private stagesUpdated(newStages: Array<StageInfo> = []) {
		let ttp = layoutGraph(newStages, this.layout);
		this.nodeColumns = ttp.nodeColumns;
		this.connections = ttp.connections;
		this.bigLabels = ttp.bigLabels;
		this.smallLabels = ttp.smallLabels;
		this.branchLabels = ttp.branchLabels;
		this.measuredWidth = ttp.measuredWidth;
		this.measuredHeight = ttp.measuredHeight;
	}

	private renderBigLabel(details: NodeLabelInfo) {
		const { nodeSpacingH, labelOffsetV, connectorStrokeWidth, ypStart } = this.layout;

		const labelWidth = nodeSpacingH - connectorStrokeWidth * 2;
		const labelHeight = ypStart - labelOffsetV;
		const labelOffsetH = Math.floor(labelWidth / -2);

		const bigLabelStyle = {
			position: 'absolute',
			width: labelWidth + 'px',
			maxHeight: labelHeight + 'px',
			textAlign: 'center',
			marginLeft: labelOffsetH + 'px',
		};

		const x = details.x;
		const bottom = this.measuredHeight - details.y + labelOffsetV;

		const style = {
			bottom: bottom + 'px',
			left: x + 'px',
			...bigLabelStyle,
		};

		const classNames = ['PWGx-pipeline-big-label'];
		if (this.stageIsSelected(details.stage) || this.stageChildIsSelected(details.stage)) {
			classNames.push('selected');
		}		
		return html`
			<truncating-label 
				class="${classNames.join(' ')}" 
				style=${styleMap(style as any)} 
				.key="${details.key}"
			>
				${details.text}
			</truncating-label>
		`;
	}

	private renderSmallLabel(details: NodeLabelInfo) {
		const { nodeSpacingH, nodeSpacingV, curveRadius, connectorStrokeWidth, nodeRadius, smallLabelOffsetV } = this.layout;

		const smallLabelWidth = Math.floor(nodeSpacingH - 2 * curveRadius - 2 * connectorStrokeWidth);
		const smallLabelHeight = Math.floor(nodeSpacingV - smallLabelOffsetV - nodeRadius - nodeStrokeWidth);
		const smallLabelOffsetH = Math.floor(smallLabelWidth * -0.5);

		const x = details.x + smallLabelOffsetH;
		const top = details.y + smallLabelOffsetV;

		const style = {
			top: top + `px`,
			left: x + `px`,
			position: 'absolute',
			width: smallLabelWidth + `px`,
			maxHeight: smallLabelHeight + `px`,
			textAlign: 'center',
		};

		const classNames = ['PWGx-pipeline-small-label'];
		if (details.stage && this.stageIsSelected(details.stage)) {
			classNames.push('selected');
		}

		return html`
			<truncatin-label class="${classNames.join(' ')}" style=${styleMap(style as any)} .key="${details.key}">
				${details.text}
			</truncatin-label>
		`;
	}

	private renderSequentialContainerLabel(details: NodeLabelInfo) {
		const { nodeRadius } = this.layout;

		const seqContainerName = details.text;
		const y = details.y;
		const x = details.x - Math.floor(nodeRadius * 2);

		const containerStyle: any = {
			top: y,
			left: x,
			marginTop: '-0.5em',
			position: 'absolute',
			maxWidth: sequentialStagesLabelOffset,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			background: 'white',
			padding: '0 7px',
			lineHeight: '1',
			whiteSpace: 'nowrap',
		};

		return html`
			<div style=${styleMap(containerStyle)} key="${details.key}" title="${seqContainerName}">
				${seqContainerName}
			</div>
		`;
	}

	private renderCompositeConnection(connection: CompositeConnection, svgElements: SVGChildren) {
		const { sourceNodes, destinationNodes, skippedNodes, hasBranchLabels } = connection;

		if (skippedNodes.length === 0) {
				this.renderBasicConnections(sourceNodes, destinationNodes, svgElements, hasBranchLabels);
		} else {
				this.renderSkippingConnections(sourceNodes, destinationNodes, skippedNodes, svgElements, hasBranchLabels);
		}
	}

	private renderBasicConnections(sourceNodes: Array<NodeInfo>, destinationNodes: Array<NodeInfo>, svgElements: SVGChildren, hasBranchLabels: boolean) {
		const { connectorStrokeWidth, nodeSpacingH } = this.layout;
		const halfSpacingH = nodeSpacingH / 2;

		// Stroke props common to straight / curved connections
		const connectorStroke = {
			class: 'PWGx-pipeline-connector',
			strokeWidth: connectorStrokeWidth,
		};

		this.renderHorizontalConnection(sourceNodes[0], destinationNodes[0], connectorStroke, svgElements);

		if (sourceNodes.length === 1 && destinationNodes.length === 1) {
			return; // No curves needed.
		}

		// Work out the extents of source and dest space
		let rightmostSource = sourceNodes[0].x;
		let leftmostDestination = destinationNodes[0].x;

		for (let i = 1; i < sourceNodes.length; i++) {
			rightmostSource = Math.max(rightmostSource, sourceNodes[i].x);
		}

		for (let i = 1; i < destinationNodes.length; i++) {
			leftmostDestination = Math.min(leftmostDestination, destinationNodes[i].x);
		}

		// Collapse from previous node(s) to top column node
		const collapseMidPointX = Math.round(rightmostSource + halfSpacingH);
		for (const previousNode of sourceNodes.slice(1)) {
			this.renderBasicCurvedConnection(previousNode, destinationNodes[0], collapseMidPointX, svgElements);
		}

		// Expand from top previous node to column node(s)
		let expandMidPointX = Math.round(leftmostDestination - halfSpacingH);

		if (hasBranchLabels) {
				// Shift curve midpoint so that there's room for the labels
				expandMidPointX -= sequentialStagesLabelOffset;
		}

		for (const destNode of destinationNodes.slice(1)) {
			this.renderBasicCurvedConnection(sourceNodes[0], destNode, expandMidPointX, svgElements);
		}
	}

	private renderSkippingConnections(
		sourceNodes: Array<NodeInfo>,
		destinationNodes: Array<NodeInfo>,
		skippedNodes: Array<NodeInfo>,
		svgElements: SVGChildren,
		hasBranchLabels: boolean
	) {
		const { connectorStrokeWidth, nodeRadius, terminalRadius, curveRadius, nodeSpacingV, nodeSpacingH } = this.layout;

		const halfSpacingH = nodeSpacingH / 2;

		// Stroke props common to straight / curved connections
		const connectorStroke = {
			class: 'PWGx-pipeline-connector',
			strokeWidth: connectorStrokeWidth,
		};

		const skipConnectorStroke = {
			className: 'PWGx-pipeline-connector-skipped',
			strokeWidth: connectorStrokeWidth,
		};

		const lastSkippedNode = skippedNodes[skippedNodes.length - 1];
		let leftNode, rightNode;

		//--------------------------------------------------------------------------
		//  Draw the "ghost" connections to/from/between skipped nodes

		leftNode = sourceNodes[0];
		for (rightNode of skippedNodes) {
			this.renderHorizontalConnection(leftNode, rightNode, skipConnectorStroke, svgElements);
			leftNode = rightNode;
		}
		this.renderHorizontalConnection(leftNode, destinationNodes[0], skipConnectorStroke, svgElements);

		//--------------------------------------------------------------------------
		//  Work out the extents of source and dest space

		let rightmostSource = sourceNodes[0].x;
		let leftmostDestination = destinationNodes[0].x;

		for (let i = 1; i < sourceNodes.length; i++) {
			rightmostSource = Math.max(rightmostSource, sourceNodes[i].x);
		}

		for (let i = 1; i < destinationNodes.length; i++) {
			leftmostDestination = Math.min(leftmostDestination, destinationNodes[i].x);
		}

		//--------------------------------------------------------------------------
		//  "Collapse" from the source node(s) down toward the first skipped

		leftNode = sourceNodes[0];
		rightNode = skippedNodes[0];

		for (leftNode of sourceNodes.slice(1)) {
			const midPointX = Math.round(rightmostSource + halfSpacingH);
			const leftNodeRadius = leftNode.isPlaceholder ? terminalRadius : nodeRadius;
			const key = connectorKey(leftNode, rightNode);

			const x1 = leftNode.x + leftNodeRadius - nodeStrokeWidth / 2;
			const y1 = leftNode.y;
			const x2 = midPointX;
			const y2 = rightNode.y;

			const pathData = `M ${x1} ${y1}` + this.svgBranchCurve(x1, y1, x2, y2, midPointX, curveRadius);

			svgElements.push(svg`
			<path ...=${spread(connectorStroke)} key="${key}" d="${pathData}" fill="none" />`);
		}

		//--------------------------------------------------------------------------
		//  "Expand" from the last skipped node toward the destination nodes

		leftNode = lastSkippedNode;

		let expandMidPointX = Math.round(leftmostDestination - halfSpacingH);

		if (hasBranchLabels) {
				// Shift curve midpoint so that there's room for the labels
				expandMidPointX -= sequentialStagesLabelOffset;
		}

		for (rightNode of destinationNodes.slice(1)) {
				const rightNodeRadius = rightNode.isPlaceholder ? terminalRadius : nodeRadius;
				const key = connectorKey(leftNode, rightNode);

				const x1 = expandMidPointX;
				const y1 = leftNode.y;
				const x2 = rightNode.x - rightNodeRadius + nodeStrokeWidth / 2;
				const y2 = rightNode.y;

				const pathData = `M ${x1} ${y1}` + this.svgBranchCurve(x1, y1, x2, y2, expandMidPointX, curveRadius);

				svgElements.push(svg`<path ...=${spread(connectorStroke)} key="${key}" d="${pathData}" fill="none" />`);
		}

		//--------------------------------------------------------------------------
		//  "Main" curve from top of source nodes, around skipped nodes, to top of dest nodes

		leftNode = sourceNodes[0];
		rightNode = destinationNodes[0];

		const leftNodeRadius = leftNode.isPlaceholder ? terminalRadius : nodeRadius;
		const rightNodeRadius = rightNode.isPlaceholder ? terminalRadius : nodeRadius;
		const key = connectorKey(leftNode, rightNode);

		const skipHeight = nodeSpacingV * 0.5;
		const controlOffsetUpper = curveRadius * 1.54;
		const controlOffsetLower = skipHeight * 0.257;
		const controlOffsetMid = skipHeight * 0.2;
		const inflectiontOffset = Math.round(skipHeight * 0.7071); // cos(45º)-ish

		// Start point
		const p1x = leftNode.x + leftNodeRadius - nodeStrokeWidth / 2;
		const p1y = leftNode.y;

		// Begin curve down point
		const p2x = Math.round(skippedNodes[0].x - halfSpacingH);
		const p2y = p1y;
		const c1x = p2x + controlOffsetUpper;
		const c1y = p2y;

		// End curve down point
		const p4x = skippedNodes[0].x;
		const p4y = p1y + skipHeight;
		const c4x = p4x - controlOffsetLower;
		const c4y = p4y;

		// Curve down midpoint / inflection
		const p3x = skippedNodes[0].x - inflectiontOffset;
		const p3y = skippedNodes[0].y + inflectiontOffset;
		const c2x = p3x - controlOffsetMid;
		const c2y = p3y - controlOffsetMid;
		const c3x = p3x + controlOffsetMid;
		const c3y = p3y + controlOffsetMid;

		// Begin curve up point
		const p5x = lastSkippedNode.x;
		const p5y = p4y;
		const c5x = p5x + controlOffsetLower;
		const c5y = p5y;

		// End curve up point
		const p7x = Math.round(lastSkippedNode.x + halfSpacingH);
		const p7y = rightNode.y;
		const c8x = p7x - controlOffsetUpper;
		const c8y = p7y;

		// Curve up midpoint / inflection
		const p6x = lastSkippedNode.x + inflectiontOffset;
		const p6y = lastSkippedNode.y + inflectiontOffset;
		const c6x = p6x - controlOffsetMid;
		const c6y = p6y + controlOffsetMid;
		const c7x = p6x + controlOffsetMid;
		const c7y = p6y - controlOffsetMid;

		// End point
		const p8x = rightNode.x - rightNodeRadius + nodeStrokeWidth / 2;
		const p8y = rightNode.y;

		const pathData =
				`M ${p1x} ${p1y}` +
				`L ${p2x} ${p2y}` + // 1st horizontal
				`C ${c1x} ${c1y} ${c2x} ${c2y} ${p3x} ${p3y}` + // Curve down (upper)
				`C ${c3x} ${c3y} ${c4x} ${c4y} ${p4x} ${p4y}` + // Curve down (lower)
				`L ${p5x} ${p5y}` + // 2nd horizontal
				`C ${c5x} ${c5y} ${c6x} ${c6y} ${p6x} ${p6y}` + // Curve up (lower)
				`C ${c7x} ${c7y} ${c8x} ${c8y} ${p7x} ${p7y}` + // Curve up (upper)
				`L ${p8x} ${p8y}` + // Last horizontal
				'';

		svgElements.push(svg`<path ...=${spread(connectorStroke)} key="${key}" d="${pathData}" fill="none" />`);
	}

	private renderHorizontalConnection(leftNode: NodeInfo, rightNode: NodeInfo, connectorStroke: Object, svgElements: SVGChildren) {
		const { nodeRadius, terminalRadius } = this.layout;
		const leftNodeRadius = leftNode.isPlaceholder ? terminalRadius : nodeRadius;
		const rightNodeRadius = rightNode.isPlaceholder ? terminalRadius : nodeRadius;

		const key = connectorKey(leftNode, rightNode);

		const x1 = leftNode.x + leftNodeRadius - nodeStrokeWidth / 2;
		const x2 = rightNode.x - rightNodeRadius + nodeStrokeWidth / 2;
		const y = leftNode.y;

		svgElements.push(svg`<line ...=${spread(connectorStroke)} key="${key}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />`);
	}

	private renderBasicCurvedConnection(leftNode: NodeInfo, rightNode: NodeInfo, midPointX: number, svgElements: SVGChildren) {
		const { nodeRadius, terminalRadius, curveRadius, connectorStrokeWidth } = this.layout;
		const leftNodeRadius = leftNode.isPlaceholder ? terminalRadius : nodeRadius;
		const rightNodeRadius = rightNode.isPlaceholder ? terminalRadius : nodeRadius;

		const key = connectorKey(leftNode, rightNode);

		const leftPos = {
				x: leftNode.x + leftNodeRadius - nodeStrokeWidth / 2,
				y: leftNode.y,
		};

		const rightPos = {
				x: rightNode.x - rightNodeRadius + nodeStrokeWidth / 2,
				y: rightNode.y,
		};

		// Stroke props common to straight / curved connections
		const connectorStroke = {
			class: 'PWGx-pipeline-connector',
			strokeWidth: connectorStrokeWidth,
		};

		const pathData = `M ${leftPos.x} ${leftPos.y}` + this.svgBranchCurve(leftPos.x, leftPos.y, rightPos.x, rightPos.y, midPointX, curveRadius);

		svgElements.push(svg`<path ...=${spread(connectorStroke)} key="${key}" d="${pathData}" fill="none" />`);
	}

	private svgBranchCurve(x1: number, y1: number, x2: number, y2: number, midPointX: number, curveRadius: number) {
		const verticalDirection = Math.sign(y2 - y1); // 1 == curve down, -1 == curve up
		const w1 = midPointX - curveRadius - x1 + curveRadius * verticalDirection;
		const w2 = x2 - curveRadius - midPointX - curveRadius * verticalDirection;
		const v = y2 - y1 - 2 * curveRadius * verticalDirection; // Will be -ive if curve up
		const cv = verticalDirection * curveRadius;

		return (
			` l ${w1} 0` + // first horizontal line
			` c ${curveRadius} 0 ${curveRadius} ${cv} ${curveRadius} ${cv}` + // turn
			` l 0 ${v}` + // vertical line
			` c 0 ${cv} ${curveRadius} ${cv} ${curveRadius} ${cv}` + // turn again
			` l ${w2} 0` // second horizontal line
		);
	}

	private renderNode(node: NodeInfo, svgElements: SVGChildren) {
		let nodeIsSelected = false;
		const { nodeRadius, connectorStrokeWidth, terminalRadius } = this.layout;
		const key = node.key;

		const groupChildren: SVGChildren = [];

		if (node.isPlaceholder === true) {
			groupChildren.push(svg`<circle r="${terminalRadius}" class="PWGx-pipeline-node-terminal" />`);
		} else {
			const { completePercent = 0, title, state } = node.stage;
			const resultClean = decodeResultValue(state);

			groupChildren.push(getGroupForResult(resultClean, completePercent, nodeRadius));

			if (title) {
					groupChildren.push(html`<title>${title}</title>`);
			}

			nodeIsSelected = this.stageIsSelected(node.stage);
		}

		// Set click listener and link cursor only for nodes we want to be clickable
		const clickableProps: any = {};

		if (node.isPlaceholder === false && node.stage.state !== 'skipped') {
			clickableProps.cursor = 'pointer';
			// clickableProps.onClick = () => this.nodeClicked(node);
		}

		// Add an invisible click/touch/mouseover target, coz the nodes are small and (more importantly)
		// many are hollow.
		groupChildren.push(svg`
			<circle 
				r="${nodeRadius + 2 * connectorStrokeWidth}" 
				class="PWGx-pipeline-node-hittarget" 
				fill-opacity="0" 
				stroke="none" 
				...=${spread(clickableProps)}
				@click=${() => this.nodeClicked(node)}
			/>
		`);

		// Most of the nodes are in shared code, so they're rendered at 0,0. We transform with a <g> to position them
		const groupProps = {
			key,
			transform: `translate(${node.x},${node.y})`,
			class: nodeIsSelected ? 'PWGx-pipeline-node-selected' : 'PWGx-pipeline-node',
		};

		svgElements.push(svg`
		<g ...=${spread(groupProps)}>
			${groupChildren.map(el => el)}
		</g>`);
	}

	private renderSelectionHighlight(svgElements: SVGChildren) {
		const { nodeRadius, connectorStrokeWidth } = this.layout;
		const highlightRadius = Math.ceil(nodeRadius + 0.5 * connectorStrokeWidth + 1);
		let selectedNode: NodeInfo | undefined;

		columnLoop: for (const column of this.nodeColumns) {
				for (const row of column.rows) {
						for (const node of row) {
								if (node.isPlaceholder === false && this.stageIsSelected(node.stage)) {
										selectedNode = node;
										break columnLoop;
								}
						}
				}
		}

		if (selectedNode) {
				const transform = `translate(${selectedNode.x} ${selectedNode.y})`;

				svgElements.push(svg`
					<g class="PWGx-pipeline-selection-highlight" transform=${transform} key="selection-highlight">
							<circle r="${highlightRadius}" stroke-width="${connectorStrokeWidth}" />
					</g>
				`);
		}
	}

	private stageIsSelected(stage?: StageInfo): boolean {
		const { selectedStage } = this;
		return (selectedStage && stage && selectedStage.id === stage.id) || false;
	}

	private stageChildIsSelected(stage?: StageInfo) {
		if (stage) {
				const { children } = stage;
				const { selectedStage } = this;

				if (children && selectedStage) {
						for (const childStage of children) {
								let currentStage: StageInfo | undefined = childStage;

								while (currentStage) {
										if (currentStage.id === selectedStage.id) {
												return true;
										}
										currentStage = currentStage.nextSibling;
								}
						}
				}
		}

		return false;
	}

	// Event
	private nodeClicked(node: NodeInfo) {
		if (node.isPlaceholder === false && node.stage.state !== 'skipped') {
				const stage = node.stage;
				const listener = this.dispatchEvent(new CustomEvent(`click-node`, {
					detail: {
						name: stage.name,
						id: stage.id,
					}
				}));

				if (listener) {
					// listener(stage.name, stage.id);
				}

				// Update selection
				// this.setState({ selectedStage: stage });
				this.selectedStage = stage;
		}
	}

	// # Render
	render() {
		const { nodeColumns, connections, bigLabels, smallLabels, branchLabels, measuredWidth, measuredHeight } = this;

		const outerDivStyle = {
			position: 'relative',
			overflow: 'visible',
		};

		const svgElements: SVGChildren = [];

		connections.forEach(connection => {
			this.renderCompositeConnection(connection, svgElements);
		});

		this.renderSelectionHighlight(svgElements);

		for (const column of nodeColumns) {
			for (const row of column.rows) {
				for (const node of row) {
					this.renderNode(node, svgElements);
				}
			}
		}

		return html`
		<div class="PWGx-PipelineGraph-container">
			<div style=${styleMap(outerDivStyle as any)} class="PWGx-PipelineGraph">
				<svg width="${measuredWidth}" height="${measuredHeight}">
					${svgElements.map(svg => svg)}
				</svg>
				
				${bigLabels.map(label => this.renderBigLabel(label))}
				${smallLabels.map(label => this.renderSmallLabel(label))}
				${branchLabels.map(label => this.renderSequentialContainerLabel(label))}
			</div>
		</div>
		`;
	}  

	// # Styles
	static styles = [
		css`
		:host {
			display: flex;
		}`,
		css`
		.PWGx-PipelineGraph-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			overflow-x: auto;
			margin-bottom: 16px; }
			.PWGx-PipelineGraph-container * {
				box-sizing: border-box; }
			.PWGx-PipelineGraph-container .PWGx-PipelineGraph {
				margin-left: auto;
				margin-right: auto; }
		
		circle.halo {
			stroke: white;
			fill: none; }
		
		.PWGx-svgResultStatusOutline {
			stroke: #949393;
			fill: none; }
		
		.PWGx-result-status-glyph {
			stroke: none;
			fill: #fff; }
		
		.PWGx-svgResultStatusSolid {
			transform: translateZ(0); }
			.PWGx-svgResultStatusSolid > circle.statusColor.success {
				fill: #8cc04f; }
			.PWGx-svgResultStatusSolid > circle.statusColor.failure {
				fill: #d54c53; }
			.PWGx-svgResultStatusSolid > circle.statusColor.unstable {
				fill: #f6b44b; }
			.PWGx-svgResultStatusSolid > circle.statusColor.aborted {
				fill: #949393; }
			.PWGx-svgResultStatusSolid > circle.statusColor.paused {
				fill: #24b0d5; }
			.PWGx-svgResultStatusSolid > circle.statusColor.unknown {
				fill: #d54cc4; }
			.pipeline-node-selected .PWGx-svgResultStatusSolid > circle.statusColor {
				stroke: none; }
		
		.PWGx-progress-spinner.running circle.statusColor {
			fill: none;
			stroke: #a7c7f2; }
		
		.PWGx-progress-spinner.running path {
			fill: none;
			stroke: #1d7dcf; }
		
		.PWGx-progress-spinner.pc-over-100 circle.statusColor {
			fill: none;
			stroke: #1d7dcf; }
		
		.PWGx-progress-spinner.pc-over-100 path {
			fill: none;
			stroke: #f6b44b; }
		
		.PWGx-progress-spinner.running.spin {
			animation: progress-spinner-rotate 4s linear;
			animation-iteration-count: infinite; }
		
		@keyframes progress-spinner-rotate {
			0% {
				transform: rotate(0deg); }
			100% {
				transform: rotate(360deg); } }
		
		.PWGx-progress-spinner circle.inner,
		.PWGx-progress-spinner.running.spin circle.inner {
			display: none;
			animation: progress-spinner-pulsate 1.2s ease-out;
			animation-iteration-count: infinite;
			opacity: 0; }
		
		.PWGx-progress-spinner.running circle.inner {
			display: block;
			fill: #1d7dcf;
			stroke: #1d7dcf; }
		
		@keyframes progress-spinner-pulsate {
			0% {
				transform: scale(0.1, 0.1);
				opacity: 0; }
			50% {
				opacity: 1; }
			100% {
				transform: scale(1.2, 1.2);
				opacity: 0; } }
		
		.PWGx-progress-spinner.queued circle.statusColor {
			fill: none;
			stroke: #949393; }
		
		.PWGx-progress-spinner.queued circle.statusColor.inner {
			display: block;
			fill: #949393;
			stroke: #949393; }
		
		.PWGx-progress-spinner.queued path {
			fill: none;
			stroke: none; }
		
		.PWGx-pipeline-connector {
			stroke: #949393; }
		
		.PWGx-pipeline-node-terminal {
			fill: #949393; }
		
		.PWGx-pipeline-connector-skipped {
			stroke: #949393;
			stroke-opacity: 0.25; }
		
		.PWGx-pipeline-small-label {
			font-size: 80%; }
		
		.PWGx-pipeline-big-label.selected {
			font-weight: bold; }
		
		.PWGx-pipeline-small-label.selected {
			font-weight: bold;
			margin-top: 3px; }
		
		.PWGx-pipeline-selection-highlight circle {
			fill: none;
			stroke: #4a90e2; }
		`,
	];
	
	styleTemplate() {
		return html`
		<style>
		</style>
		`;
	}
}
