# RPG人材育成システム (Quest HR)

A gamified human resource development platform that represents employees as RPG characters with levels, XP, skills, and quests.

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Shadcn UI + wouter routing
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Theme**: Pixel art / retro game UI with DotGothic16 font, square corners, thick borders, offset pixel shadows, warm pastel colors (light mode default)

## Visual Style

- **Fonts**: DotGothic16 (body), Press Start 2P / Silkscreen (monospace/values)
- **Colors**: Warm cream/beige background, pink primary, amber accents, dark purple sidebar
- **Borders**: All elements have 0px border-radius (global CSS rule), 2-3px thick borders
- **Shadows**: Offset pixel-style shadows (e.g., 3px 3px 0px 0px) with no blur
- **Dark Mode**: Dark purple palette with visible offset shadows, toggled via header button
- **Default Mode**: Light (changed from dark)

## Data Model

- **Employees**: RPG characters with class (warrior/mage/healer/ranger/rogue/paladin), level, XP
- **Skills**: Per-employee skills grouped by category (technical/communication/leadership/creativity/analytics) with levels 1-10
- **Quests**: Tasks/goals with difficulty levels (easy/normal/hard/legendary) and XP rewards
- **QuestCompletions**: Records of completed quests linking employees and quests

## Pages

- `/` - Dashboard with stats overview, top employees, recent activity
- `/employees` - Employee list with search/filter, add employee form
- `/employees/:id` - Character detail with skill radar chart, quest board, history
- `/quests` - Quest management with tabs for active/inactive quests

## Key Files

- `shared/schema.ts` - Data models, insert schemas, types, XP/level calculation
- `server/db.ts` - PostgreSQL connection
- `server/storage.ts` - Database storage interface
- `server/routes.ts` - REST API endpoints
- `server/seed.ts` - Seed data with 5 employees, skills, 8 quests, sample completions
- `client/src/index.css` - Pixel art theme CSS with custom properties and pixel shadow/border utilities
- `client/src/components/` - Reusable RPG UI components (character-card, xp-bar, skill-radar, quest-card, class-icon)
