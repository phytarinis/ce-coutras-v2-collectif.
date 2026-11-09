// Écran d'accueil uniquement. Le parcours reste piloté par app.js et son moteur.
export function createHome(onStart) {
  const screen = document.createElement('section');
  screen.className = 'home';
  screen.setAttribute('aria-labelledby', 'home-title');

  const identity = document.createElement('div');
  identity.className = 'home-identity';
  const logo = document.createElement('span');
  logo.className = 'home-labo';
  const logoImage = document.createElement('img');
  logoImage.src = 'assets/originals/Le bazar d’E2C Coutras.png';
  logoImage.alt = 'Le Labo Épicé';
  logo.append(logoImage);
  const cross = document.createElement('span');
  cross.className = 'home-cross';
  cross.textContent = '×';
  cross.setAttribute('aria-hidden', 'true');
  const partner = document.createElement('span');
  partner.textContent = 'E2C Coutras';
  identity.append(logo, cross, partner);

  const character = document.createElement('img');
  character.className = 'home-character';
  character.src = 'assets/derived/kozmo.png';
  character.alt = 'KØZMO, lunettes de soleil et survêtement vert bouteille à bandes crème';
  character.width = 1312;
  character.height = 1199;
  character.setAttribute('fetchpriority', 'high');

  const content = document.createElement('div');
  content.className = 'home-content';
  const title = document.createElement('h1');
  title.id = 'home-title';
  title.className = 'home-title';
  title.tabIndex = -1;
  title.setAttribute('aria-label', 'Ce Coutras qui n’existe pas… Ça dérape !');
  for (const [text, className] of [
    ['Ce Coutras', 'paper'],
    ['qui n’existe pas…', 'paper'],
    ['Ça dérape !', 'paper paper-orange'],
  ]) {
    const line = document.createElement('span');
    line.className = className;
    line.textContent = text;
    line.setAttribute('aria-hidden', 'true');
    title.append(line);
  }

  const tagline = document.createElement('p');
  tagline.className = 'home-tagline';
  tagline.textContent = 'Une ville. Une rumeur. Huit joueurs pour éviter le grand n’importe quoi.';
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'home-start';
  start.textContent = 'LANCER LE BAZAR !';
  start.addEventListener('click', onStart);

  const facts = document.createElement('ul');
  facts.className = 'home-facts';
  facts.setAttribute('aria-label', 'Informations sur la partie');
  for (const text of ['8 joueurs · 1 équipe', 'Environ 20 minutes', '3 fins possibles']) {
    const item = document.createElement('li');
    item.textContent = text;
    facts.append(item);
  }
  content.append(title, tagline);
  const controls = document.createElement('div');
  controls.className = 'home-controls';
  controls.append(start, facts);
  screen.append(character, identity, content, controls);
  return { screen, title };
}
