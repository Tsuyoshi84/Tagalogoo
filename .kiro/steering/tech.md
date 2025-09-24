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

### Database

```bash
pnpm db:generate  # Generate migrations from Drizzle schema
pnpm db:migrate   # Run migrations via Supabase CLI
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

- **Schema Definition**: Use Drizzle ORM for schema definition and type generation
- **Migrations**: Apply migrations via Drizzle, including RLS policies via raw SQL
- **Version Control**: Keep all migrations under version control
- **Single Source of Truth**: Drizzle schema is the authoritative source for database structure

### Data Access Patterns

#### Browser/Client-Side

- **Always use Supabase JS client** - never Drizzle, never direct database connections
- All queries automatically subject to Row Level Security (RLS)
- Type-safe queries using generated TypeScript types from Drizzle schema

#### Nuxt Server Routes / API Handlers

- **Primary**: Use Supabase JS client for queries (enforces RLS)
- **Alternative**: Use Drizzle with Supabase adapter for type-safe queries (still enforces RLS)
- Server-side queries still subject to RLS when using proper authentication

#### Admin / Batch Jobs / Complex SQL

- Use Drizzle with postgres-js or node-postgres + Supabase service role
- **Critical**: Must enforce your own authorization - service role bypasses RLS
- Only safe for trusted server-only tasks

### Row Level Security (RLS)

- **Always enabled** on user-facing tables
- Supabase client queries (browser or server) automatically subject to RLS
- Service role queries bypass RLS → only use for trusted operations
- Apply RLS policies in migrations via raw SQL

### Type Safety

- Generate TypeScript types from Drizzle schema
- Use Zod at API edges for runtime validation (form inputs, Supabase responses)
- Never duplicate schema definitions - Drizzle is single source of truth

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
