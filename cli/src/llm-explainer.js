/**
 * A11y Ally — LLM Explainer
 * Provides human-readable explanations and fix snippets for accessibility violations.
 * Works in two modes:
 *   1. Online: Uses OpenAI API for contextual explanations
 *   2. Offline: Uses built-in knowledge base of common fixes
 */

/**
 * Built-in knowledge base of common accessibility fixes.
 * Each entry maps an axe-core rule ID to explanation + fix snippet.
 */
const KNOWLEDGE_BASE = {
  'image-alt': {
    title: 'Missing Image Alt Text',
    explanation: 'All images must have an `alt` attribute that describes the image content. Screen readers use this text to convey the image purpose to visually impaired users. Decorative images should use `alt=""`.',
    fix: (node) => {
      const html = node.html || '<img src="example.jpg">';
      return html.replace(/<img\s/i, '<img alt="Descriptive text for this image" ');
    },
    wcagRef: 'WCAG 1.1.1 (Level A)',
    resources: ['https://www.w3.org/WAI/tutorials/images/']
  },
  'button-name': {
    title: 'Button Missing Accessible Name',
    explanation: 'Buttons must have discernible text content or an `aria-label` attribute so screen readers can announce their purpose. Icon-only buttons are especially prone to this issue.',
    fix: (node) => {
      const html = node.html || '<button></button>';
      if (html.includes('aria-label')) return html;
      return html.replace(/<button/i, '<button aria-label="Describe button purpose"');
    },
    wcagRef: 'WCAG 4.1.2 (Level A)',
    resources: ['https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html']
  },
  'color-contrast': {
    title: 'Insufficient Color Contrast',
    explanation: 'Text must have a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (18pt or 14pt bold) against its background. This ensures readability for users with low vision or color blindness.',
    fix: (node) => {
      return `/* Adjust colors to meet WCAG AA contrast requirements */
.element {
  color: #1a1a2e;           /* Dark text on light backgrounds */
  background-color: #ffffff; /* Or adjust background */
  /* Use a contrast checker: https://webaim.org/resources/contrastchecker/ */
}`;
    },
    wcagRef: 'WCAG 1.4.3 (Level AA)',
    resources: ['https://webaim.org/resources/contrastchecker/']
  },
  'document-title': {
    title: 'Page Missing Title',
    explanation: 'Every page must have a `<title>` element inside `<head>` that describes the page purpose. This is the first thing screen readers announce and appears in browser tabs and search results.',
    fix: () => '<head>\n  <title>Page Title — Site Name</title>\n</head>',
    wcagRef: 'WCAG 2.4.2 (Level A)',
    resources: ['https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html']
  },
  'html-has-lang': {
    title: 'HTML Element Missing Language Attribute',
    explanation: 'The `<html>` element must have a `lang` attribute specifying the page language. Screen readers use this to load the correct pronunciation rules.',
    fix: () => '<html lang="en">',
    wcagRef: 'WCAG 3.1.1 (Level A)',
    resources: ['https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html']
  },
  'label': {
    title: 'Form Input Missing Label',
    explanation: 'Every form input must have a programmatically associated label using `<label for="">`, `aria-label`, or `aria-labelledby`. This tells screen reader users what information to enter.',
    fix: (node) => {
      return `<label for="input-id">Field description</label>
<input type="text" id="input-id" name="field-name">`;
    },
    wcagRef: 'WCAG 1.3.1 (Level A)',
    resources: ['https://www.w3.org/WAI/tutorials/forms/labels/']
  },
  'link-name': {
    title: 'Link Missing Accessible Name',
    explanation: 'Links must have discernible text content so users understand the link destination. Avoid generic text like "click here" or "read more" without context.',
    fix: (node) => {
      const html = node.html || '<a href="#"></a>';
      if (html.includes('aria-label')) return html;
      return html.replace(/<a\s/i, '<a aria-label="Descriptive link text" ');
    },
    wcagRef: 'WCAG 2.4.4 (Level A)',
    resources: ['https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html']
  },
  'list': {
    title: 'Improper List Structure',
    explanation: 'List items (`<li>`) must be contained in `<ul>`, `<ol>`, or `<menu>` elements. Improper nesting breaks screen reader list navigation.',
    fix: () => `<ul>
  <li>List item 1</li>
  <li>List item 2</li>
  <li>List item 3</li>
</ul>`,
    wcagRef: 'WCAG 1.3.1 (Level A)',
    resources: ['https://www.w3.org/WAI/WCAG21/Techniques/html/H48']
  },
  'heading-order': {
    title: 'Heading Levels Out of Order',
    explanation: 'Headings must follow a logical, sequential order (h1 → h2 → h3). Skipping heading levels (e.g., h1 → h3) creates navigation confusion for screen reader users who rely on heading structure.',
    fix: () => `<!-- Correct heading hierarchy -->
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
  <h2>Another Section</h2>`,
    wcagRef: 'WCAG 1.3.1 (Level A)',
    resources: ['https://www.w3.org/WAI/tutorials/page-structure/headings/']
  },
  'landmark-one-main': {
    title: 'Page Missing Main Landmark',
    explanation: 'Each page should have exactly one `<main>` element (or `role="main"`) to identify the primary content area. This allows screen reader users to skip directly to the main content.',
    fix: () => `<body>
  <header>...</header>
  <nav>...</nav>
  <main>
    <!-- Primary page content here -->
  </main>
  <footer>...</footer>
</body>`,
    wcagRef: 'WCAG 1.3.1 (Level A)',
    resources: ['https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html']
  },
  'meta-viewport': {
    title: 'Viewport Meta Prevents Zoom',
    explanation: 'The viewport meta tag must not disable user scaling (`user-scalable=no`) or set `maximum-scale=1.0`. Users with low vision need the ability to zoom content.',
    fix: () => '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    wcagRef: 'WCAG 1.4.4 (Level AA)',
    resources: ['https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html']
  },
  'region': {
    title: 'Content Not in Landmark Region',
    explanation: 'All page content should be contained within landmark regions (`<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, etc.) so screen reader users can navigate by landmark.',
    fix: () => `<!-- Wrap content in semantic landmarks -->
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>`,
    wcagRef: 'WCAG 1.3.1 (Level A)',
    resources: ['https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/']
  },
  'tabindex': {
    title: 'Positive Tabindex Value',
    explanation: 'Elements should not use positive `tabindex` values as they override the natural tab order and create confusing navigation. Use `tabindex="0"` to add elements to the natural flow or `tabindex="-1"` for programmatic focus only.',
    fix: (node) => {
      const html = node.html || '<div tabindex="5"></div>';
      return html.replace(/tabindex="\d+"/i, 'tabindex="0"');
    },
    wcagRef: 'WCAG 2.4.3 (Level A)',
    resources: ['https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html']
  },
  'aria-roles': {
    title: 'Invalid ARIA Role',
    explanation: 'ARIA role values must be valid and recognized roles. Invalid roles are ignored by assistive technologies, leaving elements without proper semantics.',
    fix: () => `<!-- Common valid ARIA roles -->
<div role="alert">Important notification</div>
<div role="dialog" aria-label="Settings">...</div>
<div role="tabpanel" aria-labelledby="tab-1">...</div>`,
    wcagRef: 'WCAG 4.1.2 (Level A)',
    resources: ['https://www.w3.org/TR/wai-aria-1.2/#role_definitions']
  },
  'aria-required-attr': {
    title: 'Missing Required ARIA Attributes',
    explanation: 'Certain ARIA roles require specific attributes to function correctly. For example, `role="checkbox"` requires `aria-checked`.',
    fix: () => `<!-- Example: checkbox requires aria-checked -->
<div role="checkbox" aria-checked="false" tabindex="0">
  Accept Terms
</div>`,
    wcagRef: 'WCAG 4.1.2 (Level A)',
    resources: ['https://www.w3.org/TR/wai-aria-1.2/#requiredState']
  }
};

/**
 * Get explanation and fix for a violation using the built-in knowledge base
 * @param {object} violation - Processed violation object
 * @returns {object} Enhanced violation with explanation and fix snippets
 */
function explainOffline(violation) {
  const kb = KNOWLEDGE_BASE[violation.id];

  if (kb) {
    return {
      ...violation,
      explanation: kb.explanation,
      fixTitle: kb.title,
      fixSnippets: violation.nodes.map(node => ({
        original: node.html,
        fixed: typeof kb.fix === 'function' ? kb.fix(node) : kb.fix,
        target: node.target
      })),
      wcagRef: kb.wcagRef,
      resources: kb.resources
    };
  }

  // Fallback: generate generic explanation from axe data
  return {
    ...violation,
    explanation: violation.help || violation.description,
    fixTitle: violation.description,
    fixSnippets: violation.nodes.map(node => ({
      original: node.html,
      fixed: `<!-- Fix: ${node.failureSummary || violation.help} -->`,
      target: node.target
    })),
    wcagRef: `WCAG (${violation.wcagLevel})`,
    resources: [violation.helpUrl]
  };
}

/**
 * Get explanation and fix for a violation using OpenAI API
 * @param {object} violation - Processed violation object
 * @param {string} apiKey - OpenAI API key
 * @returns {object} Enhanced violation with AI-generated explanation and fixes
 */
async function explainWithLLM(violation, apiKey) {
  try {
    const prompt = buildLLMPrompt(violation);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an accessibility expert. Provide clear, actionable explanations for WCAG violations and generate corrected HTML/CSS code snippets. Be concise but thorough. Respond in JSON format with fields: explanation (string), fixSnippets (array of {original, fixed} objects), wcagRef (string), resources (array of URLs).'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return {
      ...violation,
      explanation: parsed.explanation,
      fixTitle: violation.description,
      fixSnippets: parsed.fixSnippets || violation.nodes.map(node => ({
        original: node.html,
        fixed: `<!-- AI fix unavailable -->`,
        target: node.target
      })),
      wcagRef: parsed.wcagRef || `WCAG (${violation.wcagLevel})`,
      resources: parsed.resources || [violation.helpUrl],
      aiGenerated: true
    };
  } catch (error) {
    // Fallback to offline mode on API failure
    console.warn(`LLM API error for ${violation.id}: ${error.message}. Falling back to offline mode.`);
    return explainOffline(violation);
  }
}

/**
 * Build prompt for LLM explanation
 */
function buildLLMPrompt(violation) {
  const nodesInfo = violation.nodes.slice(0, 3).map(node =>
    `HTML: ${node.html}\nTarget: ${node.target?.join(', ')}\nFailure: ${node.failureSummary}`
  ).join('\n---\n');

  return `Analyze this accessibility violation and provide a fix:

Rule ID: ${violation.id}
Impact: ${violation.impact} (${violation.severityLabel})
Description: ${violation.description}
Help: ${violation.help}
WCAG Tags: ${violation.wcagTags?.join(', ')}

Affected elements:
${nodesInfo}

Provide:
1. A clear explanation of why this is an accessibility issue and who it affects
2. Corrected HTML/CSS code snippets for each affected element
3. The specific WCAG success criterion reference
4. Helpful resource URLs`;
}

/**
 * Explain all violations in a scan result
 * @param {object} scanResult - Result from scanner
 * @param {object} options - { apiKey, mode: 'offline'|'llm' }
 * @returns {object} Enhanced scan result with explanations
 */
async function explainViolations(scanResult, options = {}) {
  const { apiKey, mode = 'offline' } = options;

  if (!scanResult.violations || scanResult.violations.length === 0) {
    return { ...scanResult, explanations: [] };
  }

  const explanations = [];

  for (const violation of scanResult.violations) {
    let explained;
    if (mode === 'llm' && apiKey) {
      explained = await explainWithLLM(violation, apiKey);
    } else {
      explained = explainOffline(violation);
    }
    explanations.push(explained);
  }

  return {
    ...scanResult,
    violations: explanations
  };
}

module.exports = {
  explainOffline,
  explainWithLLM,
  explainViolations,
  KNOWLEDGE_BASE,
  buildLLMPrompt
};
