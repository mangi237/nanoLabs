# nanoLabs frontend v2

The frontend lives in this repository; its API lives in the separate sibling `nanolabs-api` repository. Both use `v2-branch`. No production deployment or remote push was performed.

## Run locally

Place the repositories side by side:

```
partner-apps/
  nanolabs/
  nanolabs-api/
```

Run `npm ci` in each repository. The frontend consumes the API-owned `@nanolabs/contracts` package as a committed, versioned tarball in `vendor/`; it builds independently and does not need API source or server dependencies at build time. The API package is the only editable source for billing/package math. After changing it, run `npm run sync:contracts` here while the API is in the sibling `nanolabs-api` folder, then commit the updated artifact and lockfile. No package registry publication is required for local builds.

For a synthetic interactive demo, start `npm run dev:demo` in the API repository, then `npm run dev:demo` here. Open `http://127.0.0.1:8085`. Demo configuration is public, contains no production secrets, and cannot be used in a production build. The API README lists the synthetic staff accounts. Register a synthetic patient, select published tests, review the quote and send a request. Use the laboratory accounts for reception, cashier, sample collection, technician results and separate biologist release. Return to the patient account to view, print, share and revoke the released report.

For your own configured environment, copy `.env.example` to `.env`, fill the public Firebase browser settings and the API origin, and run `npm run dev`. Never put private provider credentials in `VITE_` variables. The API README describes server credentials, lab setup, insurance records and payment instructions. `npm run build` runs TypeScript checks and generates the web build in `dist/`.

## What v2 changes

The backend has been extracted, not duplicated. Shared administrator codes, anonymous access, browser-only authorization, permissive shared-report codes, fabricated KYC approvals and sample financial fallbacks have been removed from the active workflow. Authentication uses server-provisioned accounts and Firebase ID tokens. The app never decides its own role or whether a booking is paid/released.

Patients choose actual configured tests and laboratories, see the API's itemized quote, and submit a request with a stable retry key. The app displays confirmed server stages, not optimistic acceptance/payment/release. API failures use visible error messages. Bookings survive reload because they are stored in Firestore through the API. A disconnected browser cannot confirm an operation; retry it when connected. This version does not claim offline payment/result saving.

Cashiers see amounts and payment details without draft clinical results. Only a biologist can release a complete report. Sharing uses an expiring, revocable link. No external page translator runs over patient records. Authentication is per-browser-tab and signing out clears the Firebase session. No private file is uploaded to a public IPFS gateway or represented by a local data URL as if uploaded.

This intentionally changes the old account model. Existing accounts require a reviewed enrollment/migration plan; no compatibility login was added. Insecure legacy modules are retained as source references but are not routes in the v2 app. Re-enabling doctor chat, family profiles, transfers, inventory, settlement interfaces, private uploads or other ancillary features requires authorized API operations and verification, not direct client database access. Consult the API README for exact prerequisites and outstanding rollout work.

## Validation

Production web build and TypeScript checks passed. API unit/invariant tests and real Firebase Auth/Firestore emulator HTTP/rule tests passed. A Chrome browser check completed synthetic signup/sign-in recovery, quote, request, laboratory acceptance, invoice, cashier confirmation, sample collection, draft results, separate biologist release, patient result viewing, share creation and revocation. No production database, real payment or external messaging provider was used.
