# Upmind OS - Installation Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

---

## 1. Clone & Install

```bash
git clone https://github.com/wandersoncruzmkt-lang/upmind-dashboard
cd upmind-dashboard
npm install
```

---

## 2. Configure Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for project to provision (~2 minutes).
3. Go to **SQL Editor** and run the full contents of `schema.sql`.
4. In **Project Settings → API**, copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Upmind OS
```

---

## 4. Create First User

In Supabase **Authentication → Users**, click **Invite user** or **Add user**.

Then in **SQL Editor**, insert the user profile and team:

```sql
-- Create team first
INSERT INTO public.teams (name, slug, owner_id)
VALUES ('Minha Agência', 'minha-agencia', 'YOUR_AUTH_USER_ID');

-- Get the team id and insert user profile
INSERT INTO public.users (id, email, full_name, role, team_id)
VALUES (
  'YOUR_AUTH_USER_ID',
  'your@email.com',
  'Seu Nome',
  'admin',
  (SELECT id FROM public.teams WHERE slug = 'minha-agencia')
);
```

Replace `YOUR_AUTH_USER_ID` with the UUID shown in Auth → Users.

---

## 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll be redirected to `/auth/login`. Sign in with the credentials created in step 4.

---

## 6. Production Build

```bash
npm run build
npm run start
```

Or deploy to Vercel:

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard under **Settings → Environment Variables**.

---

## File Structure

```
src/
├── app/
│   ├── auth/login/         # Login page
│   ├── dashboard/          # Dashboard (layout + page)
│   ├── demands/            # Demands list, new, [id] detail
│   ├── calendar/           # Calendar view
│   ├── approvals/          # Approval queue
│   ├── team/               # Team management
│   └── api/                # REST API routes
│       ├── auth/login/
│       └── demands/
│           └── [id]/
│               ├── comments/
│               └── files/
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── DemandCard.tsx
│   ├── KanbanBoard.tsx
│   ├── StatusBadge.tsx
│   ├── FileUploader.tsx
│   ├── CommentThread.tsx
│   └── providers/
│       └── QueryProvider.tsx
└── lib/
    ├── supabase.ts         # Supabase client + realtime helpers
    ├── types.ts            # TypeScript types matching DB schema
schema.sql                  # Full database schema + RLS
```

---

## Key Features

| Feature | Implementation |
|---|---|
| Auth | Supabase Auth + cookie sessions |
| Route protection | `src/middleware.ts` |
| Realtime updates | `subscribeToDemandsChannel()` in demands list |
| Kanban drag-drop | Native HTML5 drag events in `KanbanBoard.tsx` |
| File uploads | Supabase Storage (`demand-files` bucket) |
| Comments | Realtime via Supabase channels |
| RLS | Enforced at DB level — all queries scoped to team |

---

## Troubleshooting

**"Invalid login credentials"** → User not created in Auth, or wrong password.

**Blank dashboard / no data** → User profile row not inserted in `public.users`, or `team_id` is null.

**File uploads fail** → Check `demand-files` bucket exists in Supabase Storage and RLS policies were applied.

**Realtime not working** → Ensure Realtime is enabled in Supabase project settings for the relevant tables.
