import { situations, endings, demoClue } from './content.js';
import { createGame, enterScene, choose } from './engine.js';
import { createHome } from './home.js';
import { createSituation1, inspectPoster, decidePoster } from './situation1.js';

// Mémoire de la session seulement : pas de stockage de données personnelles.
let game = createGame();
let resetting = false;
let notice = '';
const root = document.querySelector('#app');

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(label, action, { disabled = false, secondary = false } = {}) {
  const node = element('button', label, secondary ? 'secondary' : '');
  node.type = 'button';
  node.disabled = disabled;
  node.addEventListener('click', action);
  return node;
}

function navigate(id) {
  game = enterScene(game, id);
  notice = '';
  resetting = false;
  render();
}

function heading(parent, text) {
  const node = element('h1', text);
  node.tabIndex = -1;
  parent.append(node);
  return node;
}

function render() {
  root.replaceChildren();
  document.body.classList.toggle('is-home', game.sceneId === 'accueil');
  if (game.sceneId === 'accueil') {
    const { screen, title } = createHome(() => navigate(situations[0].id));
    root.append(screen);
    title.focus();
    return;
  }
  let panel = element('section', undefined, 'panel');
  let title;
  if (game.sceneId === 'affiche') {
    ({ panel, title } = createSituation1({
      state: game,
      onInspect: id => { game = inspectPoster(game, id); return game; },
      onDecide: id => { game = decidePoster(game, id); render(); },
      onClose: () => { render(); root.querySelector('.s1-thumbnail')?.focus(); },
      onNext: () => navigate('tout-le-monde'),
    }));
  } else if (game.sceneId === 'fins') {
    title = heading(panel, 'Les trois fins possibles');
    panel.append(element('p', 'Aucune fin n’est calculée : leurs contenus, barèmes et conditions restent à valider. Ces boutons ouvrent uniquement des écrans de démonstration.'));
    const actions = element('div', undefined, 'actions');
    endings.forEach(ending => actions.append(button(`Aperçu : ${ending.title}`, () => navigate(ending.id))));
    panel.append(actions);
  } else {
    const scene = situations.find(item => item.id === game.sceneId);
    const ending = endings.find(item => item.id === game.sceneId);
    title = heading(panel, (scene ?? ending).title);
    if (scene) {
      const index = situations.indexOf(scene);
      panel.append(element('p', `Situation ${index + 1} sur ${situations.length} · Emplacement provisoire`, 'eyebrow'));
      panel.append(element('p', 'Le contenu, les choix collectifs et leurs conséquences seront intégrés après validation.'));
      scene.choices.forEach(choice => panel.append(button(choice.label, () => {
        game = choose(game, choice);
        if (choice.nextScene) navigate(choice.nextScene);
        else render();
      }, { disabled: game.choices.some(item => item.sceneId === scene.id && item.id === choice.id) })));
      const demo = element('aside', undefined, 'demo');
      demo.append(element('h2', 'Essai technique de mémorisation'));
      demo.append(element('p', 'Ce bouton enregistre un choix technique et un indice fictif, sans changer les indicateurs. Il ne fait pas partie du scénario.'));
      const recorded = game.choices.some(item => item.sceneId === scene.id && item.id === 'demo');
      demo.append(button(recorded ? 'Essai déjà enregistré' : 'Enregistrer le choix et l’indice de démonstration', () => {
        game = choose(game, { id: 'demo', label: 'Choix de démonstration — sans effet narratif', effects: [{ type: 'clue', clue: demoClue }] });
        notice = 'Choix et indice de démonstration enregistrés.';
        render();
      }, { disabled: recorded, secondary: true }));
      panel.append(demo);
      const nav = element('nav', undefined, 'actions');
      nav.setAttribute('aria-label', 'Navigation de démonstration');
      nav.append(button(index === 0 ? 'Retour à l’accueil' : 'Situation précédente', () => navigate(index === 0 ? 'accueil' : situations[index - 1].id), { secondary: true }));
      nav.append(button(index === situations.length - 1 ? 'Voir les emplacements des fins' : 'Situation suivante', () => navigate(index === situations.length - 1 ? 'fins' : situations[index + 1].id)));
      panel.append(nav);
    } else {
      panel.append(element('p', 'Emplacement de fin réservé. Aucun dénouement ni critère de déclenchement n’est défini.'));
      panel.append(button('Retour aux trois fins', () => navigate('fins'), { secondary: true }));
    }
  }
  root.append(panel);

  const status = element('section', undefined, 'panel');
  status.setAttribute('aria-label', 'État de la partie');
  status.append(element('h2', 'État de la partie'));
  const indicators = element('dl', undefined, 'indicators');
  for (const [key, label] of [['rumor', 'Propagation de la rumeur'], ['investigation', 'Qualité de l’enquête']]) {
    const group = element('div');
    group.append(element('dt', label), element('dd', game.indicators[key] ?? 'Non définie — barème à valider'));
    indicators.append(group);
  }
  status.append(indicators, element('p', 'Les indicateurs évoluent avec les décisions collectives, pas avec la navigation.'));
  const memory = element('details');
  memory.append(element('summary', `Mémoire de la partie : ${game.choices.length} choix, ${game.clues.length} indice(s)`));
  memory.append(element('h3', 'Choix enregistrés'));
  const choices = element('ul');
  game.choices.forEach(choice => choices.append(element('li', `${situations.find(scene => scene.id === choice.sceneId)?.title ?? choice.sceneId} : ${choice.label}`)));
  memory.append(game.choices.length ? choices : element('p', 'Aucun choix enregistré.'));
  memory.append(element('h3', 'Indices mémorisés'));
  const clues = element('ul');
  game.clues.forEach(clue => clues.append(element('li', clue.label)));
  memory.append(game.clues.length ? clues : element('p', 'Aucun indice enregistré.'));
  status.append(memory, element('p', 'La mémoire est conservée pendant la navigation. Recharger ou fermer la page efface la partie.'));
  if (resetting) {
    const confirm = element('div', undefined, 'demo');
    confirm.append(element('p', 'Effacer tous les choix, indices et conséquences en attente et revenir à l’accueil ?'));
    confirm.append(button('Confirmer le redémarrage', () => {
      game = createGame();
      resetting = false;
      notice = 'Nouvelle partie : la mémoire a été effacée.';
      render();
    }), button('Annuler', () => { resetting = false; render(); }, { secondary: true }));
    status.append(confirm);
  } else {
    status.append(button('Recommencer une partie', () => { resetting = true; render(); }, { secondary: true }));
  }
  root.append(status);
  const live = element('p', notice, 'notice');
  live.setAttribute('role', 'status');
  root.append(live);
  title.focus();
}

render();
