import * as d3 from "d3";
import {ForceLink, Simulation, ZoomTransform} from "d3";
import {Graph, GraphEdge, GraphNode} from "./Graph";

export class GraphSimulation {
    private canvas: HTMLCanvasElement;
    private simulation: Simulation<GraphNode, GraphEdge>;
    public transformation: ZoomTransform;
    private graph: Graph;
    private updateCallback: (graph: Graph, transform: ZoomTransform) => void;

    constructor(canvas: HTMLCanvasElement, updateCallback: (graph: Graph, transform: ZoomTransform) => void) {
        this.canvas = canvas
        this.updateCallback = updateCallback

        this.graph = new Graph([], [])

        this.simulation = d3.forceSimulation<GraphNode, GraphEdge>()
            .force("center", d3.forceCenter(this.canvas.width / 2, this.canvas.height / 2))
            .force("collide", d3.forceCollide())
            .force("x", d3.forceX(this.canvas.width / 2).strength(0.04))
            .force("y", d3.forceY(this.canvas.height / 2).strength(0.04))
            .force("charge", d3.forceManyBody<GraphNode>().strength(-300))
            .force("link", d3.forceLink<GraphNode, GraphEdge>().strength(0.2).id(node => node.id))

        const dragBehaviour = d3.drag()
            .subject(this.dragSubject)
            .on("start", this.dragStarted)
            .on("drag", this.dragged)
            .on("end", this.dragEnded)

        const zoomBehaviour = d3.zoom().scaleExtent([1 / 10, 8])
            .on("zoom", ({transform}) => {
                this.transformation = transform
                this.update()
            })

        // @ts-ignore
        d3.select(canvas).call(dragBehaviour).call(zoomBehaviour)

        this.transformation = d3.zoomIdentity
        this.simulation.on("tick", this.update)
    }

    update = () => {
        this.graph.nodes.forEach(node => {
            node.displayX = ~~(node.x || 0)
            node.displayY = ~~(node.y || 0)
        })
        this.updateCallback(this.graph, this.transformation)
    }

    setData = (graph: Graph) => {
        this.graph = graph

        this.simulation.nodes(this.graph.nodes);
        (this.simulation.force("link") as ForceLink<GraphNode, GraphEdge>).links(this.graph.edges)
        this.simulation.alphaTarget(0.3).alphaDecay(0.05).restart();
    }

    nodeOnMousePosition = (mouseX: number, mouseY: number) => {
        let dx, dy, x = this.transformation.invertX(mouseX), y = this.transformation.invertY(mouseY);
        for (const node of this.graph.nodes) {
            // @ts-ignore
            dx = x - node.x;
            // @ts-ignore
            dy = y - node.y;
            if (dx * dx + dy * dy < 100) {
                return node
            }
        }
        return null
    };

    dragSubject = (event: d3.D3DragEvent<any, any, any>, d: any) => {
        const node = this.nodeOnMousePosition(event.x, event.y);
        if (node !== null) {
            // @ts-ignore
            node.x = this.transformation.applyX(node.x);
            // @ts-ignore
            node.y = this.transformation.applyY(node.y);
            return node
        }
    }

    dragStarted = (event: d3.D3DragEvent<any, any, any>, d: any) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart()
        event.subject.fx = this.transformation.invertX(event.x)
        event.subject.fy = this.transformation.invertY(event.y)
    }

    dragged = (event: d3.D3DragEvent<any, any, any>, d: any) => {
        event.subject.fx = this.transformation.invertX(event.x)
        event.subject.fy = this.transformation.invertY(event.y)
    }

    dragEnded = (event: d3.D3DragEvent<any, any, any>, d: any) => {
        if (!event.active) this.simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
    }
}
