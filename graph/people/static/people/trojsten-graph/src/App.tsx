import React, {createRef} from 'react';
import {Person, Relationship} from "./datatypes";
import {GraphSimulation} from "./GraphSimulation";
import {Graph} from "./Graph";
import {GraphRenderer} from "./GraphRenderer";
import {ZoomTransform} from "d3";

type GraphProps = {}

type GraphState = {
    width: number,
    height: number,
    allPeople: Array<Person>,
    allRelationships: Array<Relationship>
}

class App extends React.Component<GraphProps, GraphState> {
    private canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: GraphProps) {
        super(props);
        this.state = {
            width: window.innerWidth,
            height: window.innerHeight,
            allPeople: [],
            allRelationships: []
        };
        this.canvasRef = createRef()
    }

    componentDidMount() {
        window.addEventListener('resize', () => {
            this.setState({
                width: window.innerWidth,
                height: window.innerHeight
            })
        });

        Promise.all([
            fetch("/people/")
                .then(resp => {
                    if (!resp.ok) {
                        throw new Error("Something went wrong with fetching people")
                    }
                    return resp.json()
                })
                .then((result) => {
                    this.setState({allPeople: result})
                    return result
                })
                .catch(error => { console.log(error) }),
            fetch("/relationships/")
                .then(resp => {
                    if (!resp.ok) {
                        throw new Error("Something went wrong with fetching relationships")
                    }
                    return resp.json()
                })
                .then((result) => {
                    this.setState({allPeople: result})
                    return result
                })
                .catch(error => { console.log(error) }),
        ]).then(([people, relationships]) => {
            const graph = new Graph(people, relationships)
            const rendered = new GraphRenderer(this.canvasRef.current as HTMLCanvasElement)
            const simulation = new GraphSimulation(
                this.canvasRef.current as HTMLCanvasElement,
                (graph: Graph, transform: ZoomTransform) => {
                    rendered.renderGraph(graph, transform)
                }
            )
            simulation.setData(graph)
        })
    }

    render() {
        return (
            <div>
                <div>
                    <canvas ref={this.canvasRef} width={this.state.width} height={this.state.height}>

                    </canvas>
                </div>
            </div>
        );
    }
}

export default App;
