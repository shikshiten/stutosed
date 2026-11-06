#!/usr/bin/env node
const { execSync } = require('child_process');

if (process.env.VERCEL) {
  console.log('[build.js] Detected Vercel environment -> executing next build');
  execSync('npm run build:next', { stdio: 'inherit' });
} else {
  console.log('[build.js] Detected Cloudflare / Worker environment -> executing opennextjs-cloudflare build');
  execSync('npx @opennextjs/cloudflare build', { stdio: 'inherit' });
}
