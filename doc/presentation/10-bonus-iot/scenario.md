# Scénario : un événement découvert par iBeacon, avec deux téléphones

**Prouve** : V.2, *"when people get near a public event registered on your service, they automatically receive informations about the event, how to access it, the kind of music"*.

**Prérequis** : le téléphone A est l'organisateur, le téléphone B le visiteur. Les deux font tourner le build, connectés avec des comptes différents, Bluetooth activé. Le client web ne convient pas : un navigateur ne fait pas de Bluetooth LE.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | A : **Accueil** › « Créer un événement ». Renseigner un nom, une adresse **dans une autre ville** (pour que le GPS de B ne la trouve pas), l'accès (« Bâtiment C, 7e étage »), deux genres, un début maintenant et une fin dans deux heures, et une playlist publique de A. Puis « Créer l'événement » | La page de l'événement s'ouvre | ☐ |
| 2 | A : sur la page de l'événement, activer « Diffuser la balise » et autoriser « Appareils à proximité » | La carte indique que les téléphones proches voient l'événement | ☐ |
| 3 | B : ouvrir **Accueil**, avec la localisation autorisée et activée (Android l'exige pour tout scan de balise). Accepter une fois « Détecter aussi les balises Bluetooth » | En quelques secondes et sans rien faire, l'événement apparaît dans « Événements à proximité » comme « Tout près ». C'est bien la balise qui le trouve : l'adresse est à des centaines de kilomètres | ☐ |
| 4 | B : toucher l'événement | La page montre l'accès et les genres ; « Ouvrir la playlist » ouvre la playlist de A | ☐ |
| 5 | A : désactiver « Diffuser la balise ». B revient sur **Accueil** | L'événement quitte la section environ 8 secondes plus tard | ☐ |
| 6 | Facultatif, GPS : A modifie l'événement avec « Utiliser ma position actuelle », balise toujours coupée | B l'affiche avec une distance (« 20 m »), puis « Tout près » une fois la balise rallumée. Il n'apparaît qu'une fois | ☐ |

**Si ça casse** : rien sur B ? Vérifier que la localisation Android est **activée**, pas seulement autorisée ([events.md](../../features/events.md#permissions-android)).
