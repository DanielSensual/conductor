/**
 * Graph Serializer - Exports React Flow state to execution JSON
 */
import { Node, Edge } from '@xyflow/react';
import { v4 as uuid } from 'uuid';
import { ConductorNode, ConductorEdge } from '@/store/conductorStore';

export interface ExecutionGraph {
    version: '1.0';
    id: string;
    name: string;
    description?: string;
    nodes: Array<{
        id: string;
        type: string;
        config: Record<string, unknown>;
        position: { x: number; y: number };
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        sourceHandle?: string;
        targetHandle?: string;
        condition?: {
            field: string;
            operator: string;
            value: string | number | boolean;
        };
        hasBreakpoint?: boolean;
    }>;
}

export function serializeGraph(
    nodes: ConductorNode[],
    edges: ConductorEdge[],
    name: string = 'Untitled Graph'
): ExecutionGraph {
    return {
        version: '1.0',
        id: uuid(),
        name,
        nodes: nodes.map((node) => ({
            id: node.id,
            type: node.data.type,
            config: { ...node.data },
            position: { x: node.position.x, y: node.position.y },
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle ?? undefined,
            targetHandle: edge.targetHandle ?? undefined,
            condition: edge.data?.condition as ExecutionGraph['edges'][0]['condition'],
            hasBreakpoint: edge.data?.hasBreakpoint ?? false,
        })),
    };
}

export function deserializeGraph(
    graph: ExecutionGraph
): { nodes: ConductorNode[]; edges: ConductorEdge[] } {
    return {
        nodes: graph.nodes.map((node) => ({
            id: node.id,
            type: `${node.type}Node`,
            position: node.position,
            data: node.config as unknown as ConductorNode['data'],
        })),
        edges: graph.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            data: {
                condition: edge.condition,
                hasBreakpoint: edge.hasBreakpoint,
            },
        })),
    };
}

export function downloadGraphAsJSON(
    nodes: ConductorNode[],
    edges: ConductorEdge[],
    name: string = 'conductor-graph'
): void {
    const graph = serializeGraph(nodes, edges, name);
    const json = JSON.stringify(graph, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    a.click();

    URL.revokeObjectURL(url);
}
