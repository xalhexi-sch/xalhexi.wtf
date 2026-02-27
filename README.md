<div align="center">

# xalhexi.wtf

**A tutorial hub built for IT students who struggle with unfamiliar code.**

[![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0f172a?logo=tailwindcss&logoColor=38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![GitHub API](https://img.shields.io/badge/GitHub_API-181717?logo=github&logoColor=white)](https://docs.github.com/en/rest)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com)

---

*Follow step-by-step guides with real code, screenshots, and one-click copy.*
*No more getting lost in docs -- just open, read, and code along.*

</div>

---

## What is this?

A web app where IT students can find **step-by-step tutorials** on Git, SSH, Python, Ubuntu, and more -- written in a way that's easy to follow even if you're just starting out. It also doubles as a **repository browser** with a built-in **diff viewer** and an **AI assistant** powered by Gemini.

Built by [**xalhexi**](https://github.com/xalhexi-sch) for fellow students who want a simple, clean guide instead of digging through scattered documentation.

---

## Features

| | Feature | Description |
|---|---|---|
| **01** | Tutorials with code blocks | Syntax-highlighted code with line numbers and one-click copy |
| **02** | Screenshot support | Upload images before or after code blocks in any step |
| **03** | Repository browser | Browse any public repo's files with line-numbered code viewer |
| **04** | Diff viewer | See recent file changes with green/red unified diff (last 2 commits) |
| **05** | AI assistant | Gemini-powered chat for debugging, code help, and general questions |
| **06** | Public chat history | All AI conversations stored in Supabase -- shared and persistent |
| **07** | VIP crown system | Mark tutorials as VIP-only -- guests see locked state, VIPs get read access |
| **08** | Role-based auth | JWT-secured Admin (full control) and VIP (read-only) roles |
| **09** | Hash routing | Direct links to tutorials and repo files (`#/tutorials/id`, `#/repos/name/path`) |
| **10** | Instant loading | Tutorials cached locally -- switch between them with zero delay |
| **11** | VS Code themes | Dark+, Light, and Cyber themes with familiar IDE colors |
| **12** | Search | Find any tutorial by keyword instantly |
| **13** | GitHub-synced | Tutorials stored in the repo -- update once, live for everyone |
| **14** | Drag-to-reorder | Admins can drag tutorials to set the order |
| **15** | Priority starring | Star important tutorials so they stand out |
| **16** | Rate-limit safe | Server-side caching prevents GitHub API rate limits |

---

## Roles and Permissions

| Action | Admin | VIP | Guest |
|---|:---:|:---:|:---:|
| View regular tutorials | Yes | Yes | Yes |
| View VIP-crowned tutorials | Yes | Yes | No (locked) |
| Create / edit / delete tutorials | Yes | No | No |
| Lock / unlock tutorials | Yes | No | No |
| Star / crown tutorials | Yes | No | No |
| Access terminal settings | Yes | No | No |
| Save / sync to GitHub | Yes | No | No |
| Use AI assistant | Yes | Yes | Yes |
| Browse repositories | Yes | Yes | Yes |
| View file diffs | Yes | Yes | Yes |

---

## How to use

### As a student / visitor

1. Open the site
2. Browse tutorials in the **sidebar** or switch to the **Repositories** tab
3. Click any tutorial -- code blocks have a **Copy** button in the step header
4. Use the **search bar** to find tutorials by keyword
5. Switch themes with the **moon/sun/zap** icon in the header
6. Open the **AI assistant** to ask questions, debug errors, or get code help
7. Share direct links using hash routes (e.g. `#/tutorials/git-basics`)

### As an admin

1. Click the **gear icon** and sign in with admin credentials
2. **Create** new tutorials with the + button, **edit** or **delete** existing ones
3. **Drag** tutorials up/down to reorder, or click the **star** to mark as priority
4. **Crown** tutorials to restrict them to VIP users only
5. **Upload images** from your PC when editing steps (PNG, JPEG, WEBP)
6. Click **Save to GitHub** to push changes live for all visitors
7. Click **Sync from GitHub** to pull the latest version
8. Click **View Changes** on any repo file to see a diff of recent commits

---

## Tech stack

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org) | App Router, API routes, SSR |
| [Tailwind CSS](https://tailwindcss.com) | Styling and theming |
| [Supabase](https://supabase.com) | Chat history storage (public, no auth required) |
| [Google Gemini](https://ai.google.dev) | AI assistant (via Vercel AI SDK) |
| [highlight.js](https://highlightjs.org) | Syntax highlighting |
| [Lucide React](https://lucide.dev) | Icons |
| [GitHub API](https://docs.github.com/en/rest) | Tutorial storage, repo browsing, image uploads, diff viewer |

---

## Environment variables

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | GitHub personal access token (for push/pull/upload) |
| `GITHUB_REPO` | Repository name, e.g. `xalhexi-sch/xalhexi-sch.github.io` |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `VIP_USERNAME` | VIP login username |
| `VIP_PASSWORD` | VIP login password |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `SUPABASE_URL` | Supabase project URL (auto-set by integration) |
| `SUPABASE_ANON_KEY` | Supabase anon key (auto-set by integration) |

---

<div align="center">

**Made by [xalhexi](https://github.com/xalhexi-sch)**

*For IT students, by an IT student.*

</div>
