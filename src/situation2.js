import { publications, trails, situation2Decisions } from './situation2-state.js';
import { buzzAudio } from './buzz-audio.js';

export function createSituation2({ state, onAction, onTick, onNext, onPrevious }) {
  const scene = state.situation2;
  const panel = el('section', undefined, 'panel situation-two');
  const title = el('h1', 'Tout le monde en parle !');
  title.tabIndex = -1;
  panel.append(el('p', '02 / L’enquête collective', 's2-kicker'), title);
  let interval;
  let avalanche;
  let disposed = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotionChange = () => {
    if (motion.matches && scene.phase === 'intro') onAction({ type: 'skipIntro' });
  };
  motion.addEventListener('change', onMotionChange);
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
    if (index === 4) {
      const teaser = el('figure', undefined, 's2-kozmo');
      const image = el('img');
      image.src = 'assets/affiche-kozmo-concert.png';
      image.alt = 'Affiche annonçant le concert gratuit de KØZMO à Coutras';
      image.width = 1086;
      image.height = 1448;
      teaser.append(image, el('figcaption', 'CONCERT GRATUIT À COUTRAS ?'));
      card.append(teaser);
    }
    if (interactive) card.append(el('small', scene.steps[post.trail] === 2 ? 'Piste découverte · Revoir' : scene.steps[post.trail] === 1 ? 'Lien trouvé · Remonter à la source' : 'Rechercher la provenance', 's2-post-action'));
    return card;
  }

  if (scene.phase === 'intro') {
    panel.append(el('h2', '6 publications. Mais combien de vraies sources ?'), el('p', 'Vous avez 90 secondes pour découvrir qui tient l’information… et qui se contente de la répéter !', 's2-intro'));
    const audioControls = el('div', undefined, 's2-audio-controls');
    const sound = el('button', buzzAudio.enabled ? 'Son activé' : 'Son coupé', 'secondary');
    sound.type = 'button';
    sound.dataset.s2Focus = 'sound';
    sound.setAttribute('aria-pressed', String(buzzAudio.enabled));
    const audioNote = el('span', '', 's2-audio-note');
    audioNote.setAttribute('role', 'status');
    async function enableSound() {
      const enabled = await buzzAudio.enable();
      if (disposed) return;
      sound.textContent = enabled ? 'Son activé' : 'Son coupé';
      sound.setAttribute('aria-pressed', String(enabled));
      audioNote.textContent = enabled ? '' : 'Son indisponible. Vous pouvez continuer sans son.';
      if (enabled && scene.visiblePosts < 6 && !motion.matches) buzzAudio.play(scene.visiblePosts - 1);
    }
    sound.addEventListener('click', () => {
      if (buzzAudio.enabled) {
        buzzAudio.mute();
        sound.textContent = 'Son coupé';
        sound.setAttribute('aria-pressed', 'false');
      } else void enableSound();
    });
    audioControls.append(sound);
    if (scene.visiblePosts < 6) {
      if (!buzzAudio.enabled) {
        const launch = el('button', 'Lancer le buzz', 'secondary');
        launch.type = 'button';
        launch.dataset.s2Focus = 'buzz';
        launch.addEventListener('click', () => { void enableSound(); launch.hidden = true; });
        audioControls.append(launch);
      }
      audioControls.append(button('Passer l’animation', { type: 'skipIntro' }, 'skip', 'secondary'));
      avalanche = setTimeout(() => {
        if (!motion.matches) buzzAudio.play(scene.visiblePosts);
        onAction({ type: 'nextPost' });
      }, 1100);
    }
    audioControls.append(audioNote);
    panel.append(audioControls);
    const feed = el('div', undefined, 's2-feed');
    publications.slice(0, scene.visiblePosts).forEach((post, index) => {
      const card = postCard(post, index);
      if (index === scene.visiblePosts - 1) card.classList.add('s2-arrive');
      feed.append(card);
    });
    panel.append(feed, el('p', `${scene.visiblePosts} / 6 publications`, 's2-count'));
    if (scene.visiblePosts === 6) panel.append(button('LANCER L’ENQUÊTE — 90 S', { type: 'start' }, 'start'));
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
    panel.append(toolbar, el('p', scene.paused ? 'Exploration en pause. Les découvertes sont conservées.' : 'Cliquez sur les publications pour découvrir leurs sources. Retrouvez les trois pistes avant la fin du chrono !'));
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
    const summary = el('section', undefined, 's2-summary');
    summary.setAttribute('aria-label', 'Bilan des découvertes');
    const summaries = {
      A: ['Source commune', 'Les comptes reprennent RapRadar33, sans preuve indépendante.'],
      B: ['Témoignage indirect', 'Le cousin a vu l’affiche en ligne, sans confirmation d’un organisateur.'],
      C: ['Scoop non confirmé', 'Une réputation passée, mais aucune confirmation officielle de ce concert.'],
    };
    for (const [id, [label, text]] of Object.entries(summaries)) {
      const card = el('article', undefined, 's2-summary-card');
      card.append(el('h3', label), el('p', scene.steps[id] === 2 ? text : 'Non découverte'));
      summary.append(card);
    }
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
  return { panel, title, cleanup: () => {
    disposed = true;
    clearInterval(interval);
    clearTimeout(avalanche);
    motion.removeEventListener('change', onMotionChange);
  } };
}
