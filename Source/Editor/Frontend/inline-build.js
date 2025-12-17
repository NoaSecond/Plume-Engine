import fs from 'fs/promises';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../../../Bin/UI');
const htmlFile = path.join(distDir, 'index.html');

async function build() {
  try {
    let html = await fs.readFile(htmlFile, 'utf-8');

    // 1. Process CSS
    const linkRegex = /<link([^>]+)>/g;
    const linkMatches = [...html.matchAll(linkRegex)];
    for (const m of linkMatches) {
      const attrs = m[1];
      // Check for rel="stylesheet" (handle quotes)
      if (attrs.includes('rel="stylesheet"') || attrs.includes("rel='stylesheet'")) {
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
        if (hrefMatch) {
          const cssPath = path.join(distDir, hrefMatch[1]);
          if (await fileExists(cssPath)) {
            const css = await fs.readFile(cssPath, 'utf-8');
            html = html.replace(m[0], () => `<style>${css}</style>`);
            await fs.unlink(cssPath).catch(() => { });
          }
        }
      }
    }

    // 2. Process JS
    const scriptRegex = /<script([^>]+)><\/script>/g;
    const scriptMatches = [...html.matchAll(scriptRegex)];
    for (const m of scriptMatches) {
      const attrs = m[1];
      // Check for type="module" (handle quotes)
      if (attrs.includes('type="module"') || attrs.includes("type='module'")) {
        const srcMatch = attrs.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
          const jsPath = path.join(distDir, srcMatch[1]);
          if (await fileExists(jsPath)) {
            const js = await fs.readFile(jsPath, 'utf-8');
            html = html.replace(m[0], () => `<script type="module">${js}</script>`);
            await fs.unlink(jsPath).catch(() => { });
          }
        }
      }
    }

    await fs.writeFile(htmlFile, html);

    const assetsDir = path.join(distDir, 'assets');
    if (await fileExists(assetsDir)) {
      const files = await fs.readdir(assetsDir);
      if (files.length === 0) {
        await fs.rmdir(assetsDir);
      }
    }
    console.log('Inline build completed successfully.');
  } catch (err) {
    console.error('Error during inline build:', err);
    process.exit(1);
  }
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

build();
