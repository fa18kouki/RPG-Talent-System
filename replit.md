# RPG人材育成システム (Quest HR)

A gamified human resource development platform that represents employees as RPG characters with levels, XP, skills, and quests.

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Shadcn UI + wouter routing
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based authentication with express-session + connect-pg-simple, bcrypt password hashing
- **Theme**: Pixel art / retro game UI with DotGothic16 font, square corners, thick borders, offset pixel shadows, warm pastel colors (light mode default)

## Authentication & Roles

- **Session**: express-session with PostgreSQL session store (connect-pg-simple)
- **Roles**: `admin` and `user`
- **Admin**: Can access all features including user management, create/modify employees, quests, completions
- **User**: Can view employees, quests, dashboard (read-only access to main features)
- **Login**: Email + password authentication
- **Default accounts** (seeded, all @example.com):
  - Admin: admin@example.com / admin123
  - Admin: kobayashi@example.com / user123 (小林 さくら)
  - User: tanaka@example.com / user123 (田中 太郎)
  - User: sato@example.com / user123 (佐藤 花子)
  - User: suzuki@example.com / user123 (鈴木 一郎)
  - User: yamada@example.com / user123 (山田 美咲)
  - User: ito@example.com / user123 (伊藤 健太)
  - User: watanabe@example.com / user123 (渡辺 結衣)
  - User: nakamura@example.com / user123 (中村 大輔)

## Visual Style

- **Fonts**: DotGothic16 (body), Press Start 2P / Silkscreen (monospace/values)
- **Colors**: Warm cream/beige background, pink primary, amber accents, dark purple sidebar
- **Borders**: All elements have 0px border-radius (global CSS rule), 2-3px thick borders
- **Shadows**: Offset pixel-style shadows (e.g., 3px 3px 0px 0px) with no blur
- **Dark Mode**: Dark purple palette with visible offset shadows, toggled via header button
- **Default Mode**: Light

## Data Model

- **Users**: Authentication users with email, hashed password, displayName, role (admin/user)
- **Employees**: RPG characters with class (warrior/mage/healer/ranger/rogue/paladin), level, XP
- **Skills**: Per-employee skills grouped by category (technical/communication/leadership/creativity/analytics) with levels 1-10
- **Quests**: Tasks/goals with difficulty levels (easy/normal/hard/legendary) and XP rewards
- **QuestCompletions**: Records of completed quests linking employees and quests

## Pages

- `/login` - Login page (shown when not authenticated)
- `/` - Dashboard with stats overview, top employees, recent activity
- `/employees` - Employee list with search/filter, add employee form (admin only for adding)
- `/employees/:id` - Character detail with skill radar chart, quest board, history
- `/quests` - Quest management with tabs for active/inactive quests
- `/admin/users` - User management (admin only) - create, edit roles, delete users

## AI Chat

- **LLM Provider**: Google Gemini (gemini-2.5-flash) via Replit AI Integrations
- **Env vars**: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL` (auto-managed)
- **Features**: Natural language conversation with employee context, work consultation, daily review, reporting help, motivation support
- **System prompt**: Includes employee RPG stats, active quests, skills as context for personalized responses
- **Chat history**: Last 20 messages sent as conversation context to Gemini
- **XP rewards**: First 3 daily messages award 10 XP each

## Key Files

- `shared/schema.ts` - Data models (including users), insert schemas, types, XP/level calculation
- `server/db.ts` - PostgreSQL connection
- `server/storage.ts` - Database storage interface (including user CRUD)
- `server/routes.ts` - REST API endpoints with auth middleware (requireAuth, requireAdmin), Gemini-powered chat
- `server/index.ts` - Express server with session middleware setup
- `server/seed.ts` - Seed data with 9 users (all @example.com), 8 employees, skills, 11 quests, quest assignments (various statuses), completions, daily chat logs
- `server/replit_integrations/` - Gemini AI integration modules (chat, image, batch)
- `client/src/hooks/use-auth.ts` - Authentication hook (login, logout, user state)
- `client/src/pages/login.tsx` - Login page
- `client/src/pages/admin-users.tsx` - Admin user management page
- `client/src/index.css` - Pixel art theme CSS with custom properties and pixel shadow/border utilities
- `client/src/components/ai-chat.tsx` - AI chat floating window component
- `client/src/components/` - Reusable RPG UI components (character-card, xp-bar, skill-radar, quest-card, class-icon, app-sidebar)
