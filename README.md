# Personal website

Jekyll site for GitHub Pages. Nordic/Icelandic palette, no build tooling needed —
GitHub builds it on push.

## Deploy

1. Create a repo named `yourusername.github.io` (or any repo + enable Pages).
2. Copy these files to the repo root and push.
3. In repo Settings → Pages, set source to "Deploy from a branch", branch `main`.
4. Edit `_config.yml`: set your name, `url`, and social links.

If using a project repo (not `yourusername.github.io`), set `baseurl: "/repo-name"` in `_config.yml`.

## Add content

- **Blog post**: add `_posts/YYYY-MM-DD-title.md` with `title`, `date`, `summary` front matter.
- **Project**: add `_projects/name.md` with `title`, `date`, `summary`, optional `links`.
- **Photo of you**: put it at `assets/images/me.jpg` (used on About).
- **CV**: put your PDF at `assets/cv.pdf`.

Front page shows the 6 most recent posts + projects automatically.

## Run locally (optional)

```
gem install bundler
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.
