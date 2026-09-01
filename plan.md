# Weekly Relationship Review App — Plan

## Product concept

A private, shared relationship journal for two or more people. Each deployment belongs to one couple and has its own database, uploads, and application instance.

The app provides a simple way to record weekly relationship talks, attach photos, react with emojis, and browse a reverse-chronological timeline.

Everything lives on a single page (except login/register). Post creation, editing, image viewing, and reactions all happen inline via modals and overlays.

## Core features

- Username/password authentication
- OIDC authentication
- Session management through Better Auth
- Shared private timeline (single page, reverse-chronological)
- Create posts with:
  - Text content
  - Optional title
  - One or more images
  - Automatic creation date and author
- Newest posts displayed first
- Cursor-based pagination for older posts
- Mobile-friendly layout
- Full-screen image viewing (modal overlay)
- Edit and delete a user's own posts (inline on timeline card)
- Emoji-only reactions
- Users can add or remove reactions on any post
- Fixed, curated emoji list rather than arbitrary text reactions

## Single-tenant model

Each deployment is one couple's instance. There is no application-level multi-tenancy.

Not required:

- Couple or tenant tables
- Workspaces
- Invitations
- Tenant switching
- Multiple couples per installation
- Tenant administration
- User count restrictions
- First-run setup wizard

All registered users share access to all posts. Registration is open to anyone who reaches the instance.

## Technology stack

- SvelteKit
- Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`
- TypeScript
- `@sveltejs/adapter-node`
- SvelteKit server routes, API endpoints, and form actions
- Tailwind CSS
- shadcn-svelte
- Better Auth
- SQLite
- Zod for validation
- Local filesystem image storage
- Docker

## Runtime architecture

A single Docker container contains:

- SvelteKit frontend
- SvelteKit adapter-node server
- SvelteKit API functionality
- Better Auth
- Drizzle ORM
- SQLite database
- Image handling and storage

Persistent data should be mounted outside the container:

~~~text
/data/app.db
/data/uploads/
~~~

A reverse proxy such as Caddy, Traefik, or Nginx can provide HTTPS. The proxy may run on the host or separately, while the application itself remains a single container.

## Authentication

Better Auth should handle:

- Username/password login
- OIDC login
- Secure sessions and cookies
- Logout
- Password reset
- Optional account linking and email verification

No first-run setup or user restrictions. Registration is open.

## Database model

Better Auth tables:

~~~text
user
session
account
verification
~~~

Application tables:

~~~text
post
post_image
post_reaction
~~~

### `post`

~~~text
id
author_id
title
content
created_at
updated_at
deleted_at
~~~

### `post_image`

~~~text
id
post_id
storage_path
thumbnail_path
mime_type
width
height
sort_order
created_at
~~~

### `post_reaction`

~~~text
id
post_id
user_id
emoji
created_at
~~~

Use a unique constraint on `(post_id, user_id, emoji)` to prevent duplicate reactions.

## Image handling

- Support multiple images per post
- Validate MIME type and file size
- Limit the number of images per post
- Compress or resize large images
- Generate thumbnails for the timeline
- Strip unnecessary metadata where appropriate
- Store files under `/data/uploads/`
- Serve images through authenticated SvelteKit endpoints

## Mobile and PWA requirements

- Mobile-first responsive design
- Large touch targets
- Native camera and file picker support
- Swipe-friendly image gallery
- Responsive timeline cards
- Good keyboard and form behavior
- Optional installable PWA
- Offline draft support can be added later

Private timeline content should not be cached insecurely on shared devices.

## Security requirements

- Authenticate every protected request
- Verify the user session server-side
- Never trust client-provided author IDs
- Allow users to edit and delete only their own posts
- Restrict image access to authenticated users
- Use HTTP-only, secure cookies
- Store secrets in environment variables
- Validate request bodies with Zod
- Rate-limit login and upload endpoints
- Back up the SQLite database and uploads together

## Routes

~~~text
src/routes/
  +page.svelte                      — Main timeline (post list, create modal, edit inline, reactions, image viewer)
  +layout.svelte                    — Auth-aware layout
  login/+page.svelte                — Login page
  register/+page.svelte             — Registration page
  api/auth/[...path]/+server.ts     — Better Auth handler
  api/posts/+server.ts              — List posts (GET), create post (POST)
  api/posts/[id]/+server.ts         — Get/update/delete post
  api/posts/[id]/reactions/+server.ts — Add/remove reactions
  api/images/[id]/+server.ts        — Serve images (authenticated)
~~~

## Delivery phases

### Phase 1 — Foundation

- Set up SvelteKit, Svelte 5, TypeScript, adapter-node, Tailwind, and shadcn-svelte
- Add Docker configuration
- Add SQLite, and migrations

### Phase 2 — Authentication

- Configure Better Auth
- Implement username/password login and registration
- Add OIDC login

### Phase 3 — API

- Post CRUD endpoints
- Reaction endpoints
- Image upload and serving endpoints

### Phase 4 — UI

- Build login and register pages
- Build main page with:
  - Timeline view
  - Post creation modal
  - Inline post editing
  - Image gallery viewer
  - Emoji reactions
  - Mobile-responsive layout