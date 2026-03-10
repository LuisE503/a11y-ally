/**
 * A11y Ally — Reporter & LLM Explainer Tests
 */

const { generateReport, generateJsonReport, generateMarkdownReport, generateHtmlReport, escapeHtml } = require('../src/reporter');
const { explainOffline, explainViolations, KNOWLEDGE_BASE, buildLLMPrompt } = require('../src/llm-explainer');

// Sample scan result for testing
const sampleScanResult = {
  url: 'https://example.com',
  pageTitle: 'Test Page',
  timestamp: '2026-03-10T12:00:00.000Z',
  score: 75,
  summary: {
    violations: 3,
    passes: 20,
    incomplete: 2,
    inapplicable: 5,
    totalElements: 4
  },
  violations: [
    {
      id: 'image-alt',
      impact: 'critical',
      severity: 4,
      severityLabel: 'Critical',
      description: 'Images must have alternate text',
      help: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.9/image-alt',
      wcagTags: ['wcag2a', 'wcag111'],
      wcagLevel: 'A',
      nodes: [
        {
          html: '<img src="photo.jpg">',
          target: ['img'],
          failureSummary: 'Element does not have an alt attribute',
          impact: 'critical'
        }
      ]
    },
    {
      id: 'color-contrast',
      impact: 'serious',
      severity: 3,
      severityLabel: 'Serious',
      description: 'Elements must have sufficient color contrast',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.9/color-contrast',
      wcagTags: ['wcag2aa', 'wcag143'],
      wcagLevel: 'AA',
      nodes: [
        {
          html: '<p style="color: #ccc">Light text</p>',
          target: ['p'],
          failureSummary: 'Element has insufficient color contrast',
          impact: 'serious'
        }
      ]
    },
    {
      id: 'document-title',
      impact: 'serious',
      severity: 3,
      severityLabel: 'Serious',
      description: 'Document must have a title',
      help: 'Document must have a title',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.9/document-title',
      wcagTags: ['wcag2a', 'wcag242'],
      wcagLevel: 'A',
      nodes: [
        {
          html: '<html>',
          target: ['html'],
          failureSummary: 'Document does not have a title element',
          impact: 'serious'
        }
      ]
    }
  ],
  engine: { name: 'axe-core', version: '4.9.1' }
};

describe('Reporter Module', () => {

  describe('escapeHtml', () => {
    test('should escape HTML entities', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('should handle null/undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('generateJsonReport', () => {
    test('should generate valid JSON', () => {
      const json = generateJsonReport(sampleScanResult);
      const parsed = JSON.parse(json);
      expect(parsed.url).toBe('https://example.com');
      expect(parsed.score).toBe(75);
      expect(parsed.violations).toHaveLength(3);
    });

    test('should strip screenshot from JSON', () => {
      const resultWithScreenshot = { ...sampleScanResult, screenshot: 'base64data...' };
      const json = generateJsonReport(resultWithScreenshot);
      const parsed = JSON.parse(json);
      expect(parsed.screenshot).toBeUndefined();
    });
  });

  describe('generateMarkdownReport', () => {
    test('should generate valid Markdown', () => {
      const md = generateMarkdownReport(sampleScanResult);
      expect(md).toContain('# Accessibility Report');
      expect(md).toContain('https://example.com');
      expect(md).toContain('75/100');
      expect(md).toContain('## Violations');
    });

    test('should include violation details', () => {
      const md = generateMarkdownReport(sampleScanResult);
      expect(md).toContain('image-alt');
      expect(md).toContain('Critical');
    });

    test('should handle zero violations', () => {
      const cleanResult = { ...sampleScanResult, violations: [] };
      const md = generateMarkdownReport(cleanResult);
      expect(md).toContain('No Violations Found');
    });
  });

  describe('generateHtmlReport', () => {
    test('should generate valid HTML', () => {
      const html = generateHtmlReport(sampleScanResult);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('A11y Ally Report');
      expect(html).toContain('https://example.com');
    });

    test('should include score ring', () => {
      const html = generateHtmlReport(sampleScanResult);
      expect(html).toContain('score-ring');
      expect(html).toContain('75');
    });

    test('should include violations with severity badges', () => {
      const html = generateHtmlReport(sampleScanResult);
      expect(html).toContain('severity-critical');
      expect(html).toContain('severity-serious');
    });

    test('should include copy button for fix snippets', () => {
      const html = generateHtmlReport(sampleScanResult);
      expect(html).toContain('copy-btn');
    });
  });

  describe('generateReport', () => {
    test('should select correct format', () => {
      const json = generateReport(sampleScanResult, 'json');
      expect(() => JSON.parse(json)).not.toThrow();

      const md = generateReport(sampleScanResult, 'md');
      expect(md).toContain('# Accessibility Report');

      const html = generateReport(sampleScanResult, 'html');
      expect(html).toContain('<!DOCTYPE html>');
    });
  });
});

describe('LLM Explainer Module', () => {

  describe('KNOWLEDGE_BASE', () => {
    test('should have entries for common violations', () => {
      expect(KNOWLEDGE_BASE['image-alt']).toBeDefined();
      expect(KNOWLEDGE_BASE['button-name']).toBeDefined();
      expect(KNOWLEDGE_BASE['color-contrast']).toBeDefined();
      expect(KNOWLEDGE_BASE['document-title']).toBeDefined();
      expect(KNOWLEDGE_BASE['html-has-lang']).toBeDefined();
      expect(KNOWLEDGE_BASE['label']).toBeDefined();
      expect(KNOWLEDGE_BASE['link-name']).toBeDefined();
    });

    test('each entry should have required fields', () => {
      Object.entries(KNOWLEDGE_BASE).forEach(([id, entry]) => {
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('explanation');
        expect(entry).toHaveProperty('fix');
        expect(entry).toHaveProperty('wcagRef');
        expect(entry).toHaveProperty('resources');
        expect(entry.resources.length).toBeGreaterThan(0);
      });
    });
  });

  describe('explainOffline', () => {
    test('should explain known violations with knowledge base', () => {
      const violation = {
        id: 'image-alt',
        impact: 'critical',
        severity: 4,
        severityLabel: 'Critical',
        description: 'Images must have alternate text',
        help: 'Images must have alternate text',
        helpUrl: 'https://example.com',
        wcagTags: ['wcag2a'],
        wcagLevel: 'A',
        nodes: [{ html: '<img src="test.jpg">', target: ['img'], failureSummary: 'Missing alt' }]
      };

      const result = explainOffline(violation);

      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(10);
      expect(result.fixTitle).toBe('Missing Image Alt Text');
      expect(result.fixSnippets).toHaveLength(1);
      expect(result.fixSnippets[0].fixed).toContain('alt=');
      expect(result.wcagRef).toContain('WCAG');
      expect(result.resources).toContain('https://www.w3.org/WAI/tutorials/images/');
    });

    test('should provide generic fallback for unknown violations', () => {
      const violation = {
        id: 'unknown-rule',
        impact: 'minor',
        description: 'Some unknown rule',
        help: 'Unknown help text',
        helpUrl: 'https://example.com',
        wcagTags: [],
        wcagLevel: 'Best Practice',
        nodes: [{ html: '<div></div>', target: ['div'], failureSummary: 'Something failed' }]
      };

      const result = explainOffline(violation);

      expect(result.explanation).toBeDefined();
      expect(result.fixSnippets).toHaveLength(1);
    });
  });

  describe('explainViolations', () => {
    test('should explain all violations in offline mode', async () => {
      const result = await explainViolations(sampleScanResult, { mode: 'offline' });

      expect(result.violations).toHaveLength(3);
      result.violations.forEach(v => {
        expect(v.explanation).toBeDefined();
        expect(v.fixSnippets).toBeDefined();
      });
    });

    test('should handle empty violations', async () => {
      const emptyResult = { ...sampleScanResult, violations: [] };
      const result = await explainViolations(emptyResult, { mode: 'offline' });
      expect(result.explanations).toEqual([]);
    });
  });

  describe('buildLLMPrompt', () => {
    test('should build a well-structured prompt', () => {
      const violation = {
        id: 'image-alt',
        impact: 'critical',
        severityLabel: 'Critical',
        description: 'Images must have alternate text',
        help: 'Images must have alternate text',
        wcagTags: ['wcag2a'],
        nodes: [{ html: '<img src="test.jpg">', target: ['img'], failureSummary: 'Missing alt' }]
      };

      const prompt = buildLLMPrompt(violation);

      expect(prompt).toContain('image-alt');
      expect(prompt).toContain('critical');
      expect(prompt).toContain('<img src="test.jpg">');
    });
  });
});
