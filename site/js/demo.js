/**
 * A11y Ally — Demo Report Viewer
 * Loads and displays pre-generated accessibility reports interactively
 */

const DemoViewer = (() => {
  'use strict';

  const DEMO_REPORTS = {
    gov: null,
    ecommerce: null,
    blog: null
  };

  let currentReport = 'gov';
  let translations = {};

  /**
   * Load demo reports
   */
  async function loadReports() {
    const reportNames = ['gov', 'ecommerce', 'blog'];
    for (const name of reportNames) {
      try {
        const response = await fetch(`./demo-reports/${name}.json`);
        if (response.ok) {
          DEMO_REPORTS[name] = await response.json();
        }
      } catch (err) {
        console.warn(`[demo] Failed to load ${name} report`);
      }
    }
  }

  /**
   * Get severity color
   */
  function getSeverityColor(impact) {
    const colors = {
      critical: '#ef4444',
      serious: '#f97316',
      moderate: '#eab308',
      minor: '#3b82f6'
    };
    return colors[impact] || '#3b82f6';
  }

  /**
   * Render demo report
   */
  function renderReport(reportKey) {
    currentReport = reportKey;
    const report = DEMO_REPORTS[reportKey];
    if (!report) return;

    const container = document.getElementById('demo-report-content');
    if (!container) return;

    const t = (key, fallback) => {
      if (typeof I18n !== 'undefined') return I18n.t(key, fallback);
      return fallback || key;
    };

    const scoreColor = report.score >= 90 ? '#10b981' 
      : report.score >= 70 ? '#eab308' 
      : report.score >= 50 ? '#f97316' 
      : '#ef4444';

    const circumference = 2 * Math.PI * 42;
    const dashoffset = circumference * (1 - report.score / 100);

    let html = `
      <div class="demo-report-header">
        <div class="demo-score-ring">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"/>
            <circle class="fg" cx="50" cy="50" r="42" fill="none" stroke="${scoreColor}" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}"
              style="transform:rotate(-90deg);transform-origin:50% 50%;filter:drop-shadow(0 0 8px ${scoreColor}50);transition:stroke-dashoffset 1.5s ease"/>
          </svg>
          <div class="demo-score-value">
            <div class="number" style="color:${scoreColor}">${report.score}</div>
            <div class="label">${t('demo.score', 'Score')}</div>
          </div>
        </div>
        <div class="demo-stats">
          <div class="demo-stat-card demo-stat-violations">
            <div class="count">${report.violations.length}</div>
            <div class="label">${t('demo.violations', 'Violations')}</div>
          </div>
          <div class="demo-stat-card demo-stat-passes">
            <div class="count">${report.passes}</div>
            <div class="label">${t('demo.passes', 'Passes')}</div>
          </div>
        </div>
      </div>
      <div class="demo-violations">
    `;

    if (report.violations.length === 0) {
      html += `
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-size:48px;margin-bottom:12px;">✅</div>
          <p style="font-weight:600;color:#10b981;">${t('demo.noViolations', 'No violations found!')}</p>
        </div>
      `;
    } else {
      report.violations.forEach((v, idx) => {
        const color = getSeverityColor(v.impact);
        const impactLabel = t(`demo.impact.${v.impact}`, v.impact);

        html += `
          <div class="demo-violation">
            <div class="demo-violation-header">
              <span class="severity-badge severity-${v.impact}">${impactLabel}</span>
              <h4>${escapeHtml(v.title || v.description)}</h4>
              <span class="demo-violation-id">${v.id}</span>
            </div>
            <p>${escapeHtml(v.explanation || v.description)}</p>
        `;

        if (v.fixSnippets && v.fixSnippets.length > 0) {
          const snippet = v.fixSnippets[0];
          html += `
            <div class="snippet-group">
              <div class="snippet-label before">${t('demo.before', 'Current Code')}</div>
              <pre class="before-code"><code>${escapeHtml(snippet.original)}</code></pre>
              <div class="snippet-label after">${t('demo.after', 'Suggested Fix')}</div>
              <pre class="after-code"><code id="demo-fix-${idx}">${escapeHtml(snippet.fixed)}</code></pre>
              <button class="copy-btn" onclick="DemoViewer.copyFix('demo-fix-${idx}', this)">
                📋 ${t('demo.copyFix', 'Copy Fix')}
              </button>
            </div>
          `;
        }

        if (v.helpUrl) {
          html += `<a href="${v.helpUrl}" target="_blank" rel="noopener" class="learn-more-link">${t('demo.learnMore', 'Learn More')} →</a>`;
        }

        html += `</div>`;
      });
    }

    html += '</div>';
    container.innerHTML = html;

    // Update active tab
    document.querySelectorAll('.demo-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.report === reportKey);
    });
  }

  /**
   * Copy fix snippet to clipboard
   */
  function copyFix(elementId, btn) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const t = (key, fallback) => {
      if (typeof I18n !== 'undefined') return I18n.t(key, fallback);
      return fallback || key;
    };

    navigator.clipboard.writeText(el.textContent).then(() => {
      const originalText = btn.innerHTML;
      btn.innerHTML = `✓ ${t('demo.copied', 'Copied!')}`;
      btn.style.color = '#10b981';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
      }, 1500);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Initialize demo viewer
   */
  async function init() {
    await loadReports();

    // Set up tab clicks
    document.querySelectorAll('.demo-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        renderReport(tab.dataset.report);
      });
    });

    // Render default report
    renderReport('gov');

    // Re-render on language change
    if (typeof I18n !== 'undefined') {
      I18n.onLanguageChange(() => {
        renderReport(currentReport);
      });
    }
  }

  return { init, renderReport, copyFix };
})();
