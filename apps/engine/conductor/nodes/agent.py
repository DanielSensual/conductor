"""
Agent Node - LLM-powered node implementation.
"""
from typing import Any, Callable
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from conductor.config import get_settings


def create_agent_node(config: dict[str, Any]) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """
    Factory function that creates an agent node callable.
    
    Args:
        config: Node configuration containing model, systemPrompt, temperature, etc.
    
    Returns:
        A callable that takes state and returns updated state.
    """
    model_name = config.get("model", "gpt-4o")
    system_prompt = config.get("systemPrompt", "You are a helpful assistant.")
    temperature = config.get("temperature", 0.7)
    max_tokens = config.get("maxTokens")
    llm: ChatOpenAI | None = None

    def get_llm() -> ChatOpenAI:
        """Lazily create the LLM to avoid requiring API keys at compile time."""
        nonlocal llm
        if llm is not None:
            return llm

        settings = get_settings()
        api_key = (settings.openai_api_key or "").strip()
        if not api_key:
            raise RuntimeError(
                "OpenAI API key is missing. Set OPENAI_API_KEY or configure "
                "settings.openai_api_key to execute agent nodes."
            )

        llm = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            streaming=True,
        )
        return llm
    
    async def agent_node(state: dict[str, Any]) -> dict[str, Any]:
        """Execute the agent node."""
        # Get input from state
        input_text = state.get("input", "")
        messages_history = state.get("messages", [])
        
        # Build messages
        messages = [SystemMessage(content=system_prompt)]
        messages.extend(messages_history)
        
        if input_text:
            messages.append(HumanMessage(content=input_text))
        
        # Call the LLM
        response = await get_llm().ainvoke(messages)
        
        # Update state
        return {
            **state,
            "output": response.content,
            "messages": messages_history + [
                HumanMessage(content=input_text) if input_text else None,
                response,
            ],
        }
    
    return agent_node
