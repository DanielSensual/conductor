"""
SSE Event Streaming - Transforms LangGraph events to frontend format.
"""
import json
import time
from typing import Any, AsyncGenerator

from conductor.models import (
    ExecutionEventType,
    GraphStartEvent,
    NodeStartEvent,
    ThoughtEvent,
    TokenEvent,
    NodeEndEvent,
    EdgeTraverseEvent,
    GraphCompleteEvent,
    ErrorEvent,
)


class EventStreamer:
    """
    Transforms LangGraph execution events into SSE events for the frontend.
    """
    
    def __init__(self, execution_id: str, graph_id: str):
        self.execution_id = execution_id
        self.graph_id = graph_id
        self._start_time = time.time()
    
    async def stream_events(
        self,
        graph_events: AsyncGenerator[dict[str, Any], None],
    ) -> AsyncGenerator[str, None]:
        """
        Transform LangGraph events into SSE format.
        
        Yields:
            SSE formatted strings (data: {...}\n\n)
        """
        # Send graph start event
        yield self._format_event(GraphStartEvent(
            type=ExecutionEventType.GRAPH_START,
            timestamp=time.time(),
            executionId=self.execution_id,
            graphId=self.graph_id,
        ))
        
        current_node: str | None = None
        
        async for event in graph_events:
            event_type = event.get("event")
            
            if event_type == "on_chain_start":
                # Node starting
                node_id = self._extract_node_id(event)
                if node_id:
                    current_node = node_id
                    yield self._format_event(NodeStartEvent(
                        type=ExecutionEventType.NODE_START,
                        timestamp=time.time(),
                        executionId=self.execution_id,
                        nodeId=node_id,
                        nodeName=event.get("name"),
                    ))
            
            elif event_type == "on_chat_model_stream":
                # Token streaming
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    yield self._format_event(TokenEvent(
                        type=ExecutionEventType.TOKEN,
                        timestamp=time.time(),
                        executionId=self.execution_id,
                        nodeId=current_node or "unknown",
                        content=chunk.content,
                    ))
            
            elif event_type == "on_chain_end":
                # Node ending
                node_id = self._extract_node_id(event)
                if node_id:
                    output = event.get("data", {}).get("output")
                    yield self._format_event(NodeEndEvent(
                        type=ExecutionEventType.NODE_END,
                        timestamp=time.time(),
                        executionId=self.execution_id,
                        nodeId=node_id,
                        status="success",
                        output=output,
                    ))
            
            elif event_type == "on_chain_error":
                # Error occurred
                error = event.get("data", {}).get("error", "Unknown error")
                yield self._format_event(ErrorEvent(
                    type=ExecutionEventType.ERROR,
                    timestamp=time.time(),
                    executionId=self.execution_id,
                    nodeId=current_node,
                    message=str(error),
                ))
        
        # Send graph complete event
        total_duration = time.time() - self._start_time
        yield self._format_event(GraphCompleteEvent(
            type=ExecutionEventType.GRAPH_COMPLETE,
            timestamp=time.time(),
            executionId=self.execution_id,
            finalState={},  # TODO: Include final state
            totalDuration=total_duration,
        ))
    
    def _extract_node_id(self, event: dict[str, Any]) -> str | None:
        """Extract node ID from a LangGraph event."""
        tags = event.get("tags", [])
        for tag in tags:
            if tag.startswith("node:"):
                return tag.split(":", 1)[1]
        
        # Fallback to name
        name = event.get("name")
        if name and name not in ["RunnableSequence", "LangGraph"]:
            return name
        
        return None
    
    def _format_event(self, event: Any) -> str:
        """Format an event as SSE data."""
        if hasattr(event, "model_dump"):
            data = event.model_dump(by_alias=True)
        else:
            data = event
        return f"data: {json.dumps(data)}\n\n"
