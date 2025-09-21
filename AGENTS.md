# Repository Guidelines

## Project Structure & Module Organization
Tagalogoo runs on Nuxt 4 + Vue 3. Features live under `app/` (pages, components, assets); shared business logic belongs in `app/domain/`; server routes and middleware sit in `server/`; static files in `public/`. Keep Vue SFCs thin and move data shaping into composables or domain modules. Place tests beside the code they cover, e.g., `app/components/LessonMeter.spec.ts`.

## Build, Test, and Development Commands
Install dependencies with `pnpm install`. `pnpm dev` starts the local server on `http://localhost:3000`. Ship builds come from `pnpm build`; preview them with `pnpm preview`. Use `pnpm generate` to check static output when needed. Run `pnpm lint`, `pnpm check`, `pnpm typecheck`, and `pnpm format` before commits, then `pnpm test` (or `pnpm test -- --run app/components/LessonMeter.spec.ts`) for targeted suites.

## Coding Style & Naming Conventions
ESLint and Biome enforce a 2-space TypeScript code style—rely on the formatters, not manual tweaks. Favor function declarations with explicit return types, `interface` for object shapes, literal unions over enums, and `unknown` instead of `any`. Import modules explicitly; avoid Nuxt auto-import magic. Boolean helpers start with `is/has/can`, constants use `SCREAMING_SNAKE_CASE`, and collections end with `Map` or `Set`. Add `as const` to literal config arrays so unions stay narrow.

## Testing Guidelines
Vitest drives both unit and component coverage. Structure tests with `describe`/`it` phrasing that states observable behavior. Co-locate specs with implementations and include `expectTypeOf` assertions when touching shared types. Keep tests deterministic, mock network calls sparingly, and cover both success and failure paths. Run `pnpm test` and `pnpm typecheck` before pushing new logic.

## Commit & Pull Request Guidelines
Commits follow the repo’s Conventional Commit history (`feat:`, `chore:`, `fix:`). Keep subjects under ~60 characters, expand context in the body if needed, and group one logical change per commit. PRs should link issues, summarize behavior changes, list manual/automated checks, and drop screenshots for UI tweaks. Confirm lint, format, type, and test commands succeed locally so CI stays green.

## Environment & Tooling Notes
Use Node.js 22.x (see `.tool-versions`) and enable Corepack for consistent `pnpm`. Copy `.env.example` to `.env` when configuring Supabase keys; never commit secrets. Optional Git hooks in `lefthook.yml` can be installed with `pnpm dlx lefthook install` to run formatting and linting automatically.
