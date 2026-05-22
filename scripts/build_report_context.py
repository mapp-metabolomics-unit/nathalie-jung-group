#!/usr/bin/env python3
"""Builds a context file consumed by the Quarto report."""

from __future__ import annotations

import argparse
import datetime as dt
import os
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import yaml

COLUMN_DESCRIPTIONS = {
    "sample_type": "Sample classification (e.g. sample, QC, blank).",
    "ATTRIBUTE_condition": "Biological condition or treatment label.",
    "source_taxon": "Organism or source taxonomy provided in the metadata.",
}

CATEGORICAL_COLUMNS = [
    "sample_type",
    "ATTRIBUTE_condition",
    "source_taxon",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Quarto report context")
    parser.add_argument("--project-id", help="Project identifier (e.g. mapp_project_00061)")
    parser.add_argument("--batch-id", help="Batch identifier (e.g. mapp_batch_00149)")
    parser.add_argument(
        "--docs-root",
        default="docs",
        help="Root directory containing project documentation",
    )
    parser.add_argument(
        "--project-dir",
        help="Override the project directory path instead of using ids",
    )
    parser.add_argument(
        "--output",
        help="Path to the context YAML file (defaults to <project>/report/context.yml)",
    )
    parser.add_argument(
        "--relative-to",
        help=(
            "Base directory used to compute relative paths stored in the context. "
            "Defaults to the batch report directory."
        ),
    )
    parser.add_argument(
        "--site-base-url",
        help="Base URL where the rendered documentation is hosted (used for absolute links)",
    )
    parser.add_argument(
        "--top-annotations",
        type=int,
        default=8,
        help="Maximum number of SIRIUS annotations to include",
    )
    return parser.parse_args()


def load_copier_answers() -> Dict[str, object]:
    answers_path = Path(__file__).resolve().parents[1] / ".copier-answers.yml"
    if not answers_path.exists():
        return {}
    try:
        return yaml.safe_load(answers_path.read_text(encoding="utf-8")) or {}
    except Exception:  # pylint: disable=broad-except
        return {}


def resolve_project_directory(args: argparse.Namespace) -> Path:
    if args.project_dir:
        return Path(args.project_dir).expanduser().resolve()
    if not args.project_id or not args.batch_id:
        raise SystemExit("Either --project-dir or both --project-id and --batch-id must be provided")
    docs_root = Path(args.docs_root).expanduser().resolve()
    project_dir = docs_root / args.project_id / args.batch_id
    if not project_dir.exists():
        raise SystemExit(f"Project directory '{project_dir}' not found")
    return project_dir


def relpath(path: Optional[Path], base: Path) -> Optional[str]:
    if not path:
        return None
    try:
        return Path(os.path.relpath(path.resolve(), base)).as_posix()
    except FileNotFoundError:
        return Path(os.path.relpath(path, base)).as_posix()


def read_contrib(project_dir: Path) -> Dict[str, str]:
    contrib_path = project_dir / "CONTRIB.md"
    if not contrib_path.exists():
        return {}
    text = contrib_path.read_text(encoding="utf-8")
    description_lines: List[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            if description_lines:
                break
            continue
        if stripped.startswith("#"):
            continue
        description_lines.append(stripped)
        if len(description_lines) >= 3:
            break
    description = " ".join(description_lines)
    return {"description": description}


def summarise_metadata(project_dir: Path, base_dir: Path) -> Dict:
    treated_dir = project_dir / "metadata" / "treated"
    treated_file = None
    if treated_dir.exists():
        for ext in ("*.tsv", "*.csv", "*.txt"):
            files = sorted(treated_dir.glob(ext))
            if files:
                treated_file = files[0]
                break
    original_dir = project_dir / "metadata" / "original"
    original_file = None
    if original_dir.exists():
        for ext in ("*.tsv", "*.csv", "*.txt"):
            files = sorted(original_dir.glob(ext))
            if files:
                original_file = files[0]
                break

    metadata: Dict = {}
    if treated_file:
        metadata["treated_file"] = relpath(treated_file, base_dir)
    if original_file:
        metadata["original_file"] = relpath(original_file, base_dir)

    if not treated_file:
        return metadata

    try:
        df = pd.read_csv(treated_file, sep="\t")
    except Exception as exc:  # pylint: disable=broad-except
        metadata.setdefault("summary", {})["error"] = f"Failed to parse {treated_file.name}: {exc}"
        return metadata

    summary: Dict[str, object] = {"total_samples": int(len(df))}
    groups: Dict[str, str] = {}

    if "sample_type" in df.columns:
        counts = df["sample_type"].fillna("(missing)").value_counts()
        groups["Sample types"] = ", ".join(f"{idx}: {cnt}" for idx, cnt in counts.items())
    if "ATTRIBUTE_condition" in df.columns:
        counts = df["ATTRIBUTE_condition"].fillna("(missing)").value_counts()
        groups["Conditions"] = ", ".join(f"{idx}: {cnt}" for idx, cnt in counts.items())
    if groups:
        summary["groups"] = groups
    metadata["summary"] = summary

    categorical_summary = []
    total = float(len(df)) or 1.0
    for column in CATEGORICAL_COLUMNS:
        if column not in df.columns:
            continue
        counts = df[column].fillna("(missing)").value_counts()
        rows = []
        for level, count in counts.items():
            rows.append(
                {
                    "level": str(level),
                    "count": int(count),
                    "fraction": float(count) / total,
                }
            )
        categorical_summary.append({"column": column, "counts": rows})
    if categorical_summary:
        metadata["categorical_counts"] = categorical_summary

    featured = []
    for column, description in COLUMN_DESCRIPTIONS.items():
        if column not in df.columns:
            continue
        examples = [str(v) for v in df[column].dropna().astype(str).unique()[:5]]
        featured.append({
            "name": column,
            "description": description,
            "examples": examples,
        })
    if featured:
        metadata["featured_columns"] = featured

    return metadata


def summarise_mzmine(project_dir: Path, base_dir: Path) -> Dict:
    mzmine_dir = project_dir / "results" / "mzmine"
    if not mzmine_dir.exists():
        return {}
    data: Dict[str, object] = {}
    batch_files = sorted(mzmine_dir.glob("*.mzbatch"))
    if batch_files:
        data["batch_file"] = relpath(batch_files[0], base_dir)
    quant_files = sorted(mzmine_dir.glob("*_quant.csv"))
    if quant_files:
        data["quant_table"] = relpath(quant_files[0], base_dir)
    mgf_entries = []
    for mgf in sorted(mzmine_dir.glob("*.mgf")):
        label = "SIRIUS export" if "sirius" in mgf.stem.lower() else "MGF"
        mgf_entries.append({"label": label, "path": relpath(mgf, base_dir)})
    if mgf_entries:
        data["mgf_files"] = mgf_entries
    other_exports = []
    for export in sorted(mzmine_dir.glob("*.csv")):
        if quant_files and export == quant_files[0]:
            continue
        other_exports.append({"label": export.name, "path": relpath(export, base_dir)})
    if other_exports:
        data["exports"] = other_exports
    quality_plots = []
    for plot in sorted(mzmine_dir.glob("*.png")) + sorted(mzmine_dir.glob("*.svg")):
        quality_plots.append({"path": relpath(plot, base_dir), "caption": plot.stem})
    if quality_plots:
        data["quality_plots"] = quality_plots
    return data


def summarise_sirius(project_dir: Path, base_dir: Path, max_hits: int) -> Dict:
    sirius_dir = project_dir / "results" / "sirius"
    if not sirius_dir.exists():
        return {}

    data: Dict[str, object] = {}
    files: List[Dict[str, str]] = []
    for name in [
        "structure_identifications.tsv",
        "canopus_structure_summary.tsv",
    ]:
        path = sirius_dir / name
        if path.exists():
            files.append({"label": name, "path": relpath(path, base_dir)})
    if files:
        data["files"] = files

    structure_path = sirius_dir / "structure_identifications.tsv"
    canopus_path = sirius_dir / "canopus_structure_summary.tsv"

    canopus_df: Optional[pd.DataFrame] = None
    if canopus_path.exists():
        try:
            canopus_df = pd.read_csv(canopus_path, sep="\t")
        except Exception:  # pylint: disable=broad-except
            canopus_df = None

    structure_df: Optional[pd.DataFrame] = None
    if structure_path.exists():
        try:
            structure_df = pd.read_csv(structure_path, sep="\t")
        except Exception:  # pylint: disable=broad-except
            structure_df = None

    class_counts: List[Dict[str, object]] = []
    if canopus_df is not None and "NPC#class" in canopus_df.columns:
        counts = canopus_df["NPC#class"].fillna("(unassigned)").value_counts().head(10)
        for cclass, count in counts.items():
            class_counts.append({"class": str(cclass), "count": int(count)})
    if class_counts:
        data["class_distribution"] = class_counts

    if structure_df is not None and not structure_df.empty:
        annotations = []
        df = structure_df.copy()
        score_col = None
        for candidate in ["CSI:FingerIDScore", "ConfidenceScoreExact", "score"]:
            if candidate in df.columns:
                score_col = candidate
                break
        if score_col:
            df = df.sort_values(score_col, ascending=False)
        if "alignedFeatureId" in df.columns:
            df = df.drop_duplicates(subset=["alignedFeatureId"], keep="first")
        for _, row in df.head(max_hits).iterrows():
            feature_id = str(row.get("alignedFeatureId", row.get("mappingFeatureId", "")))
            compound = row.get("name") or row.get("compoundId") or ""
            score_value = row.get(score_col) if score_col else None
            formula = row.get("molecularFormula") or row.get("formula")
            chem_class = ""
            if canopus_df is not None and "alignedFeatureId" in canopus_df.columns:
                subset = canopus_df.loc[canopus_df["alignedFeatureId"] == row.get("alignedFeatureId")]
                if not subset.empty and "NPC#class" in subset.columns:
                    chem_class = subset.iloc[0]["NPC#class"]
            annotations.append(
                {
                    "feature_id": feature_id,
                    "compound": str(compound),
                    "formula": str(formula) if formula is not None else "",
                    "score": float(score_value) if pd.notna(score_value) else None,
                    "class": str(chem_class) if chem_class is not None else "",
                }
            )
        if annotations:
            data["top_annotations"] = annotations

    return data


def pick_stats_run(project_dir: Path) -> Optional[Path]:
    stats_dir = project_dir / "results" / "stats"
    if not stats_dir.exists():
        return None
    params_log = stats_dir / "params_log.tsv"
    if params_log.exists():
        try:
            df = pd.read_csv(params_log, sep="\t")
            if not df.empty and "timestamp" in df.columns:
                df["timestamp_parsed"] = pd.to_datetime(df["timestamp"], errors="coerce")
                df = df.sort_values("timestamp_parsed", ascending=True)
                latest = df.iloc[-1]
                stats_hash = latest.get("hash")
                if isinstance(stats_hash, str):
                    candidate = stats_dir / stats_hash
                    if candidate.exists():
                        return candidate
        except Exception:  # pylint: disable=broad-except
            pass
    subdirs = [p for p in stats_dir.iterdir() if p.is_dir()]
    if not subdirs:
        return None
    return sorted(subdirs)[-1]


def summarise_stats(project_dir: Path, base_dir: Path, preferred_job_id: Optional[str] = None) -> Dict:
    run_dir: Optional[Path] = None
    if preferred_job_id:
        candidate = project_dir / "results" / "stats" / preferred_job_id
        if candidate.exists():
            run_dir = candidate
    if run_dir is None:
        run_dir = pick_stats_run(project_dir)
    if not run_dir:
        return {}
    data: Dict[str, object] = {}

    def pick_plot(name: str) -> Optional[str]:
        for ext in (".svg", ".png", ".html", ".pdf"):
            candidate = run_dir / f"{name}{ext}"
            if candidate.exists():
                return relpath(candidate, base_dir)
        return None

    def collect_tables(prefix: str) -> List[Dict[str, str]]:
        outputs: List[Dict[str, str]] = []
        for suffix in ["_scores.tsv", "_scores.csv", "_loadings.tsv", "_loadings.csv", "_VIP.tsv", "_VIP.csv"]:
            candidate = run_dir / f"{prefix}{suffix}"
            if candidate.exists():
                outputs.append({"label": candidate.name, "path": relpath(candidate, base_dir)})
        return outputs

    pca_plot = pick_plot("PCA")
    pca_tables = collect_tables("PCA")
    if pca_plot or pca_tables:
        data["pca"] = {
            "primary_plot": pca_plot,
            "tables": pca_tables,
            "caption": "PCA scores"
            if pca_plot and pca_plot.endswith(".html")
            else "PCA scores plot",
        }

    pls_plot = pick_plot("PLSDA")
    pls_tables = collect_tables("PLSDA")
    if pls_plot or pls_tables:
        data["plsda"] = {
            "primary_plot": pls_plot,
            "tables": pls_tables,
            "caption": "PLS-DA scores",
        }

    volcano_entries = []
    if run_dir.exists():
        seen: Dict[str, Dict[str, object]] = {}
        for path in sorted(run_dir.glob("Volcano*")):
            stem = path.stem
            title = stem.replace("_", " ")
            entry = seen.setdefault(stem, {"title": title, "extra_plots": []})
            rel = relpath(path, base_dir)
            if not rel:
                continue
            if "primary_plot" not in entry:
                entry["primary_plot"] = rel
                entry["caption"] = title
            else:
                entry.setdefault("extra_plots", []).append({"path": rel, "caption": title})
        volcano_entries = list(seen.values())
    if volcano_entries:
        data["volcano_plots"] = volcano_entries

    summary_tables = []
    for name in [
        "summary_stats_table_selected.csv",
        "summary_stats_table_full.csv",
        "foldchange_pvalues.csv",
        "metaboverse_table.tsv",
    ]:
        candidate = run_dir / name
        if candidate.exists():
            summary_tables.append({"label": name, "path": relpath(candidate, base_dir)})
    if summary_tables:
        data["summary_tables"] = summary_tables

    return data


def main() -> None:
    args = parse_args()
    answers = load_copier_answers()

    if not args.project_id:
        args.project_id = answers.get("recorded_mapp_project") or answers.get("mapp_project")
    if not args.batch_id:
        args.batch_id = answers.get("recorded_mapp_batch") or answers.get("mapp_batch")

    if not args.project_id or not args.batch_id:
        raise SystemExit("Project and batch identifiers must be provided via arguments or .copier-answers.yml")

    if not args.site_base_url:
        repo_name_default = answers.get("repository_name") or answers.get("recorded_repository_name")
        github_user_default = answers.get("github_username") or answers.get("recorded_github_username")
        if repo_name_default and github_user_default:
            args.site_base_url = f"https://github.com/{github_user_default}/{repo_name_default}/blob/main/docs/"
    if args.site_base_url and not args.site_base_url.endswith("/"):
        args.site_base_url += "/"

    project_dir = resolve_project_directory(args)
    if args.relative_to:
        base_dir = Path(args.relative_to).expanduser().resolve()
    else:
        base_dir = (project_dir / "report").resolve()

    output_path = (
        Path(args.output).expanduser().resolve()
        if args.output
        else (project_dir / "report" / "context.yml")
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    base_dir.mkdir(parents=True, exist_ok=True)

    context: Dict[str, object] = {}
    now = (
        dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    context["generated_at"] = now
    project_id = args.project_id or project_dir.parent.name
    batch_id = args.batch_id or project_dir.name
    project_info: Dict[str, object] = {
        "id": project_id,
        "batch_id": batch_id,
    }
    project_info.update(read_contrib(project_dir))

    repo_name_default = answers.get("repository_name") or answers.get("recorded_repository_name")
    github_user_default = answers.get("github_username") or answers.get("recorded_github_username")
    if repo_name_default:
        project_info.setdefault("repository_name", repo_name_default)
    if github_user_default:
        project_info.setdefault("github_username", github_user_default)

    stats_dir = project_dir / "results" / "stats"
    params_log = stats_dir / "params_log.tsv"
    if params_log.exists():
        try:
            params_df = pd.read_csv(params_log, sep="\t")
            if not params_df.empty:
                latest = params_df.sort_values("timestamp", ascending=True).iloc[-1]
                title = latest.get("dataset_experiment.name")
                description = latest.get("dataset_experiment.description")
                if isinstance(title, str):
                    project_info.setdefault("title", title)
                if isinstance(description, str):
                    existing = project_info.get("description")
                    if not existing:
                        project_info["description"] = description
                condition = latest.get("filter_sample_metadata_one.levels")
                if isinstance(condition, str) and condition and condition != "NA":
                    project_info["primary_group"] = condition
        except Exception:  # pylint: disable=broad-except
            pass

    if answers.get("mapp_batch_description"):
        project_info["description"] = answers["mapp_batch_description"]

    context["project"] = project_info
    context["metadata"] = summarise_metadata(project_dir, base_dir)
    context["mzmine"] = summarise_mzmine(project_dir, base_dir)
    context["sirius"] = summarise_sirius(project_dir, base_dir, args.top_annotations)
    preferred_stats_job = answers.get("stats_job_id") or answers.get("recorded_stats_job_id")
    context["stats"] = summarise_stats(project_dir, base_dir, preferred_stats_job)
    if args.site_base_url:
        context["site"] = {"base_url": args.site_base_url}

    with output_path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(
            context,
            handle,
            sort_keys=False,
            allow_unicode=False,
        )
    print(f"Context written to {output_path}")


if __name__ == "__main__":
    main()
