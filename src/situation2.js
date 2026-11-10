import { publications, trails, situation2Decisions } from './situation2-state.js';

export function createSituation2({ state, onAction, onTick, onNext, onPrevious }) {
  const scene = state.situation2;
  const panel = el('section', undefined, 'panel situation-two');
  const title = el('h1', 'Tout le monde en parle !');
  title.tabIndex = -1;
  panel.append(el('p', '02 / L’enquête collective', 's2-kicker'), title);
  let interval;
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, key, className = '') {
    const node = el('button', text, className);
    node.type = 'button';
    node.dataset.s2Focus = key;
    node.addEventListener('click', () => onAction(action, key));
    return node;
  }
  function postCard(post, index, interactive = false) {
    const card = el(interactive ? 'button' : 'article', undefined, 's2-post');
    if (interactive) {
      card.type = 'button';
      card.dataset.s2Focus = `post-${index}`;
      card.disabled = scene.paused;
      card.setAttribute('aria-label', `Rechercher la provenance de ${post.account}`);
      card.addEventListener('click', () => onAction({ type: 'inspect', trail: post.trail }, `post-${index}`));
    }
    const avatar = el('span', post.account.slice(1, 2).toUpperCase(), 's2-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    card.append(avatar, el('strong', post.account), el('span', post.text, 's2-post-text'));
    if (interactive) card.append(el('small', scene.steps[post.trail] === 2 ? 'Piste découverte · Revoir' : scene.steps[post.trail] === 1 ? 'Lien trouvé · Remonter à la source' : 'Rechercher la provenance', 's2-post-action'));
    return card;
  }

  if (scene.phase === 'intro') {
    panel.append(el('p', 'Le fil s’emballe. Découvrez les publications à votre rythme. Tous les comptes sont fictifs.', 's2-intro'));
    const feed = el('div', undefined, 's2-feed');
    publications.slice(0, scene.visiblePosts).forEach((post, index) => {
      const card = postCard(post, index);
      if (index === scene.visiblePosts - 1) card.classList.add('s2-arrive');
      feed.append(card);
    });
    panel.append(feed, el('p', `${scene.visiblePosts} / 6 publications`, 's2-count'));
    panel.append(scene.visiblePosts < 6
      ? button('Publication suivante', { type: 'nextPost' }, 'next-post')
      : button('Démarrer l’enquête — 90 secondes', { type: 'start' }, 'start'));
  } else if (scene.phase === 'explore') {
    const toolbar = el('div', undefined, 's2-toolbar');
    const timer = el('span', '', 's2-timer');
    timer.setAttribute('role', 'timer');
    timer.setAttribute('aria-label', 'Temps d’exploration restant');
    timer.setAttribute('aria-live', 'off');
    function showTime(current) {
      const seconds = Math.ceil(current.remainingMs / 1000);
      timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}${current.paused ? ' · En pause' : ''}`;
    }
    showTime(scene);
    toolbar.append(timer, button(scene.paused ? 'Reprendre le chronomètre' : 'Mettre en pause', { type: scene.paused ? 'resume' : 'pause' }, 'pause', 'secondary'));
    panel.append(toolbar, el('p', scene.paused ? 'Exploration en pause. Les découvertes sont conservées.' : 'Ouvrez une publication, puis remontez le lien découvert pour en vérifier la provenance.'));
    if (state.clues.some(clue => clue.id === 'affiche-source')) panel.append(el('p', 'RapRadar33 : ce nom est déjà dans votre carnet.', 's2-known'));
    const layout = el('div', undefined, 's2-investigation');
    const feed = el('div', undefined, 's2-feed');
    publications.forEach((post, index) => feed.append(postCard(post, index, true)));
    const details = el('section', undefined, 's2-findings');
    details.setAttribute('aria-label', 'Découvertes de l’exploration');
    const found = Object.values(scene.steps).filter(step => step === 2).length;
    details.append(el('h2', `${found} / 3 pistes découvertes`));
    if (scene.lastTrail) {
      const trail = trails[scene.lastTrail];
      const observation = el('div', undefined, 's2-observation');
      observation.setAttribute('role', 'status');
      observation.append(el('h3', trail.title), el('p', scene.steps[scene.lastTrail] === 2 ? trail.clue : trail.link));
      details.append(observation);
    } else details.append(el('p', 'Plusieurs annonces : plusieurs sources ? À vous de remonter le fil.'));
    for (const [id, trail] of Object.entries(trails)) if (scene.steps[id] === 2) details.append(el('p', `✓ ${trail.title}`, 's2-discovered'));
    if (found === 3) details.append(button('Passer au débat collectif', { type: 'debate' }, 'debate'));
    layout.append(feed, details);
    panel.append(layout);
    interval = setInterval(() => {
      const current = onTick();
      if (current?.phase === 'explore') showTime(current);
    }, 200);
  } else if (scene.phase === 'debate') {
    panel.append(el('h2', 'Le débat collectif'), el('p', scene.remainingMs === 0 ? 'Temps écoulé. L’exploration est terminée ; vos découvertes sont conservées.' : 'Les trois pistes ont été découvertes. Place au débat.'), el('p', 'Prenez le temps d’échanger. Une seule décision sera enregistrée. Le débat n’est pas chronométré.'));
    const summary = el('section', undefined, 's2-findings');
    summary.append(el('h3', 'Votre enquête'));
    for (const [id, trail] of Object.entries(trails)) summary.append(el('p', scene.steps[id] === 2 ? trail.clue : `${trail.title} : piste non découverte.`));
    panel.append(summary);
    const choices = el('div', undefined, 's2-decisions');
    situation2Decisions.slice(0, 3).forEach(decision => choices.append(button(decision.label, { type: 'decide', id: decision.id }, `decision-${decision.id}`)));
    panel.append(choices);
    const trainer = el('section', undefined, 's2-trainer');
    trainer.append(el('h3', 'Formateur · Votes collectifs'), el('p', `${scene.failedVotes} / 2 votes sans accord`));
    if (scene.failedVotes < 2) trainer.append(button('Enregistrer un vote sans accord', { type: 'failedVote' }, 'failed-vote', 'secondary'));
    else trainer.append(button('Pas d’accord collectif', { type: 'decide', id: 'D' }, 'decision-D', 'secondary'));
    panel.append(trainer);
  } else {
    const saved = state.choices.find(choice => choice.sceneId === 'tout-le-monde');
    const decision = situation2Decisions.find(item => item.id === saved.id);
    const notification = el('section', undefined, 's2-notification s2-arrive');
    notification.append(el('p', decision.id === 'D' ? 'C24 NEWS · Flash parodique' : 'Nouvelle notification', 's2-kicker'), el('h2', decision.label), el('p', decision.notification, 's2-notification-text'));
    if (decision.id === 'A') notification.append(el('p', 'L’alerte est reprise dans le fil : elle peut amplifier la rumeur.', 's2-forwarded'));
    panel.append(notification);
    const next = el('button', 'CONTINUER — ALLÔ COUTRAS ?', 's2-continue');
    next.type = 'button';
    next.addEventListener('click', onNext);
    panel.append(next);
  }
  const previous = el('button', 'Situation précédente', 'secondary s2-previous');
  previous.type = 'button';
  previous.addEventListener('click', onPrevious);
  panel.append(previous);
  return { panel, title, cleanup: () => clearInterval(interval) };
}
