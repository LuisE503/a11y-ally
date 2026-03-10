/**
 * A11y Ally — Bookmarklet
 * In-browser accessibility scanner overlay
 * Drag to bookmarks bar to install
 */
(function() {
  'use strict';

  // Prevent double-initialization
  if (window.__a11yAllyActive) {
    const existing = document.getElementById('a11y-ally-panel');
    if (existing) existing.remove();
    window.__a11yAllyActive = false;
    return;
  }
  window.__a11yAllyActive = true;

  // Config
  const AXE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js';

  const SEVERITY_COLORS = {
    critical: '#f04040',
    serious: '#f09040',
    moderate: '#f0c040',
    minor: '#60a0f0'
  };

  const SEVERITY_LABELS = {
    critical: { en: 'Critical', es: 'Crítico', fr: 'Critique', de: 'Kritisch', pt: 'Crítico', zh: '严重', ja: '重大' },
    serious: { en: 'Serious', es: 'Grave', fr: 'Grave', de: 'Schwerwiegend', pt: 'Grave', zh: '严重', ja: '深刻' },
    moderate: { en: 'Moderate', es: 'Moderado', fr: 'Modéré', de: 'Mäßig', pt: 'Moderado', zh: '中等', ja: '中程度' },
    minor: { en: 'Minor', es: 'Menor', fr: 'Mineur', de: 'Gering', pt: 'Menor', zh: '轻微', ja: '軽微' }
  };

  // Known fixes knowledge base (inline for bookmarklet)
  const FIXES = {
    'image-alt': (n) => n.html.replace(/<img\s/i, '<img alt="Description" '),
    'button-name': (n) => n.html.replace(/<button/i, '<button aria-label="Purpose"'),
    'link-name': (n) => n.html.replace(/<a\s/i, '<a aria-label="Link purpose" '),
    'document-title': () => '<title>Page Title</title>',
    'html-has-lang': () => '<html lang="en">',
    'label': () => '<label for="id">Label</label>\\n<input id="id">',
    'color-contrast': () => '/* Increase contrast ratio to 4.5:1+ */',
    'heading-order': () => '<!-- Use sequential headings: h1 > h2 > h3 -->'
  };

  // Detect user language
  const userLang = (navigator.language || 'en').slice(0, 2);

  const i18n = {
    en: { title: 'A11y Ally', scanning: 'Scanning...', violations: 'Violations', passes: 'Passes', score: 'Score', copy: 'Copy Fix', copied: 'Copied!', close: 'Close', noIssues: 'No violations found!', export: 'Export', before: 'Current', after: 'Fix', elements: 'elements', learnMore: 'Learn More' },
    es: { title: 'A11y Ally', scanning: 'Escaneando...', violations: 'Violaciones', passes: 'Aprobados', score: 'Puntuación', copy: 'Copiar', copied: '¡Copiado!', close: 'Cerrar', noIssues: '¡Sin violaciones!', export: 'Exportar', before: 'Actual', after: 'Corrección', elements: 'elementos', learnMore: 'Más info' },
    fr: { title: 'A11y Ally', scanning: 'Analyse...', violations: 'Violations', passes: 'Réussites', score: 'Score', copy: 'Copier', copied: 'Copié!', close: 'Fermer', noIssues: 'Aucune violation!', export: 'Exporter', before: 'Actuel', after: 'Correction', elements: 'éléments', learnMore: 'En savoir plus' },
    de: { title: 'A11y Ally', scanning: 'Scannen...', violations: 'Verstöße', passes: 'Bestanden', score: 'Bewertung', copy: 'Kopieren', copied: 'Kopiert!', close: 'Schließen', noIssues: 'Keine Verstöße!', export: 'Exportieren', before: 'Aktuell', after: 'Korrektur', elements: 'Elemente', learnMore: 'Mehr erfahren' },
    pt: { title: 'A11y Ally', scanning: 'Analisando...', violations: 'Violações', passes: 'Aprovados', score: 'Pontuação', copy: 'Copiar', copied: 'Copiado!', close: 'Fechar', noIssues: 'Sem violações!', export: 'Exportar', before: 'Atual', after: 'Correção', elements: 'elementos', learnMore: 'Saiba mais' },
    zh: { title: 'A11y Ally', scanning: '扫描中...', violations: '违规', passes: '通过', score: '评分', copy: '复制', copied: '已复制!', close: '关闭', noIssues: '未发现违规!', export: '导出', before: '当前', after: '修复', elements: '元素', learnMore: '了解更多' },
    ja: { title: 'A11y Ally', scanning: 'スキャン中...', violations: '違反', passes: '合格', score: 'スコア', copy: 'コピー', copied: 'コピー済み!', close: '閉じる', noIssues: '違反なし!', export: 'エクスポート', before: '現在', after: '修正', elements: '要素', learnMore: '詳細' }
  };

  const t = i18n[userLang] || i18n.en;

  // Create panel
  const panel = document.createElement('div');
  panel.id = 'a11y-ally-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'A11y Ally Accessibility Report');

  const panelStyles = `
    position: fixed;
    top: 12px;
    right: 12px;
    width: 420px;
    max-height: calc(100vh - 24px);
    background: rgba(10, 10, 26, 0.97);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    color: #e8e8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    z-index: 2147483647;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(108,92,231,0.15);
    animation: a11ySlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  `;
  panel.style.cssText = panelStyles;

  // Inject keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes a11ySlideIn {
      from { opacity: 0; transform: translateX(40px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes a11ySpin {
      from { transform: rotate(0deg); } to { transform: rotate(360deg); }
    }
    #a11y-ally-panel * { box-sizing: border-box; margin: 0; padding: 0; }
    #a11y-ally-panel button { font-family: inherit; cursor: pointer; }
    #a11y-ally-panel::-webkit-scrollbar { width: 6px; }
    #a11y-ally-panel::-webkit-scrollbar-track { background: transparent; }
    #a11y-ally-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
    #a11y-ally-panel .a11y-highlight-overlay {
      outline: 3px solid #f04040 !important;
      outline-offset: 2px !important;
      position: relative !important;
    }
  `;
  document.head.appendChild(style);

  // Loading state
  panel.innerHTML = `
    <div style="padding: 24px; text-align: center;">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(108,92,231,0.3); border-top-color: #6c5ce7; border-radius: 50%; animation: a11ySpin 0.8s linear infinite;"></div>
      <p style="margin-top: 12px; color: #888; font-size: 12px;">♿ ${t.scanning}</p>
    </div>
  `;
  document.body.appendChild(panel);

  // Load axe-core
  function loadAxe() {
    return new Promise((resolve, reject) => {
      if (window.axe) return resolve();
      const s = document.createElement('script');
      s.src = AXE_CDN;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load axe-core'));
      document.head.appendChild(s);
    });
  }

  // Run scan
  async function runScan() {
    try {
      await loadAxe();
      const results = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
      });
      renderResults(results);
    } catch (err) {
      panel.innerHTML = `
        <div style="padding: 24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <span style="font-weight:600;font-size:15px;">♿ ${t.title}</span>
            <button onclick="document.getElementById('a11y-ally-panel').remove();window.__a11yAllyActive=false;" style="background:none;border:none;color:#888;font-size:18px;">✕</button>
          </div>
          <div style="padding:20px;background:rgba(240,64,64,0.1);border:1px solid rgba(240,64,64,0.3);border-radius:10px;text-align:center;">
            <p style="color:#f04040;font-weight:500;">Error: ${err.message}</p>
          </div>
        </div>
      `;
    }
  }

  // Render results
  function renderResults(results) {
    const violations = results.violations;
    const passes = results.passes.length;
    const total = violations.length + passes + results.incomplete.length;
    const score = total > 0 ? Math.round((passes / total) * 100) : 100;
    const scoreColor = score >= 90 ? '#00d4aa' : score >= 70 ? '#f0c040' : score >= 50 ? '#f09040' : '#f04040';

    let html = `
      <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">♿</span>
          <span style="font-weight:700;font-size:15px;background:linear-gradient(135deg,#6c5ce7,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${t.title}</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button id="a11y-export-btn" style="background:rgba(108,92,231,0.15);border:1px solid rgba(108,92,231,0.3);color:#a78bfa;padding:4px 10px;border-radius:6px;font-size:11px;">${t.export}</button>
          <button onclick="document.getElementById('a11y-ally-panel').remove();window.__a11yAllyActive=false;" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#888;padding:4px 10px;border-radius:6px;font-size:11px;">${t.close}</button>
        </div>
      </div>

      <div style="padding: 16px 20px; display:flex; align-items:center; gap: 20px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="position:relative;width:70px;height:70px;flex-shrink:0;">
          <svg viewBox="0 0 70 70" style="transform:rotate(-90deg);width:70px;height:70px;">
            <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5"/>
            <circle cx="35" cy="35" r="30" fill="none" stroke="${scoreColor}" stroke-width="5" stroke-linecap="round"
              stroke-dasharray="${2*Math.PI*30}" stroke-dashoffset="${2*Math.PI*30*(1-score/100)}"
              style="filter:drop-shadow(0 0 6px ${scoreColor}50);transition:stroke-dashoffset 1s ease"/>
          </svg>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
            <div style="font-size:18px;font-weight:700;color:${scoreColor};">${score}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:1;">
          <div style="background:rgba(240,64,64,0.08);border:1px solid rgba(240,64,64,0.15);border-radius:8px;padding:8px 12px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:#f04040;">${violations.length}</div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">${t.violations}</div>
          </div>
          <div style="background:rgba(0,212,170,0.08);border:1px solid rgba(0,212,170,0.15);border-radius:8px;padding:8px 12px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:#00d4aa;">${passes}</div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">${t.passes}</div>
          </div>
        </div>
      </div>

      <div style="overflow-y:auto;max-height:calc(100vh - 200px);padding:12px 20px;">
    `;

    if (violations.length === 0) {
      html += `
        <div style="text-align:center;padding:30px 10px;">
          <div style="font-size:40px;margin-bottom:10px;">✅</div>
          <p style="font-weight:600;color:#00d4aa;">${t.noIssues}</p>
        </div>
      `;
    } else {
      violations.sort((a, b) => {
        const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
        return (order[a.impact] || 3) - (order[b.impact] || 3);
      });

      violations.forEach((v, idx) => {
        const color = SEVERITY_COLORS[v.impact] || '#60a0f0';
        const label = (SEVERITY_LABELS[v.impact] || {})[userLang] || v.impact;
        const fixFn = FIXES[v.id];

        html += `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px;margin-bottom:8px;transition:background 0.2s;"
               onmouseenter="this.style.background='rgba(255,255,255,0.06)'"
               onmouseleave="this.style.background='rgba(255,255,255,0.03)'">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="background:${color}20;color:${color};border:1px solid ${color}40;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;">${label}</span>
              <span style="font-weight:600;font-size:12px;flex:1;">${escapeHtml(v.help)}</span>
            </div>
            <p style="color:#999;font-size:11px;margin-bottom:8px;">${escapeHtml(v.description)}</p>
            <div style="font-size:10px;color:#6c5ce7;margin-bottom:8px;">${v.nodes.length} ${t.elements}</div>
        `;

        // Show first affected node with fix
        if (v.nodes.length > 0) {
          const node = v.nodes[0];
          const originalHtml = node.html;
          const fixedHtml = fixFn ? fixFn(node) : null;

          html += `
            <div style="margin-top:6px;">
              <div style="font-size:10px;color:#f04040;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">${t.before}</div>
              <pre style="background:#0d0d20;border:1px solid rgba(255,255,255,0.06);border-left:2px solid #f04040;border-radius:6px;padding:8px;font-size:11px;font-family:'Fira Code',monospace;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">${escapeHtml(originalHtml)}</pre>
          `;

          if (fixedHtml) {
            html += `
              <div style="font-size:10px;color:#00d4aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;margin-top:6px;">${t.after}</div>
              <pre style="background:#0d0d20;border:1px solid rgba(255,255,255,0.06);border-left:2px solid #00d4aa;border-radius:6px;padding:8px;font-size:11px;font-family:'Fira Code',monospace;overflow-x:auto;white-space:pre-wrap;word-break:break-all;" id="a11y-fix-${idx}">${escapeHtml(fixedHtml)}</pre>
              <button onclick="navigator.clipboard.writeText(document.getElementById('a11y-fix-${idx}').textContent).then(()=>{this.textContent='${t.copied}';setTimeout(()=>this.textContent='${t.copy}',1500)})" style="background:rgba(108,92,231,0.12);border:1px solid rgba(108,92,231,0.25);color:#a78bfa;padding:3px 8px;border-radius:5px;font-size:10px;margin-top:4px;">${t.copy}</button>
            `;
          }
          html += '</div>';
        }

        if (v.helpUrl) {
          html += `<a href="${v.helpUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;color:#6c5ce7;text-decoration:none;font-size:10px;">${t.learnMore} →</a>`;
        }

        html += '</div>';
      });
    }

    html += '</div>';
    panel.innerHTML = html;

    // Export button
    const exportBtn = document.getElementById('a11y-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const reportData = {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          score,
          violations: violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map(n => ({ html: n.html, target: n.target }))
          })),
          passes: passes,
          engine: 'axe-core'
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `a11y-report-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Start scan
  runScan();
})();
