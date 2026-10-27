# Scénario : licence par appareil

**Prouve** : IV.2.2, *"It must be specific for each device attached to the user's account. The user can choose to give the music control to different friends."*

**Prérequis** : Bob est connecté sur **deux** appareils, le téléphone A et un second appareil A2 (le client web `make dev-web` suffit). Patrick, ami de Bob, est sur B. Aucune licence au départ.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Bob : **Profil › Mes appareils** | A et A2 listés, celui qu'on tient marqué « Cet appareil » ; tous les interrupteurs coupés | ☐ |
| 2 | Bob : sous A, activer **Patrick** | La licence est accordée sur A seulement | ☐ |
| 3 | Bob lance un titre sur A et un autre sur A2 | — | ☐ |
| 4 | Patrick : ouvrir le choix d'appareil depuis le lecteur, **Appareils de mes amis** | Seul A est contrôlable ; A2 n'apparaît pas | ☐ |
| 5 | Patrick : choisir A, puis pause et lecture | A s'arrête puis repart ; Patrick voit le titre en cours | ☐ |
| 6 | Bob : couper l'interrupteur de Patrick sous A | Patrick perd la main **immédiatement** : A disparaît de sa liste | ☐ |
| 7 | Bob : activer **Contrôle tous mes appareils** pour Patrick | A et A2 deviennent contrôlables par Patrick | ☐ |
| 8 | Sur un appareil de Mme Puff (aucun ami) : ouvrir le choix d'appareil | Aucun appareil d'ami : la délégation exige une amitié | ☐ |
| 9 | Bob : **Mes appareils**, renommer A | Le nouveau nom s'affiche aussi chez Patrick | ☐ |

**À dire** : l'identité vient toujours du socket et jamais du contenu du message. Le serveur vérifie la licence **sur l'appareil visé**, puis que cet appareil est en ligne, avant de transmettre `control:command`. Le test qui le prouve est `backend/src/realtime/music-control-access.int.test.ts` : un ami licencié sur A contrôle A et se voit refuser B.
