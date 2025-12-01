import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../../../Bin/UI');
const htmlFile = path.join(distDir, 'index.html');

let html = fs.readFileSync(htmlFile, 'utf-8');

const cssRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
let match;
while ((match = cssRegex.exec(html)) !== null) {
  const cssPath = path.join(distDir, match[1]);
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf-8');
    html = html.replace(match[0], `<style>${css}</style>`);
    fs.unlinkSync(cssPath);
  }
}

const jsRegex = /<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g;
html = html.replace(jsRegex, (match, src) => {
  const jsPath = path.join(distDir, src);
  if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, 'utf-8');
    fs.unlinkSync(jsPath);
    return `<script type="module">${js}</script>`;
  }
  return match;
});

fs.writeFileSync(htmlFile, html);

const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  if (files.length === 0) {
    fs.rmdirSync(assetsDir);
  }
}
