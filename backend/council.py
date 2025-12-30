"""Multi-round debate LLM Council orchestration."""

import asyncio
from typing import List, Dict, Any, Tuple
from .openrouter import query_model
from .roles import get_stage1_roles, get_juge_role


async def run_multi_round_debate(
    user_query: str,
    num_rounds: int = 3,
    progress_callback = None
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Run a multi-round structured debate between council roles.

    Args:
        user_query: The user's question
        num_rounds: Number of debate rounds (default 3)
        progress_callback: Optional async function to call with progress updates

    Returns:
        Tuple of (debate_history, juge_synthesis)
    """
    # Get debating roles (4 roles: Devil's Advocate, Optimist, Regulator, CFO)
    debating_roles = get_stage1_roles()  # These participate in debate
    juge = get_juge_role()  # Moderator and synthesizer

    # Initialize debate history
    debate_history = []

    # Run debate rounds
    for round_num in range(1, num_rounds + 1):
        # Sequential turn-taking (round-robin)
        for role in debating_roles:
            # Build context for this role's turn
            messages = _build_debate_context(
                user_query=user_query,
                role=role,
                debate_history=debate_history,
                round_num=round_num,
                total_rounds=num_rounds
            )

            # Notify progress callback before querying
            if progress_callback:
                await progress_callback({
                    'stage': 'debate',
                    'role_name': role.role_name,
                    'role_id': role.role_id,
                    'model': role.model,
                    'round': round_num,
                    'status': 'querying'
                })

            # Query the model for this role
            import time
            start_time = time.time()
            response = await query_model(role.model, messages, timeout=300.0)
            elapsed_time = time.time() - start_time

            if response is not None:
                # Add this turn to debate history
                debate_history.append({
                    "round": round_num,
                    "role_id": role.role_id,
                    "role_name": role.role_name,
                    "model": role.model,
                    "message": response.get('content', ''),
                    "elapsed_time": elapsed_time
                })

                # Notify progress callback after successful query
                if progress_callback:
                    await progress_callback({
                        'stage': 'debate',
                        'role_name': role.role_name,
                        'role_id': role.role_id,
                        'model': role.model,
                        'round': round_num,
                        'status': 'complete',
                        'elapsed_time': elapsed_time
                    })

    # After all rounds, Juge synthesizes the debate
    # Check if we have any responses before attempting synthesis
    if not debate_history:
        raise ValueError(
            "No models responded successfully. Please ensure Ollama is running "
            "and models are available. Run 'ollama serve' to start Ollama."
        )

    juge_synthesis = await _juge_synthesize_debate(
        user_query=user_query,
        debate_history=debate_history,
        juge=juge,
        progress_callback=progress_callback
    )

    return debate_history, juge_synthesis


def _build_debate_context(
    user_query: str,
    role,
    debate_history: List[Dict[str, Any]],
    round_num: int,
    total_rounds: int
) -> List[Dict[str, str]]:
    """
    Build the conversation context for a role's turn in the debate.

    Args:
        user_query: Original user question
        role: The Role object for the current speaker
        debate_history: List of all previous debate turns
        round_num: Current round number
        total_rounds: Total number of debate rounds

    Returns:
        List of message dicts for the API call
    """
    messages = []

    # System message with role instructions + debate guidelines
    system_instruction = f"""{role.stage1_instructions}

DEBATE CONTEXT:
You are participating in Round {round_num} of {total_rounds} in a structured debate council.
Your goal is to:
- Build on previous arguments (yours and others')
- Respond to counter-arguments from other roles
- Introduce new points and perspectives relevant to your role
- Avoid repetition - reference previous points briefly rather than restating them
- Keep your response focused and concise (2-3 paragraphs)

Remember: Each role brings a different perspective. Engage with their arguments constructively."""

    messages.append({"role": "system", "content": system_instruction})

    # User query
    if round_num == 1 and len(debate_history) == 0:
        # First turn of first round - just the question
        messages.append({"role": "user", "content": f"Question to debate: {user_query}"})
    else:
        # Build the full debate context
        debate_context = f"Question to debate: {user_query}\n\n"
        debate_context += "DEBATE SO FAR:\n\n"

        # Group by rounds for clarity
        for r in range(1, round_num + 1):
            round_messages = [msg for msg in debate_history if msg['round'] == r]
            if round_messages:
                debate_context += f"--- Round {r} ---\n\n"
                for msg in round_messages:
                    debate_context += f"**{msg['role_name']}**: {msg['message']}\n\n"

        debate_context += f"\nNow it's your turn (Round {round_num}). Respond to the debate:"

        messages.append({"role": "user", "content": debate_context})

    return messages


async def _juge_synthesize_debate(
    user_query: str,
    debate_history: List[Dict[str, Any]],
    juge,
    progress_callback = None
) -> Dict[str, Any]:
    """
    Juge synthesizes the entire debate into a final recommendation.

    Args:
        user_query: Original user question
        debate_history: Complete debate history
        juge: The Juge Role object
        progress_callback: Optional async function to call with progress updates

    Returns:
        Dict with role info and synthesis
    """
    # Build comprehensive debate summary for Juge
    debate_summary = f"Original Question: {user_query}\n\n"
    debate_summary += "COMPLETE DEBATE TRANSCRIPT:\n\n"

    # Organize by rounds
    max_round = max([msg['round'] for msg in debate_history]) if debate_history else 0

    for round_num in range(1, max_round + 1):
        round_messages = [msg for msg in debate_history if msg['round'] == round_num]
        if round_messages:
            debate_summary += f"=== Round {round_num} ===\n\n"
            for msg in round_messages:
                debate_summary += f"**{msg['role_name']}** ({msg['role_id']}):\n{msg['message']}\n\n"

    # Add synthesis instructions
    synthesis_prompt = debate_summary + "\n---\n\nYour task: Synthesize this debate into a clear, actionable answer to the user's question."

    messages = [
        {"role": "system", "content": juge.stage3_instructions},
        {"role": "user", "content": synthesis_prompt}
    ]

    # Notify progress callback before querying
    if progress_callback:
        await progress_callback({
            'stage': 'synthesis',
            'role_name': juge.role_name,
            'role_id': juge.role_id,
            'model': juge.model,
            'status': 'querying'
        })

    import time
    start_time = time.time()
    response = await query_model(juge.model, messages, timeout=300.0)
    elapsed_time = time.time() - start_time

    if response is None:
        return {
            "role_id": juge.role_id,
            "role_name": juge.role_name,
            "model": juge.model,
            "response": "Error: Unable to generate synthesis."
        }

    # Notify progress callback after successful query
    if progress_callback:
        await progress_callback({
            'stage': 'synthesis',
            'role_name': juge.role_name,
            'role_id': juge.role_id,
            'model': juge.model,
            'status': 'complete',
            'elapsed_time': elapsed_time
        })

    return {
        "role_id": juge.role_id,
        "role_name": juge.role_name,
        "model": juge.model,
        "response": response.get('content', ''),
        "elapsed_time": elapsed_time
    }


# Legacy function for backward compatibility with API
async def run_full_council(user_query: str) -> Tuple[List, List, Dict, Dict]:
    """
    Run the complete debate council process.

    This function maintains backward compatibility with the API expectations
    but now runs a multi-round debate instead of 3 stages.

    Args:
        user_query: The user's question

    Returns:
        Tuple of (debate_history, [], juge_synthesis, metadata)
        Note: Second element is empty list (legacy stage2 placeholder)
    """
    # Run the multi-round debate (reduced to 1 round for testing)
    debate_history, juge_synthesis = await run_multi_round_debate(user_query, num_rounds=1)

    # For API compatibility, return debate_history as "stage1"
    # Empty list for "stage2" (no rankings in debate system)
    # Juge synthesis as "stage3"

    metadata = {
        "total_rounds": max([msg['round'] for msg in debate_history]) if debate_history else 0,
        "total_turns": len(debate_history),
        "roles_participated": list(set([msg['role_id'] for msg in debate_history]))
    }

    return debate_history, [], juge_synthesis, metadata


# Title generation (unchanged)
async def generate_conversation_title(user_query: str) -> str:
    """
    Generate a short title for a conversation based on the first user message.

    Args:
        user_query: The first user message

    Returns:
        A short title (3-5 words)
    """
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]

    # Use a fast model for title generation
    response = await query_model("llama3.2:3b", messages, timeout=30.0)

    if response is None:
        return "New Conversation"

    title = response.get('content', 'New Conversation').strip()
    title = title.strip('"\'')

    if len(title) > 50:
        title = title[:47] + "..."

    return title
