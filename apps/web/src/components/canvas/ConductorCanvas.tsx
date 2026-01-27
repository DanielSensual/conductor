/**
 * Conductor Canvas - Main React Flow canvas component
 */
'use client';

import { useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useConductorStore, NodeType } from '@/store/conductorStore';
import {
    AgentNode,
    RouterNode,
    InputNode,
    OutputNode,
    ToolNode,
} from '@/components/nodes';
import { AnimatedEdge } from '@/components/edges';
import Toolbar from './Toolbar';
import NodeConfigPanel from '@/components/panels/NodeConfigPanel';

// Register custom node types
const nodeTypes = {
    agentNode: AgentNode,
    routerNode: RouterNode,
    inputNode: InputNode,
    outputNode: OutputNode,
    toolNode: ToolNode,
} as const;

// Register custom edge types
const edgeTypes = {
    animated: AnimatedEdge,
} as const;

function ConductorCanvasInner() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        selectedNodeId,
        setSelectedNode,
        execution,
    } = useConductorStore();

    // Handle drop from toolbar
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/conductornode') as NodeType;
            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(type, position);
        },
        [screenToFlowPosition, addNode]
    );

    // Handle canvas click to deselect
    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);

    return (
        <div className="flex h-screen w-screen bg-zinc-950">
            {/* Left Toolbar */}
            <Toolbar />

            {/* Main Canvas */}
            <div className="flex-1 relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes as any}
                    edges={edges as any}
                    onNodesChange={onNodesChange as any}
                    onEdgesChange={onEdgesChange as any}
                    onConnect={onConnect as any}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes as any}
                    edgeTypes={edgeTypes as any}
                    fitView
                    snapToGrid
                    snapGrid={[16, 16]}
                    defaultEdgeOptions={{
                        type: 'animated',
                        style: { stroke: '#6366f1', strokeWidth: 2 },
                        animated: execution.isRunning,
                    }}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={24}
                        size={1}
                        color="#27272a"
                    />
                    <Controls
                        className="!bg-zinc-900 !border-zinc-700 !rounded-lg"
                        showInteractive={false}
                    />
                    <MiniMap
                        className="!bg-zinc-900 !border-zinc-700 !rounded-lg"
                        nodeColor={(node) => {
                            switch (node.data?.type) {
                                case 'agent':
                                    return '#a855f7';
                                case 'tool':
                                    return '#06b6d4';
                                case 'router':
                                    return '#f59e0b';
                                case 'input':
                                    return '#10b981';
                                case 'output':
                                    return '#3b82f6';
                                default:
                                    return '#71717a';
                            }
                        }}
                        maskColor="rgba(0, 0, 0, 0.8)"
                    />
                </ReactFlow>

                {/* Execution Status Overlay */}
                {execution.isRunning && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                            <span className="text-sm text-purple-300">Executing...</span>
                        </div>
                    </div>
                )}

                {/* Breakpoint Paused Overlay */}
                {execution.pausedAtEdge && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/20 border border-amber-500 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <span className="text-sm text-amber-300">Paused at breakpoint</span>
                            <button className="ml-2 px-2 py-1 text-xs bg-amber-500 text-black rounded hover:bg-amber-400 transition-colors">
                                Resume
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Config Panel */}
            {selectedNodeId && <NodeConfigPanel />}
        </div>
    );
}

export default function ConductorCanvas() {
    return (
        <ReactFlowProvider>
            <ConductorCanvasInner />
        </ReactFlowProvider>
    );
}
