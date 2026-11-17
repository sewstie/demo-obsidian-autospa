# Obsidian Auto Spa

A responsive automotive detailing showroom with vehicle-based package estimates, a native before/after slider, appointment requests, and a password-protected content editor.

## Run locally

Use Node 24 (the Vercel runtime). The existing lockfile uses Astro 7 and React 19; no new dependencies were added.

```sh
npm ci
cp .env.example .env
# Set a strong ADMIN_PASSWORD in .env.
npm run dev
```

Open the URL printed by Astro. `/admin` edits the same `src/data/site.json` validated by `src/schemas/site.ts`. All content, prices, vehicle multipliers, time preferences, and business details live in that JSON file.

```sh
npm test
npm run verify
```

The verification gate checks component size, Astro/TypeScript types, and the production build. Tests cover pricing, validation, authentication, origins, request size, storage conflicts, and disabled demo submissions.

## Demo versus production

The default content is **explicitly a demo**: sample prices, a fictional Austin address and phone, sample testimonials, and inspiration photography. It uses `noindex`. The comparison uses one photo with an illustrative before treatment, not two customer-result photographs. Appointment submission is disabled while `demo` is true.

Before launch:

1. Replace all placeholder contact, location, domain, price, hours, testimonial, and image content. Publish only authorized, genuine reviews and results; update demo disclosures accordingly.
2. Check coating claims and maintenance/warranty terms against the products actually offered.
3. Configure `ADMIN_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_REPO`, optional `GITHUB_BRANCH`, and `LEAD_WEBHOOK_URL` on Vercel. Use a fine-grained GitHub token limited to Contents read/write for this repo.
4. Point `LEAD_WEBHOOK_URL` to an HTTPS endpoint you control or trust. It receives customer names, contact information, vehicle details, preferred time, and server-calculated estimates. Secure it and set an appropriate retention policy.
5. Enable host-level rate limits for `/api/site` and `/api/leads`; the code includes origin checks and a honeypot, not a distributed abuse-prevention service.
6. Set `demo` to false only after checking the real end-to-end lead delivery. Test a real save and automatic redeploy before handing over admin access.

A request is **not a confirmed booking**. No payment is collected. Time slots are contact preferences, not synchronized calendar inventory. There is no local lead database; successful delivery means the webhook accepted the request. A provider timeout can leave delivery uncertain—check your CRM before retrying.

## Admin persistence

- Development: authenticated, version-checked, atomic local JSON writes. Concurrent saves within the dev process are serialized.
- Production: authenticated GitHub Contents API reads/writes using file SHA conflict protection. Missing GitHub configuration fails closed.
- Passwords remain in React memory, never browser storage. Use HTTPS and a strong password. Sign out when finished.
- Admin saves trigger a new Git commit. Connect the repository to Vercel Git integration to rebuild the static showroom. Changes become public **after the deploy completes**, not instantly.
- If the config changed while a browser was open, the server uses the latest price and active time preferences for lead validation.

## Hosting

Vercel serves the static page and the two serverless API endpoints. GitHub Pages CI builds a **static-only preview**: API routes are omitted, the admin shows an unavailable notice, and lead submission is disabled regardless of JSON settings. It preserves repository-prefixed image, font, and script URLs.

## Assets

Self-hosted Manrope and Barlow Condensed fonts originate from Google Fonts (SIL Open Font License; licenses in `public/fonts/`). Automotive photography originates from Unsplash, downloaded and optimized to WebP:

- `photo-1503376780353-7e6692767b70` — hero, detail crop, and illustrative comparison.
- `photo-1611859266238-4b98091d9d9b` — dark coupe gallery image.
- `photo-1503736334956-4c8f8e92946d` — yellow coupe gallery image.

Use the studio’s licensed images before production; inspiration photos do not represent work completed by the studio. No deployment or external delivery is performed by the local build/test commands.
