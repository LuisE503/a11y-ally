<p align="center">♿</p>
<h1 align="center">A11y Ally</h1>
<p align="center"><strong>Asistente de Accesibilidad Web — Escáner, Bookmarklet y Reportes</strong><br>Impulsado por axe-core + explicaciones con IA</p>

<p align="center">
  <a href="../README.md">English</a> •
  <strong>Español</strong> •
  <a href="README.fr.md">Français</a> •
  <a href="README.de.md">Deutsch</a> •
  <a href="README.pt.md">Português</a> •
  <a href="README.zh.md">中文</a> •
  <a href="README.ja.md">日本語</a>
</p>

---

## ¿Qué es A11y Ally?

**A11y Ally** es un asistente de accesibilidad web de código abierto que ayuda a desarrolladores a encontrar y corregir problemas de accesibilidad en cualquier sitio web. Combina la potencia de [axe-core](https://github.com/dequelabs/axe-core) con explicaciones impulsadas por IA para producir reportes accionables con fragmentos de corrección listos para usar.

### Tres herramientas en una:

| Herramienta | Descripción |
|-------------|-------------|
| **🔖 Bookmarklet** | Herramienta de un clic — arrastra a la barra de marcadores, escanea cualquier página |
| **⌨️ CLI** | Escáner de línea de comandos Node.js para pipelines CI/CD |
| **🌐 Web UI** | Sitio estático GitHub Pages con demo, documentación e instalación |

---

## Características

- ✅ **80+ reglas** de accesibilidad via axe-core (WCAG 2.1 A/AA/AAA)
- 🤖 **Explicaciones con IA** — descripciones claras y accionables de cada violación
- ✂️ **Fragmentos de corrección** — código listo para copiar y pegar
- 📊 **Reportes profesionales** — formatos HTML, JSON y Markdown
- 🌍 **7 idiomas** — Inglés, Español, Francés, Alemán, Portugués, Chino, Japonés
- 🔖 **Bookmarklet** — escanea cualquier página sin instalar nada
- ⌨️ **Herramienta CLI** — automatiza escaneos en pipelines CI/CD
- 🆓 **Gratuito y código abierto** — Licencia MIT

---

## Inicio Rápido

### Bookmarklet (Sin Instalación)

1. Visita el [sitio web de A11y Ally](https://YOUR_USERNAME.github.io/a11y-ally/?lang=es)
2. Arrastra el botón **♿ A11y Ally** a tu barra de marcadores
3. Navega a cualquier sitio web y haz clic en el bookmarklet

### Herramienta CLI

```bash
# Instalar
cd cli && npm install

# Escanear una URL
node src/index.js scan https://example.com

# Generar reporte HTML
node src/index.js scan https://example.com --format html --output reporte.html

# Ejecutar demo
node src/index.js demo
```

---

## Contribuir

¡Las contribuciones son bienvenidas! Consulta [CONTRIBUTING.md](../CONTRIBUTING.md) para las directrices.

---

## Licencia

[Licencia MIT](../LICENSE) — Libre para usar, modificar y distribuir.

<p align="center">Hecho con ♥ para la accesibilidad web</p>
