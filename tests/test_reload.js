const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { webcrypto } = require('crypto');
const { TextEncoder: TE, TextDecoder: TD } = require('util');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sleepy = ms => new Promise(r => setTimeout(r, ms));

function makeDom() {
  return new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    beforeParse(w) {
      try {
        Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
        Object.defineProperty(w, 'TextEncoder', { value: TE, configurable: true });
        Object.defineProperty(w, 'TextDecoder', { value: TD, configurable: true });
      } catch (e) {}
      w.alert = () => {};
    },
  });
}

(async () => {
  // session 1: save an encrypted code
  const d1 = makeDom();
  const w1 = d1.window, el1 = d1.window.document;
  el1.getElementById('codeName').value = 'Reload Family';
  el1.getElementById('codeword').value = 'EagleFern73';
  el1.getElementById('passphrase').value = 'pw-123-secret';
  el1.getElementById('saveCode').click();
  await sleepy(400);

  const stored = w1.localStorage.getItem('vocalguard_codes');
  if (!stored || stored.charAt(0) !== '{') throw new Error('save did not encrypt');
  if (String(stored).includes('EagleFern73') || String(stored).includes('pw-123-secret')) {
    throw new Error('plaintext or passphrase leaked into storage');
  }

  // session 2: simulate a reload with the same storage
  const d2 = makeDom();
  const w2 = d2.window;
  w2.localStorage.setItem('vocalguard_codes', stored);

  const clickTab = name => d2.window.document.querySelector(`nav button[data-tab="${name}"]`).dispatchEvent(new w2.MouseEvent('click', {bubbles:true}));

  // start with wrong passphrase
  const pwBox = d2.window.document.getElementById('passphrase');
  pwBox.value = 'totally-wrong';
  clickTab('codes');
  await sleepy(1000);

  // wrong passphrase: cards should be empty
  const emptyCards = d2.window.document.querySelectorAll('.code-card');
  if (emptyCards.length > 0) throw new Error('wrong passphrase should show no cards');

  // now enter correct passphrase and trigger input event
  pwBox.value = 'pw-123-secret';
  pwBox.dispatchEvent(new w2.Event('input', { bubbles: true }));
  await sleepy(1000);

  // correct passphrase: cards should appear and code should be visible (auto-revealed on unlock)
  const cards = d2.window.document.querySelectorAll('.code-card');
  if (cards.length < 1) throw new Error('correct passphrase did not unlock cards');
  const val = d2.window.document.querySelector('.code-card-value');
  if (!val.textContent.includes('EagleFern73')) throw new Error('correct passphrase did not unlock code value');
  if (!val.textContent.includes('\u2022')) console.log('note: code auto-revealed after unlock');

  console.log('✓ encrypted storage survives reload, wrong passphrase rejected, correct passphrase unlocks');
  console.log('\nALL RELOAD/DECRYPT TESTS PASSED 🎉');
})().catch(e => { console.error('\nTEST FAILED:', e.message); process.exit(1); });
