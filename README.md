# Tagalogoo

A modern Tagalog learning application built with Nuxt 4 and Supabase.

## Features

- Interactive Tagalog lessons and exercises
- Progress tracking and user authentication
- Modern, responsive design with Tailwind CSS
- Real-time data synchronization with Supabase
- TypeScript support for better development experience

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Testing**: Vitest
- **Code Quality**: ESLint, Biome, Lefthook
- **Package Manager**: pnpm

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Add your Supabase project credentials to the `.env` file.

## Development

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm check` - Run Biome checks
- `pnpm test` - Run tests with Vitest
- `pnpm typecheck` - Run TypeScript type checking

## Project Structure

```
├── app/                 # Nuxt app directory
└── supabase/          # Supabase configuration (if applicable)
```
