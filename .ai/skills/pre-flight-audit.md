# Skill: Pre-Flight Anti-Slop, SEO & Conversion Audit

Audit target: $ARGUMENTS (or entire repository if unspecified)

## Execution Playbook

1. **Automated Gatekeeper:**
   - Run `npm run verify`. If any file exceeds 120 lines or fails TypeScript/Astro checks, refactor immediately.

2. **Hardcoded Slop Scan:**
   - Search `src/components/` and `src/pages/` for hardcoded phone numbers, email addresses, street names, or dollar amounts (`$`).
   - If found, move them to `src/content/` and pass via props.

3. **Mobile & Conversion Audit:**
   - Verify sticky mobile header/footer has a working `tel:` Click-to-Call button.
   - Verify all `<Image />` or `<img>` tags have explicit `width`, `height`, `alt`, and `loading="lazy"` (except Hero image which must be `loading="eager"` and `fetchpriority="high"` for 100/100 LCP score).

4. **SEO & Schema Verification:**
   - Inspect the built `dist/index.html` after running `npm run build`.
   - Confirm `<title>`, `<meta name="description">`, OpenGraph tags, and `<script type="application/ld+json">` are properly rendered with dynamic business data.
   - Report a concise checklist summary of passed/fixed items.