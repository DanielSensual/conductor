/**
 * Animated Edge - Custom edge with data packet flow animation
 */
'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge, type EdgeProps } from '@xyflow/react';

export interface AnimatedEdgeData {
    hasBreakpoint?: boolean;
    isTraversing?: boolean;
    condition?: unknown;
    [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

const AnimatedEdge = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps) => {
    const [packetPosition, setPacketPosition] = useState<number | null>(null);

    // Cast data to our expected type
    const edgeData = (data ?? {}) as AnimatedEdgeData;

    // Get the SVG path
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 12,
    });

    // Animate packet when traversing
    useEffect(() => {
        if (edgeData.isTraversing) {
            setPacketPosition(0);
            const duration = 600; // ms
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                setPacketPosition(eased);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setPacketPosition(null);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [edgeData.isTraversing]);

    // Calculate packet position along path
    const getPacketCoordinates = useCallback((progress: number) => {
        // Create temporary path element to measure
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', edgePath);
        const pathLength = pathElement.getTotalLength();
        const point = pathElement.getPointAtLength(progress * pathLength);
        return { x: point.x, y: point.y };
    }, [edgePath]);

    const packetCoords = packetPosition !== null ? getPacketCoordinates(packetPosition) : null;

    const edgeColor = selected ? '#a855f7' : edgeData.hasBreakpoint ? '#f59e0b' : '#6366f1';

    return (
        <>
            {/* Base edge path */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...((typeof style === 'object' && style !== null) ? style : {}),
                    stroke: edgeColor,
                    strokeWidth: selected ? 3 : 2,
                    opacity: edgeData.isTraversing ? 1 : 0.7,
                    transition: 'stroke 0.2s, opacity 0.2s',
                }}
            />

            {/* Glow path when traversing */}
            {edgeData.isTraversing && (
                <path
                    d={edgePath}
                    style={{
                        stroke: '#a855f7',
                        strokeWidth: 6,
                        fill: 'none',
                        filter: 'blur(4px)',
                        opacity: 0.4,
                    }}
                />
            )}

            {/* Breakpoint indicator */}
            {edgeData.hasBreakpoint && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="w-4 h-4 bg-amber-500 rounded-full border-2 border-amber-300 shadow-lg shadow-amber-500/30 cursor-pointer hover:scale-125 transition-transform"
                        title="Breakpoint"
                    />
                </EdgeLabelRenderer>
            )}

            {/* Data packet dot */}
            {packetCoords && (
                <g>
                    {/* Packet glow */}
                    <circle
                        cx={packetCoords.x}
                        cy={packetCoords.y}
                        r={8}
                        fill="#a855f7"
                        filter="blur(4px)"
                        opacity={0.6}
                    />
                    {/* Packet core */}
                    <circle
                        cx={packetCoords.x}
                        cy={packetCoords.y}
                        r={5}
                        fill="#a855f7"
                        stroke="#e9d5ff"
                        strokeWidth={2}
                    />
                    {/* Packet highlight */}
                    <circle
                        cx={packetCoords.x - 1}
                        cy={packetCoords.y - 1}
                        r={1.5}
                        fill="#ffffff"
                        opacity={0.8}
                    />
                </g>
            )}
        </>
    );
});

AnimatedEdge.displayName = 'AnimatedEdge';

export default AnimatedEdge;
