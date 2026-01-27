/**
 * Input Node - Graph entry point
 */
'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useConductorStore, InputNodeData } from '@/store/conductorStore';

interface InputNodeProps {
    id: string;
    data: InputNodeData;
    selected?: boolean;
}

const InputNode = memo<InputNodeProps>(({ id, data, selected }) => {
    const { setSelectedNode } = useConductorStore();

    return (
        <div
            className={`
        relative min-w-[140px] rounded-xl border-2 bg-zinc-900/95 backdrop-blur-sm
        border-emerald-600
        ${selected ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950' : ''}
        transition-all duration-300
      `}
            onClick={() => setSelectedNode(id)}
        >
            <div className="flex items-center gap-2 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <span className="text-white text-sm">📥</span>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">{data.label}</h3>
                    <p className="text-xs text-zinc-500">Entry Point</p>
                </div>
            </div>

            {/* Output Handle Only */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-300"
            />
        </div>
    );
});

InputNode.displayName = 'InputNode';

export default InputNode;
