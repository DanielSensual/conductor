"""
Node Registry - Maps node types to Python implementations.
"""
from typing import Any, Callable, TypeVar

from conductor.nodes.agent import create_agent_node
from conductor.nodes.tool import create_tool_node
from conductor.nodes.router import create_router_node
from conductor.nodes.io import create_input_node, create_output_node

# Type for node factory functions
NodeFactory = Callable[[dict[str, Any]], Callable[[dict[str, Any]], dict[str, Any]]]

# Registry mapping node type strings to factory functions
NODE_REGISTRY: dict[str, NodeFactory] = {
    "agent": create_agent_node,
    "tool": create_tool_node,
    "router": create_router_node,
    "input": create_input_node,
    "output": create_output_node,
}


def get_node_factory(node_type: str) -> NodeFactory:
    """Get the factory function for a node type."""
    if node_type not in NODE_REGISTRY:
        raise ValueError(f"Unknown node type: {node_type}")
    return NODE_REGISTRY[node_type]


def register_node_type(node_type: str, factory: NodeFactory) -> None:
    """Register a new node type (for extensibility)."""
    NODE_REGISTRY[node_type] = factory
