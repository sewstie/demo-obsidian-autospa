# Skill: Rebrand & Clone Template for New Local Business Niche

Target niche & location: $ARGUMENTS

## Execution Playbook (Follow Strictly in Order)

### Step 1: Do Not Break Component Architecture
1. Do NOT modify `.astro` or `.tsx` layout structure unless explicitly asked.
2. All branding, copy, and pricing updates happen strictly via Tailwind theme variables and `src/content/` JSON files.

### Step 2: Industry Color Palette & Typography
1. Open `src/styles/global.css` (or `tailwind.config.mjs`).
2. Update CSS variables (`--primary`, `--secondary`, `--accent`, `--background`) to match the psychology of the target niche:
   - *Home Services (HVAC, Plumbing, Roofing):* High-trust Navy Blue + Emergency Orange/Red accents.
   - *Auto Detailing / Mechanic:* Sleek Charcoal/Dark Slate + Crimson Red or Electric Blue.
   - *Dental / MedSpa / Clinic:* Clean Teal/Sky Blue + Soft Slate & White.
   - *Bakery / Local Cafe:* Warm Espresso Brown + Cream & Terracotta.

### Step 3: Rewrite All Content JSONs (`src/content/`)
1. Update `src/content/settings.json` with realistic business info, hours, phone format `(XXX) XXX-XXXX`, and target US city/state.
2. Rewrite `src/content/services/*.json` with 4-6 real high-margin services for this niche and realistic US pricing.
3. Rewrite `src/content/testimonials/*.json` with specific, believable customer stories mentioning local neighborhoods and specific services solved.
4. Rewrite `src/content/faqs/*.json` addressing top buyer objections (insurance, warranty, turnaround time, pricing transparency).
5. Update calculator parameters in `src/content/` so the interactive quote calculator matches the new industry's pricing logic.

### Step 4: Local SEO & Schema.org
1. Update the `@type` in the JSON-LD `LocalBusiness` schema generator (`RoofingContractor`, `AutoRepair`, `Dentist`, `Plumber`, etc.).
2. Run `npm run verify` to ensure all content collections pass Zod validation and build cleanly.