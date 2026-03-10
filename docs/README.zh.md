<p align="center">♿</p>
<h1 align="center">A11y Ally</h1>
<p align="center"><strong>网络无障碍助手 — 扫描器、书签工具与报告</strong><br>由 axe-core + AI 解释驱动</p>

<p align="center">
  <a href="../README.md">English</a> •
  <a href="README.es.md">Español</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.de.md">Deutsch</a> •
  <a href="README.pt.md">Português</a> •
  <strong>中文</strong> •
  <a href="README.ja.md">日本語</a>
</p>

---

## 什么是 A11y Ally？

**A11y Ally** 是一个开源的网络无障碍助手，帮助开发者在任何网站上发现和修复无障碍问题。它将 [axe-core](https://github.com/dequelabs/axe-core)（业界标准的无障碍测试引擎）的强大功能与 AI 驱动的解释相结合，生成可操作的报告和即用型修复代码片段。

### 三合一工具：

| 工具 | 描述 |
|------|------|
| **🔖 书签工具** | 一键浏览器工具 — 拖到书签栏，即时扫描任何页面 |
| **⌨️ CLI 工具** | Node.js 命令行扫描器，适用于 CI/CD 管道 |
| **🌐 Web UI** | 静态 GitHub Pages 网站，配有演示和文档 |

---

## 功能特性

- ✅ **80+ 无障碍规则**（WCAG 2.1 A/AA/AAA）
- 🤖 **AI 解释** — 清晰、可操作的违规描述
- ✂️ **修复代码片段** — 即可复制粘贴的代码修正
- 📊 **专业报告** — HTML、JSON、Markdown 格式
- 🌍 **7 种语言**支持
- 🆓 **免费开源** — MIT 许可证

---

## 快速开始

```bash
cd cli && npm install
node src/index.js scan https://example.com
node src/index.js demo
```

---

## 许可证

[MIT 许可证](../LICENSE)

<p align="center">为无障碍而生 ♥</p>
