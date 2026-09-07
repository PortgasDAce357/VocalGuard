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
    },
  });
}

(async () => {
  // session 1: save an encrypted code
  const d1 = makeDom();
  const w1 = d1.window, el1 = d1.window.document;
  el1.getElementById('codeword').value = 'EagleFern73';
  el1.getElementById('passphrase').value = 'pw-123-secret';
  el1.getElementById('saveCode').click();
  await sleepy(150);

  const stored = w1.localStorage.getItem('vocalguard_code');
  if (!stored || stored.charAt(0) !== '{') throw new Error('save did not encrypt');
  if (String(stored).includes('EagleFern73') || String(stored).includes('pw-123-secret')) {
    throw new Error('plaintext or passphrase leaked into storage');
  }

  // session 2: simulate a reload with the same storage
  const d2 = makeDom();
  const w2 = d2.window;
  w2.localStorage.setItem('vocalguard_code', stored);
  await sleepy(40);

  // wrong passphrase gets flagged
  const pwBox = d2.window.document.getElementById('passphrase');
  pwBox.value = 'totally-wrong';
  pwBox.dispatchEvent(new w2.Event('input', { bubbles: true }));
  await sleepy(150);
  const bad = d2.window.document.getElementById('storageState').textContent;
  if (!bad.includes('Wrong passphrase')) throw new Error('wrong passphrase was not flagged');

  // correct passphrase unlocks
  pwBox.value = 'pw-123-secret';
  pwBox.dispatchEvent(new w2.Event('input', { bubbles: true }));
  await sleepy(200);
  const good = d2.window.document.getElementById('storageState').textContent;
  if (!good.includes('unlocked')) throw new Error('correct passphrase did not unlock');

  console.log('✓ encrypted storage survives reload, wrong passphrase rejected, correct passphrase unlocks');
  console.log('\nALL RELOAD/DECRYPT TESTS PASSED 🎉');
})().catch(e => { console.error('\nTEST FAILED:', e.message); process.exit(1); });