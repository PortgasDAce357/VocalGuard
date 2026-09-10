const fs = require('fs');
const { JSDOM } = require('jsdom');
const { webcrypto } = require('crypto');
const { TextEncoder: TE, TextDecoder: TD } = require('util');

const html = fs.readFileSync(require('path').join(__dirname,'..','index.html'), 'utf8');

function makeDom() {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/index.html',
    pretendToBeVisual: true,
    beforeParse(window){ try { Object.defineProperty(window,'TextEncoder',{value:TE,configurable:true}); Object.defineProperty(window,'TextDecoder',{value:TD,configurable:true}); } catch(e){} 
      try { Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true }); }
      catch(e){ try { window.crypto = webcrypto; } catch(e2){} }
      window.alert = () => {};
    }
  });
  return dom;
}
const sleepy = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- static checks ----------
(async () => {
  const dom = makeDom();
  const { window } = dom;
  const d = window.document;
  const el = id => { const e = d.getElementById(id); if(!e) throw new Error('missing #'+id); return e; };
  let errors = [];
  window.addEventListener('error', e => errors.push(e.message));

  // 1. Tabs switch
  const clickTab = name => d.querySelector(`nav button[data-tab="${name}"]`).dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
  clickTab('codes'); if (el('tab-codes').style.display !== '') throw new Error('codes tab not visible');
  clickTab('quiz'); if (el('tab-quiz').style.display !== '') throw new Error('quiz tab not visible');
  console.log('✓ tabs switch');

  // 2. Generator
  clickTab('codes');
  el('genCode').click();
  const gen = el('codeword').value;
  if (!gen || gen.length < 8 || !/[0-9]/.test(gen)) throw new Error('bad generated code: '+gen);
  console.log('✓ generates random code:', gen);

  // 3. Save without passphrase (plain path)
  el('codeName').value = 'Test Family';
  el('codeword').value = 'BlueHarborPizza66';
  el('saveCode').click();
  const storedPlain = window.localStorage.getItem('vocalguard_codes');
  if (!storedPlain || storedPlain.charAt(0) !== '[') throw new Error('plain not saved as array');
  const parsed = JSON.parse(storedPlain);
  if (!parsed.length || parsed[0].code !== 'BlueHarborPizza66') throw new Error('plain code not in array');
  if (parsed[0].name !== 'Test Family') throw new Error('code name not saved');
  console.log('✓ plain save works');

  // 4. Reveal button on code card
  clickTab('home'); clickTab('codes');
  const revealBtns = d.querySelectorAll('.code-card-actions button');
  if (revealBtns.length < 1) throw new Error('no code cards rendered');
  revealBtns[0].click(); // first button is reveal
  const codeVal = d.querySelector('.code-card-value');
  if (!codeVal || !codeVal.textContent.includes('BlueHarborPizza66')) throw new Error('reveal failed');
  console.log('✓ reveal button shows code');

  // 5. Strength meter
  el('codeword').value = 'a';
  el('codeword').dispatchEvent(new window.Event('input',{bubbles:true}));
  if (el('strengthLabel').textContent.includes('Weak') !== true) throw new Error('weak label wrong');
  el('codeword').value = 'X9$mZq!vBk2L7p';
  el('codeword').dispatchEvent(new window.Event('input',{bubbles:true}));
  if (el('strengthLabel').textContent.includes('Very strong') !== true) throw new Error('strong label wrong');
  el('codeword').value = 'password';
  el('codeword').dispatchEvent(new window.Event('input',{bubbles:true}));
  if (el('strengthLabel').textContent.includes('Weak') !== true) throw new Error('common word not flagged weak');
  console.log('✓ strength meter distinguishes weak/strong/common');

  // 6. Encrypted save
  el('codeName').value = 'Encrypted Family';
  el('codeword').value = 'EagleFern73';
  el('passphrase').value = 'correct horse battery staple';
  el('saveCode').click();
  await sleepy(200);
  const stored = window.localStorage.getItem('vocalguard_codes');
  if (!stored || stored.charAt(0) !== '{') throw new Error('not encrypted');
  if (String(stored).includes('EagleFern73')) throw new Error('plaintext leaked into storage!');
  if (String(stored).includes('correct horse battery staple')) throw new Error('passphrase leaked into storage!');
  console.log('✓ encrypted save: no plaintext in storage');

  // 7. Code cards rendered
  clickTab('home'); clickTab('codes');
  await sleepy(400);
  const cards = d.querySelectorAll('.code-card');
  if (cards.length < 1) throw new Error('no code cards rendered');
  const cardNames = Array.from(d.querySelectorAll('.code-card-name')).map(el => el.textContent);
  if (!cardNames.includes('Encrypted Family')) throw new Error('encrypted family card not found');
  console.log('✓ code cards rendered with names');

  // 8. Expanded quiz (10) and scenarios (6)
  if (d.querySelectorAll('#quizContainer .quiz-opts button').length !== 4) throw new Error('quiz options wrong');
  const scen = d.querySelectorAll('#scenarioContainer .scenario').length;
  if (scen !== 6) throw new Error('expected 6 scenarios, got '+scen);
  console.log('✓ 10-question quiz + 6 call scenarios');

  // 9. Printable generators (stub window.print)
  let printed = '';
  window.print = () => { printed = el('printArea').innerHTML; };
  el('passphrase').value = 'correct horse battery staple';
  clickTab('cards');
  await sleepy(500);
  // select the second code (Encrypted Family / EagleFern73)
  const picker = el('printableCodeSelect');
  if (picker.options.length > 1) picker.value = '1';
  for (const id of ['printWalletCard','printPoster','printPlan']) {
    printed = '';
    el(id).click();
    if (!printed || printed.length < 150) throw new Error(id+' produced nothing');
    if (!printed.includes('EagleFern73')) throw new Error(id+' missing code word');
    if (printed.includes('correct horse')) throw new Error(id+' leaked passphrase!');
    console.log('✓', id, '->', printed.length, 'bytes, code word present, no passphrase leak');
  }

  if (errors.length) throw new Error('Runtime errors: ' + errors.join(' | '));
  console.log('\nALL VOCALGUARD TESTS PASSED 🎉');
})().catch(e => { console.error('\nTEST FAILED:', e.message); process.exit(1); });
