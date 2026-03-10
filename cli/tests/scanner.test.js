/**
 * A11y Ally — Scanner Integration Tests
 */

const path = require('path');
const fs = require('fs');

// Mock for environments without puppeteer
let scanHtml, scanUrl, processViolations, SEVERITY_MAP;

beforeAll(() => {
  try {
    const scanner = require('../src/scanner');
    scanHtml = scanner.scanHtml;
    scanUrl = scanner.scanUrl;
    processViolations = scanner.processViolations;
    SEVERITY_MAP = scanner.SEVERITY_MAP;
  } catch (e) {
    console.warn('Puppeteer not available, some tests will be skipped.');
  }
});

describe('Scanner Module', () => {
  
  describe('SEVERITY_MAP', () => {
    test('should have all severity levels defined', () => {
      expect(SEVERITY_MAP).toBeDefined();
      expect(SEVERITY_MAP.critical).toBeDefined();
      expect(SEVERITY_MAP.serious).toBeDefined();
      expect(SEVERITY_MAP.moderate).toBeDefined();
      expect(SEVERITY_MAP.minor).toBeDefined();
    });

    test('critical should have highest score', () => {
      expect(SEVERITY_MAP.critical.score).toBeGreaterThan(SEVERITY_MAP.serious.score);
      expect(SEVERITY_MAP.serious.score).toBeGreaterThan(SEVERITY_MAP.moderate.score);
      expect(SEVERITY_MAP.moderate.score).toBeGreaterThan(SEVERITY_MAP.minor.score);
    });
  });

  describe('processViolations', () => {
    test('should process raw violations into enriched format', () => {
      const rawViolations = [
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          help: 'Images must have alternate text',
          helpUrl: 'https://example.com/help',
          tags: ['wcag2a', 'wcag111'],
          nodes: [
            {
              html: '<img src="test.jpg">',
              target: ['img'],
              failureSummary: 'Fix the following: Element does not have an alt attribute',
              impact: 'critical'
            }
          ]
        }
      ];

      const result = processViolations(rawViolations);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('image-alt');
      expect(result[0].severity).toBe(4);
      expect(result[0].severityLabel).toBe('Critical');
      expect(result[0].nodes).toHaveLength(1);
      expect(result[0].wcagTags).toContain('wcag2a');
    });

    test('should sort violations by severity (descending)', () => {
      const rawViolations = [
        { id: 'minor-issue', impact: 'minor', description: '', help: '', helpUrl: '', tags: [], nodes: [] },
        { id: 'critical-issue', impact: 'critical', description: '', help: '', helpUrl: '', tags: [], nodes: [] },
        { id: 'moderate-issue', impact: 'moderate', description: '', help: '', helpUrl: '', tags: [], nodes: [] }
      ];

      const result = processViolations(rawViolations);

      expect(result[0].id).toBe('critical-issue');
      expect(result[1].id).toBe('moderate-issue');
      expect(result[2].id).toBe('minor-issue');
    });

    test('should handle empty violations array', () => {
      const result = processViolations([]);
      expect(result).toEqual([]);
    });
  });

  describe('scanHtml (requires Puppeteer)', () => {
    const badPagePath = path.join(__dirname, '..', 'test-fixtures', 'bad-page.html');
    const goodPagePath = path.join(__dirname, '..', 'test-fixtures', 'good-page.html');

    test('should detect violations in inaccessible HTML', async () => {
      if (!scanHtml) return console.warn('Skipping: Puppeteer not available');

      const badHtml = fs.readFileSync(badPagePath, 'utf8');
      const result = await scanHtml(badHtml);

      expect(result.error).toBeUndefined();
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.score).toBeDefined();
      expect(result.score).toBeLessThan(100);

      // Should detect at least image-alt and html-has-lang
      const violationIds = result.violations.map(v => v.id);
      expect(violationIds).toContain('image-alt');
    }, 30000);

    test('should pass accessible HTML with fewer violations', async () => {
      if (!scanHtml) return console.warn('Skipping: Puppeteer not available');

      const goodHtml = fs.readFileSync(goodPagePath, 'utf8');
      const result = await scanHtml(goodHtml);

      expect(result.error).toBeUndefined();
      expect(result.score).toBeGreaterThanOrEqual(50);
    }, 30000);

    test('should return proper result structure', async () => {
      if (!scanHtml) return console.warn('Skipping: Puppeteer not available');

      const html = '<html lang="en"><head><title>Test</title></head><body><main><h1>Hello</h1></main></body></html>';
      const result = await scanHtml(html);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('engine');
      expect(result.engine.name).toBe('axe-core');
    }, 30000);
  });
});
