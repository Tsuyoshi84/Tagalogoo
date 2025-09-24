# Project Structure & Organization

## Directory Layout

```
app/                    # Nuxt application source
├── assets/css/         # Tailwind CSS entry point
├── components/         # Vue components 
├── composables/        # Nuxt composables 
├── layouts/            # Nuxt layouts
├── domain/             # Business logic (framework-agnostic)
├── middleware/         # Route middleware
├── pages/              # File-based routing
├── plugins/            # Auto-registered Nuxt plugins
├── types/              # Types used in Vue app
└── utils/              # Utility functions (auto-imported)

server/                 # Nitro server routes & middleware
├── api/                # API endpoints
├── database/           # Drizzle schemas and migrations
|   ├── migrations/     # Drizzle migration files
|   └── schema.ts/      # Drizzle schema definitions
└── middleware/         # Server middleware

shared/                 # Shared by both Vue app and server
├── types/              # Shared types
└── utils/              # Shared utility functions

public/                 # Static assets served as-is
.nuxt/                  # Generated Nuxt files (auto-generated)
node_modules/           # Dependencies
```

## Architecture Patterns

### Domain-Driven Organization

- **`app/domain/`**: Pure business logic, framework-agnostic
  - No Vue reactivity or Nuxt imports
  - Clear, descriptive naming with JSDoc
  - Unit tested functions
  - Example: `app/domain/auth/google.ts`

### Composables Pattern

- **`app/composables/`**: Vue-specific reactive logic
  - Prefix with `use` (e.g., `useGoogleAuth`)
  - Return reactive state and methods
  - Handle side effects and API calls
  - Example: `app/composables/useGoogleAuth.ts`

### Component Structure

- **`app/components/`**: Reusable Vue components
  - Use TypeScript with `<script setup>`
  - Type-based props/emits with JSDoc
  - Explicit imports (no auto-import reliance)
  - Extract complex logic to composables

## File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Domain**: camelCase (e.g., `googleAuth.ts`)
- **Pages**: kebab-case or camelCase (e.g., `login.vue`, `userProfile.vue`)

## Import Patterns

- Explicit imports preferred over Nuxt auto-imports
- Use `.ts` extension for TypeScript files in this codebase
- Domain modules should not import from `app/composables`
- Composables can import from `app/domain`

## Configuration Files

- **`nuxt.config.ts`**: Central Nuxt configuration
- **`biome.json`**: Code formatting and linting
- **`eslint.config.mjs`**: ESLint rules (Vue-specific)
- **`tsconfig.json`**: TypeScript configuration references
- **`.env`**: Environment variables (copy from `.env.example`)

## Code Organization Principles

- Separation of concerns: domain logic vs. framework code
- Single responsibility per file/function
- Explicit over implicit (imports, types, dependencies)
- Business logic in domain layer, reactive state in composables
- Components focus on presentation and user interaction
