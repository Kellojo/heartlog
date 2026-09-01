# Heartlog — Design Concept

A design vision for the Heartlog timeline and post-creation experience, focused on modern glassmorphism, fluid motion, and a premium, intimate feel.

---

## Design Language

**Aesthetic:** Dark-first, aurora-glass. The app feels like a private, glowing journal floating in a calm, ambient space.

**Palette:**
- **Background:** Deep charcoal/navy (`#0a0a0f` to `#12121a`), with slow-moving, blurred aurora gradients (rose, violet, teal) drifting behind content.
- **Glass surfaces:** `bg-white/5` to `bg-white/10`, `backdrop-blur-xl`, `border-white/10`, subtle inner glow.
- **Accent:** Warm rose (`#f43f5e`) for primary actions and reactions, with a gradient shift to violet (`#8b5cf6`) for highlights.
- **Text:** Off-white (`#f1f1f4`) for primary, muted gray (`#9ca3af`) for secondary.

**Typography:**
- **Display:** A rounded, geometric sans (e.g., "Sora" or "Outfit") for titles and numbers.
- **Body:** "Inter" for readability.
- **Timeline dates:** Small, uppercase, wide tracking (`text-xs tracking-widest`).

**Motion:**
- **Spring-based:** All transitions use spring physics (Svelte's `spring` or `transition:fly` with custom easing).
- **Duration:** 200–400ms for UI, 500–800ms for page-level entrances.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (easeOutExpo) for most motion.

---

## Timeline Design

The timeline is the centerpiece. It should feel like a living, breathing scroll of memories.

### Layout Structure

```
┌─────────────────────────────┐
│  [Aurora Background Layer]  │  ← Fixed, animated gradient blobs
│                             │
│  ┌───────────────────────┐  │
│  │   Sticky Glass Header │  │  ← Floating, blurred, with user avatar
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Create Post Card    │  │  ← Glass, inviting, with typing prompt
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Timeline Line       │  │  ← Vertical gradient line on the left
│  │   ┌───────────────┐   │  │
│  │   │  Post Card    │   │  │  ← Glass card, layered over line
│  │   │  (Glass)      │   │  │
│  │   └───────────────┘   │  │
│  │   ┌───────────────┐   │  │
│  │   │  Post Card    │   │  │
│  │   └───────────────┘   │  │
│  └───────────────────────┘  │
│                             │
│  [Infinite Scroll Trigger]  │
└─────────────────────────────┘
```

### Aurora Background

- **Implementation:** A fixed `div` with 3–4 large, blurred `radial-gradient` blobs (rose, violet, teal) that slowly drift using CSS `transform: translate()` and `filter: blur(100px)`.
- **Performance:** Use `transform` and `opacity` only. Keep it behind everything (`z-index: -1`).
- **Subtlety:** Opacity ~15–20%. It should be felt, not seen.

### Timeline Line

- **Position:** Fixed left gutter (or center on wide screens).
- **Style:** A 2px vertical line with a gradient from rose → violet → transparent, fading as it goes down.
- **Animation:** A subtle "pulse" or "glow" that travels down the line as you scroll (using `IntersectionObserver` to trigger a CSS animation on newly visible posts).

### Post Card (Glass)

Each post is a self-contained glass panel.

**Visual:**
- `bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl`
- `shadow-[0_8px_32px_rgba(0,0,0,0.3)]`
- `hover:bg-white/8 hover:border-white/15 transition-all duration-300`

**Structure:**
```
┌─────────────────────────────┐
│  [Author Avatar]  [Name]    │  ← Small, circular, glass ring
│  [Time] · [Date]            │  ← Muted, tiny
│                             │
│  [Title]                    │  ← Optional, bold, larger
│  [Content]                  │  ← Readable, line-height 1.6
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐   │  ← Image grid (2-col, 3-col, or masonry)
│  │ img │ │ img │ │ img │   │     with rounded-2xl overflow
│  └─────┘ └─────┘ └─────┘   │
│                             │
│  [❤️ 3] [😊 1] [+ react]   │  ← Reaction pills, glass style
│                             │
│  [⋯]                        │  ← More options (edit/delete)
└─────────────────────────────┘
```

**Image Grid:**
- **1 image:** Full-width, 16:9 or 4:3 aspect, rounded-2xl.
- **2 images:** Side-by-side, square-ish.
- **3+ images:** 2x2 grid, or first image large + rest small.
- **Hover:** Slight scale (`scale-105`) and brightness boost.
- **Click:** Opens full-screen viewer.

**Reaction Pills:**
- **Style:** `bg-white/5 border border-white/10 rounded-full px-3 py-1`
- **Active state:** `bg-rose-500/20 border-rose-500/30 text-rose-300`
- **Hover:** `bg-white/10 scale-105`
- **Layout:** Horizontal scroll if many, or wrap.

**Reaction Picker (on hover/tap):**
- A floating glass pill that appears above the reaction bar with a spring animation.
- Contains the curated emoji list in a horizontal row.
- **Mobile:** Triggered by a long-press or a dedicated "+" button.

### Create Post Card (Top of Timeline)

This is the entry point for new posts. It should feel inviting and alive.

**Collapsed State:**
```
┌─────────────────────────────┐
│  [Your Avatar]              │
│  "What's on your mind?"     │  ← Placeholder text, muted
│                    [📷] [✨] │  ← Quick action icons
└─────────────────────────────┘
```
- **Style:** Same glass as post cards, but with a subtle gradient border (`border-transparent bg-gradient-to-r from-rose-500/20 to-violet-500/20`).
- **Interaction:** Clicking anywhere expands it into the full creation modal.

**Expanded State (Modal):**
- A full-screen or large centered modal with the same glass aesthetic.
- **Focus:** The textarea should auto-focus with a soft glow ring.

---

## Create Post Experience

This is the second most important flow. It should feel effortless and delightful.

### Modal Design

**Layout:**
```
┌─────────────────────────────┐
│  [←]  New Post        [Post]│  ← Header: back button, title, submit
│                             │
│  [Your Avatar]  [Your Name] │
│                             │
│  ┌───────────────────────┐  │
│  │ Title (optional)      │  │  ← Glass input, minimal border
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │  Write something...   │  │  ← Auto-expanding textarea
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ [📷 Add Photos]       │  │  ← Glass button, dashed border
│  │  or drag & drop       │  │
│  └───────────────────────┘  │
│                             │
│  [Selected Images Preview]  │  ← Horizontal scroll, 80px thumbs
│  [x] [x] [x]                │
│                             │
│  [Post]                     │  ← Large, gradient button
└─────────────────────────────┘
```

**Glass Inputs:**
- `bg-white/5 border border-white/10 rounded-2xl px-4 py-3`
- `focus:bg-white/8 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20`
- `placeholder:text-gray-500`

**Image Upload Area:**
- **Empty state:** Dashed border (`border-dashed border-white/20`), centered icon + text.
- **Drag-over state:** `border-rose-500/50 bg-rose-500/10`, with a pulsing animation.
- **Preview:** Horizontal scrollable row of 80px thumbnails, each with a small "×" remove button in the top-right corner.

**Submit Button:**
- **Style:** `bg-gradient-to-r from-rose-500 to-violet-500 text-white font-semibold rounded-2xl px-6 py-3`
- **Hover:** `brightness-110 scale-[1.02]`
- **Active:** `scale-[0.98]`
- **Disabled:** `opacity-50 grayscale`

### Image Viewer (Full-Screen)

**Design:**
- **Background:** `bg-black/95 backdrop-blur-2xl`
- **Image:** Centered, `object-contain`, with a subtle drop shadow.
- **Navigation:**
  - **Desktop:** Left/right arrow buttons (glass circles) on hover.
  - **Mobile:** Swipe left/right (touch events), with a subtle page indicator at the bottom.
- **Close:** "×" button in top-right, or swipe down to dismiss (mobile).
- **Info:** Show post title/content snippet at the bottom, overlaid on a gradient scrim.

**Animations:**
- **Open:** Image scales up from the thumbnail position (FLIP animation) or fades in with a slight scale.
- **Close:** Reverses the open animation.
- **Swipe:** Uses Svelte's `spring` for smooth, physics-based paging.

---

## Mobile-Specific Interactions

- **Pull-to-refresh:** At the top of the timeline, pulling down triggers a refresh with a custom glass spinner.
- **Swipe actions on posts:** Swipe left on a post card to reveal "Edit" and "Delete" actions (glass buttons).
- **Long-press to react:** Long-pressing a post card opens the emoji picker.
- **Haptic feedback:** Use `navigator.vibrate(10)` on reactions and post creation.

---

## Component Breakdown

| Component | File | Notes |
|-----------|------|-------|
| `Timeline.svelte` | `src/lib/components/Timeline.svelte` | Main scroll container, manages posts and infinite scroll |
| `PostCard.svelte` | `src/lib/components/PostCard.svelte` | Individual post, glass style, reactions, images |
| `CreatePostCard.svelte` | `src/lib/components/CreatePostCard.svelte` | Collapsed prompt at top of timeline |
| `CreatePostModal.svelte` | `src/lib/components/CreatePostModal.svelte` | Full creation form with image upload |
| `ImageViewer.svelte` | `src/lib/components/ImageViewer.svelte` | Full-screen gallery with swipe |
| `ReactionBar.svelte` | `src/lib/components/ReactionBar.svelte` | Emoji pills and picker |
| `AuroraBackground.svelte` | `src/lib/components/AuroraBackground.svelte` | Fixed animated gradient layer |
| `GlassHeader.svelte` | `src/lib/components/GlassHeader.svelte` | Sticky top bar with user info |

---

## Animation & Transition Details

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Post card entrance | `fly: { y: 20, opacity: 0 }` | 400ms | `easeOutExpo` |
| Modal open | `scale: 0.95 → 1, opacity: 0 → 1` | 300ms | `easeOutExpo` |
| Modal close | `scale: 1 → 0.95, opacity: 1 → 0` | 200ms | `easeInExpo` |
| Reaction add | `scale: 0 → 1.2 → 1` | 300ms | `spring` |
| Image viewer open | `scale: 0.8 → 1, opacity: 0 → 1` | 400ms | `easeOutExpo` |
| Image viewer swipe | `x: spring` | physics | `spring` |
| Timeline line glow | `opacity: 0 → 1 → 0` | 1000ms | `easeInOut` |

---

## Accessibility

- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-rose-500/50` on all interactive elements.
- **Reduced motion:** Respect `prefers-reduced-motion` by disabling aurora drift and card entrance animations.
- **Screen readers:** Use `aria-label` on icon buttons, `role="dialog"` on modals, and `aria-live="polite"` on reaction updates.
- **Color contrast:** Ensure text on glass meets WCAG AA (4.5:1) by using `text-gray-100` on `bg-white/5` (dark bg).

---

## Implementation Notes

- **Glassmorphism:** Use `backdrop-blur-xl` sparingly (only on cards and modals) to avoid performance issues on low-end devices.
- **Aurora:** Use CSS `transform` animations, not `top/left`, to keep them on the GPU.
- **Images:** Use `loading="lazy"` and `decoding="async"` on all timeline images. Generate `srcset` for thumbnails.
- **Spring animations:** Use Svelte's `spring` from `svelte/motion` for reaction counts and image viewer paging.
- **FLIP animations:** For image viewer open/close, consider a lightweight FLIP helper to animate from thumbnail to full-screen.

---

## Open Questions

1. **Masonry vs. grid for images?** Masonry looks more organic but is harder to implement. A simple 2-col grid with varying row spans might be a good compromise.
2. **Timeline line position?** Left gutter (like a journal) or center (like a path)? Left feels more intimate, center feels more modern.
3. **Reaction picker trigger?** Hover on desktop, long-press on mobile, or a persistent "+" button? A "+" button is more discoverable.
4. **Create post modal: full-screen or centered?** Full-screen feels more immersive on mobile, centered feels more focused on desktop. Could be responsive.
