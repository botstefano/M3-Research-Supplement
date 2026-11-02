#!/usr/bin/env python3
"""Recalcula tablas estadísticas agregadas del análisis SAG de Constancia.

El CSV de entrada debe ser proporcionado localmente mediante --input.
No se distribuye aquí la transcripción fila por fila de la Tabla 13-2.
El script escribe seis tablas agregadas y no genera figuras individuales.

Este script no analiza, ejecuta, modifica ni calibra el motor M-3.
"""
from argparse import ArgumentParser
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "data" / "constancia_aggregated"

REQUIRED = [
    "survey_no",
    "grinding_line",
    "ore_type",
    "date",
    "feed_size_p80_mm",
    "sgi_min",
    "sag_ag_throughput_tph",
    "sag_mill_product_p80_microns",
    "sag_specific_energy_shell_model_kwh_t",
    "sag_specific_energy_shell_plant_kwh_t",
    "sag_correction_factor",
]

NUMERIC = [
    "feed_size_p80_mm",
    "sgi_min",
    "sag_ag_throughput_tph",
    "sag_mill_product_p80_microns",
    "sag_specific_energy_shell_model_kwh_t",
    "sag_specific_energy_shell_plant_kwh_t",
    "sag_correction_factor",
]


def parse_args():
    parser = ArgumentParser(
        description=(
            "Recalcula estadísticas agregadas de Constancia a partir "
            "de un CSV local preparado por el usuario."
        )
    )
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Ruta al CSV local con los 14 surveys y las columnas documentadas.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Carpeta de salida (por defecto: data/constancia_aggregated/).",
    )
    return parser.parse_args()


def ci_t(series: pd.Series, confidence: float = 0.95):
    values = pd.to_numeric(series, errors="raise").dropna().astype(float)
    n = len(values)
    if n < 2:
        raise ValueError("Se necesitan al menos dos observaciones para calcular el IC.")
    mean = float(values.mean())
    sd = float(values.std(ddof=1))
    se = sd / np.sqrt(n)
    critical = float(stats.t.ppf((1 + confidence) / 2, n - 1))
    return mean - critical * se, mean + critical * se


def load_input(path: Path) -> pd.DataFrame:
    path = path.expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(f"No se encontró el CSV de entrada: {path}")

    df = pd.read_csv(path)
    missing = [column for column in REQUIRED if column not in df.columns]
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {missing}")
    if len(df) != 14:
        raise ValueError(f"Se esperaban 14 surveys; se encontraron {len(df)}")
    if df[REQUIRED].isna().any().any():
        raise ValueError("Hay valores ausentes en las columnas requeridas")
    if df["survey_no"].duplicated().any():
        raise ValueError("Hay identificadores de survey duplicados")

    for column in NUMERIC:
        df[column] = pd.to_numeric(df[column], errors="raise")

    if not np.isfinite(df[NUMERIC].to_numpy(dtype=float)).all():
        raise ValueError("Las columnas numéricas contienen valores no finitos")

    df["ore_type"] = df["ore_type"].astype(str).str.strip()
    ore_types = set(df["ore_type"])
    if ore_types != {"Hypogene", "Supergene"}:
        raise ValueError(
            "La columna ore_type debe contener las categorías Hypogene y Supergene."
        )

    counts_by_ore = df["ore_type"].value_counts()
    if any(counts_by_ore.get(name, 0) < 2 for name in ("Hypogene", "Supergene")):
        raise ValueError("Se requieren al menos dos surveys de cada tipo de mena.")

    return df


def write_outputs(df: pd.DataFrame, output_dir: Path):
    output_dir = output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    model = df["sag_specific_energy_shell_model_kwh_t"].astype(float)
    plant = df["sag_specific_energy_shell_plant_kwh_t"].astype(float)
    error = model - plant
    n = len(error)

    descriptive = []
    for column in NUMERIC:
        values = df[column].astype(float)
        lower, upper = ci_t(values)
        descriptive.append(
            {
                "variable": column,
                "n": len(values),
                "mean": values.mean(),
                "sd_sample": values.std(ddof=1),
                "se": stats.sem(values),
                "cv_pct": (
                    values.std(ddof=1) / values.mean() * 100
                    if values.mean()
                    else np.nan
                ),
                "minimum": values.min(),
                "median": values.median(),
                "maximum": values.max(),
                "ci95_t_lower": lower,
                "ci95_t_upper": upper,
                "ci_assumption": (
                    "t de Student; surveys tratados como independientes"
                ),
            }
        )
    pd.DataFrame(descriptive).to_csv(
        output_dir / "sag_estadisticas_descriptivas.csv",
        index=False,
        float_format="%.6f",
    )

    bias = float(error.mean())
    sd_error = float(error.std(ddof=1))
    bias_test = stats.ttest_1samp(error, 0.0)
    bias_ci = ci_t(error)
    correlation = stats.pearsonr(model, plant)
    absolute_errors = np.abs(error.to_numpy())
    nonzero_errors = absolute_errors[absolute_errors > 0]

    metrics = [
        ("n_surveys", n, "observaciones pareadas modelo-planta"),
        ("mean_shell_model_kwh_t", model.mean(), "media aritmética"),
        ("mean_shell_plant_kwh_t", plant.mean(), "media aritmética"),
        (
            "mean_bias_model_minus_plant_kwh_t",
            bias,
            "sesgo medio; modelo menos planta",
        ),
        (
            "sd_paired_difference_kwh_t",
            sd_error,
            "desviación estándar muestral de las diferencias",
        ),
        (
            "bias_ci95_lower_kwh_t",
            bias_ci[0],
            "IC t sobre diferencias pareadas; independencia de surveys",
        ),
        (
            "bias_ci95_upper_kwh_t",
            bias_ci[1],
            "IC t sobre diferencias pareadas; independencia de surveys",
        ),
        (
            "paired_t_statistic",
            float(bias_test.statistic),
            "prueba t sobre diferencias pareadas",
        ),
        (
            "paired_t_p_value",
            float(bias_test.pvalue),
            "no rechazar H0 no demuestra equivalencia",
        ),
        ("mae_kwh_t", float(np.mean(absolute_errors)), "media del error absoluto"),
        (
            "rmse_kwh_t",
            float(np.sqrt(np.mean(error.to_numpy() ** 2))),
            "raíz de la media de errores cuadrados",
        ),
        (
            "mape_pct",
            float(np.mean(np.abs(error.to_numpy() / plant.to_numpy())) * 100),
            "porcentaje respecto a Shell Plant",
        ),
        (
            "pearson_r",
            float(correlation.statistic),
            "asociación lineal descriptiva",
        ),
        (
            "pearson_p_value",
            float(correlation.pvalue),
            "no implica causalidad ni validación predictiva",
        ),
        (
            "pearson_r_squared",
            float(correlation.statistic ** 2),
            "cuadrado de la correlación de Pearson",
        ),
        (
            "max_absolute_error_kwh_t",
            float(absolute_errors.max()),
            "máximo error absoluto",
        ),
        (
            "min_nonzero_absolute_error_kwh_t",
            float(nonzero_errors.min()) if len(nonzero_errors) else np.nan,
            "mínimo error absoluto distinto de cero",
        ),
    ]
    pd.DataFrame(
        metrics, columns=["metric", "value", "definition_or_caution"]
    ).to_csv(
        output_dir / "sag_metricas_modelo_vs_planta.csv",
        index=False,
        float_format="%.6f",
    )

    correlations = []
    for column in ["feed_size_p80_mm", "sgi_min", "sag_ag_throughput_tph"]:
        for label, energy in [("shell_model", model), ("shell_plant", plant)]:
            result = stats.pearsonr(df[column].astype(float), energy)
            correlations.append(
                {
                    "variable": column,
                    "energy_series": label,
                    "pearson_r": result.statistic,
                    "p_value_descriptive": result.pvalue,
                }
            )
    pd.DataFrame(correlations).to_csv(
        output_dir / "sag_correlaciones.csv",
        index=False,
        float_format="%.6f",
    )

    by_ore = (
        df.assign(_model=model, _plant=plant)
        .groupby("ore_type", sort=True)
        .agg(
            n=("survey_no", "count"),
            shell_model_mean=("_model", "mean"),
            shell_model_sd=("_model", "std"),
            shell_plant_mean=("_plant", "mean"),
            shell_plant_sd=("_plant", "std"),
        )
        .reset_index()
    )
    by_ore.to_csv(
        output_dir / "sag_resumen_por_tipo_mena.csv",
        index=False,
        float_format="%.6f",
    )

    hypogene = plant[df["ore_type"].eq("Hypogene")].to_numpy()
    supergene = plant[df["ore_type"].eq("Supergene")].to_numpy()
    welch = stats.ttest_ind(hypogene, supergene, equal_var=False)
    n_hypogene, n_supergene = len(hypogene), len(supergene)
    pooled_sd = np.sqrt(
        (
            (n_hypogene - 1) * np.var(hypogene, ddof=1)
            + (n_supergene - 1) * np.var(supergene, ddof=1)
        )
        / (n_hypogene + n_supergene - 2)
    )
    cohen_d = (np.mean(hypogene) - np.mean(supergene)) / pooled_sd
    correction = 1 - 3 / (4 * (n_hypogene + n_supergene) - 9)
    effect = [
        {
            "comparison": "Hypogene minus Supergene; Shell Plant energy",
            "n_hypogene": n_hypogene,
            "n_supergene": n_supergene,
            "mean_difference_kwh_t": float(
                np.mean(hypogene) - np.mean(supergene)
            ),
            "welch_t": float(welch.statistic),
            "welch_df": float(welch.df),
            "welch_p": float(welch.pvalue),
            "cohen_d_pooled_sd": float(cohen_d),
            "hedges_g": float(correction * cohen_d),
            "interpretation": (
                "exploratory; conditional on independence; "
                "two lines observed on the same dates"
            ),
        }
    ]
    pd.DataFrame(effect).to_csv(
        output_dir / "sag_comparacion_por_mena_exploratoria.csv",
        index=False,
        float_format="%.6f",
    )

    date_level = (
        df.assign(_plant=plant)
        .groupby("date", sort=True)
        .agg(
            n_surveys=("survey_no", "count"),
            ore_type=("ore_type", "first"),
            shell_plant_mean_kwh_t=("_plant", "mean"),
        )
        .reset_index()
    )
    date_level.to_csv(
        output_dir / "sag_resumen_por_fecha.csv",
        index=False,
        float_format="%.6f",
    )

    print(f"OK: {n} surveys validados desde el archivo local.")
    print(f"Se generaron seis tablas agregadas en: {output_dir}")
    print("El archivo de entrada no se copia ni se publica.")
    print(
        "Advertencia: las inferencias tratan surveys como observaciones; "
        "la dependencia potencial por fecha debe reconocerse."
    )


def main():
    args = parse_args()
    df = load_input(args.input)
    write_outputs(df, args.output_dir)


if __name__ == "__main__":
    main()
