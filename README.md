# LAP-AI Enablement Documentation

A repository to host documentation on how to use existing AI toolkits, agents, skills, and other AI-based tools.

## Content Workflow

Documentation pages are now rendered directly from Markdown files.

- Edit existing content in `docs/*.md`.
- Add or remove pages in `docs/pages.json`.
- Open pages using `index.html?page=<slug>`.

See `docs/README.md` for the full update and new-page workflow.

## Local Preview

Because content is loaded via `fetch()`, run the site from a local web server (not `file://`).

Example:

```powershell
cd C:\Repos\Capgemini\LAP-AI-Enablement-Documentation
python -m http.server 8000
```

Then open `http://localhost:8000/index.html?page=home`.
