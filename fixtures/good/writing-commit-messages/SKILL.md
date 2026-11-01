---
name: writing-commit-messages
description: Generates descriptive Conventional Commits messages by analyzing staged git diffs. Use when the user asks for help writing a commit message or reviewing staged changes.
---

# Writing commit messages

## Instructions

1. Read the staged diff with `git diff --staged`.
2. Summarize the change as `type(scope): summary` in under 72 characters.
3. Add a body explaining why, wrapped at 72 columns.

## Example

Input: Fixed bug where dates displayed incorrectly in reports

Output:

```
fix(reports): correct date formatting in timezone conversion
```
