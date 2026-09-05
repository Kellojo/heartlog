<script lang="ts">
  import { EMOJIS } from "$lib/validation";
  import type { PageServerData } from "./$types";

  let { data } = $props<{ data: PageServerData }>();

  // svelte-ignore state_referenced_locally
  let posts = $state(data.initialPosts);
  // svelte-ignore state_referenced_locally
  let nextCursor = $state(data.nextCursor);
  // svelte-ignore state_referenced_locally
  let hasMore = $state(data.hasMore);
  let loading = $state(false);
  let showCreate = $state(false);
  let editingPostId = $state<string | null>(null);
  let viewerImages = $state<{ src: string; index: number }[]>([]);
  let viewerIndex = $state(0);
  let previewFiles = $state<{ url: string; file: File }[]>([]);
  let dragOver = $state(false);
  let emojiPickerPostId = $state<string | null>(null);
  let emojiPickerStyle = $state({ left: "0px", top: "0px" });
  let isDark = $state(false);
  let showUserMenu = $state(false);

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }

  $effect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      isDark = true;
      document.documentElement.setAttribute("data-theme", "dark");
    }
  });

  async function loadMore() {
    if (loading || !hasMore || !nextCursor) return;
    loading = true;
    try {
      const res = await fetch(`/api/posts?cursor=${nextCursor}&limit=20`);
      const json = await res.json();
      posts = [...posts, ...json.posts];
      nextCursor = json.nextCursor;
      hasMore = json.hasMore;
    } finally {
      loading = false;
    }
  }

  function openViewer(images: { id: string; thumbnailPath: string }[], startIndex: number) {
    viewerImages = images.map((img) => ({
      src: `/api/images/${img.id}?type=originals`,
      index: 0,
    }));
    viewerIndex = startIndex;
  }

  function closeViewer() {
    viewerImages = [];
    viewerIndex = 0;
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      addPreviewFiles(input.files);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    if (e.dataTransfer?.files) {
      addPreviewFiles(e.dataTransfer.files);
    }
  }

  function addPreviewFiles(files: FileList) {
    const newFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6 - previewFiles.length)
      .map((file) => ({ url: URL.createObjectURL(file), file }));
    previewFiles = [...previewFiles, ...newFiles];
  }

  function removePreview(index: number) {
    URL.revokeObjectURL(previewFiles[index].url);
    previewFiles = previewFiles.filter((_, i) => i !== index);
  }

  async function handleCreateSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Clear the file input and add our preview files
    formData.delete("images");
    previewFiles.forEach((pf) => formData.append("images", pf.file));

    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      showCreate = false;
      previewFiles.forEach((pf) => URL.revokeObjectURL(pf.url));
      previewFiles = [];
      window.location.reload();
    }
  }

  async function handleEditSubmit(e: Event, postId: string) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const res = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      editingPostId = null;
      window.location.reload();
    }
  }

  async function deletePost(postId: string) {
    if (!confirm("Do you really want to delete this post?")) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      posts = posts.filter((p: typeof posts[0]) => p.id !== postId);
    }
  }

  async function toggleReaction(postId: string, emoji: string, hasReacted: boolean) {
    const method = hasReacted ? "DELETE" : "POST";
    const res = await fetch(`/api/posts/${postId}/reactions`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const json = await res.json();
      posts = posts.map((p: typeof posts[0]) => (p.id === postId ? { ...p, reactions: json.reactions } : p));
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    window.location.href = "/login";
  }

  function groupedReactions(reactions: { emoji: string; userId: string }[]) {
    const map = new Map<string, { count: number; reacted: boolean }>();
    for (const r of reactions) {
      if (map.has(r.emoji)) {
        map.get(r.emoji)!.count++;
      } else {
        map.set(r.emoji, { count: 1, reacted: r.userId === data.currentUser.id });
      }
    }
    return Array.from(map.entries()).map(([emoji, info]) => ({ emoji, ...info }));
  }

  function userHasReacted(reactions: { emoji: string; userId: string }[], emoji: string) {
    return reactions.some((r) => r.emoji === emoji && r.userId === data.currentUser.id);
  }

  function formatDate(date: Date | number | string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function getInitial(name: string) {
    return name.charAt(0).toUpperCase();
  }

  function getAvatarColor(name: string) {
    const colors = [
      "bg-rose-100 text-rose-600",
      "bg-violet-100 text-violet-600",
      "bg-teal-100 text-teal-600",
      "bg-amber-100 text-amber-600",
      "bg-sky-100 text-sky-600",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function getAvatarHtml(name: string, image: string | null | undefined, size: "sm" | "md" | "lg" = "md") {
    const sizeClasses = {
      sm: "w-7 h-7 text-xs",
      md: "w-8 h-8 text-xs",
      lg: "w-9 h-9 text-sm",
    };
    if (image) {
      return `<img src="${image}" alt="" class="${sizeClasses[size]} rounded-full object-cover" />`;
    }
    return `<div class="${sizeClasses[size]} rounded-full ${getAvatarColor(name)} flex items-center justify-center font-medium">${getInitial(name)}</div>`;
  }

  function showEmojiPicker(postId: string, e: MouseEvent) {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    emojiPickerStyle = {
      left: `${rect.left}px`,
      top: `${rect.top - 52}px`,
    };
    emojiPickerPostId = postId;
  }

  function hideEmojiPicker() {
    emojiPickerPostId = null;
  }

  function pickEmoji(emoji: string) {
    if (!emojiPickerPostId) return;
    const post = posts.find((p: typeof posts[0]) => p.id === emojiPickerPostId);
    if (!post) return;

    const reacted = userHasReacted(post.reactions, emoji);
    toggleReaction(emojiPickerPostId, emoji, reacted);
    hideEmojiPicker();
  }

  function handleClickOutside(e: MouseEvent) {
    const picker = document.getElementById("emoji-picker");
    if (picker && !picker.contains(e.target as Node)) {
      hideEmojiPicker();
    }
    const menu = document.getElementById("user-menu");
    if (menu && !menu.contains(e.target as Node)) {
      showUserMenu = false;
    }
  }

  $effect(() => {
    if (emojiPickerPostId || showUserMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  });
</script>

<div class="min-h-screen" style="background: var(--bg);">
  <header class="fixed top-0 left-0 right-0 z-40 glass">
    <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg class="w-6 h-6" viewBox="0 0 32 32"><path d="M16 28c-1 0-2-.5-4-2C5.5 20.6 2.5 15.5 3.6 9.7 3.8 6 6.2 4 8.8 4c3 0 5.6 1.8 7.2 4.6 1.6-2.8 4.2-4.6 7.2-4.6 2.6 0 5 2 5.2 5.7 1.1 5.8-1.9 10.9-8.4 16.3-2 1.5-3 2-4 2Z" fill="#e8437c"/></svg>
        <h1 class="text-lg font-semibold accent-text">heartlog</h1>
      </div>
      <div class="flex items-center gap-3">
        <button onclick={toggleTheme} class="text-sm text-gray-400 hover:text-gray-600 transition cursor-pointer" title="Toggle theme">
          {#if isDark}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          {/if}
        </button>
        <div class="relative">
          <button
            onclick={(e) => { e.stopPropagation(); showUserMenu = !showUserMenu; }}
            class="cursor-pointer hover:opacity-80 transition"
          >
            {#if data.currentUser.image}
              <img src={data.currentUser.image} alt="" class="w-7 h-7 rounded-full object-cover" />
            {:else}
              <div class="w-7 h-7 rounded-full {getAvatarColor(data.currentUser.name)} flex items-center justify-center text-xs font-medium">
                {getInitial(data.currentUser.name)}
              </div>
            {/if}
          </button>
          {#if showUserMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div
              id="user-menu"
              class="absolute right-0 top-10 popover rounded-xl p-1.5 min-w-[120px] z-50"
              onclick={(e) => e.stopPropagation()}
            >
              <div class="px-3 py-2 border-b border-black/6">
                <p class="text-sm font-medium text-primary truncate">{data.currentUser.name}</p>
              </div>
              <button
                onclick={handleLogout}
                class="w-full text-left px-3 py-2 text-sm text-muted hover:text-secondary hover:bg-black/5 rounded-lg transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-0 sm:px-4 pt-20 pb-16">
    <!-- Create post -->
    <div class="mb-6 sm:px-0">
      <button
        onclick={() => (showCreate = true)}
        class="w-full glass sm:rounded-2xl p-4 text-left hover:border-black/10 transition group cursor-pointer"
      >
        <div class="flex items-center gap-3">
          {#if data.currentUser.image}
            <img src={data.currentUser.image} alt="" class="w-9 h-9 rounded-full object-cover shrink-0" />
          {:else}
            <div class="w-9 h-9 rounded-full {getAvatarColor(data.currentUser.name)} flex items-center justify-center text-sm font-medium shrink-0">
              {getInitial(data.currentUser.name)}
            </div>
          {/if}
          <span class="text-muted group-hover:text-secondary transition text-sm">What's on your mind?</span>
        </div>
      </button>
    </div>

    <!-- Posts -->
    <div class="space-y-4 sm:px-0">
      {#each posts as postItem (postItem.id)}
        <article class="post-card glass sm:rounded-2xl p-4">
          {#if editingPostId === postItem.id}
            <form onsubmit={(e) => handleEditSubmit(e, postItem.id)} class="space-y-3">
              <input
                name="title"
                type="text"
                value={postItem.title || ""}
                class="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-gray-800"
                placeholder="Title (optional)"
              />
              <textarea
                name="content"
                class="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 resize-none"
                rows="4"
                placeholder="What's on your mind?"
              >{postItem.content}</textarea>
              <input name="images" type="file" accept="image/*" multiple class="text-sm text-gray-500" />
              <div class="flex gap-2 justify-end">
                <button type="button" onclick={() => (editingPostId = null)} class="px-3 py-1.5 text-sm text-muted hover:text-secondary transition cursor-pointer">Cancel</button>
                <button type="submit" class="btn-primary text-white text-sm font-medium rounded-lg px-3 py-1.5 cursor-pointer">Save</button>
              </div>
            </form>
          {:else}
            <div class="flex items-center gap-3 mb-3">
              {#if postItem.author?.image}
                <img src={postItem.author.image} alt="" class="w-7 h-7 rounded-full object-cover" />
              {:else}
                <div class="w-7 h-7 rounded-full {getAvatarColor(postItem.author?.name || 'U')} flex items-center justify-center text-xs font-medium">
                  {getInitial(postItem.author?.name || "U")}
                </div>
              {/if}
              <div>
                <p class="text-sm font-medium text-primary">{postItem.author?.name || "unknown"}</p>
                <p class="text-xs text-muted">{formatDate(postItem.createdAt)}</p>
              </div>
              {#if postItem.authorId === data.currentUser.id}
                <div class="ml-auto flex gap-1">
                  <button
                    onclick={() => (editingPostId = postItem.id)}
                    class="text-xs text-muted hover:text-secondary px-2 py-1 rounded-lg hover:bg-black/5 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onclick={() => deletePost(postItem.id)}
                    class="text-xs text-muted hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              {/if}
            </div>

            {#if postItem.title}
              <h2 class="font-semibold text-primary mb-1.5">{postItem.title}</h2>
            {/if}
            <p class="text-secondary text-sm leading-relaxed mb-3 whitespace-pre-wrap break-words">{postItem.content}</p>

            {#if postItem.images.length > 0}
              <div class="image-grid grid gap-1.5 mb-3" class:grid-cols-2={postItem.images.length >= 2} class:grid-cols-3={postItem.images.length >= 3}>
                {#each postItem.images as image, i}
                  <button
                    onclick={() => openViewer(postItem.images, i)}
                    class="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                  >
                    <img
                      src={`/api/images/${image.id}?type=thumbnails`}
                      alt=""
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {#if i === 3 && postItem.images.length > 4}
                      <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span class="text-white font-semibold text-lg">+{postItem.images.length - 4}</span>
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}

            <div class="flex items-center gap-1.5 flex-wrap">
              {#each EMOJIS as emoji}
                {@const reacted = userHasReacted(postItem.reactions, emoji)}
                {@const count = postItem.reactions.filter((r: { emoji: string; userId: string }) => r.emoji === emoji).length}
                {#if count > 0}
                  <button
                    onclick={() => toggleReaction(postItem.id, emoji, reacted)}
                    class="reaction-pill glass rounded-full px-2.5 py-1 text-sm flex items-center gap-1 cursor-pointer {reacted ? 'active' : ''}"
                  >
                    <span>{emoji}</span>
                    <span class="text-xs text-muted">{count}</span>
                  </button>
                {/if}
              {/each}
              <button
                onclick={(e) => showEmojiPicker(postItem.id, e)}
                class="reaction-pill glass rounded-full px-2.5 py-1 text-sm text-faint hover:text-muted cursor-pointer"
              >
                <span>+</span>
              </button>
            </div>
          {/if}
        </article>
      {/each}
    </div>

    {#if hasMore}
      <div class="text-center py-6">
        <button
          onclick={loadMore}
          disabled={loading}
          class="text-sm accent-text hover:opacity-80 font-medium transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      </div>
    {/if}

    {#if posts.length === 0}
      <div class="text-center py-16">
        <p class="text-muted text-lg mb-2">No posts yet</p>
        <p class="text-faint text-sm">Create the first post to start your journal</p>
      </div>
    {/if}
  </main>
</div>

<!-- Create Post Modal -->
{#if showCreate}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onclick={() => (showCreate = false)} role="dialog" aria-modal="true">
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="modal-content popover rounded-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
      <div class="sticky top-0 popover border-b border-black/6 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
        <button onclick={() => (showCreate = false)} class="text-muted hover:text-secondary transition text-sm cursor-pointer">Cancel</button>
        <h2 class="font-medium text-primary">New post</h2>
        <div class="w-14"></div>
      </div>
      <form id="createForm" onsubmit={handleCreateSubmit} class="p-4 space-y-3">
        <input
          name="title"
          type="text"
          class="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
          placeholder="Title (optional)"
        />
        <textarea
          name="content"
          class="glass-input w-full rounded-xl px-3 py-2.5 text-sm resize-none"
          rows="4"
          placeholder="Write something..."
          required
        ></textarea>

        <div
          class="upload-zone rounded-xl p-5 text-center cursor-pointer {dragOver ? 'dragover' : ''}"
          onclick={() => document.getElementById("fileInput")?.click()}
          ondragover={(e) => { e.preventDefault(); dragOver = true; }}
          ondragleave={() => (dragOver = false)}
          ondrop={handleDrop}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === "Enter" && document.getElementById("fileInput")?.click()}
        >
          <p class="text-sm text-muted">Add photos</p>
          <p class="text-xs text-faint mt-0.5">Or drag & drop</p>
          <input id="fileInput" name="images" type="file" accept="image/*" multiple class="hidden" onchange={handleFileSelect} />
        </div>

        {#if previewFiles.length > 0}
          <div class="flex gap-2 overflow-x-auto py-1">
            {#each previewFiles as preview, i}
              <div class="preview-thumb relative shrink-0">
                <img src={preview.url} alt="" class="w-16 h-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onclick={() => removePreview(i)}
                  class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black/90 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <button type="submit" class="btn-primary w-full text-white font-medium rounded-xl px-4 py-2.5 text-sm cursor-pointer">
          Post
        </button>
      </form>
    </div>
  </div>
{/if}

<!-- Emoji Picker -->
{#if emojiPickerPostId}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    id="emoji-picker"
    class="fixed z-50 popover rounded-xl p-1.5"
    style="left: {emojiPickerStyle.left}; top: {emojiPickerStyle.top};"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="flex gap-0.5">
      {#each EMOJIS as emoji}
        <button class="emoji-btn text-xl p-1.5 rounded-lg cursor-pointer" onclick={() => pickEmoji(emoji)}>
          {emoji}
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Image Viewer -->
{#if viewerImages.length > 0}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
  <div class="fixed inset-0 z-50 flex flex-col viewer-backdrop" onclick={closeViewer} role="dialog" aria-modal="true">
    <div class="flex items-center justify-between px-4 py-3 text-white">
      <span class="text-sm text-muted">{viewerIndex + 1} / {viewerImages.length}</span>
      <button onclick={closeViewer} class="text-muted hover:text-white text-2xl transition cursor-pointer">&times;</button>
    </div>
    <div class="flex-1 flex items-center justify-center relative px-4">
      <img
        src={viewerImages[viewerIndex].src}
        alt=""
        class="viewer-img max-w-full max-h-full object-contain rounded-xl"
      />
      {#if viewerIndex > 0}
        <button
          onclick={(e) => { e.stopPropagation(); viewerIndex--; }}
          class="absolute left-3 w-10 h-10 rounded-full glass flex items-center justify-center text-muted hover:text-white text-xl transition cursor-pointer"
        >&#8249;</button>
      {/if}
      {#if viewerIndex < viewerImages.length - 1}
        <button
          onclick={(e) => { e.stopPropagation(); viewerIndex++; }}
          class="absolute right-3 w-10 h-10 rounded-full glass flex items-center justify-center text-muted hover:text-white text-xl transition cursor-pointer"
        >&#8250;</button>
      {/if}
    </div>
    <div class="px-4 py-3 text-center">
      <p class="text-sm text-muted"></p>
    </div>
  </div>
{/if}
