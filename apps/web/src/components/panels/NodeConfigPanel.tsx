/**
 * Node Config Panel - Right sidebar for editing selected node
 */
'use client';

import { useConductorStore, ConductorNodeData } from '@/store/conductorStore';

const modelOptions = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

export default function NodeConfigPanel() {
    const { nodes, selectedNodeId, updateNodeData, deleteNode, setSelectedNode } =
        useConductorStore();

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    if (!selectedNode) return null;

    const { data } = selectedNode;

    const handleUpdate = (updates: Partial<ConductorNodeData>) => {
        updateNodeData(selectedNodeId!, updates);
    };

    const handleDelete = () => {
        deleteNode(selectedNodeId!);
        setSelectedNode(null);
    };

    return (
        <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div>
                    <h2 className="text-lg font-semibold text-white">{data.label}</h2>
                    <p className="text-xs text-zinc-500 capitalize">{data.type} Node</p>
                </div>
                <button
                    onClick={() => setSelectedNode(null)}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Configuration */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* Label (all nodes) */}
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Label
                    </label>
                    <input
                        type="text"
                        value={data.label}
                        onChange={(e) => handleUpdate({ label: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                {/* Agent-specific config */}
                {data.type === 'agent' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                Model
                            </label>
                            <select
                                value={data.model}
                                onChange={(e) => handleUpdate({ model: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                            >
                                {modelOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                System Prompt
                            </label>
                            <textarea
                                value={data.systemPrompt}
                                onChange={(e) => handleUpdate({ systemPrompt: e.target.value })}
                                rows={6}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono"
                                placeholder="You are a helpful assistant..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                Temperature: {data.temperature}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={data.temperature}
                                onChange={(e) =>
                                    handleUpdate({ temperature: parseFloat(e.target.value) })
                                }
                                className="w-full accent-purple-500"
                            />
                            <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                <span>Deterministic</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Tool-specific config */}
                {data.type === 'tool' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                Function Name
                            </label>
                            <input
                                type="text"
                                value={data.functionName}
                                onChange={(e) => handleUpdate({ functionName: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                                placeholder="search_google"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                Parameters (JSON)
                            </label>
                            <textarea
                                value={JSON.stringify(data.parameters, null, 2)}
                                onChange={(e) => {
                                    try {
                                        handleUpdate({ parameters: JSON.parse(e.target.value) });
                                    } catch {
                                        // Invalid JSON, ignore
                                    }
                                }}
                                rows={4}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none font-mono"
                                placeholder='{"query": "string"}'
                            />
                        </div>
                    </>
                )}

                {/* Router-specific config */}
                {data.type === 'router' && (
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Conditions
                        </label>
                        <p className="text-xs text-zinc-500">
                            Configure routing conditions based on state fields.
                        </p>
                        <div className="mt-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                            <p className="text-xs text-amber-400">
                                ⚠️ Router configuration UI coming soon.
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                For now, conditions are set programmatically.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={handleDelete}
                    className="w-full py-2 px-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                >
                    Delete Node
                </button>
            </div>
        </div>
    );
}
