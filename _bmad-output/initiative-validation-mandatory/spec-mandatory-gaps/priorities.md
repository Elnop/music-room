# Priorities

P0 blocks the mandatory part. P1 closes a partial requirement cheaply. P2 is quality and hygiene. Evidence (files, lines) is in the audit companion, section named below.

| CAP | Priority | Subject | Audit section |
|---|---|---|---|
| CAP-1 | P0 | IV.6 | IV.6 Sécurité — Socket.io sans authentification |
| CAP-2 | P0 | IV.7 | IV.7 Montée en charge |
| CAP-3 | P0 | IV.8 | IV.8 Agilité, qualité, intégration continue |
| CAP-4 | P0 | IV.2.2 | IV.2.2 Music Control Delegation |
| CAP-5 | P0 | IV.2.3 | IV.2.3 Music Playlist Editor — concurrence |
| CAP-6 | P0 | IV.1 | IV.1 Utilisateur — liaison d'un compte réseau |
| CAP-7 | P1 | IV.4 | IV.4 API — endpoints absents de Swagger |
| CAP-8 | P1 | IV.5 | IV.5 Application mobile — adresse du backend |
| CAP-9 | P1 | IV.6 | IV.6 Sécurité — vol de session |
| CAP-10 | P1 | IV.6 | IV.6 Sécurité — autres dangers |
| CAP-11 | P1 | III.1, IV.4 | III.1 Architecture ; IV.4 API |
| CAP-12 | P2 | IV.8 | IV.8 — aucune CI |
| CAP-13 | P2 | — | Écarts P2, points 13, 14 et 16 |

CAP-9 shares the realtime token check with CAP-1: a revoked token must also be refused on the socket.
