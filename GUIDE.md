# Editing guide

Everything here is plain text — no build step, no npm, no framework.
Edit a file, refresh the browser.

## Running the site locally

```bash
cd personal-website && python3 -m http.server 8000
```

Then open **http://localhost:8000**.

> **Do not open `index.html` by double-clicking it.** The blog loads posts with
> `fetch()`, which browsers block on `file://` URLs. You must use the server above.
> After editing CSS, hard-reload (**Cmd+Shift+R**) — the dev server caches.

---

## 1. Add a blog post

### A post hosted on your own site (written in Markdown)

**Step 1 — write the post.** Create `blog/posts/my-post-slug.md`.
The slug must be lowercase letters, numbers and hyphens only.

Do **not** put the title in the file — it comes from `posts.json` in step 2.

````markdown
Opening paragraph. Plain Markdown from here on.

## A section heading

Regular text with **bold**, *italic*, `code`, and [a link](https://example.com).

- bullet
- list

1. numbered
2. list

> A blockquote for a key claim.

```python
def hello():
    return "code blocks work too"
```

| Column | Column |
|--------|--------|
| cell   | cell   |
````

**Step 2 — register it.** Add an entry to the **top** of `blog/posts.json`:

```json
[
  {
    "title": "My Post Title",
    "date": "2026-07-15",
    "platform": "own",
    "slug": "my-post-slug",
    "excerpt": "One or two sentences shown on the cards and listing.",
    "tags": ["Sparse Autoencoders", "AI Safety"]
  }
]
```

`date` must be `YYYY-MM-DD`. Posts sort newest-first automatically.
`slug` must exactly match the `.md` filename (without `.md`).

That's it — the homepage card, the blog listing, and the post page all update.

### A post published on LessWrong / Alignment Forum

No Markdown file needed. Add an entry with `url` instead of `slug`:

```json
{
  "title": "The Post Title As It Appears There",
  "date": "2026-07-15",
  "platform": "lesswrong",
  "url": "https://www.lesswrong.com/posts/ABC123/the-post",
  "excerpt": "One or two sentences.",
  "tags": ["Interpretability"]
}
```

Valid `platform` values: `own`, `lesswrong`, `alignmentforum`, `substack`.
Clicking the card opens the external site in a new tab. A filter button for
that platform appears automatically once you have posts from two or more places.

> **Adding another platform** (e.g. Medium): open `js/blog.js` and add one line
> to the `PLATFORMS` map at the top, then add a matching `.platform-dot--xx`
> colour in `css/style.css`.

### Citations inside a post

Write footnote markers inline, and define them at the bottom of the `.md` file:

```markdown
Prior work established this [^bricken], and later work scaled it [^templeton].

[^bricken]: Bricken, T., et al. (2023). *Towards Monosemanticity*. Transformer Circuits. [Read](https://transformer-circuits.pub/2023/monosemantic-features)
[^templeton]: Templeton, A., et al. (2024). *Scaling Monosemanticity*. Transformer Circuits. [Read](https://transformer-circuits.pub/2024/scaling-monosemanticity/)
```

You get numbered superscripts `[1]` `[2]` that show the full reference on hover,
plus a **References** section at the end of the post with back-links.
The key (`bricken`) is just a label for you — numbering is automatic and follows
first appearance. See `blog/posts/reading-sae-features.md` for a live example.

A **table of contents** is generated automatically when a post has 3+ headings.

---

## 2. Change your photo

Replace `assets/profile.jpg`. Keep the same filename and it just works.
Use a square image, at least 300×300px.

To use a different filename, edit this line in `index.html`:

```html
<img src="assets/profile.jpg" alt="Tue Minh Cao" class="profile-photo" />
```

To go back to the initials placeholder, swap that `<img>` for:

```html
<div class="profile-placeholder" aria-hidden="true">TMC</div>
```

## 3. Update your CV

Replace `assets/cv.pdf`. Same filename, no other change needed.

---

## 4. Change the theme

All colours, spacing and sizing live in one block at the top of `css/style.css`:

```css
:root {
  --text:          #1a1a1a;   /* body text */
  --text-muted:    #6b7280;   /* secondary text */
  --accent:        #1d4ed8;   /* links, badges, highlights */
  --accent-light:  #eff6ff;   /* accent backgrounds */
  --accent-border: #bfdbfe;
  --bg:            #ffffff;   /* page background */
  --bg-alt:        #f9fafb;   /* cards, footer */
  --border:        #e5e7eb;
  --max-width:     860px;     /* content column width */
}
```

Change `--accent` and the whole site re-themes. Some presets:

| Look | `--accent` | `--accent-light` | `--accent-border` |
|------|-----------|------------------|-------------------|
| Blue (current) | `#1d4ed8` | `#eff6ff` | `#bfdbfe` |
| Forest green | `#15803d` | `#f0fdf4` | `#bbf7d0` |
| Burgundy | `#9f1239` | `#fff1f2` | `#fecdd3` |
| Slate | `#334155` | `#f8fafc` | `#cbd5e1` |

**Font:** change the Google Fonts `<link>` in each HTML file's `<head>`, then
update `font-family` in the `body` rule.

**Wider or narrower text:** change `--max-width`.

---

## 5. Edit page content

| What | Where |
|------|-------|
| Name, title, research statement | `index.html` → `<section id="about">` |
| Links (email, Scholar, GitHub) | `index.html` → `.about-links` |
| The three stat numbers | `index.html` → `.about-stats` |
| News items | `index.html` → `<section id="news">` |
| Research interests / projects | `index.html` → `<section id="research">` |
| Publications | `index.html` → `<section id="publications">` |
| Students | `index.html` → `<section id="mentoring">` |
| Blog intro text | `blog/index.html` → `.blog-page-desc` |

**Adding a publication:** copy an existing `<article class="pub-item">` block and
edit it. The badge colour is set by the class:
`pub-badge--published` (green), `--review` (amber), `--preprint` (grey), `--early` (pink).

Paper links are `<a href="#" class="pub-link">` — replace `#` with the real URL.
Delete any link you don't have rather than leaving it as `#`.

---

## 6. Common problems

| Symptom | Cause |
|---------|-------|
| Blog is empty / "Could not load posts" | Opened as a `file://` path — use the local server |
| A post doesn't appear | `posts.json` has a JSON syntax error. Run `python3 -m json.tool blog/posts.json` |
| Post page says "not found" | `slug` in `posts.json` doesn't match the `.md` filename |
| CSS changes don't show | Browser cache — hard-reload with **Cmd+Shift+R** |
| Citation shows as literal `[^1]` | No matching `[^1]: ...` definition at the bottom of the file |

---

## 7. Publishing changes

Once the site is on GitHub Pages, publishing is three commands:

```bash
git add -A && git commit -m "Add new post" && git push
```

The live site updates in about a minute.
