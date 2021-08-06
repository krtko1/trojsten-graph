import {GraphEdge, GraphNode} from "./Graph";

export interface NodeFilter {
    isIncluded: (node: GraphNode) => boolean
}

export interface EdgeFilter {
    isiIncluded: (edge: GraphEdge) => boolean
}

export class SeminarFilter implements NodeFilter {
    private seminarName: string;
    private isActive: boolean;
    constructor(seminarName: string, isActive: boolean) {
        this.seminarName = seminarName
        this.isActive = isActive
    }

    isIncluded(node: GraphNode): boolean {
        return node.person.memberships.filter((membership) => {
            return membership.groupName == this.seminarName
        }).length > 0
    }
}