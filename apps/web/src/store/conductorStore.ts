/**
 * Conductor Store - Zustand state management for the canvas
 */
import { create } from 'zustand';
import {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Connection,
} from '@xyflow/react';
import { v4 as uuid } from 'uuid';

// Node data types
export type NodeType = 'agent' | 'tool' | 'router' | 'input' | 'output';

export interface AgentNodeData {
    type: 'agent';
    label: string;
    model: string;
    systemPrompt: string;
    temperature: number;
    status: 'idle' | 'running' | 'success' | 'error';
    output?: string;
    thoughts?: string;
}

export interface ToolNodeData {
    type: 'tool';
    label: string;
    functionName: string;
    parameters: Record<string, unknown>;
    status: 'idle' | 'running' | 'success' | 'error';
}

export interface RouterNodeData {
    type: 'router';
    label: string;
    conditions: Array<{
        field: string;
        operator: string;
        value: string | number;
        targetHandle: string;
    }>;
    status: 'idle' | 'running' | 'success' | 'error';
}

export interface InputNodeData {
    type: 'input';
    label: string;
    status: 'idle' | 'running' | 'success' | 'error';
}

export interface OutputNodeData {
    type: 'output';
    label: string;
    status: 'idle' | 'running' | 'success' | 'error';
    finalOutput?: unknown;
}

export type ConductorNodeData =
    | AgentNodeData
    | ToolNodeData
    | RouterNodeData
    | InputNodeData
    | OutputNodeData;

// Use generic Node type for React Flow compatibility
// We use `any` for data at the React Flow boundary because React Flow expects Record<string, unknown>
// Individual node components define their own typed props interfaces
export type ConductorNode = Node<any, string>;
export type ConductorEdge = Edge<{ condition?: unknown; hasBreakpoint?: boolean; isTraversing?: boolean }>;

// Execution state
export interface ExecutionState {
    isRunning: boolean;
    executionId: string | null;
    activeNodeId: string | null;
    pausedAtEdge: string | null;
    checkpointId: string | null;
}

interface ConductorState {
    // Graph state
    nodes: ConductorNode[];
    edges: ConductorEdge[];

    // Selection
    selectedNodeId: string | null;

    // Execution
    execution: ExecutionState;

    // Actions - Graph manipulation
    onNodesChange: OnNodesChange<ConductorNode>;
    onEdgesChange: OnEdgesChange<ConductorEdge>;
    onConnect: OnConnect;

    // Actions - Node CRUD
    addNode: (type: NodeType, position: { x: number; y: number }) => void;
    updateNodeData: (nodeId: string, data: Partial<ConductorNodeData>) => void;
    deleteNode: (nodeId: string) => void;
    setSelectedNode: (nodeId: string | null) => void;

    // Actions - Edge manipulation
    toggleBreakpoint: (edgeId: string) => void;
    setEdgeTraversing: (edgeId: string, isTraversing: boolean) => void;

    // Actions - Execution
    setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
    appendNodeThoughts: (nodeId: string, content: string) => void;
    appendNodeOutput: (nodeId: string, content: string) => void;
    startExecution: (executionId: string) => void;
    stopExecution: () => void;
    pauseAtBreakpoint: (edgeId: string, checkpointId: string) => void;
    resumeExecution: () => void;
    resetAllNodes: () => void;

    // Actions - Serialization
    getGraphJSON: () => object;
    loadGraph: (nodes: ConductorNode[], edges: ConductorEdge[]) => void;
}

// Default node configurations
const createDefaultNodeData = (type: NodeType, label: string): ConductorNodeData => {
    switch (type) {
        case 'agent':
            return {
                type: 'agent',
                label,
                model: 'gpt-4o',
                systemPrompt: 'You are a helpful assistant.',
                temperature: 0.7,
                status: 'idle',
            };
        case 'tool':
            return {
                type: 'tool',
                label,
                functionName: '',
                parameters: {},
                status: 'idle',
            };
        case 'router':
            return {
                type: 'router',
                label,
                conditions: [],
                status: 'idle',
            };
        case 'input':
            return {
                type: 'input',
                label,
                status: 'idle',
            };
        case 'output':
            return {
                type: 'output',
                label,
                status: 'idle',
            };
    }
};

export const useConductorStore = create<ConductorState>((set, get) => ({
    // Initial state
    nodes: [],
    edges: [],
    selectedNodeId: null,
    execution: {
        isRunning: false,
        executionId: null,
        activeNodeId: null,
        pausedAtEdge: null,
        checkpointId: null,
    },

    // React Flow handlers
    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    onConnect: (connection: Connection) => {
        set({ edges: addEdge({ ...connection, id: uuid() }, get().edges) });
    },

    // Node CRUD
    addNode: (type, position) => {
        const id = uuid();
        const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${get().nodes.filter(n => n.data.type === type).length + 1}`;

        const newNode: ConductorNode = {
            id,
            type: `${type}Node`,
            position,
            data: createDefaultNodeData(type, label),
        };

        set({ nodes: [...get().nodes, newNode] });
    },

    updateNodeData: (nodeId, data) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...data } as ConductorNodeData }
                    : node
            ),
        });
    },

    deleteNode: (nodeId) => {
        set({
            nodes: get().nodes.filter((node) => node.id !== nodeId),
            edges: get().edges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
            selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        });
    },

    setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
    },

    // Edge manipulation
    toggleBreakpoint: (edgeId) => {
        set({
            edges: get().edges.map((edge) =>
                edge.id === edgeId
                    ? { ...edge, data: { ...edge.data, hasBreakpoint: !edge.data?.hasBreakpoint } }
                    : edge
            ),
        });
    },

    setEdgeTraversing: (edgeId, isTraversing) => {
        set({
            edges: get().edges.map((edge) =>
                edge.id === edgeId
                    ? { ...edge, data: { ...edge.data, isTraversing } }
                    : edge
            ),
        });

        // Auto-clear traversing state after animation completes
        if (isTraversing) {
            setTimeout(() => {
                set({
                    edges: get().edges.map((edge) =>
                        edge.id === edgeId
                            ? { ...edge, data: { ...edge.data, isTraversing: false } }
                            : edge
                    ),
                });
            }, 700);
        }
    },

    // Execution actions
    setNodeStatus: (nodeId, status) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, status } as ConductorNodeData }
                    : node
            ),
            execution: {
                ...get().execution,
                activeNodeId: status === 'running' ? nodeId : get().execution.activeNodeId,
            },
        });
    },

    appendNodeThoughts: (nodeId, content) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === nodeId && node.data.type === 'agent'
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            thoughts: ((node.data as AgentNodeData).thoughts || '') + content,
                        },
                    }
                    : node
            ),
        });
    },

    appendNodeOutput: (nodeId, content) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === nodeId && node.data.type === 'agent'
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            output: ((node.data as AgentNodeData).output || '') + content,
                        },
                    }
                    : node
            ),
        });
    },

    startExecution: (executionId) => {
        set({
            execution: {
                isRunning: true,
                executionId,
                activeNodeId: null,
                pausedAtEdge: null,
                checkpointId: null,
            },
        });
    },

    stopExecution: () => {
        set({
            execution: {
                isRunning: false,
                executionId: null,
                activeNodeId: null,
                pausedAtEdge: null,
                checkpointId: null,
            },
        });
    },

    pauseAtBreakpoint: (edgeId, checkpointId) => {
        set({
            execution: {
                ...get().execution,
                pausedAtEdge: edgeId,
                checkpointId,
            },
        });
    },

    resumeExecution: () => {
        set({
            execution: {
                ...get().execution,
                pausedAtEdge: null,
                checkpointId: null,
            },
        });
    },

    resetAllNodes: () => {
        set({
            nodes: get().nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    status: 'idle',
                    ...(node.data.type === 'agent' ? { thoughts: '', output: '' } : {}),
                } as ConductorNodeData,
            })),
        });
    },

    // Serialization
    getGraphJSON: () => {
        const { nodes, edges } = get();
        return {
            version: '1.0',
            id: uuid(),
            name: 'Untitled Graph',
            nodes: nodes.map((n) => ({
                id: n.id,
                type: n.data.type,
                config: n.data,
                position: n.position,
            })),
            edges: edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                condition: e.data?.condition,
                hasBreakpoint: e.data?.hasBreakpoint,
            })),
        };
    },

    loadGraph: (nodes, edges) => {
        set({ nodes, edges });
    },
}));
