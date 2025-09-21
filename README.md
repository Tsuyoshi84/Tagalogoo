# Tagalogoo

Tagalogoo is an experimental learning platform that explores how Nuxt 4, Tailwind CSS 4, and Supabase can be combined to deliver approachable Tagalog lessons. The repository currently contains the core Nuxt scaffolding, development tooling, and styling pipeline that will power the eventual experience.

## Project Status

- ✅ Nuxt 4 application shell with Tailwind CSS 4 configured through Vite
- ✅ TypeScript-first tooling (eslint, biome, vue-tsc) wired into the project
- ✅ Testing harness ready via Vitest and `@nuxt/test-utils`
- 🚧 Feature work (curriculum, Supabase integration, UI components) is in early discovery

If you are cloning the repo to contribute, expect placeholder UI and minimal runtime features while the learning flows are under construction.

## Tech Stack

- **Framework**: Nuxt 4, Vue 3, TypeScript
- **Styling**: Tailwind CSS 4 via the `@tailwindcss/vite` plugin
- **Backend Services**: Supabase (authentication, database, real-time) — integration planned
- **Tooling**: pnpm, ESLint, Biome, Lefthook, Vitest, vue-tsc, @vueuse/nuxt, Nuxt Image

## Prerequisites

- Node.js 22.x (match the version declared in `.tool-versions` for best results)
- pnpm 10.17 or newer (`corepack enable` will install the correct release automatically)

## Getting Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env` if present, or create `.env` manually.
   - When Supabase integration lands you will need keys such as `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Start the development server**

   ```bash
   pnpm dev
   ```

   The app runs at `http://localhost:3000` with hot module replacement enabled.

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Launch the Nuxt development server. |
| `pnpm build` | Create the production build. |
| `pnpm preview` | Serve the production build locally. |
| `pnpm generate` | Generate a fully static version of the site. |
| `pnpm lint` / `pnpm lint:fix` | Run ESLint in check or auto-fix mode. |
| `pnpm check` | Run Biome format, lint, and organize imports. |
| `pnpm format` | Format the codebase with Biome. |
| `pnpm typecheck` | Perform a full `vue-tsc` type check. |
| `pnpm test` | Execute unit tests with Vitest and Nuxt test-utils. |

## Project Layout

```
app/                  Nuxt application source (pages, components, assets)
  assets/css/         Tailwind CSS entry point
  components/         Vue components (placeholder)
  composables/        Nuxt composables (placeholder)
  plugins/            Auto-registered Nuxt plugins (placeholder)
server/               Nitro server routes & middleware (scaffold)
public/               Static assets served as-is
nuxt.config.ts        Central Nuxt configuration with Tailwind setup
eslint.config.mjs     ESLint configuration managed by @nuxt/eslint
biome.json            Biome formatter and linter config
lefthook.yml          Git hooks for linting & formatting (opt-in)
```

## Quality & Developer Experience

- ESLint, Biome, and vue-tsc enforce code style, formatting, and TypeScript correctness.
- Lefthook can be installed locally (`pnpm dlx lefthook install`) to run these checks pre-commit.
- Vitest is configured but contains no suites yet—add tests alongside new features to keep coverage high.

## Contributing

1. Create a feature branch off `main`.
2. Add or update tests when behaviour changes.
3. Run `pnpm lint`, `pnpm check`, `pnpm typecheck`, and `pnpm test` before opening a pull request.
4. Document significant architecture or UX changes in this README to keep new contributors oriented.

## Roadmap Ideas

- Implement Supabase authentication and persistent progress tracking.
- Build interactive lesson modules and spaced-repetition drills.
- Add responsive layouts, theming, and motion design.
- Publish deployment instructions for Supabase and a production Nuxt host.

## License

A license has not been selected yet.
