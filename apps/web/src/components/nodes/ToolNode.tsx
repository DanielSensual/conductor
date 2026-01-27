/**
 * Tool Node - Python function execution
 */
'use client';

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useConductorStore, ToolNodeData } from '@/store/conductorStore';

interface ToolNodeProps {
    id: string;
    data: ToolNodeData;
    selected?: boolean;
}

const ToolNode = memo<ToolNodeProps>(({ id, data, selected }) => {
    const { setSelectedNode } = useConductorStore();
    const [isExpanded, setIsExpanded] = useState(false);

    const statusColors = {
        idle: 'border-zinc-700',
        running: 'border-cyan-500 shadow-lg shadow-cyan-500/20',
        success: 'border-emerald-500',
        error: 'border-red-500',
    };

    return (
        <div
            className={`
        relative min-w-[220px] rounded-xl border-2 bg-zinc-900/95 backdrop-blur-sm
        ${statusColors[data.status]}
        ${selected ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-zinc-950' : ''}
        transition-all duration-300
      `}
            onClick={() => setSelectedNode(id)}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-cyan-300"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm">🔧</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{data.label}</h3>
                        <p className="text-xs text-zinc-500 font-mono">
                            {data.functionName || 'No function'}
                        </p>
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

            {/* Expanded Parameters */}
            {isExpanded && Object.keys(data.parameters).length > 0 && (
                <div className="px-4 py-3 border-t border-zinc-800">
                    <label className="block text-xs text-zinc-500 mb-1">Parameters</label>
                    <pre className="text-xs text-zinc-300 font-mono">
                        {JSON.stringify(data.parameters, null, 2)}
                    </pre>
                </div>
            )}

            {/* Status Indicator */}
            {data.status === 'running' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping" />
            )}

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-cyan-300"
            />
        </div>
    );
});

ToolNode.displayName = 'ToolNode';

export default ToolNode;
