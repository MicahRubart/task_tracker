# Workplan Tracker

A team task tracker across departments. Built with Next.js 16, Tailwind CSS, Prisma 7, and Neon Postgres.

---

## Features

- 5 department tabs: Implementation, Web Services, Training, Conversion, Strategic Solutions
- Add tasks with assignee, due date, and partners in seconds
- Click any row to expand notes, due-date history, and linked tasks
- Color coding: **yellow** = due this week, **red** = overdue
- Filter by employee or click "My Tasks" for your own view
- Admin mode: column sorting, task deletion, employee management
- Task linking: Relates To / Blocks / Subtask Of relationships

---

## Quick Deploy (first time)

### 1. Database — Neon

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (any name, any region)
3. Copy the **connection string** — looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

### 2. GitHub

Push this repo to a new GitHub repository.

### 3. Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Before deploying, open **Environment Variables** and add:
   - `DATABASE_URL` — the Neon connection string from step 1
   - `ADMIN_PASSWORD` — choose any password for admin access
3. Deploy

### 4. Run the database migration

After the first deploy, run the migration once to create tables:

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Pull env vars locally
vercel env pull .env.local

# Run migration
npx prisma migrate dev --name init
```

### 5. Add employees

1. Open the deployed app
2. Click the **Admin** button (top right) and enter your `ADMIN_PASSWORD`
3. Click the **gear icon** that appears to open Employee Management
4. Add each team member with their department

---

## Local Development

```bash
# 1. Fill in DATABASE_URL and ADMIN_PASSWORD in .env.local

# 2. Run migration
npx prisma migrate dev --name init

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Use

| Action | How |
|---|---|
| Sign in | Select your name from the dropdown (top left) |
| Add a task | Click **+ Add Task** at the bottom of any department tab |
| Edit a task | Double-click the title, due date, or status badge |
| View notes & history | Click any row to expand it |
| Add a note | Expand a row → type in the notes box |
| Link tasks | Expand a row → click **+ Link task** |
| Admin controls | Click **Admin** button → enter password |
| Manage employees | Admin mode → gear icon |

---

## Color Key

| Color | Meaning |
|---|---|
| Yellow row | Due this week |
| Red row + "Overdue" badge | Past due date, not complete |
| Normal | No urgency |
