/**
 * Toolbar - Draggable node palette
 */
'use client';

import { useConductorStore, NodeType } from '@/store/conductorStore';

interface NodeTypeConfig {
    type: NodeType;
    label: string;
    icon: string;
    color: string;
    description: string;
}

const nodeTypes: NodeTypeConfig[] = [
    {
        type: 'input',
        label: 'Input',
        icon: '📥',
        color: 'from-emerald-500 to-teal-500',
        description: 'Entry point',
    },
    {
        type: 'agent',
        label: 'Agent',
        icon: '🤖',
        color: 'from-purple-500 to-pink-500',
        description: 'LLM-powered',
    },
    {
        type: 'tool',
        label: 'Tool',
        icon: '🔧',
        color: 'from-cyan-500 to-blue-500',
        description: 'Run function',
    },
    {
        type: 'router',
        label: 'Router',
        icon: '⬡',
        color: 'from-amber-500 to-orange-500',
        description: 'Conditional',
    },
    {
        type: 'output',
        label: 'Output',
        icon: '📤',
        color: 'from-blue-500 to-indigo-500',
        description: 'Exit point',
    },
];

export default function Toolbar() {
    const { execution, getGraphJSON, resetAllNodes } = useConductorStore();

    const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
        event.dataTransfer.setData('application/conductornode', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleRun = async () => {
        const graph = getGraphJSON();
        console.log('Executing graph:', graph);
        // TODO: Connect to backend SSE endpoint
        alert('Graph execution will be connected to the backend. Check console for graph JSON.');
    };

    const handleReset = () => {
        resetAllNodes();
    };

    return (
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Conductor
                </h1>
                <p className="text-xs text-zinc-500 mt-1">Visual Agent Orchestration</p>
            </div>

            {/* Node Types */}
            <div className="flex-1 p-4 overflow-y-auto">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Nodes
                </h2>
                <div className="space-y-2">
                    {nodeTypes.map((node) => (
                        <div
                            key={node.type}
                            draggable
                            onDragStart={(e) => onDragStart(e, node.type)}
                            className="group flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 cursor-grab hover:border-zinc-600 hover:bg-zinc-800 transition-all active:cursor-grabbing"
                        >
                            <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
                            >
                                <span className="text-lg">{node.icon}</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">{node.label}</h3>
                                <p className="text-xs text-zinc-500">{node.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Templates Section */}
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-6 mb-3">
                    Templates
                </h2>
                <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔄</span>
                            <div>
                                <h3 className="text-sm font-medium text-purple-300">
                                    Self-Correcting
                                </h3>
                                <p className="text-xs text-zinc-500">Generator → Verifier loop</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 cursor-pointer hover:border-cyan-500/50 transition-colors opacity-50">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔍</span>
                            <div>
                                <h3 className="text-sm font-medium text-cyan-300">
                                    Research Agent
                                </h3>
                                <p className="text-xs text-zinc-500">Coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-zinc-800 space-y-2">
                <button
                    onClick={handleRun}
                    disabled={execution.isRunning}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {execution.isRunning ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Running...
                        </>
                    ) : (
                        <>
                            <span>▶</span>
                            Run Graph
                        </>
                    )}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full py-2 px-4 rounded-lg bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-colors"
                >
                    Reset All
                </button>
            </div>
        </div>
    );
}
