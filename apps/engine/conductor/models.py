"""
Pydantic models matching the frontend schema.
"""
from enum import Enum
from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


# =============================================================================
# Node Types
# =============================================================================

class NodeType(str, Enum):
    AGENT = "agent"
    TOOL = "tool"
    ROUTER = "router"
    INPUT = "input"
    OUTPUT = "output"


class Position(BaseModel):
    x: float
    y: float


class AgentConfig(BaseModel):
    type: Literal["agent"] = "agent"
    label: str
    model: str = "gpt-4o"
    systemPrompt: str = "You are a helpful assistant."
    temperature: float = 0.7
    maxTokens: Optional[int] = None
    status: str = "idle"


class ToolConfig(BaseModel):
    type: Literal["tool"] = "tool"
    label: str
    functionName: str = ""
    parameters: dict[str, Any] = Field(default_factory=dict)
    status: str = "idle"


class RouterCondition(BaseModel):
    field: str
    operator: Literal["eq", "neq", "lt", "lte", "gt", "gte", "contains", "not_contains"]
    value: Union[str, int, float, bool]
    targetHandle: str


class RouterConfig(BaseModel):
    type: Literal["router"] = "router"
    label: str
    conditions: list[RouterCondition] = Field(default_factory=list)
    status: str = "idle"


class InputConfig(BaseModel):
    type: Literal["input"] = "input"
    label: str
    status: str = "idle"


class OutputConfig(BaseModel):
    type: Literal["output"] = "output"
    label: str
    status: str = "idle"


NodeConfig = Union[AgentConfig, ToolConfig, RouterConfig, InputConfig, OutputConfig]


# =============================================================================
# Graph Schema
# =============================================================================

class GraphNode(BaseModel):
    id: str
    type: str  # "agent", "tool", etc.
    config: dict[str, Any]  # Flexible config
    position: Position


class EdgeCondition(BaseModel):
    field: str
    operator: Literal["eq", "neq", "lt", "lte", "gt", "gte", "contains", "not_contains"]
    value: Union[str, int, float, bool]


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    condition: Optional[EdgeCondition] = None
    hasBreakpoint: bool = False


class ExecutionGraph(BaseModel):
    version: str = "1.0"
    id: str
    name: str = "Untitled Graph"
    description: Optional[str] = None
    nodes: list[GraphNode]
    edges: list[GraphEdge]


# =============================================================================
# Execution Events
# =============================================================================

class ExecutionEventType(str, Enum):
    GRAPH_START = "graph_start"
    NODE_START = "node_start"
    THOUGHT = "thought"
    TOKEN = "token"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    NODE_END = "node_end"
    EDGE_TRAVERSE = "edge_traverse"
    BREAKPOINT_HIT = "breakpoint_hit"
    GRAPH_COMPLETE = "graph_complete"
    ERROR = "error"


class BaseEvent(BaseModel):
    type: ExecutionEventType
    timestamp: float
    executionId: str


class GraphStartEvent(BaseEvent):
    type: Literal[ExecutionEventType.GRAPH_START] = ExecutionEventType.GRAPH_START
    graphId: str


class NodeStartEvent(BaseEvent):
    type: Literal[ExecutionEventType.NODE_START] = ExecutionEventType.NODE_START
    nodeId: str
    nodeName: Optional[str] = None


class ThoughtEvent(BaseEvent):
    type: Literal[ExecutionEventType.THOUGHT] = ExecutionEventType.THOUGHT
    nodeId: str
    content: str


class TokenEvent(BaseEvent):
    type: Literal[ExecutionEventType.TOKEN] = ExecutionEventType.TOKEN
    nodeId: str
    content: str


class NodeEndEvent(BaseEvent):
    type: Literal[ExecutionEventType.NODE_END] = ExecutionEventType.NODE_END
    nodeId: str
    status: Literal["success", "error"]
    output: Optional[Any] = None
    error: Optional[str] = None


class EdgeTraverseEvent(BaseEvent):
    type: Literal[ExecutionEventType.EDGE_TRAVERSE] = ExecutionEventType.EDGE_TRAVERSE
    edgeId: str
    fromNode: str = Field(alias="from")
    toNode: str = Field(alias="to")

    model_config = ConfigDict(populate_by_name=True)


class GraphCompleteEvent(BaseEvent):
    type: Literal[ExecutionEventType.GRAPH_COMPLETE] = ExecutionEventType.GRAPH_COMPLETE
    finalState: dict[str, Any]
    totalDuration: float


class ErrorEvent(BaseEvent):
    type: Literal[ExecutionEventType.ERROR] = ExecutionEventType.ERROR
    nodeId: Optional[str] = None
    message: str
    stack: Optional[str] = None


ExecutionEvent = Union[
    GraphStartEvent,
    NodeStartEvent,
    ThoughtEvent,
    TokenEvent,
    NodeEndEvent,
    EdgeTraverseEvent,
    GraphCompleteEvent,
    ErrorEvent,
]


# =============================================================================
# API Types
# =============================================================================

class ExecuteGraphRequest(BaseModel):
    graph: ExecutionGraph
    initialInput: dict[str, Any] = Field(default_factory=dict)
    options: Optional[dict[str, Any]] = None


class ExecuteGraphResponse(BaseModel):
    executionId: str
    status: Literal["running", "completed", "paused", "error"]
