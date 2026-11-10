import { choose, rememberClue } from './engine.js';

export const contacts = [
  { id: 'mairie', name: 'Mairie de Coutras', skill: 'Déclarations et autorisations d’événements.', mark: 'A',
    humor: 'Pour les cartes d’identité, tapez 1. Pour l’état civil, tapez 2. Pour le concert de KØZMO… merci de ne plus taper sur votre téléphone.',
    response: 'Nous n’avons pas de confirmation officielle concernant ce concert. Et non, une affiche sur Internet ne constitue pas une autorisation.',
    clue: 'La mairie ne confirme pas le concert, sans affirmer catégoriquement qu’il n’existe pas.', certainty: 'Absence de confirmation, pas de démenti catégorique.', relay: 'Relais mairie : absence de confirmation du concert.' },
  { id: 'festivites', name: 'Coutras Festivités', skill: 'Organisation des festivités.', mark: 'B',
    humor: 'Vous êtes bien chez Coutras Festivités. Si vous cherchez le programme des animations, restez en ligne. Si vous cherchez KØZMO, nous aussi, apparemment !',
    response: 'Un concert de KØZMO le 21 juin ? Nous n’organisons pas cet événement. Pourtant notre nom figure sur l’affiche !',
    clue: 'Coutras Festivités dément être l’organisateur du concert annoncé.', certainty: 'Démenti de son implication comme organisateur.', relay: 'Relais Coutras Festivités : démenti de son implication dans le concert annoncé.' },
  { id: 'police', name: 'Police municipale', skill: 'Sécurité et occupation de l’espace public.', mark: 'C',
    humor: 'Pour un véhicule mal stationné, patientez. Pour une foule de fans devant la mairie, nous préférerions en être informés avant la foule.',
    response: 'Nous ne pouvons pas confirmer la programmation d’un concert. Pour cela, contactez les organisateurs ou les services compétents.',
    clue: 'La police municipale ne confirme pas la programmation du concert.', certainty: 'Programmation non confirmée par ce service.', relay: 'Relais police municipale : communication prudente sur la sécurité.' },
  { id: 'tourisme', name: 'Office de tourisme', skill: 'Agenda et informations locales.', mark: 'D',
    humor: 'Bienvenue ! Pour découvrir les richesses de notre territoire, tapez 1. Pour découvrir pourquoi tout le monde parle d’un concert qui n’apparaît pas dans notre agenda, ne quittez pas.',
    response: 'Nous n’avons pas cet événement dans notre agenda. Le mieux serait de vérifier directement auprès de l’organisateur annoncé.',
    clue: 'Le concert n’apparaît pas dans l’agenda consulté par l’office.', certainty: 'Absence dans l’agenda consulté, pas de démenti catégorique.', relay: 'Relais office de tourisme : absence du concert dans son agenda.' },
];
export const c24Notification = 'Pendant que vous cherchiez à joindre les bons interlocuteurs, C24 NEWS vient d’annoncer une édition spéciale sur le concert de KØZMO !';
export function selectRelay(calls) {
  const id = ['festivites', 'mairie', 'police', 'tourisme'].find(id => calls.some(call => call.id === id));
  return contacts.find(contact => contact.id === id);
}
export function newSituation3() {
  return { phase: 'contacts', selected: null, calls: [], ringUntil: null, relay: null };
}

export function transitionSituation3(state, action, now = Date.now()) {
  if (state.sceneId !== 'allo') throw new Error('Situation incorrecte');
  let next = structuredClone(state);
  const scene = next.situation3 ??= newSituation3();
  if (scene.phase === 'ringing' && now >= scene.ringUntil) {
    scene.phase = 'answer';
    scene.ringUntil = null;
  }
  if (action.type === 'visit') return next;
  if (action.type === 'select' && scene.phase === 'contacts' && scene.calls.length < 2 && !scene.calls.some(call => call.id === action.id)) {
    if (!contacts.some(contact => contact.id === action.id)) throw new Error('Contact inconnu');
    scene.selected = action.id;
  } else if (action.type === 'cancel' && scene.phase === 'contacts') scene.selected = null;
  else if (action.type === 'confirm' && scene.phase === 'contacts' && scene.selected && scene.calls.length < 2 && !scene.calls.some(call => call.id === scene.selected)) {
    const contact = contacts.find(contact => contact.id === scene.selected);
    scene.calls.push({ id: contact.id, order: scene.calls.length + 1, response: null, clue: null, completed: false });
    scene.phase = 'ringing';
    scene.ringUntil = now + 2000;
    next = choose(next, { id: `call-${contact.id}`, label: `Appel ${scene.calls.length} — ${contact.name}`, effects: [] });
  } else if (action.type === 'answer' && scene.phase === 'ringing') {
    scene.phase = 'answer';
    scene.ringUntil = null;
  } else if (action.type === 'finish' && scene.phase === 'answer') {
    const call = scene.calls.at(-1);
    const contact = contacts.find(contact => contact.id === call.id);
    Object.assign(call, { response: contact.response, clue: contact.clue, completed: true });
    scene.phase = 'contacts';
    scene.selected = null;
    const relay = selectRelay(scene.calls);
    scene.relay = { id: relay.id, atScene: 'buzz', label: relay.relay };
    // Seule notre conséquence est remplacée quand le deuxième appel change la priorité.
    next.pending = next.pending.filter(effect => effect.id !== 's3-correction');
    next.pending.push({ id: 's3-correction', atScene: 'buzz', effect: { type: 'clue', clue: { id: 's3-relay', label: relay.relay } } });
    next = rememberClue(next, { id: `s3-${contact.id}`, label: `${contact.name} : ${contact.clue}` });
  } else if (action.type === 'summary' && scene.phase === 'contacts' && scene.calls.some(call => call.completed)) scene.phase = 'summary';
  return next;
}
