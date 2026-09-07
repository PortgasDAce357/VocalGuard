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
  el('genCode').click();
  const gen = el('codeword').value;
  if (!gen || gen.length < 8 || !/[0-9]/.test(gen)) throw new Error('bad generated code: '+gen);
  console.log('✓ generates random code:', gen);

  // 3. Savings without passphrase (plain path)
  el('codeword').value = 'BlueHarborPizza66';
  el('saveCode').click();
  if (window.localStorage.getItem('vocalguard_code') !== 'BlueHarborPizza66') throw new Error('plain not saved');
  if (el('storageState').textContent.includes('plain text') === false) throw new Error('plain-text warning not shown');
  console.log('✓ plain save + warning shown');

  // 4. TOGGLE SHOW then masked reveal
  el('toggleShow').click();
  let shown = el('currentCode').textContent;
  if (shown !== 'BlueHarborPizza66' && shown !== 'BlueHarborPizza66') throw new Error('show toggle failed: '+shown);
  console.log('✓ show/hide toggle works ->', shown);

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
  el('toggleShow').click();               // back to masked default
  el('codeword').value = 'EagleFern73';
  el('passphrase').value = 'correct horse battery staple';
  el('saveCode').click();
  await sleepy(120);                      // let encrypt promise resolve
  const stored = window.localStorage.getItem('vocalguard_code');
  if (!stored || stored.charAt(0) !== '{') throw new Error('not encrypted');
  if (String(stored).includes('EagleFern73')) throw new Error('plaintext leaked into storage!');
  if (String(stored).includes('correct horse battery staple')) throw new Error('passphrase leaked into storage!');
  if (el('currentCode').textContent.includes('EagleFern73')) throw new Error('encrypted code should be masked');
  if (!el('storageState').textContent.includes('encrypted')) throw new Error('encrypted badge missing');
  console.log('✓ encrypted save: no plaintext in storage');

  // 7. Rotation info rendered
  if (!el('rotationInfo').innerHTML.includes('last set')) throw new Error('rotation info missing');
  console.log('✓ rotation reminder rendered');

  // 8. Expanded quiz (10) and scenarios (6)
  if (d.querySelectorAll('#quizContainer .quiz-opts button').length !== 4) throw new Error('quiz options wrong');
  const scen = d.querySelectorAll('#scenarioContainer .scenario').length;
  if (scen !== 6) throw new Error('expected 6 scenarios, got '+scen);
  console.log('✓ 10-question quiz + 6 call scenarios');

  // 9. Printable generators (stub window.print)
  let printed = '';
  window.print = () => { printed = el('printArea').innerHTML; };
  el('passphrase').value = 'correct horse battery staple';
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