/**
 * SSE Client - Connects to backend and handles streaming events
 */
import { useConductorStore, ConductorNodeData } from '@/store/conductorStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ExecutionOptions {
    recursionLimit?: number;
    timeout?: number;
}

export async function executeGraph(
    initialInput: Record<string, unknown> = {},
    options: ExecutionOptions = {}
): Promise<void> {
    const store = useConductorStore.getState();
    const graphJson = store.getGraphJSON();

    // Reset all nodes before execution
    store.resetAllNodes();

    const response = await fetch(`${API_URL}/api/execute/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            graph: graphJson,
            initialInput,
            options,
        }),
    });

    if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
    }

    const executionId = response.headers.get('X-Execution-ID') || 'unknown';
    store.startExecution(executionId);

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    try {
                        const event = JSON.parse(jsonStr);
                        handleEvent(event);
                    } catch (e) {
                        console.error('Failed to parse event:', e);
                    }
                }
            }
        }
    } finally {
        store.stopExecution();
    }
}

function handleEvent(event: Record<string, unknown>): void {
    const store = useConductorStore.getState();

    switch (event.type) {
        case 'graph_start':
            console.log('Graph execution started:', event.graphId);
            break;

        case 'node_start':
            store.setNodeStatus(event.nodeId as string, 'running');
            break;

        case 'thought':
            store.appendNodeThoughts(event.nodeId as string, event.content as string);
            break;

        case 'token':
            store.appendNodeOutput(event.nodeId as string, event.content as string);
            break;

        case 'node_end':
            store.setNodeStatus(
                event.nodeId as string,
                event.status === 'success' ? 'success' : 'error'
            );
            break;

        case 'edge_traverse':
            console.log('Edge traversed:', event.from, '->', event.to);
            // Animate edge with packet flow
            if (event.edgeId) {
                store.setEdgeTraversing(event.edgeId as string, true);
            }
            break;

        case 'breakpoint_hit':
            store.pauseAtBreakpoint(
                event.edgeId as string,
                event.checkpointId as string
            );
            break;

        case 'graph_complete':
            console.log('Graph completed in', event.totalDuration, 'seconds');
            break;

        case 'error':
            console.error('Execution error:', event.message);
            if (event.nodeId) {
                store.setNodeStatus(event.nodeId as string, 'error');
            }
            break;

        default:
            console.log('Unknown event:', event);
    }
}

export async function resumeExecution(
    checkpointId: string,
    modifiedState?: Record<string, unknown>
): Promise<void> {
    const response = await fetch(`${API_URL}/api/resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            checkpointId,
            modifiedState,
        }),
    });

    if (!response.ok) {
        throw new Error(`Resume failed: ${response.statusText}`);
    }

    // Handle streaming response similar to executeGraph
    // TODO: Implement resume streaming
}
