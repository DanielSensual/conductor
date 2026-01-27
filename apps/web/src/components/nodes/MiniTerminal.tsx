/**
 * Mini Terminal - Polished streaming output component for nodes
 */
'use client';

import { memo, useEffect, useRef, useState } from 'react';

interface MiniTerminalProps {
    thoughts?: string;
    output?: string;
    status: 'idle' | 'running' | 'success' | 'error';
    maxHeight?: number;
}

const MiniTerminal = memo(({ thoughts, output, status, maxHeight = 160 }: MiniTerminalProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isReceiving, setIsReceiving] = useState(false);
    const prevLengthRef = useRef({ thoughts: 0, output: 0 });

    // Detect new content and trigger glow
    useEffect(() => {
        const thoughtsLen = thoughts?.length || 0;
        const outputLen = output?.length || 0;

        if (thoughtsLen > prevLengthRef.current.thoughts || outputLen > prevLengthRef.current.output) {
            setIsReceiving(true);
            const timer = setTimeout(() => setIsReceiving(false), 150);
            prevLengthRef.current = { thoughts: thoughtsLen, output: outputLen };
            return () => clearTimeout(timer);
        }
    }, [thoughts, output]);

    // Auto-scroll to bottom on content change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [thoughts, output]);

    if (!thoughts && !output) {
        return null;
    }

    const statusLabel = {
        idle: 'READY',
        running: 'STREAMING',
        success: 'COMPLETE',
        error: 'ERROR',
    };

    const statusColor = {
        idle: 'text-zinc-500',
        running: 'text-purple-400',
        success: 'text-emerald-400',
        error: 'text-red-400',
    };

    return (
        <div
            className={`
                relative overflow-hidden rounded-b-lg bg-black/50
                ${isReceiving ? 'ring-1 ring-purple-500/50' : ''}
                transition-all duration-150
            `}
        >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/60" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                        <div className="w-2 h-2 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
                        Output
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {status === 'running' && (
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    )}
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${statusColor[status]}`}>
                        {statusLabel[status]}
                    </span>
                </div>
            </div>

            {/* Terminal Content */}
            <div
                ref={scrollRef}
                className="px-3 py-2 font-mono text-xs overflow-y-auto scrollbar-thin"
                style={{ maxHeight }}
            >
                {/* Thoughts Section */}
                {thoughts && (
                    <div className="mb-2 pb-2 border-b border-zinc-800/50">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-purple-400">💭</span>
                            <span className="text-[10px] text-purple-400/70 uppercase tracking-wider">
                                Thinking
                            </span>
                        </div>
                        <p className="text-zinc-500 whitespace-pre-wrap leading-relaxed terminal-text">
                            {thoughts}
                            {status === 'running' && (
                                <span className="inline-block w-1.5 h-3.5 bg-purple-500 animate-blink ml-0.5 -mb-0.5" />
                            )}
                        </p>
                    </div>
                )}

                {/* Output Section */}
                {output && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-emerald-400">✓</span>
                            <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">
                                Response
                            </span>
                        </div>
                        <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed terminal-text">
                            {output}
                            {status === 'running' && !thoughts && (
                                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-blink ml-0.5 -mb-0.5" />
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* Scan line effect when receiving */}
            {isReceiving && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scan" />
                </div>
            )}
        </div>
    );
});

MiniTerminal.displayName = 'MiniTerminal';

export default MiniTerminal;
