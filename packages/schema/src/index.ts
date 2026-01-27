/**
 * Conductor AI - Shared Schema Types
 * 
 * These types define the contract between the frontend canvas
 * and the backend execution engine.
 */

// =============================================================================
// Node Types
// =============================================================================

export type NodeType = 'agent' | 'tool' | 'router' | 'input' | 'output';

export interface Position {
    x: number;
    y: number;
}

// Agent Node Configuration
export interface AgentConfig {
    model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'claude-3-sonnet' | 'claude-3-haiku';
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

// Tool Node Configuration
export interface ToolConfig {
    functionName: string;
    parameters: Record<string, unknown>;
    description?: string;
}

// Router Node Configuration
export interface RouterCondition {
    field: string;
    operator: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'not_contains';
    value: string | number | boolean;
    target: string; // Node ID to route to
}

export interface RouterConfig {
    conditions: RouterCondition[];
    defaultTarget?: string;
}

// Input/Output Node Configuration
export interface InputConfig {
    schema?: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>;
}

export interface OutputConfig {
    outputMapping?: Record<string, string>;
}

// Union of all config types
export type NodeConfig = AgentConfig | ToolConfig | RouterConfig | InputConfig | OutputConfig;

// =============================================================================
// Graph Schema
// =============================================================================

export interface GraphNode {
    id: string;
    type: NodeType;
    config: NodeConfig;
    position: Position;
    label?: string;
}

export interface EdgeCondition {
    field: string;
    operator: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'not_contains';
    value: string | number | boolean;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    condition?: EdgeCondition;
    hasBreakpoint?: boolean;
    label?: string;
}

export interface ExecutionGraph {
    version: '1.0';
    id: string;
    name: string;
    description?: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    metadata?: {
        createdAt: string;
        updatedAt: string;
        author?: string;
    };
}

// =============================================================================
// Execution Events (SSE Stream)
// =============================================================================

export type ExecutionEventType =
    | 'graph_start'
    | 'node_start'
    | 'thought'
    | 'token'
    | 'tool_call'
    | 'tool_result'
    | 'node_end'
    | 'edge_traverse'
    | 'breakpoint_hit'
    | 'graph_complete'
    | 'error';

export interface BaseEvent {
    type: ExecutionEventType;
    timestamp: number;
    executionId: string;
}

export interface GraphStartEvent extends BaseEvent {
    type: 'graph_start';
    graphId: string;
}

export interface NodeStartEvent extends BaseEvent {
    type: 'node_start';
    nodeId: string;
    nodeName?: string;
}

export interface ThoughtEvent extends BaseEvent {
    type: 'thought';
    nodeId: string;
    content: string;
}

export interface TokenEvent extends BaseEvent {
    type: 'token';
    nodeId: string;
    content: string;
}

export interface ToolCallEvent extends BaseEvent {
    type: 'tool_call';
    nodeId: string;
    toolName: string;
    args: Record<string, unknown>;
}

export interface ToolResultEvent extends BaseEvent {
    type: 'tool_result';
    nodeId: string;
    toolName: string;
    result: unknown;
}

export interface NodeEndEvent extends BaseEvent {
    type: 'node_end';
    nodeId: string;
    status: 'success' | 'error';
    output?: unknown;
    error?: string;
}

export interface EdgeTraverseEvent extends BaseEvent {
    type: 'edge_traverse';
    edgeId: string;
    from: string;
    to: string;
}

export interface BreakpointHitEvent extends BaseEvent {
    type: 'breakpoint_hit';
    edgeId: string;
    state: Record<string, unknown>;
    checkpointId: string;
}

export interface GraphCompleteEvent extends BaseEvent {
    type: 'graph_complete';
    finalState: Record<string, unknown>;
    totalDuration: number;
}

export interface ErrorEvent extends BaseEvent {
    type: 'error';
    nodeId?: string;
    message: string;
    stack?: string;
}

export type ExecutionEvent =
    | GraphStartEvent
    | NodeStartEvent
    | ThoughtEvent
    | TokenEvent
    | ToolCallEvent
    | ToolResultEvent
    | NodeEndEvent
    | EdgeTraverseEvent
    | BreakpointHitEvent
    | GraphCompleteEvent
    | ErrorEvent;

// =============================================================================
// API Types
// =============================================================================

export interface ExecuteGraphRequest {
    graph: ExecutionGraph;
    initialInput: Record<string, unknown>;
    options?: {
        recursionLimit?: number;
        timeout?: number;
    };
}

export interface ExecuteGraphResponse {
    executionId: string;
    status: 'running' | 'completed' | 'paused' | 'error';
}

export interface ResumeExecutionRequest {
    checkpointId: string;
    modifiedState?: Record<string, unknown>;
}

export interface CheckpointInfo {
    id: string;
    executionId: string;
    edgeId: string;
    state: Record<string, unknown>;
    createdAt: string;
}

// =============================================================================
// Template Types (Super-Nodes)
// =============================================================================

export interface GraphTemplate {
    id: string;
    name: string;
    description: string;
    category: 'verification' | 'research' | 'coding' | 'analysis' | 'custom';
    icon?: string;
    subgraph: {
        nodes: Omit<GraphNode, 'position'>[];
        edges: Omit<GraphEdge, 'id'>[];
        inputMapping: Record<string, string>;
        outputMapping: Record<string, string>;
    };
}
