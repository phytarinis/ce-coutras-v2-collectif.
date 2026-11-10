import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { contacts, c24Notification } from '../src/situation3-state.js';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.spoken = [];
    window.voiceProfilesRead = [];
    window.voiceCanceled = 0;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [{ lang: 'fr-FR', localService: true }],
      speak: line => { window.spoken.push(line.text); window.voiceProfilesRead.push({rate: line.rate, pitch: line.pitch}); },
      cancel: () => window.voiceCanceled++,
    } });
    window.rings = [];
    window.AudioContext = class {
      constructor() { if (window.blockAudio) throw new Error('Bloqué'); }
      state = 'running'; currentTime = 0; destination = {};
      async resume() {}
      createOscillator() { return { frequency: { setValueAtTime: value => window.rings.push(value) }, connect() {}, start() {}, stop() {}, disconnect() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    };
  });
  async function arrive() {
    await page.goto('http://127.0.0.1:8000');
    await page.getByRole('button', { name: 'LANCER LE BAZAR !' }).click();
    await page.getByRole('button', { name: 'C — On cherche d’où vient l’affiche.', exact: true }).click();
    await page.getByRole('button', { name: 'Continuer — Tout le monde en parle !' }).click();
    await page.getByRole('button', { name: 'LANCER L’ENQUÊTE — 90 S' }).click();
    await page.clock.fastForward(90000);
    await page.getByRole('button', { name: 'B — Continuer à enquêter.', exact: true }).click();
    await page.getByRole('button', { name: 'CONTINUER — ALLÔ COUTRAS ?', exact: true }).click();
    await page.getByRole('heading', { name: 'ALLÔ COUTRAS ?', exact: true }).waitFor();
    assert.deepEqual(await page.locator('dd').allTextContents(), ['5', '30']);
  }
  async function select(contact) {
    const card = page.getByRole('button', { name: `${contact.mark} — ${contact.name}`, exact: true });
    await card.focus();
    await page.keyboard.press('Enter');
  }
  for (const pair of [[contacts[3], contacts[0]], [contacts[2], contacts[1]]]) {
    await arrive();
    assert.equal(await page.getByRole('timer').count(), 0);
    for (const [width, height] of [[1280, 720], [1920, 1080], [1024, 576], [375, 812]]) {
      await page.setViewportSize({ width, height });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await select(pair[0]);
    await page.getByText('0/2 appels utilisés', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'APPELER', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Son activé', exact: true }).click();
    for (let index = 0; index < pair.length; index++) {
      const contact = pair[index];
      await select(contact);
      await page.getByRole('button', { name: 'APPELER', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.getByText(`${index + 1}/2 appels utilisés`, { exact: true }).waitFor();
      await page.getByText(contact.humor, { exact: true }).waitFor();
      if (!index) {
        await page.getByRole('button', { name: 'Voir la réponse maintenant', exact: true }).click();
        assert.equal(await page.evaluate(() => window.rings.length), 0);
      } else {
        await page.clock.fastForward(2000);
      }
      await page.getByText(contact.response, { exact: true }).waitFor();
      if (!index) assert.equal(await page.evaluate(() => window.spoken.length), 0);
      else {
        assert.deepEqual(await page.evaluate(() => window.spoken), [`${contact.humor} ${contact.response}`]);
        await page.getByRole('button', { name: 'Écouter les dialogues', exact: true }).click();
        assert.equal(await page.evaluate(() => window.spoken.length), 2);
        assert.deepEqual(await page.evaluate(() => window.voiceProfilesRead), Array(2).fill(contact.id === 'mairie' ? {rate: .93, pitch: .85} : {rate: 1.08, pitch: 1.25}));
        const canceled = await page.evaluate(() => window.voiceCanceled);
        await page.getByRole('button', { name: 'Son activé', exact: true }).click();
        assert.ok(await page.evaluate(() => window.voiceCanceled) > canceled);
      }

      await page.getByRole('button', { name: 'TERMINER L’APPEL', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: `${contact.mark} — ${contact.name}`, exact: true }).isDisabled(), true);
      assert.deepEqual(await page.locator('dd').allTextContents(), ['5', '30']);
      if (!index) {
        await page.getByRole('button', { name: 'Poursuivre après un seul appel', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Son coupé', exact: true }).click();
      }
    }
    assert.equal(await page.locator('.s3-contact:disabled').count(), 4);
    assert.equal(await page.evaluate(() => window.rings.length), 2);
    await page.getByRole('button', { name: 'Voir le bilan des appels', exact: true }).click();
    assert.equal(await page.locator('.s3-summary-card').count(), 2);
    assert.deepEqual(await page.locator('.s3-summary-card h3').allTextContents(), pair.map(contact => contact.name));
    await page.getByText(c24Notification, { exact: true }).waitFor();
    await page.getByRole('button', { name: 'CONTINUER — C24 NEWS', exact: true }).click();
    await page.getByRole('heading', { name: 'C24 NEWS s’emballe', exact: true }).waitFor();
    await page.getByText('Mémoire de la partie : 4 choix, 4 indice(s)', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Situation précédente', exact: true }).click();
    assert.equal(await page.locator('.s3-summary-card').count(), 2);
    assert.equal(await page.getByRole('button', { name: 'APPELER', exact: true }).count(), 0);
  }
  // Un appel suffit ; l'indisponibilité audio ne retarde ni la réponse ni le bilan.
  await page.addInitScript(() => { window.blockAudio = true; });
  await arrive();
  await select(contacts[0]);
  await page.getByRole('button', { name: 'APPELER', exact: true }).click();
  await page.getByText('Audio indisponible : l’appel continue sans son.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Voir la réponse maintenant', exact: true }).click();
  await page.getByRole('button', { name: 'TERMINER L’APPEL', exact: true }).click();
  await page.getByRole('button', { name: 'Poursuivre après un seul appel', exact: true }).click();
  assert.equal(await page.locator('.s3-summary-card').count(), 1);
  await page.locator('.s3-summary-card').getByText(contacts[0].certainty, { exact: true }).waitFor();
  assert.deepEqual(await page.locator('dd').allTextContents(), ['5', '30']);
  assert.deepEqual(errors, []);
  console.log('Situation 3 validée : quatre dialogues, confirmation, sonnerie/coupure/repli audio, deux appels maximum, bilan à un appel, mémoire, navigation, clavier et 16:9.');
} finally { await browser.close(); }
