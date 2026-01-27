"""
Execute API - Graph execution endpoint with SSE streaming.
"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from conductor.models import ExecuteGraphRequest, ExecuteGraphResponse
from conductor.hydration import GraphCompiler
from conductor.streaming import EventStreamer

router = APIRouter(prefix="/api", tags=["execution"])


@router.post("/execute", response_model=ExecuteGraphResponse)
async def execute_graph(request: ExecuteGraphRequest):
    """
    Execute a graph and return execution ID.
    
    For streaming results, use the SSE endpoint.
    """
    execution_id = str(uuid.uuid4())
    
    try:
        # Compile the graph
        compiler = GraphCompiler(
            graph=request.graph,
            recursion_limit=request.options.get("recursionLimit", 10) if request.options else 10,
        )
        compiled = compiler.compile()
        
        # Execute synchronously (non-streaming)
        result = await compiled.ainvoke(request.initialInput)
        
        return ExecuteGraphResponse(
            executionId=execution_id,
            status="completed",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/stream")
async def execute_graph_stream(request: ExecuteGraphRequest):
    """
    Execute a graph with SSE streaming.
    
    Returns:
        Server-Sent Events stream with execution progress.
    """
    execution_id = str(uuid.uuid4())
    
    try:
        # Compile the graph
        compiler = GraphCompiler(
            graph=request.graph,
            recursion_limit=request.options.get("recursionLimit", 10) if request.options else 10,
        )
        compiled = compiler.compile()
        
        # Create event streamer
        streamer = EventStreamer(
            execution_id=execution_id,
            graph_id=request.graph.id,
        )
        
        async def event_generator():
            """Generate SSE events from graph execution."""
            try:
                # Stream events from LangGraph
                async for event in streamer.stream_events(
                    compiled.astream_events(request.initialInput, version="v2")
                ):
                    yield event
            except Exception as e:
                # Send error event
                import json
                import time
                error_event = {
                    "type": "error",
                    "timestamp": time.time(),
                    "executionId": execution_id,
                    "message": str(e),
                }
                yield f"data: {json.dumps(error_event)}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Execution-ID": execution_id,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "conductor-engine"}
