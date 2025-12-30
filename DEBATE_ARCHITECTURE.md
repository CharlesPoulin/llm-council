# LLM Council - Multi-Round Adversarial Debate System

## Overview

LLM Council is a **multi-round adversarial debate system** where 5 specialized role-based AI agents debate user questions through sequential turn-taking, culminating in a balanced synthesis from a moderator.

### Key Features

- **4 Debating Roles**: Each with a distinct perspective and expertise
- **1 Juge/Moderator**: Synthesizes the debate without participating in argumentation
- **Sequential Turn-Taking**: Round-robin debate across 3 fixed rounds
- **Shared Context**: All agents read full debate history before each turn
- **Argument Building**: Agents respond to counter-arguments and introduce new perspectives
- **Repetition Avoidance**: System prompts encourage referencing rather than restating
- **User-Configurable Models**: Each role can be assigned to any Ollama model

---

## Architecture

### The 5 Roles

#### 1. Devil's Advocate (`devils_advocate`)
**Model**: llama3.2:3b (default)
**Purpose**: Critical analysis and risk identification
**Focus**:
- Identify flaws, risks, and downsides
- Challenge assumptions
- Consider worst-case scenarios
- Provide constructive criticism

#### 2. Optimiste/Champion (`optimist`)
**Model**: mistral:7b (default)
**Purpose**: Opportunity identification and benefits
**Focus**:
- Identify opportunities and positive outcomes
- Amplify benefits and possibilities
- Advocate for innovation
- Provide realistic optimism

#### 3. Régulateur/Compliance (`regulator`)
**Model**: qwen2.5:7b (default)
**Purpose**: Legal, regulatory, and ethical analysis
**Focus**:
- Analyze legal implications
- Ensure compliance with standards
- Assess ethical dimensions
- Provide governance guidance

#### 4. CFO/Analyste Financier (`cfo`)
**Model**: gemma2:9b (default)
**Purpose**: Financial analysis and ROI
**Focus**:
- Budget impact assessment
- ROI analysis
- Financial risk identification
- Resource allocation efficiency

#### 5. Juge/Synthétiseur (`juge`)
**Model**: llama3.1:8b (default)
**Purpose**: Debate moderation and synthesis
**Participation**: Stage 3 only (does NOT debate)
**Focus**:
- Synthesize all perspectives
- Balance diverse viewpoints
- Identify consensus and disagreements
- Provide actionable recommendations

---

## Debate Flow

### Structure

```
User Question
    ↓
┌──────────────────────────────────────┐
│  ROUND 1 (Sequential Turns)         │
├──────────────────────────────────────┤
│  1. Devil's Advocate                │
│  2. Optimiste/Champion              │
│  3. Régulateur/Compliance           │
│  4. CFO/Analyste Financier         │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  ROUND 2 (Sequential Turns)         │
├──────────────────────────────────────┤
│  1. Devil's Advocate                │
│     (sees all Round 1 arguments)    │
│  2. Optimiste/Champion              │
│     (sees all previous turns)       │
│  3. Régulateur/Compliance           │
│     (builds on debate history)      │
│  4. CFO/Analyste Financier         │
│     (responds to counter-arguments) │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  ROUND 3 (Final Arguments)          │
├──────────────────────────────────────┤
│  1. Devil's Advocate                │
│  2. Optimiste/Champion              │
│  3. Régulateur/Compliance           │
│  4. CFO/Analyste Financier         │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  JUGE SYNTHESIS                      │
├──────────────────────────────────────┤
│  Reads entire debate transcript      │
│  Synthesizes balanced conclusion     │
│  Provides actionable recommendation  │
└──────────────────────────────────────┘
```

### Turn-Taking Details

**Round 1, Turn 1 (Devil's Advocate)**:
- Receives: User question + role instructions
- Context: No previous debate history
- Task: Provide initial perspective from critical angle

**Round 1, Turn 2 (Optimiste)**:
- Receives: User question + Devil's Advocate's argument + role instructions
- Context: Full Round 1 so far
- Task: Respond to Devil's Advocate, provide optimistic perspective

**Round 2, Turn 1 (Devil's Advocate)**:
- Receives: User question + full Round 1 transcript + role instructions
- Context: All 4 arguments from Round 1
- Task: Build on own argument, respond to other roles, introduce new risks

**...**

**Juge Synthesis**:
- Receives: Complete debate transcript organized by rounds
- Context: All 12 debate turns (3 rounds × 4 roles)
- Task: Synthesize into coherent, balanced final answer

---

## Backend Implementation

### File Structure

```
backend/
├── config.py           # OLLAMA_API_URL, ROLES_DIR
├── roles.py            # Role loading and management
├── council.py          # Debate orchestration
├── openrouter.py       # Ollama API client
├── storage.py          # Conversation persistence
├── main.py             # FastAPI endpoints
└── roles/              # Role definition files
    ├── devils_advocate.md
    ├── optimist.md
    ├── regulator.md
    ├── cfo.md
    └── juge.md
```

### Role Definition Format

Each role is defined in a markdown file with YAML frontmatter:

```markdown
---
role_name: "Devil's Advocate"
role_id: "devils_advocate"
model: "llama3.2:3b"
participates_in_stage1: true
participates_in_stage2: true
participates_in_stage3: false
---

# Stage 1 Instructions
You are the Devil's Advocate in this council...

# Stage 2 Instructions
(Not used in debate system - legacy placeholder)

# Stage 3 Instructions
(Only for Juge role)
```

### Key Functions

#### `roles.py`

```python
class Role:
    """Role with configuration and instructions"""
    role_id: str
    role_name: str
    model: str
    stage1_instructions: str  # Used for debate turns
    stage3_instructions: str  # Only for Juge
    participates_in_stage1: bool  # Debating roles
    participates_in_stage3: bool  # Juge only

def load_all_roles() -> Dict[str, Role]:
    """Load all roles from backend/roles/*.md"""

def get_stage1_roles() -> List[Role]:
    """Get 4 debating roles"""

def get_juge_role() -> Role:
    """Get Juge for synthesis"""

def update_role_model(role_id: str, new_model: str):
    """Update model assignment in markdown file"""
```

#### `council.py`

```python
async def run_multi_round_debate(
    user_query: str,
    num_rounds: int = 3
) -> Tuple[List[Dict], Dict]:
    """
    Run sequential debate with shared context.

    Returns:
        - debate_history: List of turns with round numbers
        - juge_synthesis: Final synthesis from Juge
    """

def _build_debate_context(
    user_query: str,
    role: Role,
    debate_history: List[Dict],
    round_num: int,
    total_rounds: int
) -> List[Dict[str, str]]:
    """
    Build messages for a role's turn.

    Includes:
    - System message with role instructions + debate guidelines
    - Full debate history so far (organized by rounds)
    - Current turn context
    """

async def _juge_synthesize_debate(
    user_query: str,
    debate_history: List[Dict],
    juge: Role
) -> Dict:
    """
    Juge reads complete debate and synthesizes.

    Input: Full transcript of all rounds
    Output: Balanced final answer
    """
```

### Data Structures

**Debate Turn**:
```python
{
    "round": 1,
    "role_id": "devils_advocate",
    "role_name": "Devil's Advocate",
    "model": "llama3.2:3b",
    "message": "From a risk perspective, this proposal..."
}
```

**Debate History** (stage1 for compatibility):
```python
[
    {round: 1, role_id: "devils_advocate", role_name: "...", message: "..."},
    {round: 1, role_id: "optimist", role_name: "...", message: "..."},
    {round: 1, role_id: "regulator", role_name: "...", message: "..."},
    {round: 1, role_id: "cfo", role_name: "...", message: "..."},
    {round: 2, role_id: "devils_advocate", ...},
    # ... 12 total turns for 3 rounds
]
```

**Juge Synthesis** (stage3):
```python
{
    "role_id": "juge",
    "role_name": "Juge/Synthétiseur",
    "model": "llama3.1:8b",
    "response": "After considering all perspectives..."
}
```

**Metadata**:
```python
{
    "total_rounds": 3,
    "total_turns": 12,
    "roles_participated": ["devils_advocate", "optimist", "regulator", "cfo"]
}
```

---

## Frontend Implementation

### Components

#### `DebateRounds.jsx` (replaces Stage1)
- **Purpose**: Display multi-round debate
- **Features**:
  - Round selector tabs (Tour 1, Tour 2, Tour 3)
  - Sequential display of role arguments per round
  - Color-coded borders per role
  - Role name + model display
  - Markdown rendering of arguments

**Layout**:
```
┌────────────────────────────────────┐
│ Débat Multi-Tours                  │
│ [Tour 1] [Tour 2] [Tour 3]        │
├────────────────────────────────────┤
│ ╔════════════════════════════════╗ │
│ ║ Devil's Advocate               ║ │
│ ║ (llama3.2:3b)                  ║ │
│ ╠════════════════════════════════╣ │
│ ║ [argument text...]             ║ │
│ ╚════════════════════════════════╝ │
│                                    │
│ ╔════════════════════════════════╗ │
│ ║ Optimiste/Champion             ║ │
│ ║ (mistral:7b)                   ║ │
│ ╠════════════════════════════════╣ │
│ ║ [argument text...]             ║ │
│ ╚════════════════════════════════╝ │
└────────────────────────────────────┘
```

#### `Stage3.jsx` (updated for Juge)
- **Purpose**: Display Juge synthesis
- **Features**:
  - Green-tinted background
  - Juge role name + model
  - Final balanced recommendation

**No Stage2 Component** (debate system has no rankings)

#### `ChatInterface.jsx`
- **Integration**: Uses DebateRounds + Stage3
- **Loading States**:
  - "Débat en cours: Les rôles argumentent..."
  - "Le Juge synthétise le débat..."

### CSS Styling

**Role-Specific Border Colors**:
```css
.debate-turn:nth-child(1) { border-left-color: #e74c3c; } /* Devil's Advocate - red */
.debate-turn:nth-child(2) { border-left-color: #27ae60; } /* Optimist - green */
.debate-turn:nth-child(3) { border-left-color: #f39c12; } /* Regulator - orange */
.debate-turn:nth-child(4) { border-left-color: #3498db; } /* CFO - blue */
```

---

## API Endpoints

### POST `/api/conversations/{id}/message/stream`

**Streaming Events**:

1. `stage1_start`: Debate begins
2. `stage1_complete`: Debate history returned (all rounds)
   ```json
   {
     "type": "stage1_complete",
     "data": [/* debate_history */]
   }
   ```
3. `stage3_start`: Juge begins synthesis
4. `stage3_complete`: Final synthesis
   ```json
   {
     "type": "stage3_complete",
     "data": {/* juge_synthesis */}
   }
   ```
5. `title_complete`: Conversation title generated
6. `complete`: Stream finished

**No stage2 events** (stage2 is empty for debate system)

---

## Configuration

### Changing Role Models

**Option 1: Edit markdown files directly**
```bash
vim backend/roles/devils_advocate.md
# Change: model: "llama3.2:3b" → model: "qwen2.5:7b"
```

**Option 2: Use API (future enhancement)**
```python
from backend.roles import update_role_model
update_role_model("devils_advocate", "qwen2.5:7b")
```

### Changing Number of Rounds

Edit `backend/main.py` line 152:
```python
debate_history, juge_synthesis = await run_multi_round_debate(
    request.content,
    num_rounds=3  # Change to 2, 4, 5, etc.
)
```

---

## Debate Prompt Engineering

### System Instructions (Debate Context)

Each role receives these guidelines in addition to their role-specific instructions:

```
DEBATE CONTEXT:
You are participating in Round {round_num} of {total_rounds} in a structured debate council.
Your goal is to:
- Build on previous arguments (yours and others')
- Respond to counter-arguments from other roles
- Introduce new points and perspectives relevant to your role
- Avoid repetition - reference previous points briefly rather than restating them
- Keep your response focused and concise (2-3 paragraphs)

Remember: Each role brings a different perspective. Engage with their arguments constructively.
```

### Juge Synthesis Prompt

The Juge receives:
```
Original Question: {user_query}

COMPLETE DEBATE TRANSCRIPT:

=== Round 1 ===
**Devil's Advocate** (devils_advocate):
{message}

**Optimiste/Champion** (optimist):
{message}

...

Your task: Synthesize this debate into a clear, actionable answer to the user's question.
```

---

## Testing

### Role Loader Test
```bash
uv run python -c "
from backend.roles import load_all_roles, get_stage1_roles, get_juge_role
roles = load_all_roles()
print(f'Loaded {len(roles)} roles')
stage1_roles = get_stage1_roles()
print(f'Debating roles: {len(stage1_roles)}')
juge = get_juge_role()
print(f'Juge: {juge.role_name}')
"
```

### Full System Test
1. Start Ollama: `ollama serve`
2. Verify models: `ollama list`
3. Start backend: `uv run python -m backend.main`
4. Start frontend: `npm run dev` (in frontend/)
5. Open: http://localhost:5173
6. Ask question: "Should we adopt a 4-day work week?"
7. Observe:
   - 3 rounds of debate with 4 roles each
   - Juge synthesis balancing all perspectives

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'yaml'"
- **Solution**: Run `uv sync` to install pyyaml

### Backend won't start
- **Check**: Is Ollama running? (`ollama list`)
- **Check**: Are all models pulled? (llama3.2:3b, mistral:7b, qwen2.5:7b, gemma2:9b, llama3.1:8b)
- **Check**: Port 8001 available? (`lsof -i :8001`)

### Debate not progressing
- **Check**: Backend logs for model errors
- **Check**: Role markdown files have valid YAML frontmatter
- **Check**: All 4 debating roles have `participates_in_stage1: true`

### Juge synthesis fails
- **Check**: Juge role has `participates_in_stage3: true`
- **Check**: llama3.1:8b model is pulled
- **Check**: Debate history is non-empty

---

## Future Enhancements

### Planned Features

1. **Dynamic Role Orchestration**
   - Juge decides who speaks next based on context
   - Adaptive round length based on debate quality

2. **Debate Metrics**
   - Track argument coherence
   - Measure role participation balance
   - Analyze consensus vs. disagreement

3. **Custom Roles**
   - UI for creating new roles
   - Role templates (e.g., "Technical Expert", "User Advocate")
   - Role marketplace/sharing

4. **Multi-Model Support**
   - Mix local (Ollama) and remote (OpenRouter) models
   - Cost optimization: cheaper models for debate, premium for synthesis

5. **Streaming Debate Updates**
   - Real-time turn-by-turn streaming
   - Progressive UI updates during debate

6. **Debate History Analytics**
   - Identify which roles contribute most valuable insights
   - Track role model performance over time
   - Optimize model assignments based on performance

---

## Migration Notes

### From 3-Stage System to Debate System

**Breaking Changes**:
- `COUNCIL_MODELS` removed from `config.py` (now in role files)
- `CHAIRMAN_MODEL` removed (now Juge role)
- `stage1_collect_responses()` removed (replaced by `run_multi_round_debate()`)
- `stage2_collect_rankings()` removed (no rankings in debate)
- `calculate_aggregate_rankings()` removed

**Backward Compatibility**:
- API still returns stage1/stage2/stage3 structure
- stage1 = debate_history
- stage2 = [] (empty)
- stage3 = juge_synthesis
- Old conversations still readable (graceful degradation)

---

## Credits

**System Design**: Multi-agent adversarial debate with role specialization
**Backend**: Python, FastAPI, asyncio, Ollama
**Frontend**: React, ReactMarkdown, SSE streaming
**Models**: Llama 3.2, Mistral 7B, Qwen 2.5, Gemma 2, Llama 3.1
