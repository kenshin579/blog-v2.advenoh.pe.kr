# Design Guidelines: IT Blog Static Site

## Design Approach

**Selected Approach:** Design System with Technical Content Optimization

Drawing from Medium's reading experience, GitHub's documentation clarity, and Dev.to's developer-focused aesthetics. This blog prioritizes content readability, code presentation, and efficient information discovery while maintaining a polished, modern technical aesthetic.

---

## Core Design Elements

### A. Typography

**Font Stack:**
- **Headings:** Inter (600-700 weight) via Google Fonts - clean, modern sans-serif for headings and UI
- **Body Text:** Inter (400-500 weight) - exceptional readability for long-form content
- **Code:** JetBrains Mono or Fira Code - monospace with ligature support for code blocks

**Type Scale:**
- Article Title: text-4xl md:text-5xl, font-bold
- Section Headings (H2): text-2xl md:text-3xl, font-semibold
- Subsection Headings (H3): text-xl md:text-2xl, font-semibold
- Body Text: text-base md:text-lg, leading-relaxed
- Code Inline: text-sm
- Code Blocks: text-sm md:text-base, leading-relaxed
- Card Titles: text-xl, font-semibold
- Metadata/Tags: text-sm, font-medium

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24

**Container Strategy:**
- Global max-width: max-w-7xl for overall site content
- Article content: max-w-3xl for optimal reading (60-80 characters per line)
- Code blocks: max-w-full with horizontal scroll
- Card grids: max-w-6xl

**Grid Patterns:**
- Article cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6 md:gap-8
- Series grid: grid-cols-1 md:grid-cols-2 with gap-6

### C. Component Library

#### Header Navigation
- Sticky header with backdrop blur effect
- Logo/site title on left (text-xl font-bold)
- Navigation items: Search icon button, Series link, Light/Dark mode toggle
- Height: h-16, padding: px-4 md:px-8
- Items aligned with space-between, centered vertically

#### Article Cards (Main Page)
- Rounded corners: rounded-lg
- Padding: p-6
- Card structure top-to-bottom:
  - Article title (2 lines max with truncate)
  - Date and reading time (text-sm)
  - Excerpt/description (3-4 lines, line-clamp-3)
  - Tags row at bottom (flex-wrap gap-2)
- Hover state: subtle elevation increase
- Tag pills: rounded-full px-3 py-1 text-xs

#### Article Page Layout
Three-column responsive structure:
- Left sidebar (hidden on mobile): Empty space for balance
- Main content area: max-w-3xl, py-12 px-4 md:px-8
- Right sidebar (sticky): Table of contents, top-24, max-h-screen overflow-auto
  - TOC items: text-sm with nested indentation (pl-4 per level)
  - Active section indicator on scroll
  - Smooth scroll on click

#### Search Modal
- Full-screen overlay on mobile, centered modal on desktop
- Modal: max-w-2xl, rounded-lg
- Search input: Large, prominent with icon, h-12 md:h-14
- Results list: max-h-96 overflow-auto
- Result items: py-3 px-4 with title, excerpt preview, and metadata
- Keyboard navigation support (arrow keys, enter, escape)

#### Series Page
- Page title: text-3xl md:text-4xl, font-bold, mb-8
- Series cards: Each series as expandable section
  - Series title with article count badge
  - List of articles with dates underneath
  - Chronological or custom order within series
- Pagination controls: Centered, gap-2 between page numbers
- Items per page: 10 series max

#### Code Blocks
- Rounded corners: rounded-md
- Padding: p-4 md:p-6
- Syntax highlighting theme compatible with light/dark modes
- Copy button: Absolute positioned top-right, rounded-md p-2
- Language label: Top-left badge, text-xs
- Line numbers: Optional left gutter with pr-4

#### Load More Button
- Center-aligned, mt-12
- Prominent size: px-8 py-3 text-base md:text-lg
- Rounded: rounded-lg
- Clear loading state with spinner

#### Light/Dark Mode Toggle
- Icon button in header
- Sun icon for light mode, Moon icon for dark mode
- Smooth transition on toggle: transition-colors duration-200
- Persists preference to localStorage

### D. Page-Specific Layouts

**Main Page:**
- Hero section: py-16 md:py-24, centered content
  - Site title: text-4xl md:text-6xl, font-bold
  - Tagline: text-lg md:text-xl, mt-4
  - No background image - typography-focused
- Article grid section: py-12 md:py-16
- Pagination controls below grid

**Article Page:**
- Breadcrumb navigation: text-sm, py-4
- Article header: py-8 md:py-12
  - Title, date, reading time, tags
  - Author info if available
- Article body: prose prose-lg with consistent spacing
- Related articles section at bottom: py-12

**Series Page:**
- Page header: py-12 md:py-16 with title and description
- Series list with clear visual separation between series
- Each series: mb-12 with divider

---

## Interaction Patterns

**Navigation:**
- Smooth scroll for TOC links and anchor navigation
- Highlight active TOC section on scroll
- Breadcrumb navigation on article pages

**Search:**
- Instant search results as user types (debounced)
- Highlight matching keywords in results
- Click outside modal to close

**Loading States:**
- Skeleton loaders for initial page load
- Spinner for "Load More" button
- Fade-in animation for newly loaded content

**Responsive Behavior:**
- Mobile: Single column, hamburger menu if needed
- Tablet: Two-column article grid
- Desktop: Three-column layout for articles, side TOC visible

---

## Images

**No hero image required.** This blog emphasizes content over visual flourish. Focus on typography and whitespace.

**Article thumbnails:** Each article card can include an optional featured image (aspect ratio 16:9, rounded-lg, mb-4) if provided in frontmatter.

**Code screenshots:** Within articles, code screenshots or diagrams should be full-width within content area, rounded-md, with caption support.

---

## Accessibility

- Keyboard navigation throughout (Tab, Enter, Escape)
- ARIA labels for icon buttons (search, theme toggle)
- Focus visible states on all interactive elements
- Semantic HTML: article, nav, aside, main tags
- Alt text for all images
- Sufficient contrast ratios for text (WCAG AA minimum)