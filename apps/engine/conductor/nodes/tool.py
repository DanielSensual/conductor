"""
Tool Node - Python function execution.
"""
from typing import Any, Callable


# Built-in tool implementations
BUILTIN_TOOLS: dict[str, Callable[..., Any]] = {
    "echo": lambda text: f"Echo: {text}",
    "add": lambda a, b: a + b,
    "search_placeholder": lambda query: f"Search results for: {query} (placeholder)",
}


def create_tool_node(config: dict[str, Any]) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """
    Factory function that creates a tool node callable.
    
    Args:
        config: Node configuration containing functionName and parameters.
    
    Returns:
        A callable that takes state and returns updated state.
    """
    function_name = config.get("functionName", "")
    default_params = config.get("parameters", {})
    
    async def tool_node(state: dict[str, Any]) -> dict[str, Any]:
        """Execute the tool node."""
        # Get the tool function
        if function_name not in BUILTIN_TOOLS:
            return {
                **state,
                "error": f"Unknown tool: {function_name}",
            }
        
        tool_fn = BUILTIN_TOOLS[function_name]
        
        # Merge default params with state params
        params = {**default_params}
        if "tool_params" in state:
            params.update(state["tool_params"])
        
        try:
            # Execute the tool
            result = tool_fn(**params)
            return {
                **state,
                "tool_result": result,
                "output": str(result),
            }
        except Exception as e:
            return {
                **state,
                "error": str(e),
            }
    
    return tool_node


def register_tool(name: str, fn: Callable[..., Any]) -> None:
    """Register a custom tool function."""
    BUILTIN_TOOLS[name] = fn
