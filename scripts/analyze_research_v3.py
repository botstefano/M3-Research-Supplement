#!/usr/bin/env python3
"""Recalculate confirmatory statistics for the M-3 v3 full experiment CSVs.

Inputs are the individual replication-level CSVs written by
scripts/run-research-v3-batch.mjs. Profiles are synthetic reconstructions from
manuscript equations and assumptions; this analysis does not imply field
validation or recovery of historical input files.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Iterable
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.stats.multitest import multipletests

N_BOOTSTRAP = 10_000
BOOTSTRAP_SEED = 20261103
EXPECTED = {
    1: {"rows": 57_600, "scenarios": 24, "replicates": 300, "policies": 8, "contrasts": 192},
    2: {"rows": 72_000, "scenarios": 24, "replicates": 300, "policies": 10, "contrasts": 168},
}
REQUIRED_COLUMNS = {
    "scenario_id", "replicate_id", "policy", "tph", "esag_kwh_per_t",
    "cost_usd_per_t", "co2_kg_per_t", "fuel_l_per_t", "blend_p80_mm",
    "active_trucks", "cycles",
}

def load_and_validate(path: Path, experiment: int) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = sorted(REQUIRED_COLUMNS - set(df.columns))
    if missing:
        raise ValueError(f"{path}: faltan columnas requeridas: {missing}")
    exp = EXPECTED[experiment]
    if len(df) != exp["rows"]:
        raise ValueError(f"{path}: se esperaban {exp['rows']} filas y hay {len(df)}")
    if df["scenario_id"].nunique() != exp["scenarios"]:
        raise ValueError(f"{path}: número de escenarios inesperado")
    if df["replicate_id"].nunique() != exp["replicates"]:
        raise ValueError(f"{path}: número de réplicas inesperado")
    if df["policy"].nunique() != exp["policies"]:
        raise ValueError(f"{path}: número de políticas inesperado")
    dup = int(df.duplicated(["scenario_id", "replicate_id", "policy"]).sum())
    if dup:
        raise ValueError(f"{path}: {dup} claves escenario-réplica-política duplicadas")
    nums = df.select_dtypes(include="number")
    nonfinite = int((~np.isfinite(nums)).sum().sum())
    if nonfinite:
        raise ValueError(f"{path}: {nonfinite} celdas numéricas no finitas")
    counts = df.groupby(["scenario_id", "policy"])["replicate_id"].nunique()
    if not (counts == exp["replicates"]).all():
        raise ValueError(f"{path}: una o más combinaciones escenario-política no tienen 300 réplicas")
    return df

def contrast_row(df: pd.DataFrame, scenario: str, policy: str, reference: str,
                 metric: str, rng: np.random.Generator) -> dict:
    wide = df[df.scenario_id.eq(scenario)].pivot(
        index="replicate_id", columns="policy", values=metric
    )
    x = wide[policy].to_numpy(dtype=float)
    y = wide[reference].to_numpy(dtype=float)
    d = x - y
    pct = (x / y - 1.0) * 100.0
    paired_t = stats.ttest_rel(x, y)
    try:
        wilcoxon_p = float(stats.wilcoxon(x, y, zero_method="wilcox", method="auto").pvalue)
    except ValueError:
        wilcoxon_p = float("nan")
    sample_idx = rng.integers(0, len(d), size=(N_BOOTSTRAP, len(d)), dtype=np.int16)
    boot_means = d[sample_idx].mean(axis=1)
    ci_low, ci_high = np.quantile(boot_means, [0.025, 0.975])
    sd = float(d.std(ddof=1))
    return {
        "scenario_id": scenario, "policy": policy, "reference": reference, "metric": metric,
        "mean_policy": float(x.mean()), "mean_reference": float(y.mean()),
        "relative_difference_pct": float((x.mean() / y.mean() - 1.0) * 100.0),
        "paired_relative_pct_mean": float(pct.mean()),
        "paired_relative_pct_median": float(np.median(pct)),
        "paired_relative_pct_min": float(pct.min()),
        "paired_relative_pct_max": float(pct.max()),
        "mean_paired_difference": float(d.mean()), "sd_paired_difference": sd,
        "cohen_dz": float(d.mean() / sd) if sd > 0 else float("nan"),
        "bootstrap_95_low_difference": float(ci_low), "bootstrap_95_high_difference": float(ci_high),
        "p_t_paired": float(paired_t.pvalue), "p_wilcoxon": wilcoxon_p, "n": int(len(d)),
    }

def adjust_family(rows: list[dict], expected_count: int) -> pd.DataFrame:
    out = pd.DataFrame(rows)
    if len(out) != expected_count:
        raise RuntimeError(f"Familia confirmatoria esperada: {expected_count}; obtenida: {len(out)}")
    out["p_t_holm"] = multipletests(out.p_t_paired, method="holm")[1]
    out["significant_t_holm"] = out.p_t_holm < 0.05
    out["p_wilcoxon_holm"] = multipletests(out.p_wilcoxon.fillna(1.0), method="holm")[1]
    out["significant_wilcoxon_holm"] = out.p_wilcoxon_holm < 0.05
    return out

def build_family_exp1(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    scenarios = list(df.scenario_id.drop_duplicates())
    for policy in ["heuristic_projected", "multicriteria", "rl"]:
        for metric in ["tph", "esag_kwh_per_t"]:
            for scenario in scenarios:
                rows.append(contrast_row(df, scenario, policy, "fixed", metric, rng))
    for policy, reference in [("multicriteria", "multicriteria_no_digg"), ("rl", "rl_no_digg")]:
        for scenario in scenarios:
            rows.append(contrast_row(df, scenario, policy, reference, "esag_kwh_per_t", rng))
    return adjust_family(rows, EXPECTED[1]["contrasts"])

def build_family_exp2(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    scenarios = list(df.scenario_id.drop_duplicates())
    for policy, reference in [
        ("multicriteria", "multicriteria_no_digg"),
        ("rl_w2", "rl_w2_clean"),
        ("rl_w6", "rl_w6_clean"),
    ]:
        for scenario in scenarios:
            rows.append(contrast_row(df, scenario, policy, reference, "esag_kwh_per_t", rng))
    for policy in ["rl_w2", "rl_w6"]:
        for metric in ["esag_kwh_per_t", "tph"]:
            for scenario in scenarios:
                rows.append(contrast_row(df, scenario, policy, "fixed", metric, rng))
    return adjust_family(rows, EXPECTED[2]["contrasts"])

def ratio_summary(table: pd.DataFrame, policy: str, reference: str, metric: str,
                  scenarios: Iterable[str] | None = None) -> dict:
    selected = table[(table.policy == policy) & (table.reference == reference) & (table.metric == metric)]
    if scenarios is not None:
        selected = selected[selected.scenario_id.isin(set(scenarios))]
    return {
        "n": int(len(selected)), "median_pct": float(selected.relative_difference_pct.median()),
        "min_pct": float(selected.relative_difference_pct.min()),
        "max_pct": float(selected.relative_difference_pct.max()),
        "mean_pct": float(selected.relative_difference_pct.mean()),
        "holm_sig": int(selected.significant_t_holm.sum()),
    }

def descriptive_tables(df: pd.DataFrame, output_dir: Path, experiment: int) -> None:
    stem = f"experiment{experiment}"
    overall = df.groupby("policy").agg(
        tph_mean=("tph", "mean"), tph_sd=("tph", "std"),
        esag_mean=("esag_kwh_per_t", "mean"), esag_sd=("esag_kwh_per_t", "std"),
        cost_mean=("cost_usd_per_t", "mean"), cost_sd=("cost_usd_per_t", "std"),
        co2_mean=("co2_kg_per_t", "mean"), co2_sd=("co2_kg_per_t", "std"),
        fuel_mean=("fuel_l_per_t", "mean"), p80_blend_mean=("blend_p80_mm", "mean"),
    ).reset_index()
    overall.to_csv(output_dir / f"{stem}_policy_descriptives.csv", index=False, float_format="%.8g")
    means = df.groupby(["scenario_id", "policy"]).agg(
        tph_mean=("tph", "mean"), esag_mean=("esag_kwh_per_t", "mean"),
        cost_mean=("cost_usd_per_t", "mean"), co2_mean=("co2_kg_per_t", "mean"),
        fuel_mean=("fuel_l_per_t", "mean"), p80_blend_mean=("blend_p80_mm", "mean"),
        cycles_mean=("cycles", "mean"), active_trucks_mean=("active_trucks", "mean"),
    ).reset_index()
    for metric in ["tph_mean", "esag_mean", "cost_mean", "co2_mean"]:
        baseline = means[means.policy == "fixed"][["scenario_id", metric]].rename(
            columns={metric: "fixed_" + metric}
        )
        means = means.merge(baseline, on="scenario_id", how="left")
        means[metric.replace("_mean", "_relative_pct")] = (
            means[metric] / means["fixed_" + metric] - 1.0
        ) * 100.0
    means.to_csv(output_dir / f"{stem}_scenario_policy_means.csv", index=False, float_format="%.8g")

def create_published_summaries(means1: pd.DataFrame, t2: pd.DataFrame, output_dir: Path) -> None:
    rows = []
    for policy, group in means1.groupby("policy", sort=True):
        row = {"policy": policy}
        for metric, column in [("tph", "tph_relative_pct"), ("esag", "esag_relative_pct"),
                               ("cost", "cost_relative_pct"), ("co2", "co2_relative_pct")]:
            values = group[column].dropna()
            row[f"{metric}_mean_rel_pct"] = values.mean()
            row[f"{metric}_median_rel_pct"] = values.median()
            row[f"{metric}_min_scenario_pct"] = values.min()
            row[f"{metric}_max_scenario_pct"] = values.max()
        rows.append(row)
    pd.DataFrame(rows).to_csv(output_dir / "experiment1_policy_summary.csv", index=False, float_format="%.8g")
    summary_rows = []
    for _, row in t2.iterrows():
        orientation = "near" if row.scenario_id.endswith("_hetnear") else "far"
        summary_rows.append({
            "outcome": "tph" if row.metric == "tph" else "esag",
            "contrast": f"{row.policy}_vs_{row.reference}",
            "orientation": orientation,
            "relative_difference_pct": row.relative_difference_pct,
            "significant_holm": bool(row.significant_t_holm),
        })
    grouped = pd.DataFrame(summary_rows).groupby(["outcome", "contrast", "orientation"], sort=True).agg(
        n_scenarios=("relative_difference_pct", "size"),
        median_relative_pct=("relative_difference_pct", "median"),
        min_relative_pct=("relative_difference_pct", "min"),
        max_relative_pct=("relative_difference_pct", "max"),
        significant_holm=("significant_holm", "sum"),
    ).reset_index()
    grouped.to_csv(output_dir / "experiment2_contrasts_summary.csv", index=False, float_format="%.8g")

def create_summary(df1: pd.DataFrame, df2: pd.DataFrame,
                   t1: pd.DataFrame, t2: pd.DataFrame) -> dict:
    def base_summary(df: pd.DataFrame, contrasts: pd.DataFrame) -> dict:
        return {
            "rows": int(len(df)), "scenarios": int(df.scenario_id.nunique()),
            "replications": int(df.replicate_id.nunique()),
            "policies": sorted(df.policy.unique().tolist()),
            "duplicate_keys": int(df.duplicated(["scenario_id", "replicate_id", "policy"]).sum()),
            "nonfinite_numeric_cells": int((~np.isfinite(df.select_dtypes(include="number"))).sum().sum()),
            "contrast_family_size": int(len(contrasts)),
            "holm_significant_t": int(contrasts.significant_t_holm.sum()),
            "wilcoxon_holm_agreement_count": int((contrasts.significant_t_holm == contrasts.significant_wilcoxon_holm).sum()),
        }
    s1, s2 = base_summary(df1, t1), base_summary(df2, t2)
    ids1 = list(df1.scenario_id.drop_duplicates())
    h1_ids = [s for s in ids1 if s.startswith(("2p8c_none_", "4p16c_none_"))]
    h2_ids = [s for s in ids1 if s not in h1_ids]
    far_ids1 = [s for s in ids1 if s.endswith("_het")]
    near_ids2 = [s for s in df2.scenario_id.drop_duplicates() if s.endswith("_hetnear")]
    far_ids2 = [s for s in df2.scenario_id.drop_duplicates() if s.endswith("_het")]
    s1["key_comparisons"] = {
        "projected_vs_fixed_tph_h1": ratio_summary(t1, "heuristic_projected", "fixed", "tph", h1_ids),
        "projected_vs_fixed_tph_h2": ratio_summary(t1, "heuristic_projected", "fixed", "tph", h2_ids),
        "ppo_vs_fixed_tph_h2": ratio_summary(t1, "rl", "fixed", "tph", h2_ids),
        "multicriteria_vs_fixed_energy_fine_far": ratio_summary(t1, "multicriteria", "fixed", "esag_kwh_per_t", far_ids1),
        "multicriteria_vs_control_energy_fine_far": ratio_summary(t1, "multicriteria", "multicriteria_no_digg", "esag_kwh_per_t", far_ids1),
        "multicriteria_vs_fixed_productivity_fine_far": ratio_summary(t1, "multicriteria", "fixed", "tph", far_ids1),
    }
    s2["key_comparisons"] = {
        "multicriteria_vs_control_energy_far": ratio_summary(t2, "multicriteria", "multicriteria_no_digg", "esag_kwh_per_t", far_ids2),
        "multicriteria_vs_control_energy_near": ratio_summary(t2, "multicriteria", "multicriteria_no_digg", "esag_kwh_per_t", near_ids2),
        "ppo_w2_vs_clean_energy_far": ratio_summary(t2, "rl_w2", "rl_w2_clean", "esag_kwh_per_t", far_ids2),
        "ppo_w2_vs_clean_energy_near": ratio_summary(t2, "rl_w2", "rl_w2_clean", "esag_kwh_per_t", near_ids2),
        "ppo_w6_vs_clean_energy_far": ratio_summary(t2, "rl_w6", "rl_w6_clean", "esag_kwh_per_t", far_ids2),
        "ppo_w6_vs_clean_energy_near": ratio_summary(t2, "rl_w6", "rl_w6_clean", "esag_kwh_per_t", near_ids2),
        "ppo_w2_vs_fixed_energy_far": ratio_summary(t2, "rl_w2", "fixed", "esag_kwh_per_t", far_ids2),
        "ppo_w2_vs_fixed_energy_near": ratio_summary(t2, "rl_w2", "fixed", "esag_kwh_per_t", near_ids2),
        "ppo_w2_vs_fixed_tph_far": ratio_summary(t2, "rl_w2", "fixed", "tph", far_ids2),
        "ppo_w2_vs_fixed_tph_near": ratio_summary(t2, "rl_w2", "fixed", "tph", near_ids2),
        "ppo_w6_vs_fixed_energy_far": ratio_summary(t2, "rl_w6", "fixed", "esag_kwh_per_t", far_ids2),
        "ppo_w6_vs_fixed_energy_near": ratio_summary(t2, "rl_w6", "fixed", "esag_kwh_per_t", near_ids2),
        "ppo_w6_vs_fixed_tph_far": ratio_summary(t2, "rl_w6", "fixed", "tph", near_ids2),
        "ppo_w6_vs_fixed_tph_near": ratio_summary(t2, "rl_w6", "fixed", "tph", far_ids2),
    }
    return {
        "analysis": {
            "method": "paired t-tests by scenario; Holm correction within experiment-specific confirmatory family; Wilcoxon sensitivity analysis; Cohen dz; percentile bootstrap CI for mean paired difference",
            "bootstrap_resamples": N_BOOTSTRAP, "bootstrap_seed": BOOTSTRAP_SEED,
            "relative_difference_definition": "100 * (mean(policy) / mean(reference) - 1), computed within each scenario",
        },
        "experiments": {"1": s1, "2": s2},
    }

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exp1", required=True, type=Path, help="CSV individual del experimento 1")
    parser.add_argument("--exp2", required=True, type=Path, help="CSV individual del experimento 2")
    parser.add_argument("--output-dir", required=True, type=Path, help="Directorio para resultados estadísticos")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    df1 = load_and_validate(args.exp1, 1)
    df2 = load_and_validate(args.exp2, 2)
    rng = np.random.default_rng(BOOTSTRAP_SEED)
    t1, t2 = build_family_exp1(df1, rng), build_family_exp2(df2, rng)
    t1.insert(0, "experiment", 1)
    t2.insert(0, "experiment", 2)
    t1.to_csv(args.output_dir / "experiment1_confirmatory_contrasts.csv", index=False, float_format="%.10g")
    t2.to_csv(args.output_dir / "experiment2_confirmatory_contrasts.csv", index=False, float_format="%.10g")
    pd.concat([t1, t2], ignore_index=True).to_csv(
        args.output_dir / "all_confirmatory_contrasts_full.csv", index=False, float_format="%.10g"
    )
    descriptive_tables(df1, args.output_dir, 1)
    descriptive_tables(df2, args.output_dir, 2)
    means1 = pd.read_csv(args.output_dir / "experiment1_scenario_policy_means.csv")
    create_published_summaries(means1, t2, args.output_dir)
    summary = create_summary(df1, df2, t1, t2)
    (args.output_dir / "analysis_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps({
        "output_dir": str(args.output_dir), "exp1_contrasts": len(t1), "exp2_contrasts": len(t2),
        "exp1_holm_significant": int(t1.significant_t_holm.sum()),
        "exp2_holm_significant": int(t2.significant_t_holm.sum()),
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
