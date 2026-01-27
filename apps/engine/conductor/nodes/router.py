"""
Router Node - Conditional branching logic.
"""
from typing import Any, Callable


def create_router_node(config: dict[str, Any]) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """
    Factory function that creates a router node callable.
    
    The router evaluates conditions and sets a 'route' key in state
    that determines which edge to follow.
    
    Args:
        config: Node configuration containing conditions.
    
    Returns:
        A callable that takes state and returns updated state.
    """
    conditions = config.get("conditions", [])
    
    async def router_node(state: dict[str, Any]) -> dict[str, Any]:
        """Evaluate conditions and set route."""
        for condition in conditions:
            field = condition.get("field", "")
            operator = condition.get("operator", "eq")
            value = condition.get("value")
            target_handle = condition.get("targetHandle", "true")
            
            # Get the field value from state
            field_value = state.get(field)
            
            # Evaluate the condition
            if evaluate_condition(field_value, operator, value):
                return {
                    **state,
                    "route": target_handle,
                }
        
        # No condition matched, use default (false)
        return {
            **state,
            "route": "false",
        }
    
    return router_node


def evaluate_condition(field_value: Any, operator: str, target_value: Any) -> bool:
    """Evaluate a single condition."""
    try:
        if operator == "eq":
            return field_value == target_value
        elif operator == "neq":
            return field_value != target_value
        elif operator == "lt":
            return float(field_value) < float(target_value)
        elif operator == "lte":
            return float(field_value) <= float(target_value)
        elif operator == "gt":
            return float(field_value) > float(target_value)
        elif operator == "gte":
            return float(field_value) >= float(target_value)
        elif operator == "contains":
            return str(target_value) in str(field_value)
        elif operator == "not_contains":
            return str(target_value) not in str(field_value)
        else:
            return False
    except (ValueError, TypeError):
        return False


def create_router_function(conditions: list[dict[str, Any]]) -> Callable[[dict[str, Any]], str]:
    """
    Create a router function for LangGraph conditional edges.
    
    Returns:
        A function that takes state and returns the next node ID.
    """
    def route_fn(state: dict[str, Any]) -> str:
        """Determine the next node based on state."""
        for condition in conditions:
            field = condition.get("field", "")
            operator = condition.get("operator", "eq")
            value = condition.get("value")
            target = condition.get("target", "")
            
            field_value = state.get(field)
            
            if evaluate_condition(field_value, operator, value):
                return target
        
        # Return default target or END
        return condition.get("defaultTarget", "__end__")
    
    return route_fn
