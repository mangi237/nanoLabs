import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const target = process.argv[2];
const config = JSON.parse(readFileSync(new URL('../config/hosting.json', import.meta.url)));
const selected = config.environments[target];
if (!selected) throw new Error('Choose dev or prod for the hosted build.');
const { firebase } = config;
const result = spawnSync('npm', ['run', 'build'], {stdio:'inherit',env:{...process.env,
  VITE_API_URL:selected.apiUrl,VITE_FIREBASE_API_KEY:firebase.apiKey,VITE_FIREBASE_AUTH_DOMAIN:firebase.authDomain,
  VITE_FIREBASE_PROJECT_ID:firebase.projectId,VITE_FIREBASE_APP_ID:firebase.appId,VITE_FIREBASE_STORAGE_BUCKET:firebase.storageBucket,
  VITE_FIREBASE_TENANT_ID:selected.tenantId,VITE_USE_FIREBASE_EMULATORS:'false',VITE_ENVIRONMENT:target==='prod'?'production':'staging',
}});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
