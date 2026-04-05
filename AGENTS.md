# Project Orchestrator

This repository uses a specialist multi-agent architecture.

The root `AGENTS.md` is the orchestration layer.
The files inside `agents/` are the specialist instructions for each domain.

## Specialist Ownership
- UX/UI, layout, hierarchy, cognitive flow: `agents/product-designer.md`
- React architecture, components, rendering, performance: `agents/frontend-architect.md`
- KPI semantics, thresholds, visual meaning, executive metrics: `agents/data-semantics.md`
- Interaction validation, edge cases, visual QA, consistency: `agents/interaction-qa.md`
- Change control, approval gates, rollback policy, baseline governance: `agents/version-governor.md`

## Operating Rule
- Follow the specialist instructions that match the task.
- When a task spans multiple domains, apply the specialists in the execution order below.
- No domain may make decisions outside its ownership area.

## Branch And Approval Policy
- All implementation work must happen on `codex/test`.
- If work is found on any other branch, move it to `codex/test` before continuing.
- Treat `main` as a protected approved baseline.
- Do not merge, fast-forward, rebase onto, or otherwise update `main` without explicit user approval in the current conversation.
- After implementation, run the available local validation before handing off.
- Before saying a change is ready for testing, stage, commit, and push the validated candidate to `origin/codex/test`.
- Only treat `codex/test` as test-ready when the latest intended changes are already published on the remote branch.
- If commit or push did not happen, explicitly say that `codex/test` is not ready for testing yet.
- After local validation and publication to `origin/codex/test`, stop and wait for the user's approval before any promotion step.

## Conflict Resolution
1. Data semantics overrides aesthetics.
2. Product designer overrides implementation details.
3. Interaction QA can veto unclear states.
4. Frontend architect decides implementation strategy only.
5. Version governor decides whether a candidate can become the new approved baseline.

## Execution Order
1. Baseline check
2. Semantics
3. UX
4. Implementation
5. QA
6. Approval and version decision
