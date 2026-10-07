- source_plan: `_bmad-output/initiative-validation-mandatory/epic-securite/story-authentifier-la-connexion-socket-io-par-jwt-backend-plan.md`
  summary: Token verification (Socket.io handshake and every `authMiddleware` route) is not rate-limited, so garbage tokens turn into unlimited Supabase Auth `getUser` calls.
  evidence: `authenticateSocket` and `authMiddleware` both call `SessionService.verifyToken` → `supabase.auth.getUser`; `server.ts` mounts no global limiter; AGENTS.md asks to rate-limit sensitive routes with the Redis limiter.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-securite/story-authentifier-la-connexion-socket-io-par-jwt-backend-plan.md`
  summary: AGENTS.md lists backend imports as `@/features/...` or `@/shared/...`, but `src/realtime/` is imported as `@/realtime/...` (server.ts, music-control.service.ts, socket-auth.ts); either add it to the rule or move the module.
  evidence: grep `@/realtime/` in backend/src.
