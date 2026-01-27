"""
Test graph compilation and hydration.
"""
import pytest
from unittest.mock import patch

from conductor.models import ExecutionGraph, GraphNode, GraphEdge, Position
from conductor.hydration import GraphCompiler
from tests.mocks import MockChatOpenAI, create_mock_settings


def create_simple_graph() -> ExecutionGraph:
    """Create a simple input -> agent -> output graph for testing."""
    return ExecutionGraph(
        id="test-graph-1",
        name="Test Graph",
        nodes=[
            GraphNode(
                id="input-1",
                type="input",
                config={"type": "input", "label": "Input"},
                position=Position(x=0, y=0),
            ),
            GraphNode(
                id="agent-1",
                type="agent",
                config={
                    "type": "agent",
                    "label": "Agent",
                    "model": "gpt-4o",
                    "systemPrompt": "You are a test assistant.",
                    "temperature": 0.5,
                },
                position=Position(x=200, y=0),
            ),
            GraphNode(
                id="output-1",
                type="output",
                config={"type": "output", "label": "Output"},
                position=Position(x=400, y=0),
            ),
        ],
        edges=[
            GraphEdge(id="e1", source="input-1", target="agent-1"),
            GraphEdge(id="e2", source="agent-1", target="output-1"),
        ],
    )


def test_compiler_creates_graph():
    """Test that the compiler creates a LangGraph from JSON."""
    graph = create_simple_graph()
    compiler = GraphCompiler(graph)
    compiled = compiler.compile()
    
    # Verify it's a compiled graph
    assert compiled is not None
    assert hasattr(compiled, "invoke")
    assert hasattr(compiled, "ainvoke")


def test_compiler_sets_entry_point():
    """Test that input nodes become entry points."""
    graph = create_simple_graph()
    compiler = GraphCompiler(graph)
    
    # Before compilation
    assert compiler._entry_point is None
    
    # After compilation
    compiler.compile()
    assert compiler._entry_point == "input-1"


def test_compiler_handles_empty_graph():
    """Test handling of empty graphs."""
    graph = ExecutionGraph(id="empty", name="Empty", nodes=[], edges=[])
    compiler = GraphCompiler(graph)
    
    # Should not crash
    compiled = compiler.compile()
    assert compiled is not None


def test_empty_graph_has_noop_entry_point():
    """Test that empty graphs create a __noop__ node as entry point."""
    graph = ExecutionGraph(id="empty", name="Empty", nodes=[], edges=[])
    compiler = GraphCompiler(graph)
    
    compiler.compile()
    
    # Verify the entry point is the noop node
    assert compiler._entry_point == "__noop__"


@pytest.mark.asyncio
async def test_empty_graph_is_executable():
    """Test that empty graphs can be executed (invoked)."""
    graph = ExecutionGraph(id="empty", name="Empty", nodes=[], edges=[])
    compiler = GraphCompiler(graph)
    compiled = compiler.compile()
    
    # Should be able to invoke with initial state
    initial_state = {"input": "test", "messages": []}
    result = await compiled.ainvoke(initial_state)
    
    # Result should pass through unchanged (noop behavior)
    assert result["input"] == "test"


@pytest.mark.asyncio
async def test_agent_node_with_mock_llm():
    """Test agent node execution with mock LLM (no API key required)."""
    from conductor.nodes.agent import create_agent_node
    
    # Create agent node
    config = {
        "model": "gpt-4o",
        "systemPrompt": "You are a test assistant.",
        "temperature": 0.5,
    }
    agent_fn = create_agent_node(config)
    
    # Mock the settings and ChatOpenAI
    with patch("conductor.nodes.agent.get_settings", return_value=create_mock_settings()):
        with MockChatOpenAI.patch() as mock:
            mock.set_response("Hello from mock AI!")
            
            # Execute the agent
            state = {"input": "Hello", "messages": []}
            result = await agent_fn(state)
            
            # Verify mock response was used
            assert result["output"] == "Hello from mock AI!"


@pytest.mark.asyncio
async def test_full_graph_execution_with_mock():
    """Test full graph execution with mock LLM."""
    graph = create_simple_graph()
    
    # Mock the settings and LLM - must be active BEFORE compilation
    # so the agent node factory captures the mock
    with patch("conductor.nodes.agent.get_settings", return_value=create_mock_settings()):
        with MockChatOpenAI.patch() as mock:
            mock.set_response("Processed: test input successfully")
            
            # Compile within the mock context
            compiler = GraphCompiler(graph)
            compiled = compiler.compile()
            
            # Execute the graph
            result = await compiled.ainvoke({"input": "test input", "messages": []})
            
            # Verify output
            assert result is not None
            assert "output" in result
            assert "Processed:" in result["output"]
