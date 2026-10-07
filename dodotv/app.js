/**
 * DodoTV — LG webOS TV URL WebView Application
 * Responsive & Secure Implementation
 * Handles Spatial Navigation, Strict URL Sanitization, XSS-free DOM Rendering,
 * LocalStorage Sanitization, Remote Keycodes, and Audio FX.
 */

(function () {
  'use strict';

  // ==========================================================
  // 1. CONFIGURATION & STATE
  // ==========================================================
  const STORAGE_KEYS = {
    RECENTS: 'dodotv_recents_v1',
    FAVORITES: 'dodotv_favorites_v1',
    SOUND: 'dodotv_sound_enabled',
    LAST_URL: 'dodotv_last_url'
  };

  const MAX_RECENTS = 10;
  const MAX_FAVORITES = 30;
  const MAX_URL_LENGTH = 2048;
  const LOAD_TIMEOUT_MS = 15000;

  const state = {
    currentScreen: 'home', // 'home' | 'webview'
    soundEnabled: true,
    currentUrl: '',
    currentTitle: '',
    recentUrls: [],
    favorites: [],
    loadTimeoutTimer: null,
    hudAutoHideTimer: null,
    isHudVisible: false,
    focusedElement: null
  };

  // TV Keycodes
  const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK_WEBOS: 461,
    BACK_ESC: 27,
    BACKSPACE: 8,
    RED: 403,
    GREEN: 404,
    YELLOW: 405,
    BLUE: 406
  };

  // DOM Cache
  const dom = {};

  // ==========================================================
  // 2. AUDIO SYNTHESIZER (TV Remote Sound FX)
  // ==========================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.05, gainValue = 0.08) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  }

  function playSoundFocus() {
    playTone(520, 'sine', 0.04, 0.05);
  }

  function playSoundSelect() {
    playTone(880, 'sine', 0.08, 0.1);
  }

  function playSoundError() {
    playTone(220, 'sawtooth', 0.15, 0.12);
  }

  // ==========================================================
  // 3. SPATIAL NAVIGATION ENGINE
  // ==========================================================
  function getVisibleFocusables() {
    const openOverlay = document.querySelector('.modal-overlay:not(.hidden)');
    if (openOverlay) {
      return Array.from(openOverlay.querySelectorAll('.focusable')).filter(isVisible);
    }

    if (state.currentScreen === 'webview') {
      if (state.isHudVisible) {
        return Array.from(dom.webviewHud.querySelectorAll('.focusable')).filter(isVisible);
      }
      return [];
    }

    return Array.from(dom.homeScreen.querySelectorAll('.focusable')).filter(isVisible);
  }

  function isVisible(el) {
    if (!el || el.disabled) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function setFocus(targetEl, shouldPlaySound = true) {
    if (!targetEl || !isVisible(targetEl)) return;

    if (state.focusedElement && state.focusedElement !== targetEl) {
      state.focusedElement.classList.remove('focused');
    }

    state.focusedElement = targetEl;
    targetEl.classList.add('focused');
    targetEl.focus();

    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    if (shouldPlaySound) {
      playSoundFocus();
    }
  }

  function moveFocus(direction) {
    const focusables = getVisibleFocusables();
    if (focusables.length === 0) return;

    const current = state.focusedElement && isVisible(state.focusedElement)
      ? state.focusedElement
      : document.activeElement;

    if (!current || !focusables.includes(current)) {
      setFocus(focusables[0]);
      return;
    }

    const currentRect = current.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestCandidate = null;
    let minDistance = Infinity;

    for (const candidate of focusables) {
      if (candidate === current) continue;
      const r = candidate.getBoundingClientRect();
      const cCenter = {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2
      };

      const dx = cCenter.x - currentCenter.x;
      const dy = cCenter.y - currentCenter.y;

      let isEligible = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      if (direction === 'up' && dy < -5) {
        isEligible = true;
        primaryDist = Math.abs(dy);
        secondaryDist = Math.abs(dx);
      } else if (direction === 'down' && dy > 5) {
        isEligible = true;
        primaryDist = Math.abs(dy);
        secondaryDist = Math.abs(dx);
      } else if (direction === 'left' && dx < -5) {
        isEligible = true;
        primaryDist = Math.abs(dx);
        secondaryDist = Math.abs(dy);
      } else if (direction === 'right' && dx > 5) {
        isEligible = true;
        primaryDist = Math.abs(dx);
        secondaryDist = Math.abs(dy);
      }

      if (isEligible) {
        const distance = primaryDist + secondaryDist * 2.2;
        if (distance < minDistance) {
          minDistance = distance;
          bestCandidate = candidate;
        }
      }
    }

    if (bestCandidate) {
      setFocus(bestCandidate);
    }
  }

  // ==========================================================
  // 4. STRICT URL SANITIZATION & SECURITY (Zero-Trust Validation)
  // ==========================================================
  function sanitizeUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let url = raw.trim();
    if (!url || url.length > MAX_URL_LENGTH) return null;

    // Explicitly reject dangerous schemes and payloads
    const lower = url.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:') ||
      lower.startsWith('blob:') ||
      lower.startsWith('about:') ||
      lower.includes('\0')
    ) {
      return null;
    }

    // Default to https:// if protocol is omitted
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      const parsed = new URL(url);

      // Whitelist strictly http: and https: protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      // Disallow embedded credentials (prevents credential phishing / leaks)
      if (parsed.username || parsed.password) {
        return null;
      }

      // Check valid hostname
      const hostname = parsed.hostname.toLowerCase();
      if (!hostname) return null;

      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const hasDot = hostname.includes('.');
      if (!hasDot && !isLocalhost) {
        return null;
      }

      return parsed.href;
    } catch (e) {
      return null;
    }
  }

  function showAlert(title, message) {
    playSoundError();
    dom.alertModalTitle.textContent = String(title).slice(0, 100);
    dom.alertModalMessage.textContent = String(message).slice(0, 300);
    dom.alertModal.classList.remove('hidden');
    setFocus(dom.btnAlertOk, false);
  }

  function hideAlert() {
    dom.alertModal.classList.add('hidden');
    setFocus(dom.urlInput);
  }

  // ==========================================================
  // 5. STORAGE & XSS-FREE DOM RENDERING
  // ==========================================================
  function loadPersistedData() {
    try {
      const storedRecents = localStorage.getItem(STORAGE_KEYS.RECENTS);
      if (storedRecents) {
        const parsed = JSON.parse(storedRecents);
        if (Array.isArray(parsed)) {
          // Strictly sanitize and validate each stored entry
          state.recentUrls = parsed
            .filter(u => typeof u === 'string')
            .map(u => sanitizeUrl(u))
            .filter(Boolean)
            .slice(0, MAX_RECENTS);
        }
      }
    } catch (e) {
      state.recentUrls = [];
    }

    try {
      const storedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (storedFavs) {
        const parsed = JSON.parse(storedFavs);
        if (Array.isArray(parsed)) {
          state.favorites = parsed
            .filter(f => f && typeof f.url === 'string')
            .map(f => ({
              url: sanitizeUrl(f.url),
              title: typeof f.title === 'string' ? f.title.slice(0, 80) : ''
            }))
            .filter(f => f.url)
            .slice(0, MAX_FAVORITES);
        }
      }
    } catch (e) {
      state.favorites = [];
    }

    try {
      const storedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (storedSound !== null) {
        state.soundEnabled = storedSound === 'true';
      }
      updateSoundUI();
    } catch (e) {}
  }

  function saveRecents() {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(state.recentUrls));
    } catch (e) {}
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
    } catch (e) {}
  }

  function addRecentUrl(url) {
    if (!url) return;
    state.recentUrls = state.recentUrls.filter(item => item !== url);
    state.recentUrls.unshift(url);
    if (state.recentUrls.length > MAX_RECENTS) {
      state.recentUrls.pop();
    }
    saveRecents();
    renderRecentsList();
  }

  function removeRecentUrl(url) {
    state.recentUrls = state.recentUrls.filter(item => item !== url);
    saveRecents();
    renderRecentsList();
  }

  function clearAllRecents() {
    playSoundSelect();
    state.recentUrls = [];
    saveRecents();
    renderRecentsList();
  }

  function addFavoriteUrl(url, title = '') {
    if (!url) return;
    const exists = state.favorites.some(f => f.url === url);
    if (exists) {
      showAlert('Already Saved', 'This URL is already in your Favorites.');
      return;
    }
    const cleanTitle = (title || url.replace(/^https?:\/\//i, '').split('/')[0]).slice(0, 80);
    state.favorites.unshift({ url, title: cleanTitle });
    if (state.favorites.length > MAX_FAVORITES) {
      state.favorites.pop();
    }
    saveFavorites();
    renderFavoritesList();
    showAlert('Saved to Favorites', `Added "${cleanTitle}" to your saved favorites.`);
  }

  function removeFavoriteUrl(url) {
    state.favorites = state.favorites.filter(item => item.url !== url);
    saveFavorites();
    renderFavoritesList();
  }

  // Safe DOM creation (Zero innerHTML vulnerability)
  function renderRecentsList() {
    dom.recentCount.textContent = String(state.recentUrls.length);
    dom.recentList.textContent = '';

    if (state.recentUrls.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'list-empty-hint';
      emptyDiv.textContent = 'No recent URLs yet. Enter a URL above.';
      dom.recentList.appendChild(emptyDiv);
      return;
    }

    state.recentUrls.forEach(url => {
      const item = document.createElement('div');
      item.className = 'url-item focusable';
      item.tabIndex = 0;
      item.dataset.url = url;

      const mainDiv = document.createElement('div');
      mainDiv.className = 'url-item-main';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'url-item-icon';
      iconSpan.textContent = '🔗';

      const textSpan = document.createElement('span');
      textSpan.className = 'url-item-text';
      textSpan.textContent = url;

      mainDiv.appendChild(iconSpan);
      mainDiv.appendChild(textSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'url-item-actions';

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-item-action btn-del-recent focusable';
      delBtn.tabIndex = 0;
      delBtn.title = 'Delete from history';
      delBtn.textContent = '✕';

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSoundSelect();
        removeRecentUrl(url);
      });

      actionsDiv.appendChild(delBtn);

      item.appendChild(mainDiv);
      item.appendChild(actionsDiv);

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-del-recent')) return;
        playSoundSelect();
        dom.urlInput.value = url;
        openUrl(url);
      });

      dom.recentList.appendChild(item);
    });
  }

  function renderFavoritesList() {
    dom.favoritesCount.textContent = String(state.favorites.length);
    dom.favoritesList.textContent = '';

    if (state.favorites.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'list-empty-hint';
      emptyDiv.textContent = 'No favorites saved yet. Click "★ Save Favorite".';
      dom.favoritesList.appendChild(emptyDiv);
      return;
    }

    state.favorites.forEach(fav => {
      const item = document.createElement('div');
      item.className = 'url-item focusable';
      item.tabIndex = 0;
      item.dataset.url = fav.url;

      const mainDiv = document.createElement('div');
      mainDiv.className = 'url-item-main';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'url-item-icon';
      iconSpan.textContent = '★';

      const textSpan = document.createElement('span');
      textSpan.className = 'url-item-text';
      textSpan.textContent = fav.title || fav.url;

      mainDiv.appendChild(iconSpan);
      mainDiv.appendChild(textSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'url-item-actions';

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-item-action btn-del-fav focusable';
      delBtn.tabIndex = 0;
      delBtn.title = 'Remove Favorite';
      delBtn.textContent = '✕';

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSoundSelect();
        removeFavoriteUrl(fav.url);
      });

      actionsDiv.appendChild(delBtn);

      item.appendChild(mainDiv);
      item.appendChild(actionsDiv);

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-del-fav')) return;
        playSoundSelect();
        dom.urlInput.value = fav.url;
        openUrl(fav.url, fav.title);
      });

      dom.favoritesList.appendChild(item);
    });
  }

  // ==========================================================
  // 6. WEBVIEW LIFECYCLE & NAVIGATION (PRD Section 12-19)
  // ==========================================================
  function openUrl(targetUrl, title = '') {
    const validUrl = sanitizeUrl(targetUrl);
    if (!validUrl) {
      showAlert('Invalid URL', 'Please enter a valid website address (e.g. example.com or https://...)');
      return;
    }

    // Network status check
    if (!navigator.onLine) {
      showError('No Internet Connection', 'Connect your TV to the internet and try again.', validUrl);
      return;
    }

    state.currentUrl = validUrl;
    state.currentTitle = title || validUrl;
    addRecentUrl(validUrl);

    showScreen('webview');
    showLoading(validUrl);

    dom.hudUrlDisplay.textContent = validUrl;
    showHud();

    clearTimeout(state.loadTimeoutTimer);
    dom.webviewFrame.src = validUrl;

    state.loadTimeoutTimer = setTimeout(() => {
      hideLoading();
      scheduleHudAutoHide();
    }, LOAD_TIMEOUT_MS);
  }

  function showLoading(url) {
    dom.loadingTargetUrl.textContent = url;
    dom.loadingOverlay.classList.remove('hidden');
    setFocus(dom.btnCancelLoading, false);
  }

  function hideLoading() {
    clearTimeout(state.loadTimeoutTimer);
    dom.loadingOverlay.classList.add('hidden');
  }

  function showError(title, message, url) {
    hideLoading();
    playSoundError();
    dom.errorTitle.textContent = title;
    dom.errorMessage.textContent = message;
    dom.errorUrlRef.textContent = url || state.currentUrl;
    dom.errorOverlay.classList.remove('hidden');
    setFocus(dom.btnErrorRetry, false);
  }

  function hideError() {
    dom.errorOverlay.classList.add('hidden');
  }

  function showScreen(screenName) {
    state.currentScreen = screenName;
    if (screenName === 'home') {
      dom.homeScreen.classList.add('active');
      dom.webviewScreen.classList.remove('active');
      // Set to blank to release TV memory and avoid background sound/video playback
      dom.webviewFrame.src = 'about:blank';
      hideHud();
      hideLoading();
      hideError();
      setFocus(dom.urlInput);
    } else if (screenName === 'webview') {
      dom.homeScreen.classList.remove('active');
      dom.webviewScreen.classList.add('active');
    }
  }

  function showHud() {
    state.isHudVisible = true;
    dom.webviewHud.classList.add('active');
    scheduleHudAutoHide();
  }

  function hideHud() {
    state.isHudVisible = false;
    dom.webviewHud.classList.remove('active');
    clearTimeout(state.hudAutoHideTimer);
    dom.webviewFrame.focus();
  }

  function scheduleHudAutoHide() {
    clearTimeout(state.hudAutoHideTimer);
    state.hudAutoHideTimer = setTimeout(() => {
      const isHudFocused = dom.webviewHud.contains(document.activeElement);
      if (!isHudFocused) {
        hideHud();
      } else {
        scheduleHudAutoHide();
      }
    }, 4500);
  }

  function toggleFullscreen() {
    playSoundSelect();
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function openDirectBrowser(url) {
    playSoundSelect();
    const target = url || state.currentUrl || dom.urlInput.value;
    const sanitized = sanitizeUrl(target);
    if (!sanitized) return;
    window.location.href = sanitized;
  }

  // ==========================================================
  // 7. REMOTE KEYBOARD & KEYPAD (TV Input Experience)
  // ==========================================================
  function setupVirtualKeyboard() {
    dom.btnToggleVKeyboard.addEventListener('click', () => {
      playSoundSelect();
      dom.virtualKeyboardPanel.classList.toggle('collapsed');
      if (!dom.virtualKeyboardPanel.classList.contains('collapsed')) {
        const firstKey = dom.virtualKeyboardPanel.querySelector('.vkey');
        if (firstKey) setFocus(firstKey);
      }
    });

    dom.virtualKeyboardPanel.querySelectorAll('.vkey[data-char]').forEach(key => {
      key.addEventListener('click', () => {
        playSoundSelect();
        const char = key.dataset.char;
        if (dom.urlInput.value.length < MAX_URL_LENGTH) {
          dom.urlInput.value += char;
        }
      });
    });

    dom.vkeyBackspace.addEventListener('click', () => {
      playSoundSelect();
      dom.urlInput.value = dom.urlInput.value.slice(0, -1);
    });

    dom.vkeyDone.addEventListener('click', () => {
      playSoundSelect();
      dom.virtualKeyboardPanel.classList.add('collapsed');
      setFocus(dom.btnOpen);
    });
  }

  // ==========================================================
  // 8. REMOTE CONTROL KEY EVENT HANDLER (D-Pad, Back, Color)
  // ==========================================================
  function handleKeyDown(e) {
    const keyCode = e.keyCode || e.which;

    // 1. BACK KEY (webOS 461, Escape 27, Backspace 8)
    if (keyCode === KEYS.BACK_WEBOS || keyCode === KEYS.BACK_ESC || (keyCode === KEYS.BACKSPACE && document.activeElement !== dom.urlInput)) {
      e.preventDefault();
      handleBackNavigation();
      return;
    }

    // 2. DIRECTIONAL ARROWS (Spatial Navigation)
    if (keyCode === KEYS.UP) {
      e.preventDefault();
      if (state.currentScreen === 'webview' && !state.isHudVisible) {
        showHud();
        setFocus(dom.hudBtnBack);
        return;
      }
      moveFocus('up');
      return;
    }

    if (keyCode === KEYS.DOWN) {
      e.preventDefault();
      moveFocus('down');
      return;
    }

    if (keyCode === KEYS.LEFT) {
      if (document.activeElement === dom.urlInput && dom.urlInput.selectionStart > 0) {
        return;
      }
      e.preventDefault();
      moveFocus('left');
      return;
    }

    if (keyCode === KEYS.RIGHT) {
      if (document.activeElement === dom.urlInput && dom.urlInput.selectionEnd < dom.urlInput.value.length) {
        return;
      }
      e.preventDefault();
      moveFocus('right');
      return;
    }

    // 3. ENTER / OK KEY
    if (keyCode === KEYS.ENTER) {
      if (document.activeElement === dom.urlInput) {
        e.preventDefault();
        playSoundSelect();
        openUrl(dom.urlInput.value);
        return;
      }
    }

    // 4. COLOR BUTTONS
    if (keyCode === KEYS.RED) {
      e.preventDefault();
      playSoundSelect();
      if (state.currentScreen !== 'home') showScreen('home');
      setFocus(dom.urlInput);
      return;
    }

    if (keyCode === KEYS.GREEN) {
      e.preventDefault();
      playSoundSelect();
      if (state.currentScreen === 'home') {
        openUrl(dom.urlInput.value);
      }
      return;
    }

    if (keyCode === KEYS.YELLOW) {
      e.preventDefault();
      playSoundSelect();
      const target = dom.urlInput.value || state.currentUrl;
      if (target) addFavoriteUrl(target);
      return;
    }

    if (keyCode === KEYS.BLUE) {
      e.preventDefault();
      playSoundSelect();
      dom.urlInput.value = '';
      setFocus(dom.urlInput);
      return;
    }
  }

  function handleBackNavigation() {
    playSoundSelect();

    if (!dom.alertModal.classList.contains('hidden')) {
      hideAlert();
      return;
    }

    if (!dom.errorOverlay.classList.contains('hidden')) {
      hideError();
      showScreen('home');
      return;
    }

    if (!dom.loadingOverlay.classList.contains('hidden')) {
      hideLoading();
      showScreen('home');
      return;
    }

    if (state.currentScreen === 'webview') {
      showScreen('home');
      return;
    }

    if (!dom.virtualKeyboardPanel.classList.contains('collapsed')) {
      dom.virtualKeyboardPanel.classList.add('collapsed');
      setFocus(dom.urlInput);
      return;
    }

    if (window.webOS && typeof window.webOS.platformBack === 'function') {
      window.webOS.platformBack();
    } else {
      window.close();
    }
  }

  // ==========================================================
  // 9. HEADER & UTILITIES (Clock, Sound, Network)
  // ==========================================================
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    dom.clockDisplay.textContent = `${hours}:${minutes} ${ampm}`;
  }

  function updateSoundUI() {
    dom.soundIcon.textContent = state.soundEnabled ? '🔊 Sound On' : '🔇 Sound Muted';
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, String(state.soundEnabled));
    } catch (e) {}
    updateSoundUI();
    if (state.soundEnabled) playSoundSelect();
  }

  function updateNetworkStatus() {
    if (navigator.onLine) {
      dom.networkPill.className = 'status-pill online';
      dom.networkText.textContent = 'Connected';
    } else {
      dom.networkPill.className = 'status-pill offline';
      dom.networkText.textContent = 'Offline';
    }
  }

  // ==========================================================
  // 10. INITIALIZATION
  // ==========================================================
  function init() {
    dom.app = document.getElementById('app');
    dom.homeScreen = document.getElementById('home-screen');
    dom.webviewScreen = document.getElementById('webview-screen');
    dom.networkPill = document.getElementById('network-pill');
    dom.networkText = document.getElementById('network-text');
    dom.btnSoundToggle = document.getElementById('btn-sound-toggle');
    dom.soundIcon = document.getElementById('sound-icon');
    dom.clockDisplay = document.getElementById('clock-display');

    dom.urlInput = document.getElementById('url-input');
    dom.btnClearInput = document.getElementById('btn-clear-input');
    dom.btnOpen = document.getElementById('btn-open');
    dom.btnSampleUrl = document.getElementById('btn-sample-url');
    dom.btnToggleVKeyboard = document.getElementById('btn-toggle-vkeyboard');
    dom.btnAddFavorite = document.getElementById('btn-add-favorite');

    dom.virtualKeyboardPanel = document.getElementById('virtual-keyboard-panel');
    dom.vkeyBackspace = document.getElementById('vkey-backspace');
    dom.vkeyDone = document.getElementById('vkey-done');

    dom.presetsGrid = document.getElementById('presets-grid');
    dom.recentCount = document.getElementById('recent-count');
    dom.btnClearRecents = document.getElementById('btn-clear-recents');
    dom.recentList = document.getElementById('recent-list');
    dom.favoritesCount = document.getElementById('favorites-count');
    dom.favoritesList = document.getElementById('favorites-list');

    dom.webviewHud = document.getElementById('webview-hud');
    dom.hudUrlDisplay = document.getElementById('hud-url-display');
    dom.hudBtnBack = document.getElementById('hud-btn-back');
    dom.hudBtnReload = document.getElementById('hud-btn-reload');
    dom.hudBtnDirect = document.getElementById('hud-btn-direct');
    dom.hudBtnFullscreen = document.getElementById('hud-btn-fullscreen');
    dom.hudBtnHide = document.getElementById('hud-btn-hide');
    dom.hudTriggerZone = document.getElementById('hud-trigger-zone');
    dom.webviewFrame = document.getElementById('webview-frame');

    dom.loadingOverlay = document.getElementById('loading-overlay');
    dom.loadingTargetUrl = document.getElementById('loading-target-url');
    dom.btnCancelLoading = document.getElementById('btn-cancel-loading');

    dom.errorOverlay = document.getElementById('error-overlay');
    dom.errorTitle = document.getElementById('error-title');
    dom.errorMessage = document.getElementById('error-message');
    dom.errorUrlRef = document.getElementById('error-url-ref');
    dom.btnErrorRetry = document.getElementById('btn-error-retry');
    dom.btnErrorDirect = document.getElementById('btn-error-direct');
    dom.btnErrorHome = document.getElementById('btn-error-home');

    dom.alertModal = document.getElementById('alert-modal');
    dom.alertModalTitle = document.getElementById('alert-modal-title');
    dom.alertModalMessage = document.getElementById('alert-modal-message');
    dom.btnAlertOk = document.getElementById('btn-alert-ok');

    loadPersistedData();
    renderRecentsList();
    renderFavoritesList();

    updateClock();
    setInterval(updateClock, 1000);
    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    dom.btnSoundToggle.addEventListener('click', toggleSound);

    dom.btnOpen.addEventListener('click', () => {
      playSoundSelect();
      openUrl(dom.urlInput.value);
    });

    dom.btnClearInput.addEventListener('click', () => {
      playSoundSelect();
      dom.urlInput.value = '';
      setFocus(dom.urlInput);
    });

    dom.btnSampleUrl.addEventListener('click', () => {
      playSoundSelect();
      dom.urlInput.value = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      setFocus(dom.btnOpen);
    });

    dom.btnAddFavorite.addEventListener('click', () => {
      playSoundSelect();
      const current = dom.urlInput.value;
      if (!current) {
        showAlert('Empty URL', 'Type or select a URL first before saving to favorites.');
        return;
      }
      addFavoriteUrl(current);
    });

    dom.btnClearRecents.addEventListener('click', clearAllRecents);

    document.querySelectorAll('.chip[data-insert]').forEach(chip => {
      chip.addEventListener('click', () => {
        playSoundSelect();
        const text = chip.dataset.insert;
        if (text === 'https://' || text === 'http://') {
          dom.urlInput.value = text + dom.urlInput.value.replace(/^https?:\/\//i, '');
        } else {
          dom.urlInput.value += text;
        }
        setFocus(dom.urlInput);
      });
    });

    dom.presetsGrid.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        playSoundSelect();
        const url = card.dataset.url;
        const title = card.dataset.title;
        dom.urlInput.value = url;
        openUrl(url, title);
      });
    });

    setupVirtualKeyboard();

    dom.hudBtnBack.addEventListener('click', () => {
      playSoundSelect();
      showScreen('home');
    });

    dom.hudBtnReload.addEventListener('click', () => {
      playSoundSelect();
      if (state.currentUrl) openUrl(state.currentUrl, state.currentTitle);
    });

    dom.hudBtnDirect.addEventListener('click', () => {
      openDirectBrowser();
    });

    dom.hudBtnFullscreen.addEventListener('click', toggleFullscreen);

    dom.hudBtnHide.addEventListener('click', () => {
      playSoundSelect();
      hideHud();
    });

    dom.hudTriggerZone.addEventListener('mouseenter', showHud);

    dom.webviewFrame.addEventListener('load', () => {
      hideLoading();
      scheduleHudAutoHide();
    });

    dom.webviewFrame.addEventListener('error', () => {
      showError('Unable to load page', 'The website could not be reached or blocked player embedding.', state.currentUrl);
    });

    dom.btnCancelLoading.addEventListener('click', () => {
      playSoundSelect();
      hideLoading();
      showScreen('home');
    });

    dom.btnErrorRetry.addEventListener('click', () => {
      playSoundSelect();
      hideError();
      if (state.currentUrl) openUrl(state.currentUrl);
    });

    dom.btnErrorDirect.addEventListener('click', () => {
      openDirectBrowser();
    });

    dom.btnErrorHome.addEventListener('click', () => {
      playSoundSelect();
      hideError();
      showScreen('home');
    });

    dom.btnAlertOk.addEventListener('click', () => {
      playSoundSelect();
      hideAlert();
    });

    document.addEventListener('mouseover', (e) => {
      const focusable = e.target.closest('.focusable');
      if (focusable && focusable !== state.focusedElement) {
        setFocus(focusable, false);
      }
    });

    window.addEventListener('keydown', handleKeyDown);

    setTimeout(() => {
      setFocus(dom.urlInput, false);
    }, 200);

    document.addEventListener('webOSRelaunch', (e) => {
      if (e.detail && e.detail.url) {
        openUrl(e.detail.url);
      }
    });

    console.log('DodoTV initialized securely.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
