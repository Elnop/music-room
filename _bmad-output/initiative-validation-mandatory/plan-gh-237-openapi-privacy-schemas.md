---
title: 'OpenAPI privacy schemas match the API'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '45949cbf2f1b20066a4a2ce6bbb5b3097285ab0f'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `profile.openapi.ts` documented privacy settings as `profileVisibility` (`public|friends|private`), `showEmail`, `showListeningActivity`, while the API reads and returns four `*Visibility` fields with `public|friends_only|private` (GitHub #237).

**Approach:** Rewrite `PrivacySettings` and `UpdatePrivacySettingsRequest` from `updatePrivacySchema` (`profile.validators.ts`) and `ProfilePrivacy` (`profile.types.ts`).

</frozen-after-approval>

## Implementation Notes

Oneshot (schema only):
- `PrivacySettings`: `userId`, the four `*Visibility` enums, `createdAt`, `updatedAt`, matching `ProfilePrivacy`.
- `UpdatePrivacySettingsRequest`: the four optional `*Visibility` enums (unknown keys are stripped by Zod, as the description says).
- Checks: `openapi-coverage.test.ts` 4/4, type-check, eslint, prettier.

## Review Triage Log

Quick review, 3 findings: all patched.

- low, patched: the PUT request example still sent `profileVisibility`/`showEmail`/`showListeningActivity`; now `{ bioVisibility: 'friends_only', emailVisibility: 'private' }`.
- low, patched: `createdAt` and `updatedAt` are always returned; added to `PrivacySettings.required`.
- low, patched: `additionalProperties: false` promised a 400 the API never sends (Zod strips unknown keys); removed, and the description says unknown fields are ignored.
