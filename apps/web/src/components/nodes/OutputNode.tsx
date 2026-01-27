/**
 * Output Node - Graph exit point
 */
'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useConductorStore, OutputNodeData } from '@/store/conductorStore';

interface OutputNodeProps {
    id: string;
    data: OutputNodeData;
    selected?: boolean;
}

function OutputNodeComponent({ id, data, selected = false }: OutputNodeProps) {
    const { setSelectedNode } = useConductorStore();

    return (
        <div
            className={`
        relative min-w-[140px] rounded-xl border-2 bg-zinc-900/95 backdrop-blur-sm
        border-blue-600
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}
        transition-all duration-300
      `}
            onClick={() => setSelectedNode(id)}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300"
            />

            <div className="flex items-center gap-2 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white text-sm">📤</span>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">{data.label}</h3>
                    <p className="text-xs text-zinc-500">Exit Point</p>
                </div>
            </div>

            {/* Show final output if available - use ternary to avoid unknown && JSX pattern */}
            {data.finalOutput != null ? (
                <div className="px-4 py-2 border-t border-zinc-800">
                    <p className="text-xs text-emerald-400 font-mono">
                        {JSON.stringify(data.finalOutput, null, 2)}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

const OutputNode = React.memo(OutputNodeComponent);

OutputNode.displayName = 'OutputNode';

export default OutputNode;
