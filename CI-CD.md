# Continuing development and releases

Frontend: https://github.com/mangi237/nanoLabs/tree/v2-branch

API: https://github.com/Eneza/nanoLabs-api (private; `mangi237` now has confirmed administrator access). Repository administration lets you manage API source, collaborators and Actions; it does not grant unrelated Omevision cloud access.

Use Node 24 and run `npm ci` in both repositories. The frontend is independently installable: its API-owned contracts are vendored as a versioned npm artifact. After changing shared contracts in the sibling API, run `npm run sync:contracts`, review the package/lockfile changes, and commit them together. Read both READMEs for the local Firebase emulator demo (Java 21 required).

## Automated checks and deployment

`.github/workflows/release.yml` checks pull requests targeting `v2-branch` without deployment credentials. Pushes to `v2-branch` run tests, build the test configuration and deploy to `nanolabs-dev.eneza.workers.dev`. Release tags matching `nanolabs-v2-*` build and deploy production at `nanolabs.eneza.workers.dev`. A tagged commit must belong to `v2-branch`. Deployment errors, unavailable readiness checks, or a hosted `/release.json` that does not match the exact source commit and environment fail the workflow.

The Cloudflare token in the repository's encrypted `CLOUDFLARE_API_TOKEN` secret is limited to the existing `nanolabs` and `nanolabs-dev` Workers. It grants no API token management, DNS, R2 or unrelated Worker access. `CLOUDFLARE_ACCOUNT_ID` is a public repository variable. Application credentials are not embedded in the build. Public Firebase project and API environment selection is centralized in `config/hosting.json`; the dedicated Firebase browser key is injected only for hosted builds from the encrypted `NANOLABS_FIREBASE_BROWSER_API_KEY` Actions secret. Pull requests compile with the isolated demo configuration and receive no hosted key. `scripts/build-hosted.mjs` requires `VITE_FIREBASE_API_KEY` explicitly for local and CI hosted releases, with no default key. The deployed browser bundle necessarily contains this Firebase project identifier; its Google restrictions permit only Identity Toolkit/Secure Token and the two hosted nanoLabs origins. It cannot call Gemini or other Google APIs.

The Cloudflare Pages project limit was reached, so these sites use Workers static assets. GitHub Actions invokes Wrangler direct deployment; Git push alone outside that workflow does not publish a site. The protected `nanolabs-handoff` Worker is deployed separately and is excluded from the CI token's permissions. Its test logins, access hash and expiry are Worker secrets, never source files or Vite assets.

## Releasing

1. Merge or push reviewed work to `v2-branch`; wait for the test deployment to pass.
2. Exercise the patient, lab and doctor workflows in the test app with synthetic data.
3. Deploy an API release first if the frontend needs a new API contract. See the API repository's `CI-CD.md` for its identity prerequisites and migration gate.
4. Tag the reviewed frontend commit, for example `git tag nanolabs-v2-20261111-1`, then `git push origin nanolabs-v2-20261111-1`. Check the Actions run and inspect the live site.

To roll back the frontend, create a new release tag on a previously tested commit reachable from `v2-branch`; inspect the matching API contract before doing so. Keep the backend compatible within a coordinated release by reviewing changes explicitly; no automatic legacy-auth or schema compatibility shim is provided.

Branch protection for the original frontend repository requires its owner to enable required checks in repository Settings. Do not treat a green build as a clinical, payment or physical-microphone acceptance test. The hosted test accounts use an isolated identity tenant and database; real patient data must never be entered there.
