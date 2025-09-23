# Tech Stack & Build System

## Framework & Core Technologies

- **Framework**: Nuxt 4 with Vue 3 and TypeScript
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite` plugin + DaisyUI components
- **Backend**: Supabase (authentication, database, real-time)
- **Package Manager**: pnpm 10.17+ (required)
- **Node Version**: 22.x (see `.tool-versions`)

## Key Dependencies

- **UI/UX**: `@nuxt/image`, `@nuxt/fonts`, `@vueuse/nuxt`, DaisyUI, Lucide Vue Next
- **Auth**: `@nuxtjs/supabase` with Google OAuth
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

### Setup

```bash
pnpm install     # Install dependencies
# Copy .env.example to .env and configure Supabase credentials
```

## Code Style Configuration

- **Formatter**: Biome with tab indentation, 100 char line width
- **Linting**: ESLint + Biome with strict Vue 3 Composition API rules
- **TypeScript**: Strict mode with enhanced safety options
- **Git Hooks**: Optional Lefthook setup for pre-commit quality checks
