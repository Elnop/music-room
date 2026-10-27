# Scénario : trouver des personnes aux goûts proches

**Prouve** : IV.2.3, *"Collaborate with your friends or people with the same musical tastes to create playlists in real-time"*, et IV.1, les préférences musicales (*"their music preferences"*) et leur confidentialité.

**Prérequis** : seed local rechargé (`make supabase-reset`), Bob sur A, Mme Puff sur B. Bob aime pop et rock. Mme Puff aime latin, pop et rock ; elle n'a aucun ami et Bob ne la suit pas.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Bob : **Accueil**, section « Profils aux goûts proches » | Mme Puff en premier (pop et rock en commun), puis Perle (pop). Patrick et Sandy n'y sont pas : Bob les suit déjà | ☐ |
| 2 | Bob : toucher la carte de Mme Puff | Son profil s'ouvre dans l'onglet Amis | ☐ |
| 3 | Sur ce profil, **Suivre**, puis revenir sur **Accueil** | Mme Puff a disparu de la section : on ne suggère pas un profil déjà suivi | ☐ |
| 4 | Mme Puff : **Profil › Confidentialité**, Préférences musicales en **Amis seulement** | — | ☐ |
| 5 | Un compte qui ne suit pas Mme Puff et aime la pop (Perle) : **Accueil** | Mme Puff n'est plus suggérée : ses goûts ne sont plus publics, une suggestion les révélerait | ☐ |
| 6 | Gary (aucun genre) : **Accueil** | La section invite à choisir ses genres ; « Choisir mes genres » ouvre **Préférences musicales** | ☐ |
| 7 | Gary choisit Pop, revient sur **Accueil** | Des profils aimant la pop apparaissent | ☐ |
| 8 | Bob invite Mme Puff comme éditrice d'une playlist ([scenario-rights.md](scenario-rights.md)) | Ils éditent ensemble en direct : la découverte par les goûts mène à la collaboration | ☐ |

**À dire** :

- **Classement** : similarité de Jaccard, c'est-à-dire les genres communs divisés par l'ensemble des genres des deux, puis le nombre de genres communs. Le calcul est fait par une fonction SQL du projet, `recommend_similar_profiles`, sans service tiers.
- **Vie privée** : seuls les profils aux préférences **publiques** sont candidats, et l'avatar suit sa propre confidentialité.
- **Tests** : `backend/src/features/profile/services/recommendations.int.test.ts`.
