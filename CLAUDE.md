# Personal academic website — Tue Minh Cao

Static research/portfolio site for a PhD student in mechanistic interpretability.
Plain HTML/CSS/JS, **no build step, no framework, no package manager.**
Edit a file, refresh the browser, done.

## Structure

```
index.html              Homepage: About, News, Research, Publications, Blog preview, Mentoring
blog/
  index.html            Blog listing (posts + platform filters) — rendered by JS
  post.html             Markdown reader; reads ?p=<slug>
  posts.json            SINGLE SOURCE OF TRUTH for every post (metadata only)
  posts/<slug>.md       Body of each self-hosted post (Markdown)
css/style.css           All styling. Design tokens are CSS vars in :root
js/blog.js              Blog engine: loads posts.json, renders lists + Markdown posts
js/main.js              Nav, mobile menu, scroll-spy, citation tooltip positioning
js/vendor/marked.min.js Markdown parser, vendored (no CDN — site works offline)
assets/                 profile.jpg, cv.pdf
```

## How the blog works

`blog/posts.json` is an array of post objects. Everything else derives from it:
the homepage cards, the blog listing, the filter buttons, and each post's header.

Two kinds of post:
- `"platform": "own"` + `"slug"` → body lives in `blog/posts/<slug>.md`, read by `post.html?p=<slug>`
- any other platform + `"url"` → the card links straight out to LessWrong / Alignment Forum / etc.

Platforms are declared once in the `PLATFORMS` map at the top of `js/blog.js`
(label, dot colour, call-to-action). Adding a platform there makes it work
everywhere — cards, list, filters, post header.

Citations use footnote syntax in Markdown (`[^key]` inline, `[^key]: ...` at the
bottom). `extractCitations()` in `js/blog.js` turns them into numbered
superscripts with hover tooltips plus a References list.

## Guardrails

- **`posts.json` is the only place posts are declared.** Never hand-write post
  markup into `blog/index.html` or `index.html` — both use empty mount points
  (`#blog-list`, `#blog-cards`) that JS fills. Hand-written entries get wiped.
- **The site must be served over HTTP, not opened as a `file://` path.**
  The blog uses `fetch()`, which browsers block on `file://`. Use
  `python3 -m http.server 8000`. The pages show an explicit error if this is wrong.
- **Keep `posts.json` valid JSON** — a trailing comma silently empties the blog.
  Check with `python3 -m json.tool blog/posts.json`.
- **`slug` must match the filename** in `blog/posts/` and be `[a-z0-9-]` only.
  `post.html` rejects anything else, so slugs with slashes or dots will 404.
- **Never use CSS `grid` on an element holding inline content** (`<em>`, `<a>`,
  bare text). Grid promotes every child to a grid item and shatters the line —
  this is what broke `.ref-list li` once already; it uses absolute positioning now.
- **Declare `:visited` whenever you set a link colour.** Browsers otherwise
  force their own purple, and ordinary class selectors do not override it.
- **Colours must come from the `:root` CSS variables**, not hard-coded hex, so
  the theme stays changeable from one place.
- **Escape anything interpolated into HTML** in `js/blog.js` — use the existing
  `escapeHtml()`. Post *bodies* are intentionally rendered as trusted Markdown,
  so only ever put your own content in `blog/posts/`.
- `js/vendor/marked.min.js` is vendored on purpose. Do not swap it for a CDN
  `<script>` — that would break the site offline and add a third-party dependency.

## Verifying a change

```bash
python3 -m http.server 8000        # then open http://localhost:8000
```

Check: homepage cards, `/blog/`, a post page (citations + TOC + references),
mobile width, and the browser console for errors. The local dev server caches
aggressively — hard-reload after editing CSS.
