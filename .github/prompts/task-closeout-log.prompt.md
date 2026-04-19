---
name: Task Closeout Log
description: "Record completed work using this repository's closeout workflow. Use when finishing a coding task and updating project logs."
argument-hint: "Describe the completed task, changed files, and validation performed"
agent: "agent"
---

Close out the completed task for this repository.

Use the argument as the primary closeout input. If the argument is brief, infer missing details from recent workspace changes and recent conversation context.

Follow this exact workflow:
1. Review [AGENTS guide](../../AGENTS.md), especially the Agent Logging Workflow section.
2. Append one concise row to [work logs](../logs.md) with:
   - current date
   - prompt or task summary
   - changed files
   - validation performed
   - outcome
3. If a reusable insight was discovered, append one concise row to [lessons learned](../lessons.md).
4. Preserve existing markdown table formatting in both files.
5. Do not modify unrelated files.

Output requirements:
- Confirm which files were updated.
- State whether a lesson entry was added and why.
- Keep the final response concise and factual.