# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tagalogoo is a modern Tagalog learning application built with Nuxt 4, Vue 3, and TypeScript. The app features interactive lessons, progress tracking, and uses Supabase for backend services.

## Essential Commands

### Development

- `pnpm dev` - Start development server on <http://localhost:3000>
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm check` - Run Biome checks and formatting
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - Run TypeScript type checking

### Testing

- `pnpm test` - Run tests with Vitest
- `pnpm test path/to/file.spec.ts --run` - Run specific test file without watch mode

## Architecture

### Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript
- **Styling**: Tailwind CSS 4 (configured via Vite plugin)
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Testing**: Vitest with @nuxt/test-utils
- **Code Quality**: ESLint, Biome, Lefthook (git hooks)
- **Package Manager**: pnpm

### Project Structure

```
app/                   # Nuxt app directory (main application code)
├── assets/css/        # Global CSS files
├── domain/            # Business logic (pure TypeScript, no Vue dependencies)
├── composables/       # Vue composables for shared reactive logic
├── pages/             # Page composables
├── utils/             # Utility functions used in the client
server/                # Nuxt server directory
├── api/               # Server APIs
├── utils/             # Utility functions used in the server
supabase/              # Supabase configuration (if applicable)
```

### Key Configuration

- **TypeScript**: Strict mode enabled with comprehensive compiler options
- **Nuxt Modules**: ESLint, Fonts, Test Utils, Image, VueUse
- **Experimental Features**: Typed pages enabled
- **Development Tools**: Nuxt DevTools enabled

## Coding Standards

### Vue Components

- Use TypeScript with explicit typing
- Follow component design principles from `.cursor/rules/vue.mdc`
- Extract business logic to composables or domain modules
- Use `useTemplateRef()` instead of `ref(null)` for template refs
- Import components explicitly (don't rely on auto-import)
- Use semantic HTML and proper accessibility attributes

### TypeScript

- Prefer function declarations over expressions
- Use `interface` over `type` for object types
- Use literal union types over enums
- Prefer `undefined` over `null`
- Import files with explicit `.ts` extensions for local files
- Follow naming conventions from `.cursor/rules/typescript.mdc`

### Domain Logic (`app/domain/`)

- Pure TypeScript without Vue dependencies
- No imports from `app/composables` or `app/stores`
- Include comprehensive JSDoc with examples
- Provide unit tests for all functions

### Testing

- Use Vitest for all tests
- Test files should end with `.spec.ts`
- Test public behavior, not implementation details
- Use descriptive test names and prefer `it` over `test`
- Import Vitest APIs explicitly

## Development Workflow

1. **Setup**: Run `pnpm install` to install dependencies
2. **Environment**: Copy `.env.example` to `.env` and add Supabase credentials
3. **Development**: Use `pnpm dev` for local development
4. **Code Quality**: Run `pnpm lint` and `pnpm typecheck` before committing
5. **Testing**: Run `pnpm test` to ensure all tests pass

## Important Notes

- This project uses pnpm as the package manager
- Tailwind CSS 4 is configured via Vite plugin, not PostCSS
- The project follows strict TypeScript configuration for better type safety
- Git hooks are managed by Lefthook for automated quality checks
- Business logic should be kept separate in the `app/domain/` directory
- Follow the comprehensive coding rules defined in `.cursor/rules/` for consistency
