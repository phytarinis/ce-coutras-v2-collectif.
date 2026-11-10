# Ce Coutras qui n'existe pas… Ça dérape ! — V2

Jeu narratif numérique interactif.

Projet du Labo Épicé en collaboration avec l'E2C Coutras.

Version collective : 8 joueurs, 7 situations et 3 fins possibles.

Développement avec Codex.

## Première structure fonctionnelle

Application statique en HTML, CSS et JavaScript, sans framework, service externe,
base de données ni compilation. L’interface s’adresse au formateur qui pilote
la séance pour huit joueurs. Les textes et couleurs sont provisoires.

### Tester dans un navigateur

Depuis le dossier du dépôt, avec Python 3 installé :

```sh
python3 -m http.server 8000
```

Ouvrir `http://localhost:8000` dans un navigateur récent. Arrêter le serveur avec
Ctrl+C. Utiliser un serveur HTTP : ouvrir directement `index.html` comme fichier
peut bloquer les modules JavaScript. Aucun `npm install` n’est nécessaire pour jouer.

Cliquer sur « LANCER LE BAZAR ! », explorer l’affiche de la situation 1,
valider une décision puis parcourir les autres situations de démonstration. La mémoire reste visible après les déplacements.
À la dernière situation, ouvrir les trois aperçus de fins. « Recommencer une
partie » demande une confirmation puis efface toute la mémoire.

### Fichiers et rôles

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page d’entrée, langue, titre et chargement de l’application. |
| `styles.css` | Accueil inspiré de la maquette, présentation des scènes et adaptation aux écrans. |
| `src/content.js` | Liste des sept situations et des trois fins ; point d’entrée pour les contenus validés. |
| `src/engine.js` | État de partie, choix, indices et conséquences immédiates ou différées. Indépendant de l’affichage. |
| `src/app.js` | Écrans, navigation de démonstration, mémoire visible et redémarrage. |
| `src/home.js` | Accueil HTML, titre accessible, images locales et bouton vers la situation 1. |
| `assets/` | Ressources originales fournies, maquette et portrait détouré dérivé. |
| `tests/engine.test.js` | Tests du moteur, sans dépendance externe. |
| `tests/browser.js` | Vérification du parcours dans Chromium avec Playwright. |
| `package.json` et `package-lock.json` | Commandes pratiques et version verrouillée de l’outil de test navigateur. |

### Ajouter progressivement les contenus

Une personne non programmeuse peut transmettre, pour chaque situation : son titre,
son texte, les choix proposés, les indices et les effets validés. Leur intégration
dans les fichiers demande encore une intervention technique ; ce prototype n’est
pas un éditeur visuel. Les titres se trouvent ensemble dans `src/content.js`.
Un futur champ de texte ou média demandera également un affichage dans `src/app.js`.

Le moteur accepte des choix avec `id`, `label`, `effects` et, pour l’interface,
un éventuel `nextScene`. Les identifiants doivent être stables et uniques dans
chaque scène. Les effets pris en charge sont :

- `type: 'clue'` et `clue: { id, label }` pour mémoriser un indice sans doublon ;
- `type: 'indicator'`, `indicator: 'rumor'` ou `'investigation'`,
  `operation: 'set'` ou `'add'`, et une valeur explicitement validée ;
- `atScene: 'identifiant-de-scene'` sur un effet pour l’appliquer une seule fois
  lors d’une prochaine entrée dans cette scène. Sans ce champ, il est immédiat.

Une variation d’indicateur est refusée tant que sa valeur initiale n’est pas
explicitement définie. Depuis la mission 3, le départ à 0 pour les deux
indicateurs a été confirmé par le porteur du projet. Les effets différés
restent testés avec des données techniques ; la situation 1 utilise des effets immédiats.

### Vérifications de développement

Node.js 24 et Python 3 sont disponibles dans l’environnement cloud.

```sh
npm test
npm ci
npm start
```

Dans un second terminal, serveur démarré :

```sh
npm run test:browser
```

Le test navigateur utilise `/usr/bin/chromium`. Pour un autre emplacement,
définir `CHROMIUM_PATH`. Playwright est uniquement un outil de développement ;
il n’est pas chargé par le jeu. `npm start` écoute sur toutes les interfaces
pour le développement cloud ; la commande Python ci-dessus convient en local.
Si le cache npm habituel n’est pas accessible dans l’environnement cloud,
utiliser `npm ci --cache /tmp/ce-coutras-v2-npm-cache` à la place de `npm ci`.

### Limites volontaires

- Les situations 2 à 7 et les fins restent des emplacements de démonstration ;
  aucun seuil ni sélection automatique de fin n’est défini.
- La navigation est libre et technique : elle ne représente pas encore le parcours narratif final.
- Le moteur mémorise chaque choix une seule fois par scène ; les règles d’exclusivité
  entre plusieurs choix restent à définir lorsque les situations seront intégrées.
- La mémoire existe uniquement dans l’onglet ouvert. Un rechargement ou une fermeture
  efface la partie ; aucune reprise persistante n’est encore proposée.
- Aucun test sur le vidéoprojecteur réel ni audit complet d’accessibilité à ce stade.

## Mission 2 — Accueil interactif

L’accueil reprend la composition de la maquette fournie : photo de l’E2C en fond,
KØZMO au premier plan, titre en collage, bleu nuit, crème, orange et vert bouteille.
Le titre, l’accroche, les informations et le bouton sont des éléments HTML,
séparés des images. Le logo Labo Épicé est cadré en CSS depuis la maquette ;
un fichier de logo séparé permettrait un rendu plus net et plus léger.

Le bouton « LANCER LE BAZAR ! » lance la première situation avec la navigation
existante, à la souris, avec Tab puis Entrée ou Espace. Aucun mouvement ni
animation n’est nécessaire. Les indicateurs et la mémoire sont affichés dans
les situations, afin de garder l’accueil consacré au lancement. Le retour à
l’accueil conserve la mémoire ; « Recommencer une partie » la réinitialise.

Les cinq originaux ont été déplacés sans modification dans `assets/originals/`.
Le portrait de studio a été détouré avec l’outil de retouche d’image dans
`assets/derived/kozmo.png`. Il conserve la pose du portrait fourni, différente
de la pose bras croisés de la maquette. Aucune ressource externe n’est chargée.
La photo du bâtiment est de petite définition (638 × 480) : un original plus
résolu améliorerait la netteté au vidéoprojecteur.

Les tests navigateur vérifient l’absence de débordement de l’accueil à
1280 × 720, 1920 × 1080 et 1024 × 576, ainsi qu’à 375 × 812, le chargement
des images, le lancement au clavier, l’utilisation avec réduction des animations
et le parcours existant (sept situations, trois fins, choix, indices, redémarrage).
La vérification sur le vidéoprojecteur physique reste à effectuer.

## Mission 3 — L’affiche improbable

`src/situation1.js` contient la story de @Rumeurs247, les trois observations
validées, les cinq décisions et leurs conséquences. L’affiche fournie a été
renommée sans retouche en `assets/affiche-kozmo-concert.png`.

Cliquer sur « Agrandir et explorer l’affiche » ouvre une fenêtre modale. Les
zones 21 juin, Place de la mairie / Coutras et Coutras Festivités sont activables
à la souris ou avec Tab puis Entrée/Espace. Des boutons portant les mêmes noms
permettent aussi d’explorer sans viser une zone. Échap ou « Fermer l’affiche »
ferme la fenêtre et replace le focus sur le bouton d’ouverture.

Les observations sont mémorisées comme indices, sans points et sans enregistrer
une décision collective. Les joueurs peuvent explorer dans n’importe quel ordre,
sans chronomètre. Il n’est pas obligatoire de consulter les trois informations
pour décider. Une seule décision collective est possible :

| Décision | Propagation | Enquête | Indice de source |
| --- | --- | --- | --- |
| A — Partager | +15 | 0 | Aucun |
| B — Signaler | 0 | 0 | Aucun |
| C — Chercher l’origine | 0 | +15 | Compte de fans RapRadar33, non officiel |
| D — Ne rien faire | 0 | 0 | Aucun |
| Pas d’accord collectif | 0 | 0 | Aucun |

Les variations ne sont pas affichées sur les boutons avant le choix. Après la
conséquence, « Continuer — Tout le monde en parle ! » ouvre la situation 2.
Revenir à la situation 1 affiche la conséquence enregistrée, sans rejouer les
points. La mémoire et les points restent conservés pendant la navigation ;
le rechargement efface toujours la partie.

`npm test` exécute 11 tests (moteur et situation 1). `npm run test:browser`
vérifie les trois zones dans un ordre libre, les consultations répétées, la
fermeture clavier et le retour du focus, les cinq conséquences, leurs points,
l’unicité du choix, la navigation et le parcours de démonstration restant.
L’accueil validé, les contenus des situations 2 à 7 et les fins sont inchangés.

## Mission 4 — Habillage de la situation 1

L’habillage est isolé sous la classe `is-situation-one` : bleu nuit, crème,
orange et sauge, titre en papier découpé, story fictive avec avatar typographique,
alternatives clavier compactes et notification narrative. Aucun nouvel asset ni
service externe n’est nécessaire. Le texte technique de l’en-tête est masqué
uniquement dans cette situation. Les autres scènes et l’accueil conservent leur
présentation.

Les indicateurs associent un pictogramme à la valeur exacte. Ils n’utilisent
ni pourcentage, ni barre de progression, car aucun maximum ni seuil n’est défini.
L’animation d’apparition de la conséquence dure 180 ms et est supprimée avec
`prefers-reduced-motion`. La page reste défilable pour accéder à la mémoire,
aux jauges et au redémarrage. L’affiche agrandie tient dans une fenêtre modale
adaptée aux écrans 16:9 ; son contenu peut défiler si nécessaire.

Validation : tests moteur inchangés (11 tests), parcours Chromium avec les cinq
issues, exploration des trois zones au clic et au clavier, mémoire, points,
navigation et contrôle de débordement horizontal aux formats 1280 × 720,
1920 × 1080 et 1024 × 576. Le parcours de l’accueil est également vérifié.
