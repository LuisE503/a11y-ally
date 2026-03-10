/**
 * A11y Ally — Bookmarklet Build Script
 * Minifies and URI-encodes the bookmarklet for drag-and-drop installation
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'bookmarklet.js');
const distDir = path.join(__dirname, '..', 'site', 'js');
const distPath = path.join(distDir, 'bookmarklet-compiled.js');

// Read source
const source = fs.readFileSync(srcPath, 'utf8');

// Basic minification (remove comments, collapse whitespace)
function minify(code) {
  return code
    // Remove single-line comments (but not URLs with //)
    .replace(/(?<!:)\/\/(?!.*['"`]).*$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Remove spaces around operators
    .replace(/\s*([{}();,=:+\-*/<>!&|?])\s*/g, '$1')
    // Remove leading/trailing whitespace
    .trim();
}

const minified = minify(source);
const bookmarkletUri = `javascript:${encodeURIComponent(minified)}`;

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write compiled bookmarklet
const output = `// A11y Ally Bookmarklet — Auto-generated, do not edit
// Drag to bookmarks bar or copy the href value
window.A11Y_ALLY_BOOKMARKLET = ${JSON.stringify(bookmarkletUri)};

// Source size: ${source.length} chars
// Minified size: ${minified.length} chars
// URI-encoded size: ${bookmarkletUri.length} chars
`;

fs.writeFileSync(distPath, output, 'utf8');

console.log('✅ Bookmarklet built successfully!');
console.log(`   Source: ${source.length} chars`);
console.log(`   Minified: ${minified.length} chars`);
console.log(`   URI-encoded: ${bookmarkletUri.length} chars`);
console.log(`   Output: ${distPath}`);

// Also write a plain text file with just the bookmarklet URI
const uriPath = path.join(distDir, 'bookmarklet-uri.txt');
fs.writeFileSync(uriPath, bookmarkletUri, 'utf8');
