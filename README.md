# DodoTV — LG webOS TV URL WebView Player

**Version:** 1.0.0  
**Package:** `DodoTV.ipk` / `com.dodotv.app_1.0.0_all.ipk`  
**Platform:** LG webOS TV (Web App)  
**Target Resolution:** 1920 × 1080 (Responsive: 720p, 1080p, 4K)  
**Author:** DodoTV Project  

---

## 🌟 Overview

**DodoTV** is a lightweight, dedicated URL WebView application for LG webOS Smart TVs. It enables you to enter any website or web-based video player URL using your LG Magic Remote and view it fullscreen on your television without needing a phone, casting device, or opening the heavy TV browser manually.

Built adhering to the complete [DodoTV PRD](file:///c:/Users/admin/Desktop/aab/DodoTV_PRD.md).

---

## ✨ Key Features

- 📺 **Fully Responsive & TV-First Interface:** Fluid CSS layout with CSS `clamp()`, flexible grids, and media queries supporting 720p HD Ready, 1080p Full HD, 4K/8K Ultra HD TVs, and windowed testing displays.
- 🛡️ **Hardened Security Architecture:**
  - **Strict Content Security Policy (CSP):** Whitelists local assets and explicit media/frame protocols (`https:`, `http:`), disabling dangerous `eval` and untrusted scripts.
  - **Isolated Iframe Sandbox:** Grants video playback capabilities while strictly prohibiting `allow-top-navigation` to prevent framed websites from hijacking or redirecting the TV application.
  - **Strict-Origin Referrer Policy:** Shields sensitive user referrers from leaking to external websites.
  - **Zero-Trust URL Sanitizer:** Rejects malicious schemes (`javascript:`, `data:`, `file:`, `blob:`, `about:`, `vbscript:`), URL embedded credentials, and null-byte injection attacks.
  - **XSS-Free DOM Generation:** Built purely with secure `createElement` and `textContent` assignments—zero `innerHTML` injection vulnerabilities.
  - **LocalStorage Validation & Quotas:** Automatically verifies and bounds stored history and favorites to prevent storage tampering or quota exhaustion.
- 🎯 **Full Remote Navigation (Spatial Navigation):** Move seamlessly between elements using remote D-pad (Up/Down/Left/Right) and OK/Enter.
- 🎮 **LG Remote Back Button Support:** Intercepts keycode `461` to smoothly navigate back from WebView to Home, or exit cleanly.
- 🔴🟢🟡🔵 **Color Buttons Quick Access:**
  - **RED (403):** Quick-focus URL input
  - **GREEN (404):** Trigger OPEN
  - **YELLOW (405):** Save current URL to Favorites
  - **BLUE (406):** Clear input field
- ⌨ **On-Screen Remote Keyboard:** Collapsible on-screen keypad to type URLs directly using the remote if desired, along with quick insert chips (`https://`, `.com`, `.org`, `.net`, `.tv`, `/`).
- 🎬 **Video Stream Presets:** Includes 1-click test streams (Big Buck Bunny, Tears of Steel, Sintel, Vimeo, YouTube Web) to verify HTML5 video playback right after installation.
- 🕒 **Recent URLs & Favorites:** Automatically saves up to 10 recently opened URLs with 1-click delete or re-open, plus saved favorites (persisted in local TV storage).
- 🧭 **Smart WebView HUD:** Floating auto-hiding control bar in WebView mode providing Home, Reload, Direct Browser mode, and Fullscreen toggle.
- 🔊 **Synthesized Remote Sound FX:** Built-in TV sound feedback on focus and selection using the Web Audio API.

---

## 📁 Project Structure

```text
aab/
├── DodoTV.ipk                     # Ready-to-install webOS package
├── com.dodotv.app_1.0.0_all.ipk
├── DodoTV_PRD.md                  # Complete Product Requirements Document
├── package.json                   # Project npm scripts
├── README.md                      # Documentation & install guide
└── dodotv/                        # WebOS application source
    ├── appinfo.json               # webOS metadata & configuration
    ├── index.html                 # Main TV user interface
    ├── styles.css                 # 1080p TV stylesheet & focus engine
    ├── app.js                     # Core TV navigation & WebView logic
    ├── icon.png                   # 80x80 Application icon
    ├── largeIcon.png              # 130x130 App launcher icon
    ├── assets/
    │   └── logo.png               # High-resolution branding logo
    ├── webOSTVjs-1.2.13/          # Official LG webOS TV API library
    │   ├── webOSTV.js
    │   └── webOSTV-dev.js
    └── package.json
```

---

## 🚀 How to Install on LG TV

### Option A: Using webOS Dev Manager (Recommended)

1. **Turn on Developer Mode on your LG TV:**
   - Install the **Developer Mode** app from the LG Content Store.
   - Log in with your LG Developer account and toggle **Dev Mode Status** to `ON`.
   - Note your TV's **IP Address** and **Passphrase**.
2. **Connect via webOS Dev Manager (PC/Mac):**
   - Download and open [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop).
   - Add your TV by entering the IP Address and Passphrase.
3. **Install `DodoTV.ipk`:**
   - Click **Install** in webOS Dev Manager.
   - Select `DodoTV.ipk` (or `com.dodotv.app_1.0.0_all.ipk`) from this directory.
   - The DodoTV icon will appear immediately in your LG TV's App Launcher ribbon!

### Option B: Using the webOS CLI (`ares-install`)

If you have paired your TV with `ares-setup-device`:

```powershell
npx -p @webos-tools/cli ares-install -d <YOUR_TV_NAME> ./DodoTV.ipk
```

---

## 🛠 Development & Packaging

### Re-packaging the Application

If you make modifications to `dodotv/`:

```powershell
# From project root:
npm run package

# Or directly using ares-package:
npx -p @webos-tools/cli ares-package ./dodotv -o .
```

### Running Locally for Testing

To preview the app locally in any modern browser:

```powershell
npm run serve
```
Then open `http://localhost:8080` in your browser. Use the Arrow Keys (`▲▼◄►`), `Enter`, and `Escape` to navigate just like an LG remote.
