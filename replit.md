# RPG人材育成システム (Quest HR)

A gamified human resource development platform that represents employees as RPG characters with levels, XP, skills, and quests.

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Shadcn UI + wouter routing
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Theme**: Fantasy RPG purple/indigo color scheme with dark mode default

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
- `client/src/components/` - Reusable RPG UI components (character-card, xp-bar, skill-radar, quest-card, class-icon)
