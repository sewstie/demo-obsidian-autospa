# Skill: Add New Website Section + CMS Schema

Target feature/section request: $ARGUMENTS

## Execution Playbook (Follow Strictly in Order)

### Step 1: Data & Zod Schema First
1. Inspect `src/schemas/site.ts` and `src/data/site.json`.
2. Add or update the required Zod schema fields for this section in `src/schemas/site.ts`.
3. Populate realistic, high-converting US local business mock data in `src/data/site.json`.
4. If the field should be editable by the client, expose it in the `/admin` dashboard form.

### Step 2: Zero-JS Astro Component
1. Create a new `.astro` file in `src/components/sections/` (PascalCase).
2. Define a strict TypeScript `interface Props` at the top of the frontmatter.
3. Read data from props or directly via `getEntry` / `getCollection` from `astro:content`.
4. **Rules:**
   - ZERO hardcoded business copy, phone numbers, or prices inside HTML tags.
   - Maximum 120 lines of code. If the section has complex cards or sub-items, extract a child `.astro` component.
   - Use semantic Tailwind tokens (`bg-primary`, `text-foreground`, `border-border`).
   - Mobile-first responsive design (`grid-cols-1 md:grid-cols-3`, touch targets >= 44px).

### Step 3: Integration & Verification
1. Import and render the new section in `src/pages/index.astro`.
2. Run `npm run verify` to check TypeScript, Astro types, and line-count limits. Fix any errors before completing.