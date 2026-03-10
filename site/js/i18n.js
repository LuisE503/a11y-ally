/**
 * A11y Ally — Internationalization Engine
 * Lightweight i18n system with auto-detection, hash-based switching, and lazy loading
 */

const I18n = (() => {
  'use strict';

  const SUPPORTED_LANGS = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja'];
  const DEFAULT_LANG = 'en';
  const CACHE = {};
  let currentLang = DEFAULT_LANG;
  let currentTranslations = {};
  const listeners = [];

  /**
   * Detect user's preferred language
   */
  function detectLanguage() {
    // 1. Check URL hash  ?lang=es or #lang=es
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const urlLang = params.get('lang') || hashParams.get('lang');
    if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;

    // 2. Check localStorage
    const storedLang = localStorage.getItem('a11y-ally-lang');
    if (storedLang && SUPPORTED_LANGS.includes(storedLang)) return storedLang;

    // 3. Check browser language
    const browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

    return DEFAULT_LANG;
  }

  /**
   * Load translation file
   */
  async function loadTranslations(lang) {
    if (CACHE[lang]) return CACHE[lang];

    try {
      const response = await fetch(`./i18n/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}`);
      const data = await response.json();
      CACHE[lang] = data;
      return data;
    } catch (err) {
      console.warn(`[i18n] Failed to load ${lang}, falling back to ${DEFAULT_LANG}`);
      if (lang !== DEFAULT_LANG) return loadTranslations(DEFAULT_LANG);
      return {};
    }
  }

  /**
   * Get nested value from object by dot-notation key
   */
  function getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
  }

  /**
   * Translate a key
   */
  function t(key, fallback) {
    const value = getNestedValue(currentTranslations, key);
    return value !== null ? value : (fallback || key);
  }

  /**
   * Apply translations to DOM elements with data-i18n attribute
   */
  function applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key);
      if (translation && translation !== key) {
        el.textContent = translation;
      }
    });

    // Apply to attributes: data-i18n-placeholder, data-i18n-title, data-i18n-aria-label
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = t(key);
      if (translation) el.setAttribute('placeholder', translation);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = t(key);
      if (translation) el.setAttribute('title', translation);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      const translation = t(key);
      if (translation) el.setAttribute('aria-label', translation);
    });

    // Update HTML lang attribute
    const htmlLang = currentTranslations?.meta?.lang || currentLang;
    document.documentElement.setAttribute('lang', htmlLang);
    const dir = currentTranslations?.meta?.dir || 'ltr';
    document.documentElement.setAttribute('dir', dir);

    // Update hreflang links
    updateHreflangLinks();
  }

  /**
   * Update <link rel="alternate" hreflang> tags for SEO
   */
  function updateHreflangLinks() {
    // Remove existing hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

    const baseUrl = window.location.origin + window.location.pathname;

    SUPPORTED_LANGS.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = `${baseUrl}?lang=${lang}`;
      document.head.appendChild(link);
    });

    // x-default
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = baseUrl;
    document.head.appendChild(defaultLink);
  }

  /**
   * Set language
   */
  async function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      console.warn(`[i18n] Unsupported language: ${lang}`);
      return;
    }

    currentLang = lang;
    currentTranslations = await loadTranslations(lang);

    // Persist preference
    localStorage.setItem('a11y-ally-lang', lang);

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);

    // Apply to DOM
    applyToDOM();

    // Notify listeners
    listeners.forEach(fn => fn(lang, currentTranslations));
  }

  /**
   * Register a listener for language changes
   */
  function onLanguageChange(fn) {
    listeners.push(fn);
  }

  /**
   * Initialize i18n
   */
  async function init() {
    const detectedLang = detectLanguage();
    await setLanguage(detectedLang);
    return currentTranslations;
  }

  return {
    init,
    t,
    setLanguage,
    getCurrentLang: () => currentLang,
    getTranslations: () => currentTranslations,
    getSupportedLangs: () => [...SUPPORTED_LANGS],
    onLanguageChange,
    applyToDOM,
    SUPPORTED_LANGS
  };
})();
