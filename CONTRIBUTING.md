# Contributing to A11y Ally

Thank you for your interest in contributing! This project helps make the web accessible to everyone, and every contribution counts.

## 🌍 Translations

We welcome translations! See `docs/` for existing language files and `site/i18n/` for UI translations.

**Available languages:** English, Spanish, French, German, Portuguese, Chinese, Japanese

To add a new language:

1. Copy `site/i18n/en.json` → `site/i18n/{lang-code}.json`
2. Translate all string values
3. Copy `docs/README.es.md` → `docs/README.{lang-code}.md`
4. Add the language to `site/js/i18n.js` supported languages list
5. Submit a Pull Request

## 🛠️ Development Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/a11y-ally.git
cd a11y-ally

# Install CLI dependencies
cd cli && npm install

# Build the bookmarklet
cd ../bookmarklet && node build.js

# Serve the site locally
cd ../site && npx serve .
```

## 📋 Code Guidelines

- **Accessibility first** — Our code must pass its own accessibility checks
- **Test everything** — Add tests for new features
- **Document changes** — Update README and translations when needed
- **Keep it lightweight** — Minimize dependencies

## 🐛 Reporting Issues

Please include:
- URL tested (if applicable)
- Browser and version
- Steps to reproduce
- Expected vs actual behavior

## 📝 Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
