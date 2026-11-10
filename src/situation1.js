import { choose, rememberClue } from './engine.js';

export const observations = [
  { id: 'date', label: '21 juin', text: 'Une date cohérente avec la Fête de la musique, mais qui ne prouve pas la venue de KØZMO.' },
  { id: 'lieu', label: 'Place de la mairie, Coutras', text: 'Un lieu plausible, mais sans confirmation indépendante.' },
  { id: 'organisateur', label: 'Coutras Festivités', text: 'Un organisateur mentionné, sans confirmation de sa participation.' },
];

export const decisions = [
  { id: 'A', label: 'A — On partage, c’est trop drôle !', consequence: 'Une nouvelle publication annonce que KØZMO arriverait en hélicoptère sur le parking du Lidl.', effects: [{ type: 'indicator', indicator: 'rumor', operation: 'add', value: 15 }] },
  { id: 'B', label: 'B — On signale la publication.', consequence: 'Le réseau vous remercie pour le signalement. La publication reste accessible pendant son examen.', effects: [] },
  { id: 'C', label: 'C — On cherche d’où vient l’affiche.', consequence: 'L’affiche provient initialement d’un compte de fans nommé RapRadar33, et non d’un compte officiel.', effects: [
    { type: 'indicator', indicator: 'investigation', operation: 'add', value: 15 },
    { type: 'clue', clue: { id: 'affiche-source', label: 'Origine de l’affiche : compte de fans RapRadar33, et non compte officiel.' } },
  ] },
  { id: 'D', label: 'D — On ne fait rien.', consequence: 'Notification : 742 personnes viennent de rejoindre un groupe de covoiturage pour le concert.', effects: [] },
  { id: 'desaccord', label: 'Pas d’accord collectif', consequence: 'Tatie Nicole, Papi Gilbert et leur famille relaient la rumeur, sans preuve supplémentaire.', effects: [] },
];

export function inspectPoster(state, id) {
  const observation = observations.find(item => item.id === id);
  if (state.sceneId !== 'affiche' || !observation) throw new Error('Observation invalide');
  return rememberClue(state, { id: `affiche-${id}`, label: `${observation.label} : ${observation.text}` });
}

export function decidePoster(state, id) {
  if (state.sceneId !== 'affiche') throw new Error('Situation incorrecte');
  if (state.choices.some(item => item.sceneId === 'affiche')) return state;
  const decision = decisions.find(item => item.id === id);
  if (!decision) throw new Error('Décision inconnue');
  return choose(state, decision);
}

export function createSituation1({ state, onInspect, onDecide, onNext, onClose }) {
  const panel = document.createElement('section');
  panel.className = 'panel situation-one';
  function node(tag, text, className) {
    const item = document.createElement(tag);
    if (text) item.textContent = text;
    if (className) item.className = className;
    return item;
  }
  function action(text, callback, className) {
    const item = node('button', text, className);
    item.type = 'button';
    item.addEventListener('click', callback);
    return item;
  }
  const title = node('h1', 'L’affiche improbable');
  title.tabIndex = -1;
  panel.append(title);
  const saved = state.choices.find(item => item.sceneId === 'affiche');
  if (saved) {
    const decision = decisions.find(item => item.id === saved.id);
    const consequence = node('section', undefined, 's1-consequence');
    consequence.append(node('p', 'Décision collective enregistrée', 'eyebrow'), node('h2', saved.label), node('p', decision.consequence));
    panel.append(consequence, action('Continuer — Tout le monde en parle !', onNext));
    return { panel, title };
  }

  const layout = node('div', undefined, 's1-layout');
  const story = node('section', undefined, 's1-story');
  story.setAttribute('aria-label', 'Story fictive de Rumeurs247');
  story.append(node('p', '@Rumeurs247 · Story fictive', 's1-account'), node('p', 'KØZMO GRATUIT À COUTRAS ?! Faites tourner avant que ça disparaisse !', 's1-message'));
  const thumbnail = action('Agrandir et explorer l’affiche', () => dialog.showModal(), 's1-thumbnail');
  const preview = node('img');
  preview.src = 'assets/affiche-kozmo-concert.png';
  preview.alt = 'Affiche annonçant un concert gratuit de KØZMO, le 21 juin à 19 h, place de la mairie à Coutras, avec Coutras Festivités.';
  thumbnail.prepend(preview);
  story.append(thumbnail);

  const dialog = node('dialog', undefined, 's1-dialog');
  dialog.setAttribute('aria-labelledby', 'poster-title');
  const dialogTitle = node('h2', 'Explorer l’affiche');
  dialogTitle.id = 'poster-title';
  const close = action('Fermer l’affiche', () => dialog.close(), 'secondary');
  close.autofocus = true;
  const dialogLayout = node('div', undefined, 's1-poster-layout');
  const poster = node('div', undefined, 's1-poster');
  const large = preview.cloneNode();
  large.alt = preview.alt;
  poster.append(large);
  const notes = node('section', undefined, 's1-notes');
  notes.append(node('h3', 'Trois informations à examiner'), node('p', 'Choisissez une zone de l’affiche ou un bouton ci-dessous. Aucun ordre imposé.'));
  const observationText = node('p', 'Sélectionnez une information pour lire son observation.', 's1-observation');
  observationText.setAttribute('role', 'status');
  const controls = [];
  function updateConsulted() {
    controls.forEach(({ control, id, label }) => {
      const consulted = state.clues.some(item => item.id === `affiche-${id}`);
      control.classList.toggle('is-consulted', consulted);
      control.setAttribute('aria-label', `${label}${consulted ? ' — consulté' : ''}`);
      control.setAttribute('aria-pressed', String(consulted));
    });
  }
  for (const observation of observations) {
    function inspect() {
      state = onInspect(observation.id);
      observationText.textContent = `${observation.label} : ${observation.text}`;
      updateConsulted();
    }
    const hotspot = action('', inspect, `s1-hotspot s1-hotspot-${observation.id}`);
    hotspot.title = observation.label;
    const textControl = action(observation.label, inspect, 'secondary');
    controls.push({ control: hotspot, ...observation }, { control: textControl, ...observation });
    poster.append(hotspot);
    notes.append(textControl);
  }
  updateConsulted();
  notes.append(observationText);
  dialogLayout.append(poster, notes);
  dialog.append(dialogTitle, close, dialogLayout);

  const collective = node('section', undefined, 's1-collective');
  collective.append(node('h2', 'Votre décision collective'), node('p', 'Échangez à huit, puis validez une seule décision. Elle sera définitive pour cette partie.'));
  const consulted = node('p');
  function updateCount() {
    consulted.textContent = `${observations.filter(item => state.clues.some(clue => clue.id === `affiche-${item.id}`)).length} / 3 informations consultées`;
  }
  updateCount();
  dialog.addEventListener('close', () => { updateCount(); onClose?.(); });
  collective.append(consulted);
  const error = node('p', undefined, 's1-error');
  error.setAttribute('role', 'alert');
  for (const decision of decisions) {
    collective.append(action(decision.label, () => {
      try { onDecide(decision.id); }
      catch (issue) { error.textContent = issue.message; }
    }, decision.id === 'desaccord' ? 'secondary s1-trainer' : 's1-decision'));
  }
  collective.append(error);
  layout.append(story, collective);
  panel.append(layout, dialog);
  return { panel, title };
}
