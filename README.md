<div align="center">

# xalhexi.wtf

**A tutorial hub built for IT students who struggle with unfamiliar code.**

[![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0f172a?logo=tailwindcss&logoColor=38bdf8)](https://tailwindcss.com)
[![GitHub API](https://img.shields.io/badge/GitHub_API-181717?logo=github&logoColor=white)](https://docs.github.com/en/rest)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com)

---

*Follow step-by-step guides with real code, screenshots, and one-click copy.*
*No more getting lost in docs -- just open, read, and code along.*

</div>

---

## What is this?

A web app where IT students can find **step-by-step tutorials** on Git, SSH, Python, Ubuntu, and more -- written in a way that's easy to follow even if you're just starting out. It also doubles as a **repository browser** so you can explore real project code directly in the browser.

Built by [**xalhexi**](https://github.com/xalhexi-sch) for fellow students who want a simple, clean guide instead of digging through scattered documentation.

---

## Features

| | Feature | Description |
|---|---|---|
| **01** | Tutorials with code blocks | Syntax-highlighted, copy-pasteable code for 20+ languages |
| **02** | Screenshot support | Upload images directly -- see what each step should look like |
| **03** | Repository browser | Browse any public repo's files and code without leaving the site |
| **04** | VS Code-style highlighting | Dark+, Light, and Cyber themes with familiar IDE colors |
| **05** | Search | Find any tutorial by keyword instantly |
| **06** | GitHub-synced | Tutorials stored in the repo -- update once, live for everyone |
| **07** | Drag-to-reorder | Admins can drag tutorials to set the order |
| **08** | Priority starring | Star important tutorials so they stand out |
| **09** | Responsive | Works on desktop and mobile |
| **10** | Rate-limit safe | Server-side caching prevents GitHub API rate limits |

---

## How to use

### As a student / visitor

1. Open the site
2. Browse tutorials in the **sidebar** or switch to the **Repositories** tab
3. Click any tutorial to read it -- code blocks have a **Copy** button
4. Use the **search bar** to find tutorials by keyword
5. Switch themes with the **moon/sun/zap** icon in the header

### As an admin

1. Click the **lock icon** in the header and enter the admin password
2. **Create** new tutorials with the + button, **edit** or **delete** existing ones
3. **Drag** tutorials up/down to reorder, or click the **star** to mark as priority
4. **Upload images** from your PC when editing steps (PNG, JPEG, WEBP)
5. Click **Save to GitHub** to push changes live for all visitors
6. Click **Sync from GitHub** to pull the latest version

---

## Tech stack

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org) | App Router, API routes, SSR |
| [Tailwind CSS](https://tailwindcss.com) | Styling and theming |
| [highlight.js](https://highlightjs.org) | Syntax highlighting |
| [Lucide React](https://lucide.dev) | Icons |
| [GitHub API](https://docs.github.com/en/rest) | Data storage, repo browsing, image uploads |

---

## Environment variables

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | GitHub personal access token (for push/pull/upload) |
| `GITHUB_REPO` | Repository name, e.g. `xalhexi-sch/xalhexi-sch.github.io` |
| `ADMIN_PASSWORD` | Password for admin access |

---

<div align="center">

**Made by [xalhexi](https://github.com/xalhexi-sch)**

*For IT students, by an IT student.*

</div>
