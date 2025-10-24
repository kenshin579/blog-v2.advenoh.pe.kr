# IT Blog - Technical Blog Platform

## Overview

This is a modern IT blog platform built as a static site generator with dynamic features. The application is designed to display technical articles with rich markdown support, code syntax highlighting, and series organization. It features a clean, developer-focused design inspired by Medium and Dev.to, with emphasis on content readability and technical documentation clarity.

The application loads markdown files from the `/articles/` directory, parses frontmatter metadata, and presents them in a responsive, searchable interface with support for article series, tagging, and dark/light themes.

## Recent Changes

**Date: 2024-10-24**
- ✅ Completed migration from mock data to real markdown file system
- ✅ Created 8 sample technical articles with YAML frontmatter
- ✅ Implemented efficient article loading with Promise-based caching to prevent duplicate fetches
- ✅ Added comprehensive error handling with user-friendly messages and retry functionality
- ✅ Implemented lazy loading for search modal to optimize performance
- ✅ All end-to-end tests passed: navigation, search, series, theme toggle, TOC, code highlighting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, bundled via Vite

**Routing**: Wouter (lightweight client-side routing)
- Three main routes: Home (`/`), Series (`/series`), Article (`/article/:slug`)
- Not-found page for unmatched routes

**State Management**: 
- React hooks (useState, useEffect, useMemo) for local component state
- TanStack Query (React Query) for server state management (configured but not used for articles)
- Context API for theme management

**UI Framework**: 
- Shadcn/ui component library (Radix UI primitives with Tailwind CSS)
- Custom design system based on "new-york" style variant
- Comprehensive component library including cards, buttons, dialogs, forms, and more

**Styling**:
- Tailwind CSS with custom configuration
- CSS custom properties for theme variables (light/dark mode)
- Typography: Inter font for headings/body, JetBrains Mono for code
- Responsive design with mobile-first approach

**Content Processing**:
- Markdown parsing via `marked` library
- Syntax highlighting using Prism.js (supports TypeScript, JavaScript, JSX, TSX, CSS, Bash, JSON)
- Custom YAML frontmatter parser (browser-compatible)
- Table of contents generation from heading elements
- Reading time calculation (based on 200 words per minute)
- Image extraction from markdown content

**Search Functionality**:
- MiniSearch library for client-side full-text search
- Searches across title, excerpt, tags, and content
- Fuzzy matching enabled
- Results limited to 10 items
- Lazy loaded when search modal opens

**Key Features**:
- Article listing with pagination (10 items per page, expandable with "Load More")
- Series organization (articles grouped by series name)
- Search modal with keyboard shortcuts
- Dark/light theme toggle with localStorage persistence
- Responsive navigation header
- SEO metadata via react-helmet-async
- Article cards with first image or default IT blog image
- Smooth scrolling table of contents with active section highlighting

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**Build System**:
- Development: tsx for hot-reloading TypeScript execution
- Production: esbuild for server bundling, Vite for client bundling

**Server Responsibilities**:
- Static file serving (production)
- Vite dev middleware (development)
- API endpoint scaffolding (placeholder for future CRUD operations)
- Request logging middleware

**Storage Layer**:
- In-memory storage implementation (`MemStorage` class)
- User management interface defined (getUser, getUserByUsername, createUser)
- Designed for future database integration via Drizzle ORM

**Content Delivery**:
- Articles stored as markdown files in `client/public/articles/`
- Manifest file (`manifest.json`) lists all available articles
- Client-side loading via fetch API with Promise-based caching

### Data Architecture

**Article Schema**:
```typescript
{
  slug: string
  frontmatter: {
    title: string
    date: string (ISO format)
    excerpt?: string
    tags?: string[]
    series?: string
    seriesOrder?: number
  }
  content: string (raw markdown)
  html: string (parsed HTML)
  firstImage?: string (extracted from content or default)
}
```

**Article Loading System**:
- Promise-based caching in `loadArticles()` function prevents duplicate network requests
- Manifest file lists all article filenames
- Articles are fetched on-demand and cached in memory
- Cache can be cleared via `clearArticlesCache()` function
- Search modal uses lazy loading (only loads articles when opened)
- Error handling with retry functionality

**Database Schema** (PostgreSQL with Drizzle ORM - configured but not actively used):
- Users table with id (UUID), username (unique), password
- Schema validation via drizzle-zod

### External Dependencies

**Core Dependencies**:
- React 18 with React DOM
- TypeScript for type safety
- Express.js for server
- Vite for build tooling and dev server

**UI Libraries**:
- Radix UI primitives (20+ component primitives)
- Tailwind CSS for styling
- class-variance-authority for component variants
- lucide-react for icons

**Content Processing**:
- marked (markdown parser)
- prismjs (syntax highlighting)
- minisearch (client-side search)
- Custom YAML frontmatter parsing

**Database & ORM** (configured, minimal usage):
- Drizzle ORM
- @neondatabase/serverless
- PostgreSQL dialect
- Connection via DATABASE_URL environment variable

**Utilities**:
- date-fns for date formatting
- wouter for routing
- react-helmet-async for SEO
- nanoid for ID generation
- TanStack Query for data fetching patterns

**Development Tools**:
- Replit-specific plugins (vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner)
- PostCSS with Autoprefixer

**Design Philosophy**:
- Static-first architecture with markdown content
- Progressive enhancement approach
- Mobile-responsive with accessibility considerations
- Developer-focused aesthetics prioritizing code readability
- Clean separation between content (markdown files) and presentation (React components)
- Performance-optimized with efficient caching and lazy loading

## Sample Articles

The blog includes 8 sample technical articles covering:
1. TypeScript Advanced Types (TypeScript Series #1)
2. React Hooks Design Patterns
3. Node.js Performance Optimization
4. Modern CSS Layouts with Grid and Flexbox
5. TypeScript Generics Deep Dive (TypeScript Series #2)
6. Web Security Best Practices
7. Docker for Microservices
8. GraphQL API Design Principles

All articles feature:
- Rich YAML frontmatter metadata
- Code examples with syntax highlighting
- Proper heading structure for TOC generation
- Tags for categorization
- Series organization where applicable
