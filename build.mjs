/**
 * Bundles the src/ entry points into the classic scripts Chrome loads from dist/.
 * Usage: node build.mjs [--watch]
 */

import * as esbuild from 'esbuild';

const options = {
  entryPoints: {
    inject: 'src/page/inject.js',
    overlay: 'src/ui/overlay.js',
    content: 'src/content/content.js'
  },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome111',
  minify: false,
  logLevel: 'info'
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
