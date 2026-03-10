<p align="center">♿</p>
<h1 align="center">A11y Ally</h1>
<p align="center"><strong>ウェブアクセシビリティアシスタント — スキャナー、ブックマークレット＆レポート</strong><br>axe-core + AI 解説で駆動</p>

<p align="center">
  <a href="../README.md">English</a> •
  <a href="README.es.md">Español</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.de.md">Deutsch</a> •
  <a href="README.pt.md">Português</a> •
  <a href="README.zh.md">中文</a> •
  <strong>日本語</strong>
</p>

---

## A11y Ally とは？

**A11y Ally** は、開発者がウェブサイトのアクセシビリティ問題を発見・修正するためのオープンソースアシスタントです。業界標準のアクセシビリティテストエンジンである [axe-core](https://github.com/dequelabs/axe-core) の機能を AI 駆動の解説と組み合わせ、すぐに使える修正スニペット付きのレポートを生成します。

### 3つのツールを1つに：

| ツール | 説明 |
|--------|------|
| **🔖 ブックマークレット** | ワンクリックブラウザツール — ブックマークバーにドラッグして即座にスキャン |
| **⌨️ CLI ツール** | CI/CDパイプライン向け Node.js コマンドラインスキャナー |
| **🌐 Web UI** | デモとドキュメント付き静的 GitHub Pages サイト |

---

## 機能

- ✅ **80以上のアクセシビリティルール**（WCAG 2.1 A/AA/AAA）
- 🤖 **AI 解説** — 明確で実用的な違反の説明
- ✂️ **修正スニペット** — コピー＆ペーストですぐに使えるコード修正
- 📊 **プロフェッショナルレポート** — HTML、JSON、Markdown形式
- 🌍 **7言語**対応
- 🆓 **無料 & オープンソース** — MITライセンス

---

## クイックスタート

```bash
cd cli && npm install
node src/index.js scan https://example.com
node src/index.js demo
```

---

## ライセンス

[MITライセンス](../LICENSE)

<p align="center">アクセシビリティのために ♥ で作成</p>
