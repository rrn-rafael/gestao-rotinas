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

- `main` or `approved` branch:
  contains only the latest approved baseline
- `codex/<change-name>` branch:
  contains the current candidate change
- optional tag:
  `approved/vX.Y.Z` for every approved baseline

Recommended promotion logic:
1. Create a candidate branch from the approved baseline.
2. Implement and validate the change.
3. Request testing.
4. If approved, merge or fast-forward the approved branch and optionally create a tag.
5. If rejected, abandon the candidate branch and restart from the approved baseline.

## Current Limitation
This workspace is not currently initialized as a Git repository.

That means:
- rollback is manual instead of guaranteed
- approved baselines are procedural instead of system-enforced
- parallel candidates are riskier than they should be

## Practical Rule For This Repository
Until Git is enabled:
- keep diffs small
- do not treat a change as approved unless the user explicitly says it is approved
- after each implementation, stop at "awaiting test"
- only continue building on top of a version after explicit approval
