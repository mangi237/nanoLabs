import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
const target = process.argv[2];
const config = JSON.parse(readFileSync(new URL('../config/hosting.json', import.meta.url)));
const selected = config.environments[target];
if (!selected) throw new Error('Choose dev or prod for the hosted build.');
const { firebase } = config;
const browserKey = process.env.VITE_FIREBASE_API_KEY;
if (!browserKey || !/^AIza[0-9A-Za-z_-]{35}$/.test(browserKey)) throw new Error('VITE_FIREBASE_API_KEY must be supplied from the nanoLabs browser-key secret for a hosted build.');
const result = spawnSync('npm', ['run', 'build'], {stdio:'inherit',env:{...process.env,
  VITE_API_URL:selected.apiUrl,VITE_FIREBASE_API_KEY:browserKey,VITE_FIREBASE_AUTH_DOMAIN:firebase.authDomain,
  VITE_FIREBASE_PROJECT_ID:firebase.projectId,VITE_FIREBASE_APP_ID:firebase.appId,VITE_FIREBASE_STORAGE_BUCKET:firebase.storageBucket,
  VITE_FIREBASE_TENANT_ID:selected.tenantId,VITE_USE_FIREBASE_EMULATORS:'false',VITE_ENVIRONMENT:target==='prod'?'production':'staging',
}});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const commit = process.env.GITHUB_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Expected an exact source commit for the hosted release.');
writeFileSync(new URL('../dist/release.json',import.meta.url),JSON.stringify({commit,environment:target,builtAt:new Date().toISOString()})+'\n');
