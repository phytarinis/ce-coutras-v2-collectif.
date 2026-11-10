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

- Les situations 3 à 7 et les fins restent des emplacements de démonstration ;
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

## Mission 5 — Tout le monde en parle !

La situation 2 réutilise le moteur, le carnet et les indicateurs. Elle est isolée
entre `src/situation2-state.js` (étapes, temps, pistes, décisions et effets),
`src/situation2.js` (interface) et `situation2.css` (styles limités à cette scène).
Les règles et l’habillage de la situation 1, ainsi que l’accueil, sont conservés.

### Déroulé pour le formateur

1. Les six publications fictives apparaissent successivement avec « Publication
   suivante ». Cette introduction est sans chronomètre ; seul le dernier message
   ajouté reçoit une animation brève, désactivable avec les animations réduites.
2. « Démarrer l’enquête — 90 secondes » lance le temps. Chaque carte est un vrai
   bouton utilisable avec la souris ou Tab puis Entrée/Espace. Un premier clic
   révèle le lien, un second remonte à la découverte essentielle de la piste.
   Plusieurs cartes peuvent mener à la même piste ; une découverte n’est ajoutée
   qu’une seule fois dans le carnet. Aucun point n’est attribué à l’exploration.
3. « Mettre en pause » fige le temps et bloque les cartes. « Reprendre le
   chronomètre » reprend le temps restant. Le compteur utilise une échéance réelle,
   sans dépendre du nombre de rafraîchissements de l’onglet. Si l’on retourne à
   la situation 1 sans mettre en pause, le temps continue à s’écouler ; il est
   recalculé au retour. Les étapes et indices sont conservés.
4. Après trois pistes découvertes, on peut ouvrir le débat immédiatement. À zéro,
   l’exploration s’arrête automatiquement. Le débat n’est pas chronométré. Un indice
   connu depuis la situation 1 n’est jamais révélé automatiquement dans cette scène.
5. Le formateur valide une décision unique. Il peut enregistrer deux votes sans
   accord pour rendre disponible l’issue « Pas d’accord collectif ». Un vote sans
   accord n’est pas une décision et ne donne aucun point.
6. Après la notification, « CONTINUER — ALLÔ COUTRAS ? » ouvre la situation 3.
   Un retour à la situation 2 conserve la conséquence, sans rejouer les points.

| Issue | Propagation | Enquête | Indice supplémentaire |
| --- | --- | --- | --- |
| A — Publier une alerte | +10 | +5 | Aucun |
| B — Continuer à enquêter | +5 | +15 | Coutras Festivités, interlocuteur possible sans confirmation |
| C — Ne rien relayer | +5 | 0 | Aucun |
| Pas d’accord collectif | 0 | 0 | Aucun |

Ces valeurs de travail sont celles demandées pour le prototype. Aucun point n’est
annoncé avant le choix. Les résultats se cumulent avec la situation 1. Les
jauges n’introduisent toujours ni maximum ni seuil. Aucune vidéo virale n’est ajoutée.

### Vérifications et limites

`npm test` exécute 20 tests. `npm run test:browser` exécute le parcours existant
et le parcours dédié de la situation 2. Les tests utilisent une horloge contrôlée
pour vérifier 90 secondes, une longue pause et l’expiration sans attendre en temps
réel. Ils couvrent les six publications, la progression, les indices uniques,
les quatre issues, les votes, les points cumulés, les retours de navigation,
le clavier, les animations réduites et les formats 16:9 (1280 × 720, 1920 × 1080,
1024 × 576), ainsi qu’un écran étroit. La page est défilable ; le chronomètre reste
visible pendant le défilement de l’exploration. Le vidéoprojecteur physique reste
à vérifier. Aucun média externe, service supplémentaire ou dépendance n’est ajouté.

La mémoire et le temps restent dans la session courante : recharger la page ou
recommencer une partie les efface, comme auparavant. Les situations 3 à 7 et les
fins demeurent des emplacements de démonstration.

## Mission 6 — Avalanche et bilan simplifié

L’introduction de la situation 2 est désormais automatique : la première
publication est visible à l’entrée, puis cinq autres arrivent toutes les 1,1 s
(environ 5,5 s au total). « Passer l’animation » affiche immédiatement les six.
Avec `prefers-reduced-motion`, elles sont toutes visibles dès l’entrée. Le
chronomètre ne commence toujours qu’au clic sur « LANCER L’ENQUÊTE — 90 S ».

Le défilement commence sans son. « Lancer le buzz » ou « Son coupé » active les
notifications par une interaction explicite, nécessaire aux navigateurs. « Son
activé » les coupe. Les sons sont de courtes sinusoïdes originales synthétisées
par Web Audio, de fréquences légèrement différentes, sans fichier ni requête
réseau. Un garde-fou évite leur chevauchement et la coupure arrête le son courant.
Si Web Audio est absent ou bloqué, une indication apparaît et le jeu continue.
Le choix sonore reste valable dans l’onglet ; l’activation ne relance pas une
avalanche déjà engagée. En mode animations réduites, aucune rafale de sons n’est
jouée. Le volume final reste à vérifier sur Chromebook et sur la sonorisation.

La publication de @team_kozmo33 utilise une petite vignette du portrait original
présent dans `assets`, avec « CONCERT GRATUIT À COUTRAS ? ». Aucun personnage
n’est généré. Les cinq autres messages restent textuels.

Le débat affiche trois cartes courtes : Source commune, Témoignage indirect,
Scoop non confirmé. Une piste absente affiche seulement « Non découverte » sous
son titre ; son explication reste cachée. Les trois décisions principales ont la
même couleur bleu nuit/sauge, sans hiérarchie de bonne ou mauvaise réponse.
L’orange reste réservé à la progression et aux accents de l’interface.

Les règles, les trois pistes complètes, le temps, la pause/reprise, les points,
les conséquences, la mémoire et la suite vers la situation 3 sont inchangés.
Le module `src/buzz-audio.js` et les tests dédiés sont ajoutés. L’état n’ajoute
qu’une action pour passer l’introduction ; le moteur et la situation 1 ne changent
pas. `npm test` couvre 22 tests et `npm run test:browser` trois parcours, dont
l’avalanche, les notifications, la désactivation, le repli sans audio, l’expiration
avec une ou deux pistes et le bilan sans divulgation. Les tests audio emploient
un contexte contrôlé ; un AudioContext réel a aussi été activé dans Chromium.
