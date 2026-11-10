// Valeurs initiales validées pour la mission 3 : propagation 0, enquête 0.
export function createGame() {
  return {
    sceneId: 'accueil',
    indicators: { rumor: 0, investigation: 0 },
    choices: [],
    clues: [],
    pending: [],
    applied: [],
  };
}

function applyEffect(state, effect) {
  if (effect.type === 'clue') {
    if (!state.clues.some(clue => clue.id === effect.clue.id)) {
      state.clues.push({ ...effect.clue });
    }
  } else if (effect.type === 'indicator') {
    if (!Object.hasOwn(state.indicators, effect.indicator)) {
      throw new Error('Indicateur inconnu');
    }
    if (!Number.isFinite(effect.value)) throw new Error('Valeur non numérique');
    if (effect.operation === 'set') state.indicators[effect.indicator] = effect.value;
    else if (effect.operation === 'add') {
      if (state.indicators[effect.indicator] === null) {
        throw new Error('Définir une valeur initiale validée avant une variation');
      }
      state.indicators[effect.indicator] += effect.value;
    } else throw new Error('Opération inconnue');
  } else throw new Error('Type de conséquence inconnu');
}

// Une consultation est un indice, pas une décision collective.
export function rememberClue(state, clue) {
  const next = structuredClone(state);
  applyEffect(next, { type: 'clue', clue });
  return next;
}

export function enterScene(state, sceneId) {
  const next = structuredClone(state);
  next.sceneId = sceneId;
  const due = next.pending.filter(item => item.atScene === sceneId);
  next.pending = next.pending.filter(item => item.atScene !== sceneId);
  for (const item of due) {
    applyEffect(next, item.effect);
    next.applied.push(item.id);
  }
  return next;
}

// Un choix est validé une seule fois ; revenir à une scène ne rejoue pas ses effets.
// effect.atScene permet une conséquence différée à l'entrée d'une scène précise.
export function choose(state, choice) {
  if (state.choices.some(item => item.sceneId === state.sceneId && item.id === choice.id)) {
    return state;
  }
  const next = structuredClone(state);
  next.choices.push({ id: choice.id, sceneId: state.sceneId, label: choice.label });
  for (const [index, effect] of (choice.effects ?? []).entries()) {
    const id = `${state.sceneId}:${choice.id}:${index}`;
    if (effect.atScene) next.pending.push({ id, atScene: effect.atScene, effect });
    else {
      applyEffect(next, effect);
      next.applied.push(id);
    }
  }
  return next;
}
