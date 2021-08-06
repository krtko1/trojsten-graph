import {Graph, GraphEdge, GraphNode} from "./Graph";
import {ZoomTransform} from "d3";

export class GraphRenderer {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.context = canvas.getContext("2d") as CanvasRenderingContext2D
    }

    renderNode = (node: GraphNode) => {
        this.context.beginPath();
        this.context.arc(node.displayX, node.displayY, 10, 0, 2 * Math.PI, true);
        this.context.fillStyle = '#666';
        this.context.fill();

        this.context.fillStyle = "#FFF";
        this.context.fillText(
            node.person.nickname,
            node.displayX - this.context.measureText(node.person.nickname).width / 2,
            node.displayY - 8
        );
    }

    renderEdge = (edge: GraphEdge) => {
        this.context.beginPath();
        this.context.lineWidth = 3;
        this.context.strokeStyle = "#FFF";
        const source = edge.source as GraphNode
        const target = edge.target as GraphNode
        this.context.moveTo(source.displayX, source.displayY);
        this.context.lineTo(target.displayX, target.displayY);
        this.context.stroke();
    };

    renderGraph = (graph: Graph, transform: ZoomTransform) => {
        this.context.save();
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.translate(transform.x, transform.y);
        this.context.scale(transform.k, transform.k);

        graph.edges.forEach((edge) => {
            this.renderEdge(edge);
        });

        this.context.font = "normal normal bold 12px sans-serif";
        graph.nodes.forEach((node) => {
            this.renderNode(node);
        });

        this.context.restore();
    }
}
