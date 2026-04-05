# Versioning Workflow

This project uses approval-based version governance.

## Core Principle
- The working version and the approved version are not the same thing.
- Only an explicitly approved version becomes the new baseline.
- Rollback must always target the last approved baseline, never an arbitrary intermediate state.

## Delivery States
1. Draft
   A change is being implemented locally and is not yet valid for approval.
2. Awaiting test
   The implementation is complete, local checks passed, and the change is ready for manual validation.
3. Approved
   The change was validated and becomes the new approved baseline.
4. Rejected
   The candidate failed validation and must not become the baseline.

## Required Flow For Every Change
1. Start from the last approved baseline.
2. Implement one small and coherent change.
3. Run local validation when possible.
4. Hand off for testing or approval.
5. If approved, promote the candidate to the new approved baseline.
6. If rejected, discard the candidate and return to the last approved baseline before continuing.

## Recommended Git Strategy
Use this when the repository is under Git.

- `main` branch:
  contains only the latest approved baseline
- `codex/teste` branch:
  contains the current candidate under validation
- optional tag:
  `approved/vX.Y.Z` for every approved baseline

Recommended promotion logic:
1. Create or reset `codex/teste` from the approved baseline.
2. Implement and validate the change.
3. Request testing and explicit user approval.
4. If approved, merge or fast-forward `main`, optionally create a tag, and delete or recycle `codex/teste`.
5. If rejected, delete or recreate `codex/teste` from the last approved baseline and return to `main`.

## Practical Rule For This Repository
- keep only one test branch at a time: `codex/teste`
- do not create multiple concurrent candidate branches
- do not treat a change as approved unless the user explicitly says it is approved
- after each implementation, stop at "awaiting test"
- never update `main` without explicit user approval in the current conversation
- if rejected, delete or recreate `codex/teste` from the last approved baseline
- if approved, promote `codex/teste` to `main`
