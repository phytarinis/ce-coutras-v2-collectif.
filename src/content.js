// Contenus éditoriaux : aucun barème ni scénario n'est défini ici.
// Chaque situation pourra recevoir un tableau choices et des indices validés.
export const situations = [
  { id: 'affiche', title: 'L’affiche improbable' },
  { id: 'tout-le-monde', title: 'Tout le monde en parle !' },
  { id: 'allo', title: 'Allô Coutras ?' },
  { id: 'c24', title: 'C24 NEWS s’emballe' },
  { id: 'buzz', title: 'Coupe le buzz !' },
  { id: 'business', title: 'Le business du siècle' },
  { id: 'rassemblement', title: 'Le grand rassemblement' },
].map(scene => ({ ...scene, choices: [] }));

export const endings = [
  { id: 'fin-1', title: 'Fin 1 — à définir' },
  { id: 'fin-2', title: 'Fin 2 — à définir' },
  { id: 'fin-3', title: 'Fin 3 — à définir' },
];

export const demoClue = {
  id: 'indice-technique',
  label: 'Indice de démonstration — sans contenu narratif',
};
