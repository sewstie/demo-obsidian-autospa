# Skill: Build Interactive React Island (Widget / Calculator / Form)

Target widget request: $ARGUMENTS

## Execution Playbook (Follow Strictly in Order)

### Step 1: Validation & Types Schema
1. If the widget takes user input (lead forms, quote calculators, booking widgets), create a Zod schema first.
2. Keep the schema in a separate file `src/components/islands/schemas/[widgetName]Schema.ts` if the component would otherwise exceed 120 lines.
3. Export both the Zod schema and the inferred TypeScript type (`z.infer<typeof schema>`).

### Step 2: Stateful React Component
1. Create the interactive component in `src/components/islands/[WidgetName].tsx`.
2. Use `react-hook-form` with `@hookform/resolvers/zod` for forms, or clean `useState` / `useMemo` for instant quote calculators.
3. **Anti-Slop Constraints:**
   - NO `useEffect` for derived state (compute values directly during render or with `useMemo`).
   - NO `any` types.
   - Include clear UI states: `idle`, `submitting`, `success`, and `error`.
   - Configurable parameters (e.g., base prices, service multipliers, webhook URL) must be passed in as serializable `Props` from Astro (sourced from `src/content/`), NOT hardcoded inside the `.tsx` file.
   - Maximum 120 lines per `.tsx` file.

### Step 3: Astro Island Hydration
1. Embed the component inside an Astro section using `<WidgetName client:visible {...props} />` (only use `client:load` if the widget is above the fold).
2. Run `npm run verify` to confirm zero TypeScript or build errors.
