# Markdown Content Workflow

This site now renders content directly from Markdown files.

## Update existing content

1. Edit the corresponding file in `docs/*.md`.
2. Refresh the browser.

## Add a new page

1. Create a new markdown file in `docs/` (for example `docs/security.md`).
2. Add a new entry to `docs/pages.json`:

```json
{
  "slug": "security",
  "title": "Security",
  "file": "docs/security.md",
  "keywords": "security governance compliance"
}
```

3. Refresh the browser and open:

`index.html?page=security`

## Notes

- Use `##` for page heading and `###` for section headings.
- The "On this page" TOC is generated from `h2`/`h3` headings.
- Deep-link anchors are added automatically for headings.
