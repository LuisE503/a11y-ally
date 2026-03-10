/**
 * A11y Ally — Accessibility Scanner
 * Uses Puppeteer + axe-core to scan web pages for accessibility violations
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Resolve axe-core script path
const AXE_SCRIPT_PATH = require.resolve('axe-core');
const AXE_SOURCE = fs.readFileSync(AXE_SCRIPT_PATH, 'utf8');

/**
 * Scanner configuration defaults
 */
const DEFAULT_CONFIG = {
  timeout: 30000,
  waitUntil: 'networkidle2',
  viewport: { width: 1280, height: 800 },
  axeOptions: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
    }
  }
};

/**
 * Severity mapping for WCAG levels
 */
const SEVERITY_MAP = {
  critical: { score: 4, label: 'Critical', wcag: 'A' },
  serious: { score: 3, label: 'Serious', wcag: 'A/AA' },
  moderate: { score: 2, label: 'Moderate', wcag: 'AA' },
  minor: { score: 1, label: 'Minor', wcag: 'AAA' }
};

/**
 * Scan a single URL for accessibility violations
 * @param {string} url - Target URL to scan
 * @param {object} options - Scanner options
 * @returns {object} Scan results with violations, passes, and metadata
 */
async function scanUrl(url, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport(config.viewport);

    // Navigate to the target URL
    const response = await page.goto(url, {
      waitUntil: config.waitUntil,
      timeout: config.timeout
    });

    const statusCode = response ? response.status() : null;
    const pageTitle = await page.title();

    // Inject axe-core and run audit
    await page.evaluate(AXE_SOURCE);
    const axeResults = await page.evaluate((axeOptions) => {
      return new Promise((resolve, reject) => {
        window.axe.run(document, axeOptions)
          .then(results => resolve(results))
          .catch(err => reject(err.message));
      });
    }, config.axeOptions);

    // Capture page screenshot for report
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'jpeg',
      quality: 60
    });

    // Process violations with severity scoring
    const violations = processViolations(axeResults.violations);
    const passes = axeResults.passes.length;
    const incomplete = axeResults.incomplete.length;
    const inapplicable = axeResults.inapplicable.length;

    // Calculate overall score (0-100)
    const totalChecks = violations.length + passes + incomplete;
    const score = totalChecks > 0
      ? Math.round(((passes) / (totalChecks)) * 100)
      : 100;

    return {
      url,
      pageTitle,
      statusCode,
      timestamp: new Date().toISOString(),
      score,
      summary: {
        violations: violations.length,
        passes,
        incomplete,
        inapplicable,
        totalElements: violations.reduce((sum, v) => sum + v.nodes.length, 0)
      },
      violations,
      passes: axeResults.passes.map(p => ({
        id: p.id,
        description: p.description,
        impact: p.impact,
        tags: p.tags
      })),
      screenshot: screenshotBuffer.toString('base64'),
      engine: {
        name: 'axe-core',
        version: axeResults.testEngine?.version || 'unknown'
      }
    };
  } catch (error) {
    return {
      url,
      timestamp: new Date().toISOString(),
      error: true,
      errorMessage: error.message,
      score: null,
      summary: null,
      violations: []
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Process raw axe-core violations into enriched format
 */
function processViolations(rawViolations) {
  return rawViolations.map(violation => {
    const severity = SEVERITY_MAP[violation.impact] || SEVERITY_MAP.minor;
    const wcagTags = violation.tags.filter(t =>
      t.startsWith('wcag') || t.startsWith('best-practice')
    );

    return {
      id: violation.id,
      impact: violation.impact,
      severity: severity.score,
      severityLabel: severity.label,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      wcagTags,
      wcagLevel: getWcagLevel(violation.tags),
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary,
        impact: node.impact
      }))
    };
  }).sort((a, b) => b.severity - a.severity);
}

/**
 * Extract WCAG level from axe tags
 */
function getWcagLevel(tags) {
  if (tags.some(t => t === 'wcag2aaa' || t === 'wcag21aaa')) return 'AAA';
  if (tags.some(t => t === 'wcag2aa' || t === 'wcag21aa')) return 'AA';
  if (tags.some(t => t === 'wcag2a' || t === 'wcag21a')) return 'A';
  return 'Best Practice';
}

/**
 * Batch scan multiple URLs
 * @param {string[]} urls - Array of URLs to scan
 * @param {object} options - Scanner options
 * @returns {object[]} Array of scan results
 */
async function batchScan(urls, options = {}) {
  const results = [];
  for (const url of urls) {
    const result = await scanUrl(url, options);
    results.push(result);
  }
  return results;
}

/**
 * Scan HTML string directly (for testing)
 * @param {string} html - HTML content to scan
 * @param {object} options - Scanner options
 * @returns {object} Scan results
 */
async function scanHtml(html, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport(config.viewport);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    await page.evaluate(AXE_SOURCE);
    const axeResults = await page.evaluate((axeOptions) => {
      return new Promise((resolve, reject) => {
        window.axe.run(document, axeOptions)
          .then(results => resolve(results))
          .catch(err => reject(err.message));
      });
    }, config.axeOptions);

    const violations = processViolations(axeResults.violations);
    const passes = axeResults.passes.length;
    const totalChecks = violations.length + passes;
    const score = totalChecks > 0
      ? Math.round((passes / totalChecks) * 100)
      : 100;

    return {
      url: 'inline-html',
      timestamp: new Date().toISOString(),
      score,
      summary: {
        violations: violations.length,
        passes,
        incomplete: axeResults.incomplete.length,
        inapplicable: axeResults.inapplicable.length,
        totalElements: violations.reduce((sum, v) => sum + v.nodes.length, 0)
      },
      violations,
      engine: {
        name: 'axe-core',
        version: axeResults.testEngine?.version || 'unknown'
      }
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  scanUrl,
  batchScan,
  scanHtml,
  processViolations,
  SEVERITY_MAP,
  DEFAULT_CONFIG
};
