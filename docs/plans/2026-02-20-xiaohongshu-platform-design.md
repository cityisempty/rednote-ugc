# Xiaohongshu Content Generation Platform - Design Document

**Date**: 2026-02-20
**Status**: Approved
**Author**: Claude Code

## Executive Summary

Transform the existing Xiaohongshu Note AI Generator into a comprehensive content generation platform with user authentication, credit system, template marketplace, and advanced note imitation capabilities.

## Goals

1. Add user authentication and authorization system
2. Implement credit-based usage model with recharge card system
3. Build template marketplace with system-generated templates
4. Create note imitation feature to analyze and replicate successful posts
5. Maintain modern minimalist design with gradients
6. Support scalability to thousands of users

## Non-Goals

- Direct payment integration (using external recharge card system)
- Complex revenue sharing for templates (all templates free)
- Microservices architecture (single monolith sufficient)
- Mobile native apps (web-first approach)

## Architecture Overview

### Technology Stack

**Frontend**
- React 19 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand (state management)
- React Router v6 (routing)
- Axios (HTTP client)

**Backend**
- Node.js + Express.js + TypeScript
- Prisma ORM (database access)
- JWT (authentication)
- bcrypt (password hashing)
- express-validator (input validation)

**Database**
- PostgreSQL (primary database)

**AI Services**
- Google Gemini API (text generation)
- Gemini Image API (image generation)

**File Storage**
- Local filesystem (development)
- Cloudflare R2 / S3 (production, configurable)

### Project Structure

```
rednote-ugc/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── assets/        # Static assets
│   ├── public/
│   └── vite.config.ts
├── server/                # Backend Express app
│   ├── src/
│   │   ├── routes/        # API route definitions
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── tsconfig.json
├── shared/                # Shared code between client/server
│   └── types/            # Shared TypeScript types
└── docs/                 # Documentation
```

## Data Models

### User
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String   @unique
  password      String   // bcrypt hashed
  role          Role     @default(USER)
  credits       Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  notes         Note[]
  templates     Template[]
  transactions  Transaction[]
  rechargeCards RechargeCardUsage[]
}

enum Role {
  USER
  ADMIN
}
```

### Note (Generated Content)
```prisma
model Note {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  productName   String
  style         String
  title         String
  content       String   @db.Text
  tags          String[] // Array of tags
  images        String[] // Array of image URLs

  outline       Json?    // Store original outline
  templateId    String?
  template      Template? @relation(fields: [templateId], references: [id])

  status        NoteStatus @default(DRAFT)
  creditsUsed   Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum NoteStatus {
  DRAFT
  COMPLETED
  ARCHIVED
}
```

### Template
```prisma
model Template {
  id            String   @id @default(uuid())
  name          String
  description   String?
  category      String   // e.g., "音乐节", "美食", "旅行"

  // Template structure
  titlePattern  String   // e.g., "🎵 {topic} | {emotion}"
  contentStructure Json  // Structured template data
  styleGuide    Json     // Tone, emoji usage, paragraph structure
  hashtagStrategy String[] // Recommended hashtags

  // Metadata
  isOfficial    Boolean  @default(false)
  isPublic      Boolean  @default(true)
  usageCount    Int      @default(0)

  createdById   String?
  createdBy     User?    @relation(fields: [createdById], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  notes         Note[]
}
```

### RechargeCard
```prisma
model RechargeCard {
  id            String   @id @default(uuid())
  code          String   @unique // e.g., "REDINK-XXXX-XXXX-XXXX"
  credits       Int      // Number of credits this card provides
  isUsed        Boolean  @default(false)

  createdAt     DateTime @default(now())
  expiresAt     DateTime?

  // Relations
  usage         RechargeCardUsage?
}

model RechargeCardUsage {
  id            String   @id @default(uuid())
  cardId        String   @unique
  card          RechargeCard @relation(fields: [cardId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  usedAt        DateTime @default(now())
}
```

### Transaction
```prisma
model Transaction {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  type          TransactionType
  amount        Int      // Credits (positive for credit, negative for debit)
  balance       Int      // Balance after transaction
  description   String

  relatedNoteId String?
  metadata      Json?    // Additional data (e.g., card code, note details)

  createdAt     DateTime @default(now())
}

enum TransactionType {
  RECHARGE      // Credit from recharge card
  GENERATE_OUTLINE
  GENERATE_NOTE
  GENERATE_IMAGE
  ADMIN_ADJUSTMENT
}
```

## API Design

### Authentication Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
```

### User Endpoints

```
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/credits
GET    /api/users/transactions
```

### Recharge Endpoints

```
POST   /api/recharge/redeem
```

### Content Generation Endpoints

```
POST   /api/generate/outline
POST   /api/generate/note
POST   /api/generate/image
POST   /api/generate/batch
```

### Note Management Endpoints

```
GET    /api/notes
GET    /api/notes/:id
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id
```

### Template Endpoints

```
GET    /api/templates
GET    /api/templates/:id
POST   /api/templates
PUT    /api/templates/:id
DELETE /api/templates/:id
POST   /api/templates/analyze-note  // Note imitation feature
```

### Admin Endpoints

```
GET    /api/admin/users
PUT    /api/admin/users/:id
POST   /api/admin/recharge-cards/generate
GET    /api/admin/recharge-cards
GET    /api/admin/stats
```

## Core Features

### 1. User Authentication

- Email + password registration
- JWT-based authentication
- Refresh token mechanism
- Password reset via email (future)
- Role-based access control (USER, ADMIN)

### 2. Credit System

**Credit Pricing:**
- Outline generation: 5 credits
- Full note generation: 10 credits
- Image generation: 15 credits per image

**Recharge Card System:**
- Admin generates recharge cards with unique codes
- Format: `REDINK-XXXX-XXXX-XXXX`
- Users redeem cards to add credits
- One-time use, tracked in database
- Optional expiration date

### 3. Content Generation

**Outline Generation:**
- Input: product info (name, audience, description, features, style)
- Output: title suggestions, hook, main points, image prompts
- Cost: 5 credits

**Full Note Generation:**
- Input: outline + product info
- Output: complete note with title, content, tags
- Cost: 10 credits

**Image Generation:**
- Input: image prompt from outline
- Output: base64 image (3:4 aspect ratio)
- Cost: 15 credits per image

### 4. Template System

**System-Generated Templates:**
- Official templates for common categories
- Auto-generated from successful patterns
- Free to use for all users

**Note Imitation Feature:**
- User inputs Xiaohongshu note URL
- System scrapes and analyzes:
  - Title pattern and structure
  - Content organization and flow
  - Emoji usage patterns
  - Paragraph length and rhythm
  - Hashtag strategy
  - Tone and writing style
- Generates reusable template with placeholders
- Saves to user's template library
- Can be applied to new content generation

**Template Structure:**
```typescript
interface TemplateStructure {
  titlePattern: string;           // e.g., "{emoji} {hook} | {benefit}"
  sections: {
    type: 'intro' | 'body' | 'conclusion';
    placeholder: string;
    guidelines: string;
  }[];
  emojiStrategy: {
    frequency: 'high' | 'medium' | 'low';
    placement: 'start' | 'end' | 'both' | 'inline';
  };
  paragraphStyle: {
    avgLength: number;
    rhythm: 'short-punchy' | 'medium-balanced' | 'long-detailed';
  };
  hashtagStrategy: {
    count: number;
    categories: string[];
    examples: string[];
  };
}
```

### 5. History & Management

- View all generated notes
- Filter by date, style, status
- Edit and regenerate
- Export to various formats
- Archive old notes

### 6. Admin Dashboard

- User management (view, edit, ban)
- Generate recharge cards (bulk generation)
- View platform statistics
- Monitor credit usage
- Template moderation

## UI/UX Design

### Design System

**Colors:**
- Primary: Gradient from `#6366f1` to `#8b5cf6` (indigo to purple)
- Secondary: `#10b981` (emerald)
- Background: `#f8fafc` (slate-50)
- Cards: White with subtle shadows
- Text: `#1e293b` (slate-800) for headings, `#64748b` (slate-500) for body

**Typography:**
- Font: System font stack (SF Pro, Segoe UI, etc.)
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Code/Numbers: Monospace

**Components:**
- Rounded corners: 16-24px for cards
- Shadows: Subtle, layered
- Animations: Smooth transitions (200-300ms)
- Buttons: Gradient backgrounds with hover effects
- Inputs: Clean borders, focus states with gradient rings

### Key Pages

1. **Landing/Login Page**: Clean hero with gradient, feature highlights
2. **Dashboard**: Overview of credits, recent notes, quick actions
3. **Content Generator**: Step-by-step wizard (product info → outline → full note)
4. **Template Marketplace**: Grid layout with categories, search, preview
5. **History**: Table/card view with filters and actions
6. **Profile**: User info, credit balance, transaction history
7. **Admin Panel**: Stats dashboard, user management, card generation

## Security Considerations

1. **Authentication**: JWT with short expiry (15min access, 7d refresh)
2. **Password**: bcrypt with salt rounds = 10
3. **Input Validation**: express-validator on all endpoints
4. **Rate Limiting**: Prevent abuse (e.g., 100 requests/15min per user)
5. **SQL Injection**: Prisma ORM prevents this by default
6. **XSS**: React escapes by default, sanitize user-generated content
7. **CORS**: Whitelist frontend origin only
8. **Environment Variables**: Never commit secrets, use .env files

## Performance Considerations

1. **Database Indexing**: Index on frequently queried fields (email, username, userId)
2. **Pagination**: Limit results (e.g., 20 notes per page)
3. **Caching**: Cache templates and user sessions (future: Redis)
4. **Image Optimization**: Compress generated images before storage
5. **API Response**: Keep payloads small, use pagination
6. **Connection Pooling**: Prisma handles this automatically

## Deployment Strategy

**Development:**
- Frontend: `npm run dev` (Vite dev server on port 3000)
- Backend: `npm run dev` (nodemon on port 5000)
- Database: Local PostgreSQL

**Production:**
- Frontend: Build with Vite, serve via Nginx or Vercel
- Backend: PM2 or Docker container
- Database: Managed PostgreSQL (e.g., Railway, Supabase, AWS RDS)
- Environment: Separate .env files for dev/prod

## Future Enhancements

1. Real-time collaboration on notes
2. AI-powered content suggestions
3. Analytics dashboard for content performance
4. Social sharing integrations
5. Mobile app (React Native)
6. Multi-language support
7. Advanced template customization
8. Batch operations for power users

## Success Metrics

1. User registration and retention rate
2. Average credits consumed per user
3. Template usage and creation rate
4. Note generation success rate
5. System uptime and response time
6. User satisfaction (feedback/surveys)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API rate limits | High | Implement queue system, cache responses |
| Database performance at scale | Medium | Optimize queries, add indexes, consider read replicas |
| Recharge card fraud | High | One-time use validation, expiration dates, admin monitoring |
| User data privacy | High | Encrypt sensitive data, GDPR compliance, clear privacy policy |
| AI-generated content quality | Medium | Fine-tune prompts, allow user feedback, iterative improvements |

## Conclusion

This design provides a solid foundation for a scalable, user-friendly Xiaohongshu content generation platform. The monolithic architecture allows for rapid development while maintaining flexibility for future enhancements. The credit-based model with recharge cards provides clear monetization without complex payment integrations.
