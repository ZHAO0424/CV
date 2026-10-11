import { build } from 'esbuild';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({
  entryPoints: [path.join(root, 'scripts/night-street-vendor.mjs')],
  outfile: path.join(root, 'assets/night-street-vendor.js'),
  bundle: true, minify: true, format: 'esm', target: 'es2020', legalComments: 'linked'
});
await build({
  entryPoints: [path.join(root, 'scripts/site-theme.mjs')],
  outfile: path.join(root, 'assets/site-theme.js'),
  bundle: true, minify: true, format: 'iife', target: 'es2020', legalComments: 'linked'
});
for (const dependency of ['three', 'lucide']) {
  const license = await readFile(path.join(root, 'node_modules', dependency, 'LICENSE'), 'utf8');
  await writeFile(path.join(root, 'assets', `${dependency}-LICENSE.txt`), license);
}

// All portfolio pages share the same theme bootstrap and assets.
for (const directory of ['', 'projects']) {
  for (const name of await readdir(path.join(root, directory))) {
    if (!name.endsWith('.html') || name === 'demo-world.html') continue;
    const file = path.join(root, directory, name);
    const prefix = directory ? '../' : '';
    const previous = await readFile(file, 'utf8');
    const source = previous.replace(/interactions\.js\?v=[^"']+/g, 'interactions.js?v=20261011-cyber');
    if (!source.includes('styles.css')) continue;
    if (source.includes('theme-init.js')) {
      if (source !== previous) await writeFile(file, source);
      continue;
    }
    const assets = `  <script src="${prefix}theme-init.js"></script>\n  <link rel="stylesheet" href="${prefix}cyber-theme.css?v=20261011" />\n  <script defer src="${prefix}assets/site-theme.js?v=20261011"></script>`;
    await writeFile(file, source.replace(/(<link[^>]+href="[^\"]*styles\.css[^\"]*"[^>]*>)/, `$1\n${assets}`));
  }
}
