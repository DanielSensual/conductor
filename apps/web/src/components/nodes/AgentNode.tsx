/**
 * Agent Node - LLM-powered node with system prompt and streaming output
 */
'use client';

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useConductorStore, AgentNodeData } from '@/store/conductorStore';
import MiniTerminal from './MiniTerminal';

interface AgentNodeProps {
    id: string;
    data: AgentNodeData;
    selected?: boolean;
}

const AgentNode = memo<AgentNodeProps>(({ id, data, selected }) => {
    const { setSelectedNode } = useConductorStore();
    const [isExpanded, setIsExpanded] = useState(false);

    const statusColors = {
        idle: 'border-zinc-700',
        running: 'border-purple-500 shadow-lg shadow-purple-500/20',
        success: 'border-emerald-500',
        error: 'border-red-500',
    };

    const statusGlow = {
        idle: '',
        running: 'animate-pulse',
        success: '',
        error: '',
    };

    return (
        <div
            className={`
        relative min-w-[280px] rounded-xl border-2 bg-zinc-900/95 backdrop-blur-sm
        ${statusColors[data.status]} ${statusGlow[data.status]}
        ${selected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950' : ''}
        transition-all duration-300
      `}
            onClick={() => setSelectedNode(id)}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-purple-500 !border-2 !border-purple-300"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-sm">🤖</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{data.label}</h3>
                        <p className="text-xs text-zinc-500">{data.model}</p>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {/* Expanded Configuration */}
            {isExpanded && (
                <div className="px-4 py-3 border-b border-zinc-800">
                    <label className="block text-xs text-zinc-500 mb-1">System Prompt</label>
                    <p className="text-xs text-zinc-300 line-clamp-3">{data.systemPrompt}</p>
                    <div className="mt-2 flex items-center gap-4">
                        <div>
                            <span className="text-xs text-zinc-500">Temp: </span>
                            <span className="text-xs text-zinc-300">{data.temperature}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Streaming Output Terminal */}
            <MiniTerminal
                thoughts={data.thoughts}
                output={data.output}
                status={data.status}
                maxHeight={160}
            />

            {/* Status Indicator */}
            {data.status === 'running' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
            )}

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-purple-500 !border-2 !border-purple-300"
            />
        </div>
    );
});

AgentNode.displayName = 'AgentNode';

export default AgentNode;
