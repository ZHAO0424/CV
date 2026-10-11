# Static Assets

The portfolio remains a static GitHub Pages site. Generated files in `assets/`
are committed so deployment needs no Node.js build step.

Run `npm ci` and `npm run build` after changing the dependency versions or
`scripts/site-theme.mjs`. The build bundles the existing Three.js 0.170.0
modules into one local file and adds the shared theme assets to portfolio pages.
`demo-world.html` keeps its scene source inline.

`cyber-theme.css` only overrides the optional Night Street theme. The original
palette remains in `styles.css`; `theme-init.js` restores the saved selection
before the page renders.

The local Space Grotesk Latin font is distributed under the license in
`assets/space-grotesk-OFL.txt`. The font file comes from Google Fonts. Dependency
licenses are copied to `assets/` by the build.
