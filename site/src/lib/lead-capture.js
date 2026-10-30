// clc-leads' client is a private package on GitHub Packages, installed as an optional
// dependency: without NODE_AUTH_TOKEN npm skips it and the site still builds, with
// everything lead-related left out. astro.config.mjs and src/data/site.js both decide
// with these helpers, so the build alias and the rendered pages always agree.
import { existsSync } from 'node:fs';

export const LEAD_CAPTURE = '@carlosleoncode/lead-capture';

/** `root` is the site folder as a file: URL ending in "/". */
export const isLeadCaptureInstalled = (root) =>
  existsSync(new URL(`node_modules/${LEAD_CAPTURE}/package.json`, root));

/** LEADS_DISABLED=1 builds without them even when the package is there. */
export const leadsEnabled = ({ endpoint, installed, env = process.env }) =>
  Boolean(endpoint?.trim()) && installed && env.LEADS_DISABLED !== '1';
