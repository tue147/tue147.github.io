# Tue Minh Cao — personal website

Static academic site: research profile, publications, and a Markdown blog that
can also link out to posts on LessWrong / the AI Alignment Forum.

No build step — plain HTML, CSS and JavaScript.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

The blog loads posts with `fetch()`, so the site must be served over HTTP.
Opening `index.html` directly from disk will show an empty blog.

## Editing

See **[GUIDE.md](GUIDE.md)** — how to add a blog post, change the photo,
switch the theme, and edit each section.
