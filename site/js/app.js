/**
 * A11y Ally — Main Application
 * Handles navigation, scroll effects, language switcher, and animations
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // ── Initialize i18n ──
  await I18n.init();

  // ── Navigation scroll effect ──
  const nav = document.querySelector('.nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 40);
    lastScroll = scrollY;
  }, { passive: true });

  // ── Mobile nav toggle ──
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.innerHTML = isOpen ? '✕' : '☰';
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '☰';
      });
    });
  }

  // ── Language Switcher ──
  const langBtn = document.querySelector('.lang-btn');
  const langDropdown = document.querySelector('.lang-dropdown');

  if (langBtn && langDropdown) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      langDropdown.classList.remove('open');
    });

    // Language options
    langDropdown.querySelectorAll('.lang-option').forEach(option => {
      option.addEventListener('click', async () => {
        const lang = option.dataset.lang;
        await I18n.setLanguage(lang);
        langDropdown.classList.remove('open');

        // Update button text
        updateLangButton();

        // Update active state
        langDropdown.querySelectorAll('.lang-option').forEach(opt => {
          opt.classList.toggle('active', opt.dataset.lang === lang);
        });
      });
    });

    // Set initial active language
    updateLangButton();
    I18n.onLanguageChange(updateLangButton);
  }

  function updateLangButton() {
    const lang = I18n.getCurrentLang();
    const langNames = { en: 'EN', es: 'ES', fr: 'FR', de: 'DE', pt: 'PT', zh: '中', ja: '日' };
    if (langBtn) {
      langBtn.textContent = `🌐 ${langNames[lang] || lang.toUpperCase()}`;
    }

    // Update active class
    if (langDropdown) {
      langDropdown.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === lang);
      });
    }
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Scroll animations ──
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-in').forEach(el => {
    scrollObserver.observe(el);
  });

  // ── Initialize demo viewer ──
  if (typeof DemoViewer !== 'undefined') {
    await DemoViewer.init();
  }

  // ── Bookmarklet installation ──
  const bookmarkletLink = document.getElementById('bookmarklet-link');
  if (bookmarkletLink) {
    // Try to load compiled bookmarklet
    try {
      const script = document.createElement('script');
      script.src = './js/bookmarklet-compiled.js';
      script.onload = () => {
        if (window.A11Y_ALLY_BOOKMARKLET) {
          bookmarkletLink.href = window.A11Y_ALLY_BOOKMARKLET;
        }
      };
      document.head.appendChild(script);
    } catch (e) {
      // Fallback: use inline bookmarklet
      bookmarkletLink.href = "javascript:void(function(){var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js';s.onload=function(){axe.run().then(function(r){alert('Violations: '+r.violations.length+'\\nPasses: '+r.passes.length)})};document.head.appendChild(s)})()";
    }

    // Prevent default click (should be dragged)
    bookmarkletLink.addEventListener('click', (e) => {
      e.preventDefault();
      const t = I18n.t;
      const msg = I18n.getCurrentLang() === 'es'
        ? 'Arrastra este botón a tu barra de marcadores'
        : I18n.getCurrentLang() === 'fr'
        ? 'Glissez ce bouton dans votre barre de favoris'
        : 'Drag this button to your bookmarks bar';
      alert(msg);
    });
  }

  // ── Update meta tags for SEO ──
  I18n.onLanguageChange((lang, translations) => {
    // Update page title
    document.title = `A11y Ally — ${translations?.hero?.title || 'Web Accessibility Assistant'}`;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = translations?.hero?.subtitle || '';
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = translations?.hero?.subtitle || '';
  });

  console.log('%c♿ A11y Ally', 'font-size:20px;font-weight:bold;color:#6c5ce7;');
  console.log('%cMaking the web accessible for everyone', 'color:#9898b8;');
});
