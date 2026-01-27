"""
Input/Output Nodes - Graph entry and exit points.
"""
from typing import Any, Callable


def create_input_node(config: dict[str, Any]) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """
    Factory function for input node (graph entry point).
    
    The input node passes through the initial state unchanged,
    just marking that execution has started.
    """
    async def input_node(state: dict[str, Any]) -> dict[str, Any]:
        """Pass through the input state."""
        return {
            **state,
            "_started": True,
        }
    
    return input_node


def create_output_node(config: dict[str, Any]) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """
    Factory function for output node (graph exit point).
    
    The output node marks the final state and can perform
    any output mapping specified in config.
    """
    output_mapping = config.get("outputMapping", {})
    
    async def output_node(state: dict[str, Any]) -> dict[str, Any]:
        """Finalize the output state."""
        final_output = {}
        
        if output_mapping:
            # Apply output mapping
            for output_key, state_key in output_mapping.items():
                if state_key in state:
                    final_output[output_key] = state[state_key]
        else:
            # Default: use 'output' key or entire state
            final_output = state.get("output", state)
        
        return {
            **state,
            "_completed": True,
            "final_output": final_output,
        }
    
    return output_node
