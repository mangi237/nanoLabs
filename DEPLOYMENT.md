# nanoLabs frontend hosting

Live: https://nanolabs.eneza.workers.dev

Test: https://nanolabs-dev.eneza.workers.dev

`wrangler.jsonc` deploys static Vite assets to Cloudflare Workers (`nanolabs`, or `--env dev` for `nanolabs-dev`). This avoids the existing account’s Pages project limit. GitHub Actions now performs the direct upload after checks on `v2-branch` or a production release tag; see `CI-CD.md`.

Build with environment-specific public settings, then deploy that exact build. `VITE_API_URL` points to the matching Cloud Run API, `VITE_FIREBASE_TENANT_ID` selects the isolated identity tenant, and `VITE_USE_FIREBASE_EMULATORS=false`. `VITE_ENVIRONMENT=staging` displays the test banner; live uses `production`. Other `VITE_FIREBASE_*` settings come from the nanoLabs Firebase web-app configuration. These identify the public Firebase app and are not server credentials. Never add the Gemini or database secrets to any `VITE_` variable.

Live API: https://nanolabs-api-prod-dysic27f5a-ew.a.run.app

Test API: https://nanolabs-api-dev-dysic27f5a-ew.a.run.app

The API repository’s DEPLOYMENT.md records Neon, Firebase, runtime identities, secrets and the release container. Public headers preserve HTTPS, no-referrer, MIME and framing protections; microphone access is restricted to the app’s own origin. Static asset routes fall back to the SPA, and the test-only real-audio QA page is excluded from production builds.

The release was verified in Chrome with live owner sign-in, test patient sign-in, a released report surviving reload, and real Gemini responses. The complete patient-to-lab workflow was verified over the hosted test API and dedicated Neon database. No production demo laboratory or test patients were inserted. Initial owner and test credentials are private local handoff files, not source assets.
