import { contacts, c24Notification } from './situation3-state.js';
import { telephoneAudio } from './telephone-audio.js';
import { telephoneVoice } from './telephone-voice.js';

export function createSituation3({ state, onAction, onNext, onPrevious }) {
  const scene = state.situation3;
  const panel = el('section', undefined, 'panel situation-three');
  let timeout;
  let disposed = false;
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, key, className = '') {
    const node = el('button', text, className);
    node.type = 'button';
    node.dataset.s3Focus = key;
    node.addEventListener('click', () => onAction(action, key));
    return node;
  }
  const title = el('h1', 'ALLÔ COUTRAS ?');
  title.tabIndex = -1;
  panel.append(el('p', '03 / L’enquête collective', 's3-kicker'), title, el('h2', 'LE STANDARD EST EN PLS !', 's3-subtitle'));
  const toolbar = el('div', undefined, 's3-toolbar');
  const count = el('p', `${scene.calls.length}/2 appels utilisés`, 's3-count');
  count.setAttribute('role', 'status');
  const sound = el('button', telephoneAudio.enabled ? 'Son activé' : 'Son coupé', 'secondary');
  sound.type = 'button';
  sound.dataset.s3Focus = 'sound';
  sound.setAttribute('aria-pressed', String(telephoneAudio.enabled));
  const soundNote = el('span', '', 's3-sound-note');
  soundNote.setAttribute('role', 'status');
  sound.addEventListener('click', () => {
    if (telephoneAudio.enabled) { telephoneAudio.mute(); telephoneVoice.stop(); }
    else telephoneAudio.enabled = true;
    sound.textContent = telephoneAudio.enabled ? 'Son activé' : 'Son coupé';
    sound.setAttribute('aria-pressed', String(telephoneAudio.enabled));
  });
  toolbar.append(count, sound, soundNote);
  panel.append(toolbar);
  const fiction = el('p', 'Appels et dialogues entièrement fictifs : aucune connexion téléphonique ni déclaration réelle des organismes.', 's3-fiction');
  if (scene.phase === 'contacts') {
    panel.append(el('p', 'Quatre contacts. Deux appels. Qui peut vraiment confirmer ce concert ?', 's3-instruction'));
    const grid = el('div', undefined, 's3-contacts');
    for (const contact of contacts) {
      const card = button('', { type: 'select', id: contact.id }, contact.id, 's3-contact');
      card.disabled = scene.calls.length >= 2 || scene.calls.some(call => call.id === contact.id);
      card.setAttribute('aria-label', `${contact.mark} — ${contact.name}`);
      card.setAttribute('aria-pressed', String(scene.selected === contact.id));
      const badge = el('span', contact.mark, 's3-contact-mark');
      badge.setAttribute('aria-hidden', 'true');
      card.append(badge, el('strong', contact.name), el('span', contact.skill), el('small', scene.calls.some(call => call.id === contact.id) ? 'Déjà appelé' : scene.calls.length >= 2 ? 'Deux appels utilisés' : 'Choisir ce contact'));
      grid.append(card);
    }
    panel.append(grid);
    if (scene.selected) {
      const confirm = el('section', undefined, 's3-confirm');
      confirm.setAttribute('aria-label', 'Confirmation de l’appel');
      confirm.append(el('p', `Appeler ${contacts.find(contact => contact.id === scene.selected).name} ? Cet appel sera consommé dès confirmation.`), button('APPELER', { type: 'confirm' }, 'confirm'), button('Annuler', { type: 'cancel' }, 'cancel', 'secondary'));
      panel.append(confirm);
    }
    if (scene.calls.some(call => call.completed)) panel.append(button(scene.calls.length === 1 ? 'Poursuivre après un seul appel' : 'Voir le bilan des appels', { type: 'summary' }, 'summary'));
  } else if (scene.phase === 'ringing' || scene.phase === 'answer') {
    const contact = contacts.find(contact => contact.id === scene.calls.at(-1).id);
    const line = el('section', undefined, `s3-line ${scene.phase === 'ringing' ? 's3-ringing' : ''}`);
    line.setAttribute('aria-label', `Appel à ${contact.name}`);
    line.append(el('p', scene.phase === 'ringing' ? 'DRING… DRING…' : 'En ligne', 's3-line-status'), el('h2', contact.name), el('p', contact.humor, 's3-humor'));
    if (scene.phase === 'ringing') {
      line.append(button('Voir la réponse maintenant', { type: 'answer' }, 'answer'));
      const remaining = Math.max(0, scene.ringUntil - Date.now());
      void telephoneAudio.ring(remaining).then(played => {
        if (!disposed && telephoneAudio.enabled && !played) soundNote.textContent = 'Audio indisponible : l’appel continue sans son.';
      });
      timeout = setTimeout(() => onAction({ type: 'answer' }), remaining);
    } else {
      const voiceNote = el('p', '', 's3-sound-note');
      voiceNote.setAttribute('role', 'status');
      function readDialogues() {
        if (!telephoneAudio.enabled) {
          voiceNote.textContent = 'Activez le son pour écouter les dialogues.';
          return;
        }
        voiceNote.textContent = '';
        telephoneVoice.say(`${contact.humor} ${contact.response}`, () => {
          if (!disposed) voiceNote.textContent = 'Voix française indisponible ou bloquée. Essayez « Écouter les dialogues » ; les textes restent accessibles.';
        }, contact.id);
      }
      const replay = el('button', 'Écouter les dialogues', 'secondary');
      replay.type = 'button';
      replay.addEventListener('click', readDialogues);
      line.append(el('p', contact.response, 's3-response'), replay, button('TERMINER L’APPEL', { type: 'finish' }, 'finish'), voiceNote);
      if (telephoneAudio.enabled) readDialogues();
    }
    panel.append(line);
  } else {
    panel.append(el('h2', 'Ce que vous avez réellement appris'));
    const summary = el('div', undefined, 's3-summary');
    scene.calls.filter(call => call.completed).forEach(call => {
      const contact = contacts.find(contact => contact.id === call.id);
      const card = el('article', undefined, 's3-summary-card');
      card.append(el('p', `Appel ${call.order}`, 's3-kicker'), el('h3', contact.name), el('p', call.response), el('p', contact.certainty, 's3-certainty'));
      summary.append(card);
    });
    const notification = el('section', undefined, 's3-notification');
    notification.append(el('p', 'C24 NEWS · Nouvelle notification', 's3-kicker'), el('p', c24Notification));
    const next = el('button', 'CONTINUER — C24 NEWS');
    next.type = 'button';
    next.addEventListener('click', onNext);
    panel.append(summary, notification, next);
  }
  panel.append(fiction, el('p', 'Aucun point attribué aux appels pour cette intégration. Les effets chiffrés restent à valider lors de l’équilibrage général.', 's3-balance'));
  const previous = el('button', 'Situation précédente', 'secondary s3-previous');
  previous.type = 'button';
  previous.addEventListener('click', onPrevious);
  panel.append(previous);
  return { panel, title, cleanup: () => { disposed = true; clearTimeout(timeout); telephoneAudio.stop(); telephoneVoice.stop(); } };
}
