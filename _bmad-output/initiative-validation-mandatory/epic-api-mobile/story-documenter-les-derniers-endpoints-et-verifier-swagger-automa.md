---
id: 2
type: story
title: "Documenter les derniers endpoints et vérifier Swagger automatiquement"
parent: epic-api-mobile
covers: [CAP-7, CAP-3]
after: [5.2, 1.7]
hitl: false
risk: low
tracker_id: "95"
remote: "https://github.com/Elnop/music-room/issues/95"
tracker_status: backlog
---

# Documenter les derniers endpoints et vérifier Swagger automatiquement

## Description

Ajoute GET /api/playlists/public, GET /api/soundcloud/stream (variante query) et GET /health (dans swagger.config.ts), et un test qui échoue si une route montée par Express manque dans la spec OpenAPI.

## Acceptance Criteria

Verify: Les 3 endpoints apparaissent dans /api-docs et le test de comparaison routes / OpenAPI passe.

## References

- parent — _bmad-output/initiative-validation-mandatory/epic-api-mobile/epic-api-mobile.md
