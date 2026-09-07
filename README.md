# 🛡️ VocalGuard

**Protect your family from AI voice-clone &amp; deepfake phone scams.**

A single, **100% offline** HTML file that gives every family a real defense against the fastest-growing scam in the world — callers who clone a loved one's voice to demand money.

**No install. No account. No data leaves your device.** Open it in any browser and you're done.

---

## ❓ The problem

AI can clone a convincing version of *your* voice from just **a few seconds** of audio — pulled from social videos, voicemails, or news clips. Scammers use this in the **"grandparent scam"**: they call elders pretending to be a child or grandchild in legal or medical trouble, demanding urgent money, gift cards, or crypto.

Caller ID can be spoofed. Voices can be cloned. Anyone — young, old, everyone — can be targeted.

## ✅ The fix (no tech required)

> **Trust the code word, not the voice or the number.**

A **family safe code word** that only your family knows defeats any audio clone, no matter how perfect. This tool makes setting that up fast, fun, and family-friendly.

---

## 🚀 Features

| Feature | What it does |
|---------|--------------|
| 🗝️ **Family Safe Codes** | Create or auto-generate a secret code word, saved privately in your browser. |
| 🔐 **Encrypted storage** | Set a master passphrase and your code word is stored **AES-256-GCM encrypted** (key derived with PBKDF2-SHA256, 150k rounds). No plaintext, no leak of the passphrase. |
| 🛡️ **Tamper check** | On load, the app verifies its own SHA-256 against the hash embedded at build time — it warns you if a copy has been modified (e.g., a tampered "official" download). |
| 📏 **Code strength meter** | Live strength score (length, variety, entropy) plus warnings for common or guessable words. |
| 🔁 **Rotation reminders** | Tracks when the code was last set and reminds you to rotate it every 6 months. |
| 🎯 **Detection Quiz** | Interactive 10-question training so the whole family learns to spot clones — with clear explanations. |
| 📞 **Call Simulator** | Six realistic scam scenarios ("grandchild in jail", "emergency wire", "don't tell anyone", fake police) with safe-response walkthroughs. |
| 🖨️ **Printables** | Print **wallet cards**, **phone posters**, and a **family safety plan** for elders, in one click (or save as PDF). |
| 🔒 **Private by design** | Everything runs in your browser. No tracking, no cloud, no servers. |

---

## 📥 How to use

1. **Download** [`index.html`](index.html).
2. **Open it** in any browser (double-click, or right-click → Open With → Browser).
3. **Set up** your family safe code word (Safe Codes tab).
4. **Do the quiz** together, and **print the cards &amp; posters** for the elders.
5. Done. You're now resistant to the #1 voice-scam attack.

> Works on desktop, tablet, and phone. Works offline with no internet at all.

---

## 📸 What it looks like

![VocalGuard home](assets/screenshot.png)

*(Add a screenshot at `assets/screenshot.png` if you'd like to show it off.)*

---

## 🔐 Security notes

- **Code word storage:** plain "save" keeps the code in `localStorage` (fine for casual use). Enter a **master passphrase** and the code is stored encrypted (AES-256-GCM) — the passphrase itself is **never** stored, so keep it somewhere safe. You'll need it to unlock the code after a browser/device restart.
- **Why encryption matters:** `localStorage` is readable by anyone with access to the device or its backup files. Encryption blurs the code so a leaked backup doesn't reveal your family's secret.
- **Tamper check:** the app computes its own hash against the one embedded at build time and shows a chip in the header:
  - **"verified authentic"** — this copy is byte-for-byte the official one.
  - **"has been modified"** — someone edited this file; download a fresh copy from the official source before trusting it.
  - *Note:* the check needs to fetch the file, so it runs when the page is served over `http(s)://` (like GitHub Pages). Local `file://` opens still work fine — the chip just shows "could not verify offline".

## 🧰 Built with

- Plain HTML + CSS + JavaScript — **zero dependencies**, no runtime build step.
- Web Crypto API (`crypto.subtle`) for AES-GCM / PBKDF2 encryption — no libraries shipped.
- `localStorage` for settings — nothing ever leaves the device.

### Development

The integrity hash is re-stamped with:

```bash
python3 scripts/build.py          # in place
python3 scripts/build.py -o out/  # to a folder
```

Commit only files produced by a build (they carry the correct hash). The unit tests in the project live in the repo under `tests/` and cover tabs, code generation, encryption, strength scoring, and printables.

---

## 🤝 Contributing

Ideas welcome! A few directions that would make this even more useful:

- More Quiz scenarios &amp; translations (ES, AR, FR, etc.)
- Voice-sample "clone test" demo (educational only)
- More printable card layouts
- Checkbox-style safety plan that persists in localStorage

Please open an issue or PR. See [CONTRIBUTING](CONTRIBUTING.md).

---

## 📄 License

[MIT](LICENSE)

---

## ⚠️ Disclaimer

VocalGuard provides **awareness and family procedures**, not a technical guarantee. No tool can stop a determined scammer. Always verify identity with a code word and report suspected scams to local authorities and your national fraud/anti-fraud line.
