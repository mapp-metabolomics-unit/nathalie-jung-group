# Quarto Reporting Drafts

This folder stores the Quarto project that turns the project artefacts into a draft metabolomics report.

## Workflow

1. From the repository root, create (once) the local Quarto runtime environment with `uv`:
   ```bash
   uv venv .venv
   uv sync
   ```
   Set `QUARTO_PYTHON` to the environment’s interpreter (add the line to your shell profile to persist it):
   ```bash
   export QUARTO_PYTHON="$(pwd)/.venv/bin/python"
   ```

2. Render (or re-render) the report — the helper script regenerates the context file, infers the project/batch identifiers from `.copier-answers.yml`, and copies the artefacts into `docs/` for you:
   ```bash
   scripts/render_report.sh
   ```
   Add `--pdf` to the command if you also need the PDF output. Links in the report point to the repository on GitHub by default (`https://github.com/<github_username>/<repository_name>/blob/main/docs/`). Override this with `SITE_BASE_URL="https://your.domain/" scripts/render_report.sh ...` if the artefacts are hosted elsewhere.

3. Review the generated draft and expand on the narrative sections that remain marked as TODOs.

## Customisation

- Update `reporting/report.qmd` parameters (`project_id`, `batch_id`, `context_file`) for other projects.
- Extend the templates in `reporting/templates/` for additional sections (QC, targeted analyses, etc.).
- Add new keys to the context builder script and surface them in the partials when you introduce new outputs to the project template.
- If you need to inspect or tweak the generated context directly, run `python scripts/build_report_context.py --project-id <id> --batch-id <id> --site-base-url "$SITE_BASE_URL"` and open the resulting YAML in the batch `report/` folder.
