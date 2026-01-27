/**
 * Router Node - Conditional branching with multiple outputs
 */
'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useConductorStore, RouterNodeData } from '@/store/conductorStore';

interface RouterNodeProps {
    id: string;
    data: RouterNodeData;
    selected?: boolean;
}

const RouterNode = memo<RouterNodeProps>(({ id, data, selected }) => {
    const { setSelectedNode } = useConductorStore();

    const statusColors = {
        idle: 'border-zinc-700',
        running: 'border-amber-500 shadow-lg shadow-amber-500/20',
        success: 'border-emerald-500',
        error: 'border-red-500',
    };

    return (
        <div
            className={`
        relative w-16 h-16 rotate-45 rounded-lg border-2 bg-zinc-900/95 backdrop-blur-sm
        ${statusColors[data.status]}
        ${selected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950' : ''}
        transition-all duration-300 flex items-center justify-center
      `}
            onClick={() => setSelectedNode(id)}
        >
            {/* Input Handle (top when rotated) */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-amber-300 !-left-2"
            />

            {/* Center Icon */}
            <div className="-rotate-45 text-amber-500 text-lg">⬡</div>

            {/* True Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-300 !-right-2 !top-1/4"
            />

            {/* False Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!w-3 !h-3 !bg-red-500 !border-2 !border-red-300 !-right-2 !top-3/4"
            />

            {/* Label below */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 -rotate-45 whitespace-nowrap">
                <span className="text-xs text-zinc-400">{data.label}</span>
            </div>
        </div>
    );
});

RouterNode.displayName = 'RouterNode';

export default RouterNode;
