# xalhexi.wtf

A tutorial and repository browser for [xalhexi-sch](https://github.com/xalhexi-sch). Built with Next.js and styled like GitHub Dark.

## What is this?

A web app that serves as a central hub for:

- **Tutorials** -- Step-by-step guides with syntax-highlighted code blocks, screenshots, and copy-to-clipboard. Topics include Git, SSH, Python, Ubuntu, and more.
- **Repository Browser** -- Browse all public repositories from [xalhexi-sch](https://github.com/xalhexi-sch) directly in the app. View files, folders, and code with VS Code-style syntax highlighting.

## Features

- GitHub as a database -- tutorials are stored in `tutorials.json` in this repo and synced via the GitHub API
- Admin panel -- create, edit, delete, and reorder tutorials (password-protected)
- Push/Pull to GitHub -- save tutorials to GitHub or sync the latest version, updating the site globally for all users
- Syntax highlighting -- VS Code Dark+ inspired colors for 20+ languages
- Image uploads -- upload screenshots directly to the repo via the GitHub API
- Copy code -- one-click copy on all code blocks
- Responsive -- works on desktop and mobile with tab switching
- Resizable sidebar -- drag to resize the tutorial/repo list

## How to use

### As a visitor
1. Open the site
2. Browse tutorials in the sidebar or switch to Repositories
3. Click any tutorial to read it, or click a repo to browse its files
4. Use the search bar to find tutorials by keyword

### As an admin
1. Click the lock icon in the header and enter the admin password
2. Create/edit/delete tutorials using the sidebar controls
3. Upload images from your PC when editing tutorial steps
4. Click **Save to GitHub** to push changes live for everyone
5. Click **Sync from GitHub** to pull the latest tutorials from the repo

## Tech Stack

- [Next.js](https://nextjs.org) -- App Router, API routes
- [Tailwind CSS](https://tailwindcss.com) -- Styling
- [highlight.js](https://highlightjs.org) -- Syntax highlighting
- [Lucide React](https://lucide.dev) -- Icons
- [GitHub API](https://docs.github.com/en/rest) -- Tutorials storage, repo browsing, image uploads
