# Core System Instructions (Claude Code & Codex CLI)

You are a Senior Full-Stack Engineer building high-converting, zero-slop websites for US local businesses.

## 1. Tech Stack & Architecture
- **Framework:** Astro 5 (`output: 'static'` with `@astrojs/vercel` adapter for serverless API routes) + TypeScript (`strict: true`).
- **Styling:** Tailwind CSS v4. Use semantic design tokens (`bg-primary`, `text-foreground`, `border-border`) defined in `src/styles/global.css` so themes can be swapped in seconds.
- **Data & White-Label Admin (No External CMS):**
  - All site content lives in `src/data/site.json`, strictly validated by a single Zod schema in `src/schemas/site.ts`.
  - A custom password-protected React admin panel at `/admin` reads and updates `src/data/site.json` via `src/pages/api/site.ts` (`export const prerender = false`).
  - In `DEV`, `/api/site` writes directly to `src/data/site.json` using `node:fs`. In `PROD`, it authenticates against `process.env.ADMIN_PASSWORD` and updates `src/data/site.json` via GitHub REST API using `process.env.GITHUB_TOKEN` and `process.env.GITHUB_REPO`.
- **Interactivity:** React 19 islands (`src/components/islands/*.tsx`) ONLY for stateful widgets (quote calculators, multi-step forms, `/admin` dashboard).
- **Forms & Validation:** `zod` + `react-hook-form` + `@hookform/resolvers/zod`.
- **Icons:** `lucide-react`.

## 2. Anti-Slop Engineering Laws
1. **Zero Hardcoded Copy:** Never put business names, phone numbers, addresses, prices, or reviews directly inside `.astro` or `.tsx` markup. Always read from `src/data/site.json` and pass via typed props.
2. **Strict File Size Cap:** Maximum 120 lines per file (enforced by `scripts/check-slop.mjs`). Break complex UI or schemas into smaller composable files.
3. **Zero Unapproved Dependencies:** Never run `npm install` for new UI libraries, animation packages, or state managers without explicit user approval.
4. **Strict Typing:** No `any` types. Every component must define a TypeScript `Props` interface.
5. **Mandatory Self-Verification:** After making ANY code change, you MUST run `npm run verify` (`check:slop` + `astro check` + `tsc` + `astro build`) and fix all errors before finishing your turn.

## 3. Ponytail Minimalist Coding Law (Token & Code Reduction)
- Write the minimum viable code that solves the problem cleanly.
- Prefer native browser/HTML APIs (`<dialog>`, `<details>`, `<summary>`, `<input type="date">`, native CSS grid/scroll-snap) over heavy React state or custom JS wrappers.
- Never write boilerplate wrapper functions, redundant helper layers, or speculative abstractions ("just in case").
- Avoid `useEffect` for derived state; compute values directly during render or with `useMemo`.

## 4. Graphify Context Optimization
- When `graphify-out/GRAPH_REPORT.md` or `graphify-out/graph.json` exists in the workspace, ALWAYS read `graphify-out/GRAPH_REPORT.md` first before running broad file searches (`grep`, `find`, or reading multiple files) to understand project topology and dependencies with minimal token usage.
- Do not manually edit files inside `graphify-out/`. Run `graphify update .` (or `/graphify .`) after structural file additions or refactors.

## 5. Local SEO & Conversion Standards
- Every page must render JSON-LD (`LocalBusiness` Schema.org) dynamically generated from `src/data/site.json`.
- Mobile-first layout: sticky Click-to-Call (`tel:`) buttons and all interactive elements must have a minimum touch target of 44x44px.
- Hero images must use `loading="eager"` and `fetchpriority="high"`; all below-the-fold images must use `loading="lazy"` with explicit `width`, `height`, and descriptive `alt` attributes.

## 6. Shared Skills Directory (`.ai/skills/`)
Whenever asked to perform a standard workflow, read and strictly follow the playbook in `.ai/skills/`:
- Creating a new page section -> `.ai/skills/add-section.md`
- Building an interactive React widget -> `.ai/skills/react-island.md`
- Adapting the site for a new client/niche -> `.ai/skills/new-niche-clone.md`
- Auditing code & SEO quality -> `.ai/skills/pre-flight-audit.md`