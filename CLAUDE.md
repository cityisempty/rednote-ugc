# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Xiaohongshu (Little Red Book) Note AI Generator - A React + TypeScript + Vite application that uses Google's Gemini AI to generate content for Xiaohongshu social media platform. The app generates note outlines, full content, and images based on product information.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Create a `.env.local` file in the root directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

The Vite config maps `GEMINI_API_KEY` to `process.env.API_KEY` for the application.

## Architecture

### Core Flow

1. **Outline Generation** (`AppView.OUTLINE_GENERATOR`)
   - User fills product info form (name, audience, description, features, style)
   - `geminiService.generateOutline()` calls Gemini API with structured JSON schema
   - Returns: title suggestions, hook, main points, image prompts

2. **Publish Plan Management** (`AppView.PUBLISH_PLAN`)
   - Generated outlines are added as tasks (`GeneratedNote`)
   - Tasks have scheduling metadata: `publishFrequency`, `durationDays`, `order`
   - Task statuses: `draft` → `running` → `completed` (or `paused`/`aborted`)
   - Tasks persist in localStorage under key `xhs_tasks_v2`

3. **Content Generation** (deferred)
   - Full note content generated on-demand via `geminiService.generateFullNote()`
   - Images generated via `geminiService.generateImage()` using Gemini image model

### Key Files

- `App.tsx` - Main application orchestrator, manages views and task state
- `services/geminiService.ts` - Gemini API integration (outline, note, image generation)
- `constants.tsx` - System prompts for AI, style options
- `types.ts` - TypeScript interfaces (`ProductInfo`, `NoteOutline`, `GeneratedNote`, `AppView`)
- `components/` - React components for each view

### Gemini API Integration

- Uses `@google/genai` SDK (v1.34.0)
- Models:
  - `gemini-3-flash-preview` - Text generation with structured JSON output
  - `gemini-2.5-flash-image` - Image generation (3:4 aspect ratio)
- All responses use `responseMimeType: "application/json"` with typed schemas
- API key injected via Vite's `define` config from `.env.local`

### State Management

- React `useState` for local component state
- `localStorage` for task persistence (key: `xhs_tasks_v2`)
- No external state management library (Redux, Zustand, etc.)

### Styling

- Tailwind CSS via inline classes
- Custom animations: `animate-in`, `slide-in-from-left-4`
- Design system: rounded corners (`rounded-[2.5rem]`), slate color palette

## Important Patterns

### Immutable Task Updates

Always use spread operator when updating tasks:

```typescript
setTasks(prev => prev.map(t =>
  t.id === id ? { ...t, status: 'completed' } : t
));
```

### Error Handling

Current implementation uses `console.error` + `alert()`. Consider upgrading to toast notifications.

### API Response Parsing

Gemini responses accessed via `.text` property, then JSON parsed:

```typescript
return JSON.parse(response.text || '{}');
```

## Known Limitations

- No test coverage yet
- Task execution logic is placeholder (see `handleExecuteTasks` in App.tsx)
- No authentication or multi-user support
- localStorage only (no backend persistence)
- Image generation not integrated into task execution flow
