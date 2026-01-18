#!/usr/bin/env python3
"""
Markdown heading level converter script.
Converts heading levels up by one level in index.md files.

Conversion rules:
- ## → #
- ### → ##
- #### → ###
- ##### → ####

Preserves:
- Frontmatter (between --- markers)
- Code blocks (between ``` markers)
"""

import os
import re
from pathlib import Path


def convert_heading(line: str) -> str:
    """Convert heading by removing one # from the beginning."""
    # Match lines starting with ## to ##### followed by space
    match = re.match(r'^(#{2,5})(\s)', line)
    if match:
        hashes = match.group(1)
        space = match.group(2)
        rest = line[len(hashes) + len(space):]
        # Remove one # (level up)
        new_hashes = hashes[1:]
        return new_hashes + space + rest
    return line


def process_file(filepath: Path) -> tuple[bool, int]:
    """
    Process a single markdown file.
    Returns (was_modified, heading_count).
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []

    in_frontmatter = False
    frontmatter_count = 0
    in_code_block = False
    heading_count = 0

    for line in lines:
        # Track frontmatter (starts and ends with ---)
        if line.strip() == '---':
            if frontmatter_count < 2:
                frontmatter_count += 1
                in_frontmatter = frontmatter_count == 1
                if frontmatter_count == 2:
                    in_frontmatter = False

        # Track code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block

        # Only convert headings outside frontmatter and code blocks
        if not in_frontmatter and not in_code_block:
            if re.match(r'^#{2,5}\s', line):
                new_line = convert_heading(line)
                if new_line != line:
                    heading_count += 1
                new_lines.append(new_line)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    new_content = '\n'.join(new_lines)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True, heading_count

    return False, 0


def main():
    """Main function to process all index.md files in contents directory."""
    contents_dir = Path(__file__).parent.parent / 'contents'

    if not contents_dir.exists():
        print(f"Error: contents directory not found at {contents_dir}")
        return

    # Find all index.md files
    index_files = list(contents_dir.glob('**/index.md'))

    print(f"Found {len(index_files)} index.md files")
    print("-" * 50)

    total_modified = 0
    total_headings = 0

    for filepath in sorted(index_files):
        relative_path = filepath.relative_to(contents_dir)
        modified, heading_count = process_file(filepath)

        if modified:
            total_modified += 1
            total_headings += heading_count
            print(f"[MODIFIED] {relative_path} ({heading_count} headings)")

    print("-" * 50)
    print(f"Summary:")
    print(f"  Files processed: {len(index_files)}")
    print(f"  Files modified: {total_modified}")
    print(f"  Total headings converted: {total_headings}")


if __name__ == '__main__':
    main()
