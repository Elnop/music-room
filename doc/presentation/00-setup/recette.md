# Recette avant la soutenance

À dérouler en entier avant la correction, après [preparation.md](preparation.md). Cocher un scénario seulement quand toutes ses étapes sont cochées. Un échec devient un ticket ; tant que la partie obligatoire a un échec, on ne présente pas les bonus (*"If you have not passed ALL the mandatory requirements, your bonus part will not be evaluated at all."*).

## Partie obligatoire

| Sujet | Scénario | ☐ |
| --- | --- | --- |
| III.1, III.2 | [Installation depuis un clone](../01-architecture/scenario-install.md) | ☐ |
| IV.1 | [Inscription par email, validation, mot de passe oublié](../02-user/scenario-signup-email.md) | ☐ |
| IV.1, IV.5 | [Google, Facebook et comptes liés](../02-user/scenario-social-login.md) | ☐ |
| IV.1 | [Profil public, amis, privé et préférences](../02-user/scenario-profile-privacy.md) | ☐ |
| IV.2.3 | [Édition à plusieurs en temps réel](../03-playlist-editor/scenario-realtime.md) | ☐ |
| IV.2.3 | [Visibilité et licence d'édition](../03-playlist-editor/scenario-rights.md) | ☐ |
| IV.2.3 | [Le même titre déplacé par deux personnes](../03-playlist-editor/scenario-concurrency.md) | ☐ |
| IV.2.3 | [Trouver des personnes aux goûts proches](../03-playlist-editor/scenario-similar-tastes.md) | ☐ |
| IV.2.2 | [Licence par appareil](../04-control-delegation/scenario-delegation.md) | ☐ |
| IV.2.2 | [File d'attente partagée et transfert de lecture](../04-control-delegation/scenario-connect.md) | ☐ |
| IV.3, IV.4 | [Documentation de l'API](../05-server-api/scenario-swagger.md) | ☐ |
| IV.5 | [Changer l'adresse du backend dans l'app](../05-server-api/scenario-backend-url.md) | ☐ |
| IV.6 | [Chaque action de l'app est journalisée](../06-security/scenario-logs.md) | ☐ |
| IV.6 | [Comportements malveillants](../06-security/scenario-attacks.md) | ☐ |
| IV.7 | [Mesurer la charge](../07-scaling/scenario-load-test.md) | ☐ |
| IV.8 | [Process, tests et CI](../08-quality-ci/scenario-ci.md) | ☐ |

## Rendu (VI)

| Sujet | Vérification | ☐ |
| --- | --- | --- |
| VI | La machine de référence a cloné le dépôt rendu, sur la branche rendue, sans modification locale (`git status` propre) : *"Only the work inside your repository will be evaluated during the defense."* | ☐ |

## Bonus

| Sujet | Scénario | ☐ |
| --- | --- | --- |
| V.1 | [Le client web](../09-bonus-web/scenario.md) | ☐ |
| V.2 | [Un événement découvert par iBeacon](../10-bonus-iot/scenario.md) | ☐ |
| V.3 | [Passer en Premium et revenir](../11-bonus-subscription/scenario.md) | ☐ |

## Points ouverts connus

- IV.7 : machine de référence et rapport de capacité (#103, #106).
