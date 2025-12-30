"""Role management for the LLM Council adversarial system."""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional
import yaml


class Role:
    """Represents a council role with its configuration and instructions."""

    def __init__(
        self,
        role_id: str,
        role_name: str,
        model: str,
        stage1_instructions: str,
        stage2_instructions: str,
        stage3_instructions: str,
        participates_in_stage1: bool,
        participates_in_stage2: bool,
        participates_in_stage3: bool,
    ):
        self.role_id = role_id
        self.role_name = role_name
        self.model = model
        self.stage1_instructions = stage1_instructions
        self.stage2_instructions = stage2_instructions
        self.stage3_instructions = stage3_instructions
        self.participates_in_stage1 = participates_in_stage1
        self.participates_in_stage2 = participates_in_stage2
        self.participates_in_stage3 = participates_in_stage3

    def __repr__(self):
        return f"Role(role_id='{self.role_id}', role_name='{self.role_name}', model='{self.model}')"


def load_role(role_file_path: str) -> Role:
    """
    Load a single role from markdown file with YAML frontmatter.

    Args:
        role_file_path: Path to the role markdown file

    Returns:
        Role object with parsed configuration and instructions
    """
    with open(role_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract YAML frontmatter (between --- markers)
    frontmatter_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not frontmatter_match:
        raise ValueError(f"No YAML frontmatter found in {role_file_path}")

    frontmatter_text = frontmatter_match.group(1)
    metadata = yaml.safe_load(frontmatter_text)

    # Extract markdown body (everything after the frontmatter)
    body_start = frontmatter_match.end()
    body = content[body_start:]

    # Extract Stage 1, 2, and 3 instructions sections
    stage1_instructions = _extract_section(body, "Stage 1 Instructions")
    stage2_instructions = _extract_section(body, "Stage 2 Instructions")
    stage3_instructions = _extract_section(body, "Stage 3 Instructions")

    return Role(
        role_id=metadata['role_id'],
        role_name=metadata['role_name'],
        model=metadata['model'],
        stage1_instructions=stage1_instructions,
        stage2_instructions=stage2_instructions,
        stage3_instructions=stage3_instructions,
        participates_in_stage1=metadata.get('participates_in_stage1', False),
        participates_in_stage2=metadata.get('participates_in_stage2', False),
        participates_in_stage3=metadata.get('participates_in_stage3', False),
    )


def _extract_section(markdown_text: str, section_header: str) -> str:
    """
    Extract content from a markdown section.

    Args:
        markdown_text: The markdown content
        section_header: The section header (without #)

    Returns:
        The section content (trimmed)
    """
    # Look for "# Section Header" followed by content until next # header or end
    pattern = rf'#\s+{re.escape(section_header)}\s*\n(.*?)(?=\n#\s+|\Z)'
    match = re.search(pattern, markdown_text, re.DOTALL)

    if match:
        return match.group(1).strip()
    return ""


# Global cache for loaded roles
_roles_cache: Optional[Dict[str, Role]] = None


def load_all_roles() -> Dict[str, Role]:
    """
    Load all roles from backend/roles/ directory.

    Returns:
        Dict mapping role_id -> Role object
    """
    global _roles_cache

    # Return cached roles if available
    if _roles_cache is not None:
        return _roles_cache

    roles_dir = Path(__file__).parent / "roles"

    if not roles_dir.exists():
        raise FileNotFoundError(f"Roles directory not found: {roles_dir}")

    roles = {}
    for role_file in roles_dir.glob("*.md"):
        try:
            role = load_role(str(role_file))
            roles[role.role_id] = role
        except Exception as e:
            print(f"Warning: Failed to load role from {role_file}: {e}")

    if not roles:
        raise ValueError(f"No valid roles found in {roles_dir}")

    # Cache the roles
    _roles_cache = roles

    return roles


def get_stage1_roles() -> List[Role]:
    """
    Get roles that participate in Stage 1 (answering the user's question).

    Returns:
        List of Role objects that participate in Stage 1
    """
    all_roles = load_all_roles()
    return [role for role in all_roles.values() if role.participates_in_stage1]


def get_stage2_roles() -> List[Role]:
    """
    Get roles that participate in Stage 2 (ranking responses).

    Returns:
        List of Role objects that participate in Stage 2
    """
    all_roles = load_all_roles()
    return [role for role in all_roles.values() if role.participates_in_stage2]


def get_juge_role() -> Role:
    """
    Get the Juge role for Stage 3 synthesis.

    Returns:
        The Juge Role object

    Raises:
        ValueError: If Juge role not found or multiple Juge roles exist
    """
    all_roles = load_all_roles()
    juge_roles = [role for role in all_roles.values() if role.participates_in_stage3]

    if not juge_roles:
        raise ValueError("No Juge role found (role with participates_in_stage3=true)")

    if len(juge_roles) > 1:
        raise ValueError(f"Multiple Juge roles found: {[r.role_id for r in juge_roles]}")

    return juge_roles[0]


def update_role_model(role_id: str, new_model: str) -> None:
    """
    Update the model assignment for a role and persist to markdown file.

    Args:
        role_id: The role identifier
        new_model: The new Ollama model identifier

    Raises:
        ValueError: If role not found
    """
    global _roles_cache

    all_roles = load_all_roles()

    if role_id not in all_roles:
        raise ValueError(f"Role not found: {role_id}")

    role = all_roles[role_id]

    # Update the role object
    role.model = new_model

    # Find the role file
    roles_dir = Path(__file__).parent / "roles"
    role_files = list(roles_dir.glob("*.md"))

    for role_file in role_files:
        with open(role_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if this file contains the role we're looking for
        if f'role_id: "{role_id}"' in content or f"role_id: '{role_id}'" in content:
            # Update the model in the YAML frontmatter
            updated_content = re.sub(
                r'(model:\s*["\']?)([^"\'\n]+)(["\']?)',
                rf'\1{new_model}\3',
                content
            )

            # Write back to file
            with open(role_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)

            # Clear cache to force reload
            _roles_cache = None

            return

    raise ValueError(f"Could not find file for role: {role_id}")


def reload_roles() -> None:
    """Force reload of all roles from disk (clears cache)."""
    global _roles_cache
    _roles_cache = None
