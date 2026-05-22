#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $0 [--project-id ID] [--batch-id ID] [--site-base-url URL] [--pdf]

Renders the Quarto report after regenerating the context file. By default only the
HTML draft is produced; pass --pdf to request both HTML and PDF outputs. When no
project or batch identifier is supplied, the script falls back to the values
recorded in .copier-answers.yml.
USAGE
}

project_id=""
batch_id=""
render_pdf=false
site_base_url="${SITE_BASE_URL:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-id)
      project_id="$2"
      shift 2
      ;;
    --batch-id)
      batch_id="$2"
      shift 2
      ;;
    --site-base-url)
      site_base_url="$2"
      shift 2
      ;;
    --pdf)
      render_pdf=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$project_id" ]]; then
        project_id="$1"
      elif [[ -z "$batch_id" ]]; then
        batch_id="$1"
      else
        echo "Unknown option: $1" >&2
        usage
        exit 2
      fi
      shift
      ;;
  esac
done

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
python_bin="$repo_root/.venv/bin/python"
context_script="$repo_root/scripts/build_report_context.py"
output_dir=""
staging_dir="$repo_root/reporting/_output"
docs_batch=""
link_results="$repo_root/results"
link_metadata="$repo_root/metadata"

answers_file="$repo_root/.copier-answers.yml"
answers_python=""
if [[ -x "$python_bin" ]]; then
  answers_python="$python_bin"
elif command -v python3 &>/dev/null; then
  answers_python="python3"
elif command -v python &>/dev/null; then
  answers_python="python"
fi

if [[ -f "$answers_file" && -n "$answers_python" ]]; then
  eval "$($answers_python - <<'PY' "$answers_file"
import shlex
import sys
from pathlib import Path

try:
    import yaml
except Exception:  # pragma: no cover - optional dependency
    sys.exit(0)

data = yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8")) or {}

def first(*keys):
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""

defaults = {
    "project_default": first("recorded_mapp_project", "mapp_project"),
    "batch_default": first("recorded_mapp_batch", "mapp_batch"),
    "repo_name_default": first("repository_name", "recorded_repository_name"),
    "github_username_default": first("github_username", "recorded_github_username"),
    "batch_description_default": first("mapp_batch_description"),
}

for key, value in defaults.items():
    print(f"{key}={shlex.quote(value)}")
PY
)"
fi

if [[ -z "$project_id" && -n "${project_default:-}" ]]; then
  project_id="$project_default"
fi
if [[ -z "$batch_id" && -n "${batch_default:-}" ]]; then
  batch_id="$batch_default"
fi

if [[ -z "$project_id" || -z "$batch_id" ]]; then
  echo "Project and batch identifiers must be provided either via arguments or .copier-answers.yml" >&2
  usage
  exit 1
fi

if [[ -z "$site_base_url" && -n "${github_username_default:-}" && -n "${repo_name_default:-}" ]]; then
  site_base_url="https://github.com/${github_username_default}/${repo_name_default}/blob/main/docs/"
fi

if [[ -n "$site_base_url" && "${site_base_url: -1}" != "/" ]]; then
  site_base_url+="/"
fi

output_dir="$repo_root/docs/$project_id/$batch_id/report"
docs_batch="$repo_root/docs/$project_id/$batch_id"

if [[ ! -x "$python_bin" ]]; then
  echo "Python interpreter not found at $python_bin. Run 'uv venv .venv' first." >&2
  exit 3
fi

if [[ ! -f "$context_script" ]]; then
  echo "Context builder script not found at $context_script" >&2
  exit 4
fi

context_args=("--project-id" "$project_id" "--batch-id" "$batch_id")
if [[ -n "$site_base_url" ]]; then
  context_args+=("--site-base-url" "$site_base_url")
fi
"$python_bin" "$context_script" "${context_args[@]}"

format_args=("--to" "html")
if $render_pdf; then
  format_args=("--to" "html,pdf")
fi

rm -rf "$staging_dir"
mkdir -p "$staging_dir"

cleanup() {
  rm -f "$link_results" "$link_metadata"
}
trap cleanup EXIT

rm -f "$link_results" "$link_metadata"
if [[ -d "$docs_batch/results" ]]; then
  ln -s "$docs_batch/results" "$link_results"
fi
if [[ -d "$docs_batch/metadata" ]]; then
  ln -s "$docs_batch/metadata" "$link_metadata"
fi

env QUARTO_PYTHON="$python_bin" \
  quarto render "$repo_root/reporting/report.qmd" \
  "${format_args[@]}"

mkdir -p "$output_dir"
rsync -a --delete "$staging_dir"/ "$output_dir"/

rm -rf "$staging_dir"
