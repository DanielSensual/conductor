"""
Graph Compiler - Hydrates JSON graph into executable LangGraph.
"""
from typing import Any, Callable, Annotated, TypedDict
from operator import add
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph

from conductor.models import ExecutionGraph, GraphNode, GraphEdge
from conductor.nodes import get_node_factory
from conductor.nodes.router import create_router_function


class AgentState(TypedDict, total=False):
    """State dictionary for the agent graph."""
    input: str
    output: str
    messages: list
    final_output: Any
    _started: bool
    _completed: bool


class GraphCompiler:
    """
    Compiles a JSON graph definition into an executable LangGraph.
    
    This is the core "hydration" logic that transforms the frontend's
    visual representation into runnable Python code.
    """
    
    def __init__(
        self,
        graph: ExecutionGraph,
        recursion_limit: int = 10,
    ):
        self.graph = graph
        self.recursion_limit = recursion_limit
        self._node_map: dict[str, Callable] = {}
        self._entry_point: str | None = None
    
    def compile(self) -> CompiledStateGraph:
        """
        Hydrate the JSON graph into an executable LangGraph.
        
        Returns:
            A compiled LangGraph that can be executed with `.invoke()` or `.astream()`.
        """
        # Create the state graph builder
        builder = StateGraph(AgentState)

        # Handle empty graphs with a no-op node to keep compilation safe
        if not self.graph.nodes:
            async def noop(state: dict[str, Any]) -> dict[str, Any]:
                return state

            noop_id = "__noop__"
            self._entry_point = noop_id
            builder.add_node(noop_id, noop)
            builder.set_entry_point(noop_id)
            builder.add_edge(noop_id, END)
            return builder.compile()
        
        # Step 1: Add all nodes
        for node in self.graph.nodes:
            self._add_node(builder, node)
        
        # Step 2: Add all edges
        for edge in self.graph.edges:
            self._add_edge(builder, edge)
        
        # Step 3: Set entry point
        if self._entry_point:
            builder.set_entry_point(self._entry_point)
        elif self.graph.nodes:
            # Default to first node
            builder.set_entry_point(self.graph.nodes[0].id)
        
        # Step 4: Compile with recursion limit
        return builder.compile()
    
    def _add_node(self, builder: StateGraph, node: GraphNode) -> None:
        """Add a node to the graph builder."""
        node_type = node.config.get("type", node.type)
        
        # Mark input nodes as entry points
        if node_type == "input":
            self._entry_point = node.id
        
        # Get the factory function for this node type
        try:
            factory = get_node_factory(node_type)
        except ValueError:
            # Unknown node type, create a pass-through
            async def passthrough(state: dict[str, Any]) -> dict[str, Any]:
                return state
            builder.add_node(node.id, passthrough)
            return
        
        # Create the node function with config
        node_fn = factory(node.config)
        
        # Add to builder
        builder.add_node(node.id, node_fn)
        
        # Store reference
        self._node_map[node.id] = node_fn
    
    def _add_edge(self, builder: StateGraph, edge: GraphEdge) -> None:
        """Add an edge to the graph builder."""
        source = edge.source
        target = edge.target
        
        # Check if source is a router node
        source_node = self._get_node_by_id(source)
        
        if source_node and source_node.config.get("type") == "router":
            # Router nodes need conditional edges
            self._add_conditional_edge(builder, source_node, edge)
        elif edge.condition:
            # Edge has an explicit condition
            self._add_conditional_edge_from_condition(builder, edge)
        else:
            # Simple direct edge
            if target == "__end__" or self._is_output_node(target):
                # Connect to END if target is output or explicit end
                builder.add_edge(source, END)
            else:
                builder.add_edge(source, target)
    
    def _add_conditional_edge(
        self,
        builder: StateGraph,
        router_node: GraphNode,
        edge: GraphEdge,
    ) -> None:
        """Add conditional edges from a router node."""
        # Get all edges from this router
        router_edges = [e for e in self.graph.edges if e.source == router_node.id]
        
        # Build the routing map
        route_map: dict[str, str] = {}
        for e in router_edges:
            handle = e.sourceHandle or "default"
            target = e.target if e.target != "__end__" else END
            route_map[handle] = target
        
        # Create router function from conditions
        conditions = router_node.config.get("conditions", [])
        route_fn = create_router_function(conditions)
        
        # Add conditional edges
        builder.add_conditional_edges(
            router_node.id,
            route_fn,
            route_map,
        )
    
    def _add_conditional_edge_from_condition(
        self,
        builder: StateGraph,
        edge: GraphEdge,
    ) -> None:
        """Add a conditional edge based on edge condition."""
        condition = edge.condition
        if not condition:
            builder.add_edge(edge.source, edge.target)
            return
        
        # Create a simple condition function
        def check_condition(state: dict[str, Any]) -> str:
            field_value = state.get(condition.field)
            target_value = condition.value
            op = condition.operator
            
            # Evaluate
            result = False
            try:
                if op == "eq":
                    result = field_value == target_value
                elif op == "neq":
                    result = field_value != target_value
                elif op == "lt":
                    result = float(field_value) < float(target_value)
                elif op == "gt":
                    result = float(field_value) > float(target_value)
                elif op == "contains":
                    result = str(target_value) in str(field_value)
            except (ValueError, TypeError):
                result = False
            
            return edge.target if result else END
        
        builder.add_conditional_edges(
            edge.source,
            check_condition,
            {edge.target: edge.target, END: END},
        )
    
    def _get_node_by_id(self, node_id: str) -> GraphNode | None:
        """Get a node by its ID."""
        for node in self.graph.nodes:
            if node.id == node_id:
                return node
        return None
    
    def _is_output_node(self, node_id: str) -> bool:
        """Check if a node is an output node."""
        node = self._get_node_by_id(node_id)
        if node:
            return node.config.get("type") == "output"
        return False
