import { choose, rememberClue } from './engine.js';

export const publications = [
  { account: '@rapbuzz_gironde', text: 'C’EST CONFIRMÉ ! Plusieurs comptes annoncent KØZMO à Coutras 🔥', trail: 'A' },
  { account: '@le_vrai_mika33', text: 'Mon cousin a déjà prévu le trajet !', trail: 'B' },
  { account: '@coutras_events', text: 'Grosse soirée en préparation 👀', trail: 'A' },
  { account: '@rapradar33', text: 'Des infos arrivent bientôt…', trail: 'C' },
  { account: '@team_kozmo33', text: 'Le 21 juin on retourne Coutras !! Qui vient ?', trail: 'A' },
  { account: '@radio_buzz33', text: 'La toile s’enflamme autour d’un concert surprise à Coutras.', trail: 'A' },
];

export const trails = {
  A: { title: 'Les confirmations multiples', link: 'Ces comptes reprennent RapRadar33 ou des comptes qui le citent. Remontez cette chaîne de publications.', clue: 'Plusieurs comptes reprennent les publications de RapRadar33 ou de comptes qui le citent, sans preuve indépendante.' },
  B: { title: 'Le cousin de Mika33', link: 'Mika33 cite son cousin. Regardez sur quoi repose son information.', clue: 'Le cousin a simplement vu une affiche sur Internet. Il n’a reçu aucune confirmation d’un organisateur.' },
  C: { title: 'Le prétendu scoop', link: 'La réputation de RapRadar33 repose sur des informations passées. Vérifiez ce qu’il sait de ce concert.', clue: 'RapRadar33 aurait déjà eu raison dans le passé, mais cela ne prouve rien pour ce concert. Le compte ne dispose pas de confirmation officielle.' },
};

const add = (indicator, value) => ({ type: 'indicator', indicator, operation: 'add', value });
export const situation2Decisions = [
  { id: 'A', label: 'A — Publier une alerte « Rien n’est confirmé ».', notification: 'ALERTE !!! APPAREMMENT KØZMO SERAIT À COUTRAS MAIS C’EST PAS CONFIRMÉ !!! 🔥🔥🔥', effects: [add('rumor', 10), add('investigation', 5)] },
  { id: 'B', label: 'B — Continuer à enquêter.', notification: 'Contactez Coutras Festivités, ils sont forcément au courant !', effects: [add('rumor', 5), add('investigation', 15), { type: 'clue', clue: { id: 's2-festivites', label: 'Coutras Festivités est mentionné comme interlocuteur possible, sans confirmation du concert.' } }] },
  { id: 'C', label: 'C — Ne rien relayer sans preuve.', notification: 'URGENT : Kevin33 cherche trois places dans une voiture pour Coutras. Départ de Bordeaux dans 20 minutes. Il a déjà acheté les chips.', effects: [add('rumor', 5)] },
  { id: 'D', label: 'Pas d’accord collectif', notification: 'La cellule d’enquête de Coutras hésiterait à créer un groupe WhatsApp pour décider de créer un groupe WhatsApp.', effects: [] },
];

export function newSituation2() {
  return { phase: 'intro', visiblePosts: 1, steps: { A: 0, B: 0, C: 0 }, remainingMs: 90000, deadline: null, paused: false, failedVotes: 0, lastTrail: null };
}

// Le temps réel écoulé fait foi, même si un onglet est ralenti ou masqué.
// now est injectable pour vérifier 90 s et les pauses sans attendre en test.
export function transitionSituation2(state, action, now = Date.now()) {
  if (state.sceneId !== 'tout-le-monde') throw new Error('Situation incorrecte');
  let next = structuredClone(state);
  const scene = next.situation2 ??= newSituation2();
  if (scene.phase === 'explore' && !scene.paused) {
    scene.remainingMs = Math.max(0, scene.deadline - now);
    if (scene.remainingMs === 0) {
      scene.phase = 'debate';
      scene.deadline = null;
    }
  }
  if (action.type === 'visit' || action.type === 'tick') return next;
  if (action.type === 'nextPost' && scene.phase === 'intro') scene.visiblePosts = Math.min(6, scene.visiblePosts + 1);
  else if (action.type === 'start' && scene.phase === 'intro' && scene.visiblePosts === 6) {
    scene.phase = 'explore';
    scene.deadline = now + scene.remainingMs;
  } else if (action.type === 'pause' && scene.phase === 'explore' && !scene.paused) {
    scene.paused = true;
    scene.deadline = null;
  } else if (action.type === 'resume' && scene.phase === 'explore' && scene.paused) {
    scene.paused = false;
    scene.deadline = now + scene.remainingMs;
  } else if (action.type === 'inspect' && scene.phase === 'explore' && !scene.paused) {
    const trail = trails[action.trail];
    if (!trail) throw new Error('Piste inconnue');
    scene.lastTrail = action.trail;
    scene.steps[action.trail] = Math.min(2, scene.steps[action.trail] + 1);
    if (scene.steps[action.trail] === 2) next = rememberClue(next, { id: `s2-${action.trail}`, label: `${trail.title} : ${trail.clue}` });
  } else if (action.type === 'debate' && scene.phase === 'explore' && Object.values(scene.steps).every(step => step === 2)) {
    scene.phase = 'debate';
    scene.deadline = null;
    scene.paused = false;
  } else if (action.type === 'failedVote' && scene.phase === 'debate') scene.failedVotes = Math.min(2, scene.failedVotes + 1);
  else if (action.type === 'decide' && scene.phase === 'debate' && !next.choices.some(choice => choice.sceneId === 'tout-le-monde')) {
    const decision = situation2Decisions.find(item => item.id === action.id);
    if (!decision || (decision.id === 'D' && scene.failedVotes < 2)) throw new Error('Décision indisponible');
    next = choose(next, decision);
    next.situation2.phase = 'consequence';
  }
  return next;
}
