# Tech Stack & Build System

## Framework & Core Technologies

- **Framework**: Nuxt 4 with Vue 3 and TypeScript
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite` plugin + DaisyUI components
- **Backend**: Supabase (authentication, database, real-time)
- **Database Schema**: Drizzle ORM for schema definition and migrations
- **Data Access**: Supabase JS client for all queries (enforces RLS)
- **Package Manager**: pnpm 10.17+ (required)
- **Node Version**: 22.x (see `.tool-versions`)

## Key Dependencies

- **UI/UX**: `@nuxt/image`, `@nuxt/fonts`, `@vueuse/nuxt`, DaisyUI, Lucide Vue Next
- **Auth**: `@nuxtjs/supabase` with Google OAuth
- **Database Schema**: `drizzle-orm`, `drizzle-kit` for schema definition and migrations
- **Data Access**: `@supabase/supabase-js` for all client-side and server-side queries
- **Schema Validation**: `zod` for runtime type validation at API boundaries
- **Testing**: Vitest with `@nuxt/test-utils`
- **Code Quality**: ESLint (`@nuxt/eslint`), Biome, vue-tsc
- **Git Hooks**: Lefthook for pre-commit checks

## UI Component Libraries

### DaisyUI

- Semantic component classes built on Tailwind CSS
- Pre-built components: buttons, cards, modals, forms, etc.
- Use component classes like `btn`, `card`, `modal` in templates
- Configured as Tailwind plugin in `nuxt.config.ts`

### Lucide Vue Next

- Feather-inspired icon library for Vue 3
- Import icons individually: `import { User, Mail, Settings } from 'lucide-vue-next'`
- Use as components: `<User class="w-4 h-4" />`
- Optimized with tree-shaking for minimal bundle size

## Browser & Device Support

### Target Browsers

- **Chrome**: Latest version (primary target)
- **Edge**: Latest version (primary target)
- Modern browsers with ES2022+ support

### Device Support

- **Mobile-first**: Responsive design for mobile devices
- **Desktop**: Full desktop experience
- **Touch interfaces**: Optimized for touch interactions

### Theme Support

- **Light mode**: Default theme
- **Dark mode**: Full dark theme support
- **System preference**: Respects user's OS theme setting
- Use DaisyUI theme system for consistent theming

## Development Server

- Runs on port 3123 (configured in `nuxt.config.ts`)
- Hot module replacement enabled
- TypeScript strict mode with enhanced compiler options

## Common Commands

### Development

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm preview      # Serve production build locally
pnpm generate     # Generate static site
```

### Code Quality

```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Auto-fix ESLint issues
pnpm check        # Run Biome (format, lint, organize imports)
pnpm format       # Format code with Biome
pnpm typecheck    # Full TypeScript type checking
```

### Testing

```bash
pnpm test         # Run Vitest tests
```

**Test File Organization**: Test files must be co-located with their target files in the same directory (e.g., `ComponentName.spec.ts` alongside `ComponentName.vue`)

### Database

```bash
pnpm db:generate  # Generate migrations from Drizzle schema
pnpm db:migrate   # Run migrations with Drizzle Kit
pnpm db:push      # Push schema directly to database (dev only)
pnpm db:studio    # Open Drizzle Studio
```

### Setup

```bash
pnpm install     # Install dependencies
# Copy .env.example to .env and configure Supabase credentials
```

## Database Architecture

### Schema & Migrations

- **Schema Definition**: Use Drizzle ORM (`schema.ts`) as the authoritative source of truth for table and column definitions
- **Migration Workflow**:
  1. Define or update `schema.ts`
  2. Run `drizzle-kit generate` to produce SQL
  3. Create a Supabase migration file via `supabase migration new <name>`
  4. Copy Drizzle’s generated SQL into that file, then add RLS policies/triggers/functions manually as needed
  5. Apply migrations to **remote Supabase** via `supabase db push`
- **Version Control**: Commit all migration files under version control
- **Single Source of Truth**: Drizzle schema remains the source; migration files are the history applied to Supabase

### Data Access Patterns

#### Browser/Client-Side

- **Always use Supabase JS client** - never Drizzle, never direct database connections
- All queries automatically subject to Row Level Security (RLS)
- Type-safe queries via TypeScript types generated from Drizzle schema

#### Nuxt Server Routes / API Handlers

- **Primary**: Use Supabase JS client for queries (enforces RLS)
- **Alternative**: Use Drizzle with Supabase adapter for type-safe queries (still enforces RLS)
- Server-side queries remain subject to RLS when using authenticated Supabase client

#### Admin / Batch Jobs / Complex SQL

- Use Drizzle with `postgres-js` or `node-postgres` + Supabase service role
- **Critical**: Service role bypasses RLS, so enforce your own authorization
- Only safe for trusted server-only tasks

### Row Level Security (RLS)

- **Always enabled** on user-facing tables
- Supabase client queries (browser or server) automatically subject to RLS
- Service role queries bypass RLS → only use for trusted operations
- Apply RLS policies in migration files (SQL blocks after Drizzle DDL)

### Type Safety

- Generate TypeScript types from Drizzle schema
- Use Zod for runtime validation at API boundaries (form inputs, Supabase responses, external APIs)
- Never duplicate schema definitions - Drizzle is single source of truth
- Zod schemas provide runtime validation at application edges

### Security Rules

❌ **Never** connect Drizzle directly to database from client/browser  
❌ **Never** expose Supabase service role key to client code  
❌ **Never** duplicate schema definitions  
✅ **Always** use Supabase client for user-facing queries  
✅ **Always** enable RLS on user tables  
✅ **Always** validate data at API boundaries

## Code Style Configuration

- **Formatter**: Biome with tab indentation, 100 char line width
- **Linting**: ESLint + Biome with strict Vue 3 Composition API rules
- **TypeScript**: Strict mode with enhanced safety options
- **Git Hooks**: Optional Lefthook setup for pre-commit quality checks

## Post-Implementation Checks

After implementing or updating code, Kiro must run the following commands before considering the task complete:

- `pnpm check`      → verify project consistency
- `pnpm typecheck`  → ensure TypeScript types are valid
- `pnpm lint:fix`   → auto-fix lint issues and enforce style
