import {Person, Relationship} from "./datatypes";
import {SimulationLinkDatum, SimulationNodeDatum} from "d3";
import {EdgeFilter, NodeFilter} from "./GraphFilters";

export type GraphNode = SimulationNodeDatum & {
    id: number,
    person: Person,
    displayX: number,
    displayY: number
}

export type GraphEdge = SimulationLinkDatum<GraphNode> & {
    id: number,
    sourceId: number,
    targetId: number,
    relationship: Relationship
}

export class Graph {
    public nodes: Array<GraphNode>
    public edges: Array<GraphEdge>

    constructor(people: Array<Person>, relationships: Array<Relationship>) {
        this.nodes = people.map((person) => {
            return {
                id: person.id,
                person: person,
                displayX: 0,
                displayY: 0
            }
        })
        this.edges = relationships.map((relationship) => {
            return {
                id: relationship.id,
                source: relationship.source,
                target: relationship.target,
                sourceId: relationship.source,
                targetId: relationship.target,
                relationship: relationship
            }
        })
    }

    getSubgraph = (nodeFilters: Array<NodeFilter>, edgeFilters: Array<EdgeFilter>) => {
        return new Graph(
            this.nodes.map(it => it.person),
            this.edges.map(it => it.relationship)
        )
    }

    getEdgeNodes = (source: number, target: number) => {
        return [
            this.nodes.find((node) => { return node.id == source }),
            this.nodes.find((node) => { return node.id == target })
        ]
    }
}