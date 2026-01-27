"""
Mock utilities for testing without API keys.
"""
from typing import Any, List, Optional
from unittest.mock import MagicMock, AsyncMock

from langchain_core.messages import AIMessage, BaseMessage


class MockChatOpenAI:
    """
    Mock ChatOpenAI that returns deterministic responses.
    
    Usage:
        with MockChatOpenAI.patch():
            # All ChatOpenAI calls now return mock responses
            result = agent_node(state)
    """
    
    def __init__(
        self,
        model: str = "mock-model",
        temperature: float = 0.0,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None,
        streaming: bool = False,
        **kwargs: Any,
    ):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.streaming = streaming
        self._response_content = "This is a mock response from the AI assistant."
    
    def set_response(self, content: str) -> None:
        """Set the mock response content."""
        self._response_content = content
    
    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        """Synchronous invoke."""
        return AIMessage(content=self._response_content)
    
    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        """Async invoke - returns deterministic response."""
        return AIMessage(content=self._response_content)
    
    @classmethod
    def patch(cls) -> "MockChatOpenAIPatcher":
        """
        Context manager to patch ChatOpenAI with the mock.
        
        Usage:
            with MockChatOpenAI.patch() as mock:
                mock.set_response("Custom response")
                result = await agent_node(state)
        """
        return MockChatOpenAIPatcher()


class MockChatOpenAIPatcher:
    """Context manager for patching ChatOpenAI."""
    
    def __init__(self):
        self._patcher = None
        self._mock_instance = MockChatOpenAI()
    
    def set_response(self, content: str) -> None:
        """Set the mock response content."""
        self._mock_instance.set_response(content)
    
    def __enter__(self) -> "MockChatOpenAIPatcher":
        from unittest.mock import patch
        self._patcher = patch(
            "conductor.nodes.agent.ChatOpenAI",
            return_value=self._mock_instance
        )
        self._patcher.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._patcher:
            self._patcher.stop()
    
    async def __aenter__(self) -> "MockChatOpenAIPatcher":
        return self.__enter__()
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        self.__exit__(exc_type, exc_val, exc_tb)


def create_mock_settings(openai_api_key: str = "mock-api-key") -> MagicMock:
    """Create mock settings with a fake API key."""
    settings = MagicMock()
    settings.openai_api_key = openai_api_key
    return settings
