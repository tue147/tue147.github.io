/* ============================================================
   Blog engine — data loading, listing, and Markdown rendering
   ------------------------------------------------------------
   Single source of truth: blog/posts.json
   Post bodies (platform "own") live in blog/posts/<slug>.md
   ============================================================ */

// ── Platform registry ──────────────────────────────────────
// Add a new platform here and it works everywhere (cards, list,
// filters, post header) with no other changes.
const PLATFORMS = {
  own:             { label: 'This site',          dot: 'own', cta: 'Read post' },
  lesswrong:       { label: 'LessWrong',          dot: 'lw',  cta: 'Read on LessWrong' },
  alignmentforum:  { label: 'AI Alignment Forum', dot: 'af',  cta: 'Read on the Alignment Forum' },
  substack:        { label: 'Substack',           dot: 'sub', cta: 'Read on Substack' },
};

const platformOf = p => PLATFORMS[p] || PLATFORMS.own;

// Resolve paths relative to site root, so this works from / and /blog/
const ROOT = location.pathname.includes('/blog/') ? '../' : './';

// ── Helpers ────────────────────────────────────────────────
const escapeHtml = str => String(str).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** "2026-06-20" -> "Jun 20, 2026" (parsed as local, not UTC) */
function formatDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US',
    { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Where does this post live? Internal posts get a reader URL. */
function postHref(post, fromBlogDir) {
  if (post.platform === 'own') {
    return `${fromBlogDir ? '' : 'blog/'}post.html?p=${encodeURIComponent(post.slug)}`;
  }
  return post.url;
}

const isExternal = post => post.platform !== 'own';

/** Newest first. */
const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));

/** Load and validate posts.json. Returns [] and logs on failure. */
async function loadPosts() {
  try {
    const res = await fetch(`${ROOT}blog/posts.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();
    if (!Array.isArray(posts)) throw new Error('posts.json must be an array');
    return posts.slice().sort(byDateDesc);
  } catch (err) {
    console.error('[blog] Could not load posts.json:', err);
    return null; // null = load error (distinct from "no posts yet")
  }
}

/** Shown when fetch() fails — almost always the file:// protocol. */
const LOAD_ERROR_HTML = `
  <div class="blog-empty">
    <p>
      <strong>Could not load posts.</strong><br />
      If you opened this file directly from your disk, start a local server
      instead — browsers block <code>fetch()</code> on <code>file://</code> URLs.
      <br /><br />
      <code>python3 -m http.server 8000</code>
    </p>
  </div>`;

/* ============================================================
   Homepage — latest post cards (#blog-cards)
   ============================================================ */
async function renderHomeCards() {
  const mount = document.getElementById('blog-cards');
  if (!mount) return;

  const posts = await loadPosts();
  if (posts === null) { mount.innerHTML = LOAD_ERROR_HTML; return; }

  if (!posts.length) {
    mount.innerHTML = `
      <div class="blog-empty">
        <p>
          Posts coming soon — I'm working on a few pieces about sparse autoencoders
          and feature geometry. Check back, or follow me on
          <a href="https://www.lesswrong.com/users/tue-minh-cao" target="_blank" rel="noopener">LessWrong</a>.
        </p>
      </div>`;
    return;
  }

  mount.innerHTML = `<div class="blog-grid">${
    posts.slice(0, 3).map(post => {
      const pf = platformOf(post.platform);
      const ext = isExternal(post);
      return `
        <a class="blog-card" href="${escapeHtml(postHref(post, false))}"
           ${ext ? 'target="_blank" rel="noopener"' : ''}>
          <div class="blog-card-platform">
            <span class="platform-dot platform-dot--${pf.dot}"></span>${escapeHtml(pf.label)}
          </div>
          <div class="blog-card-title">${escapeHtml(post.title)}</div>
          <div class="blog-card-date">${escapeHtml(formatDate(post.date))}</div>
          <div class="blog-card-excerpt">${escapeHtml(post.excerpt || '')}</div>
          <span class="blog-card-cta">${escapeHtml(pf.cta)}</span>
        </a>`;
    }).join('')
  }</div>`;
}

/* ============================================================
   Blog index — full list + platform filters (#blog-list)
   ============================================================ */
async function renderBlogList() {
  const mount = document.getElementById('blog-list');
  if (!mount) return;

  const posts = await loadPosts();
  if (posts === null) { mount.innerHTML = LOAD_ERROR_HTML; return; }

  if (!posts.length) {
    mount.innerHTML = `
      <div class="blog-empty" style="margin: 3rem 0;">
        <p>
          Posts coming soon. I'm working on pieces about sparse autoencoders,
          feature geometry, and lessons from mechanistic interpretability research.
          <br /><br />
          In the meantime, you can follow my activity on
          <a href="https://www.lesswrong.com/users/tue-minh-cao" target="_blank" rel="noopener">LessWrong</a>
          and the
          <a href="https://www.alignmentforum.org" target="_blank" rel="noopener">AI Alignment Forum</a>.
        </p>
      </div>`;
    document.querySelector('.blog-filters')?.remove();
    return;
  }

  mount.innerHTML = posts.map(post => {
    const pf = platformOf(post.platform);
    const ext = isExternal(post);
    return `
      <a class="blog-list-item" href="${escapeHtml(postHref(post, true))}"
         data-platform="${escapeHtml(post.platform)}"
         ${ext ? 'target="_blank" rel="noopener"' : ''}>
        <div class="blist-date">${escapeHtml(formatDate(post.date))}</div>
        <div>
          <div class="blist-platform">
            <span class="platform-dot platform-dot--${pf.dot}"></span>${escapeHtml(pf.label)}
          </div>
          <div class="blist-title">${escapeHtml(post.title)}</div>
          <div class="blist-excerpt">${escapeHtml(post.excerpt || '')}</div>
        </div>
      </a>`;
  }).join('');

  wireFilters();
}

/**
 * Build filter buttons from the platforms actually present in posts.json.
 * Generating these (rather than hand-writing them) keeps the button's
 * data-filter value and the post's platform key from drifting apart.
 */
function wireFilters() {
  const bar = document.querySelector('.blog-filters');
  if (!bar) return;

  const items = [...document.querySelectorAll('.blog-list-item[data-platform]')];
  const present = [...new Set(items.map(el => el.dataset.platform))];

  // A single-platform blog does not need a filter bar at all
  if (present.length < 2) { bar.remove(); return; }

  bar.innerHTML = [
    `<button class="filter-btn active" data-filter="all">All</button>`,
    ...present.map(key =>
      `<button class="filter-btn" data-filter="${escapeHtml(key)}">${escapeHtml(platformOf(key).label)}</button>`),
  ].join('');

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.filter;
    items.forEach(item => {
      item.style.display = (target === 'all' || item.dataset.platform === target) ? '' : 'none';
    });
  });
}

/* ============================================================
   Markdown post reader (blog/post.html)
   ============================================================ */

/**
 * Pull footnote-style citations out of Markdown before parsing.
 *
 *   Body:       ...as shown by prior work [^1].
 *   Definition: [^1]: Author, A. (2024). *Title*. [arXiv](https://...)
 *
 * Definitions are stripped from the body and returned separately so we can
 * render a numbered reference list at the end of the post.
 */
function extractCitations(markdown) {
  const defs = new Map();

  // Strip definition lines: [^key]: text  (must start at column 0)
  const body = markdown.replace(/^\[\^([^\]]+)\]:[ \t]*(.+(?:\n[ \t]+.+)*)$/gm,
    (_, key, text) => { defs.set(key.trim(), text.trim()); return ''; });

  // Number citations in order of first appearance in the body
  const order = [];
  const numberOf = key => {
    let i = order.indexOf(key);
    if (i === -1) { order.push(key); i = order.length - 1; }
    return i + 1;
  };

  // Replace inline [^key] with a placeholder marked.js will leave intact.
  // We use a raw HTML span; marked passes inline HTML through by default.
  const withMarkers = body.replace(/\[\^([^\]]+)\]/g, (match, rawKey) => {
    const key = rawKey.trim();
    if (!defs.has(key)) return match; // undefined citation — leave as written
    const n = numberOf(key);
    return `<span class="cite"><a href="#ref-${n}" class="cite-num" id="cite-ref-${n}">[${n}]</a>` +
           `<span class="cite-tooltip" data-ref="${n}"></span></span>`;
  });

  const references = order.map((key, i) => ({ n: i + 1, key, raw: defs.get(key) }));
  return { body: withMarkers, references };
}

/** Render the numbered reference list appended to a post. */
function renderReferences(references) {
  if (!references.length) return '';
  const items = references.map(ref => `
    <li id="ref-${ref.n}">
      ${marked.parseInline(ref.raw)}
      <a href="#cite-ref-${ref.n}" class="back-ref" title="Back to text">&#8617;</a>
    </li>`).join('');
  return `
    <section class="references">
      <h2>References</h2>
      <ol class="ref-list">${items}</ol>
    </section>`;
}

/** Fill each citation tooltip with its rendered reference text. */
function fillTooltips(references) {
  const byNum = new Map(references.map(r => [String(r.n), r]));
  document.querySelectorAll('.cite-tooltip[data-ref]').forEach(tip => {
    const ref = byNum.get(tip.dataset.ref);
    if (!ref) return;
    tip.innerHTML = marked.parseInline(ref.raw);
    // Links inside the dark tooltip need a light colour to stay readable
    tip.querySelectorAll('a').forEach(a => {
      a.style.color = '#93c5fd';
      a.target = '_blank';
      a.rel = 'noopener';
    });
  });
}

/** Build a table of contents from h2/h3, or return '' if the post is short. */
function buildToc(article) {
  const headings = [...article.querySelectorAll('h2, h3')]
    .filter(h => !h.closest('.references'));
  if (headings.length < 3) return '';

  const links = headings.map((h, i) => {
    if (!h.id) h.id = `section-${i + 1}`;
    const cls = h.tagName === 'H3' ? ' class="toc-sub"' : '';
    return `<li${cls}><a href="#${h.id}">${escapeHtml(h.textContent)}</a></li>`;
  }).join('');

  return `<nav class="post-toc"><p class="toc-label">Contents</p><ul>${links}</ul></nav>`;
}

const readingTime = text => Math.max(1, Math.round(text.trim().split(/\s+/).length / 220));

async function renderPost() {
  const mount = document.getElementById('post-root');
  if (!mount) return;

  const slug = new URLSearchParams(location.search).get('p');
  const fail = msg => {
    mount.innerHTML = `<div class="container"><div class="blog-empty" style="margin:4rem 0;">
      <p>${msg}</p><p style="margin-top:1rem;"><a href="./">← Back to all posts</a></p>
    </div></div>`;
  };

  if (!slug) return fail('No post specified.');
  // Reject path traversal / nested paths — slugs are flat filenames
  if (!/^[a-z0-9-]+$/i.test(slug)) return fail('Invalid post address.');

  const posts = await loadPosts();
  if (posts === null) { mount.innerHTML = LOAD_ERROR_HTML; return; }

  const post = posts.find(p => p.slug === slug && p.platform === 'own');
  if (!post) return fail(`Post <code>${escapeHtml(slug)}</code> was not found.`);

  let markdown;
  try {
    const res = await fetch(`posts/${slug}.md`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    markdown = await res.text();
  } catch (err) {
    console.error('[blog] Could not load post body:', err);
    return fail(`Could not load <code>posts/${escapeHtml(slug)}.md</code>.`);
  }

  document.title = `${post.title} — Tue Minh Cao`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', post.excerpt || '');

  const { body, references } = extractCitations(markdown);
  marked.setOptions({ gfm: true, breaks: false });

  const pf = platformOf(post.platform);
  const tags = (post.tags || [])
    .map((t, i) => `<span class="tag${i === 0 ? ' tag--accent' : ''}">${escapeHtml(t)}</span>`)
    .join('');

  mount.innerHTML = `
    <section class="post-header">
      <div class="container">
        <div class="post-platform-badge">
          <span class="platform-dot platform-dot--${pf.dot}"></span>${escapeHtml(pf.label)}
        </div>
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        <div class="post-meta">
          <span>Tue Minh Cao</span>
          <span>${escapeHtml(formatDate(post.date))}</span>
          <span>${readingTime(markdown)} min read</span>
        </div>
        ${tags ? `<div class="post-tags">${tags}</div>` : ''}
      </div>
    </section>
    <div class="container">
      <article class="post-body">
        ${marked.parse(body)}
        ${renderReferences(references)}
      </article>
    </div>`;

  fillTooltips(references);

  // Insert the TOC after the first paragraph so the post opens with prose
  const article = mount.querySelector('.post-body');
  const toc = buildToc(article);
  if (toc) {
    const firstPara = article.querySelector('p');
    (firstPara || article.firstElementChild)?.insertAdjacentHTML('afterend', toc);
  }

  // Citation tooltips + external link hygiene
  article.querySelectorAll('a[href^="http"]').forEach(a => {
    a.target = '_blank';
    a.rel = 'noopener';
  });

  document.dispatchEvent(new CustomEvent('post:rendered'));
}

// ── Boot ───────────────────────────────────────────────────
renderHomeCards();
renderBlogList();
renderPost();
