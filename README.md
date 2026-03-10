<p align="center">
  <span style="font-size:48px">♿</span>
</p>

<h1 align="center">A11y Ally</h1>

<p align="center">
  <strong>Web Accessibility Assistant — Scanner, Bookmarklet & Reports</strong><br>
  Powered by axe-core + AI explanations
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#cli-usage">CLI</a> •
  <a href="#bookmarklet">Bookmarklet</a> •
  <a href="#demo">Demo</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <strong>🌍 README in other languages:</strong><br>
  <a href="docs/README.es.md">Español</a> •
  <a href="docs/README.fr.md">Français</a> •
  <a href="docs/README.de.md">Deutsch</a> •
  <a href="docs/README.pt.md">Português</a> •
  <a href="docs/README.zh.md">中文</a> •
  <a href="docs/README.ja.md">日本語</a>
</p>

---

## What is A11y Ally?

**A11y Ally** is an open-source web accessibility assistant that helps developers find and fix accessibility issues on any website. It combines the power of [axe-core](https://github.com/dequelabs/axe-core) (the industry-standard accessibility testing engine) with AI-powered explanations to produce actionable reports with ready-to-use fix snippets.

### Three tools in one:

| Tool | Description |
|------|-------------|
| **🔖 Bookmarklet** | One-click browser tool — drag to bookmarks bar, scan any page instantly |
| **⌨️ CLI Tool** | Node.js command-line scanner for CI/CD pipelines and batch processing |
| **🌐 Web UI** | Static GitHub Pages site with live demo, documentation, and installation |

---

## Features

- ✅ **80+ accessibility rules** via axe-core (WCAG 2.1 A/AA/AAA + best practices)
- 🤖 **AI-powered explanations** — clear, actionable descriptions of each violation
- ✂️ **Fix snippets** — copy-paste ready code corrections (before/after)
- 📊 **Professional reports** — HTML, JSON, and Markdown formats
- 🌍 **7 languages** — English, Spanish, French, German, Portuguese, Chinese, Japanese
- 🔖 **Bookmarklet** — scan any page without installing anything
- ⌨️ **CLI tool** — automate scans in CI/CD pipelines
- 📈 **Severity scoring** — 0-100 accessibility score with WCAG level mapping
- 🎨 **Premium dark theme** — beautiful reports and web UI
- 🆓 **Free & open source** — MIT License

---

## Quick Start

### Bookmarklet (No Install)

1. Visit the [A11y Ally website](https://YOUR_USERNAME.github.io/a11y-ally/)
2. Drag the **♿ A11y Ally** button to your bookmarks bar
3. Navigate to any website and click the bookmarklet

### CLI Tool

```bash
# Install
cd cli && npm install

# Scan a URL
node src/index.js scan https://example.com

# Generate HTML report
node src/index.js scan https://example.com --format html --output report.html

# Batch scan from file
node src/index.js batch urls.txt --output-dir ./reports

# Run demo scan
node src/index.js demo
```

---

## CLI Usage

```
a11y-ally <command> [options]

Commands:
  scan <url>       Scan a URL for accessibility violations
  batch <file>     Scan multiple URLs from a file
  demo             Run demo scan on sample pages

Options:
  -f, --format     Report format: html, json, md (default: html)
  -o, --output     Output file path
  -l, --lang       Report language (default: en)
  -k, --llm-key    OpenAI API key for AI explanations
  --no-screenshots Disable screenshots
  --wcag-level     WCAG level: a, aa, aaa (default: aa)
  -V, --version    Output version
  -h, --help       Display help
```

### Examples

```bash
# Basic scan
node src/index.js scan https://example.com

# Scan with AI explanations
node src/index.js scan https://example.com --llm-key sk-your-key

# Markdown report
node src/index.js scan https://example.com -f md -o report.md

# Batch scan
echo "https://example.com" > urls.txt
echo "https://example.org" >> urls.txt
node src/index.js batch urls.txt -f html --output-dir ./reports
```

---

## Bookmarklet

The bookmarklet is a self-contained browser tool that:

1. Injects axe-core into the current page
2. Runs a full accessibility audit
3. Displays results in a floating overlay panel
4. Provides fix snippets with copy-to-clipboard
5. Exports results as JSON

### Build the bookmarklet

```bash
node bookmarklet/build.js
```

This generates a minified, URI-encoded bookmarklet in `site/js/bookmarklet-compiled.js`.

---

## Demo

The project includes pre-generated demo reports for three sample websites:

| Site | Score | Common Issues |
|------|-------|---------------|
| Government Portal | 42/100 | Missing alt text, form labels, landmarks |
| E-Commerce Store | 58/100 | Product images, button names, contrast |
| News Blog | 71/100 | Heading order, link names, landmarks |

### Run the web UI locally

```bash
cd site
npx serve .
```

Then open `http://localhost:3000` in your browser.

---

## Project Structure

```
a11y-ally/
├── cli/                 # Node.js CLI tool
│   ├── src/
│   │   ├── index.js     # CLI entry point
│   │   ├── scanner.js   # axe-core scanner
│   │   ├── reporter.js  # Report generation
│   │   └── llm-explainer.js  # AI explanations
│   └── tests/           # Integration tests
├── bookmarklet/         # Browser bookmarklet
│   ├── src/bookmarklet.js
│   └── build.js
├── site/                # Static website (GitHub Pages)
│   ├── css/styles.css   # Design system
│   ├── js/              # App, i18n, demo viewer
│   ├── i18n/            # Translation files (7 languages)
│   └── demo-reports/    # Pre-generated reports
├── docs/                # Multi-language READMEs
└── README.md
```

---

## Testing

```bash
cd cli
npm install
npm test
```

Tests cover:
- Scanner module (violation processing, severity mapping)
- Reporter module (HTML, JSON, Markdown generation)
- LLM Explainer (knowledge base, offline mode, prompt building)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Translation contributions

We especially welcome translation contributions! To add a new language:

1. Copy `site/i18n/en.json` → `site/i18n/{lang-code}.json`
2. Translate all string values
3. Copy `docs/README.es.md` → `docs/README.{lang-code}.md`
4. Submit a Pull Request

---

## License

[MIT License](LICENSE) — Free to use, modify, and distribute.

---

<p align="center">
  Made with ♥ for web accessibility<br>
  <sub>Powered by <a href="https://github.com/dequelabs/axe-core">axe-core</a></sub>
</p>
