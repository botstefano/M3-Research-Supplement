# Diccionario de datos y artefactos

## Resúmenes agregados M-3

### `data/m3/experiment1_policy_summary.csv`

Una fila por política del experimento 1. Para productividad (t/h), energía SAG (kWh/t), costo (USD/t) y CO₂ (kg/t), informa media, mediana, mínimo y máximo de la diferencia porcentual relativa frente a la política fija entre los 24 escenarios. Primero se promedian las 300 réplicas por escenario y política; después se calcula la diferencia relativa por escenario y se resumen las diferencias entre escenarios.

### `data/m3/experiment2_contrasts_summary.csv`

Una fila por resultado, contraste y orientación de los frentes finos. Incluye número de escenarios (12 por orientación), mediana y rango de la diferencia relativa porcentual entre medias por escenario y número de escenarios con prueba t pareada significativa tras Holm.

## Salidas generadas por `scripts/analyze_research_v3.py`

- `experiment1_confirmatory_contrasts.csv`: 192 contrastes confirmatorios con medias, diferencias absolutas y relativas, pruebas t pareadas, Wilcoxon, corrección Holm, dz e intervalo bootstrap del 95 %.
- `experiment2_confirmatory_contrasts.csv`: 168 contrastes con la misma estructura.
- `all_confirmatory_contrasts_full.csv`: concatenación de los 360 contrastes.
- `experiment1_policy_descriptives.csv` y `experiment2_policy_descriptives.csv`: medias y desviaciones estándar globales por política.
- `experiment1_scenario_policy_means.csv` y `experiment2_scenario_policy_means.csv`: medias por escenario y política, incluyendo diferencias relativas frente a fija.
- `analysis_summary.json`: controles de integridad y comparaciones clave.
- `experiment1_policy_summary.csv` y `experiment2_contrasts_summary.csv`: regeneran los dos resúmenes versionados en `data/m3/`.

Los CSV de fila individual generados por el ejecutor no están versionados en este repositorio; se generan durante la reproducción.

## Esquema de entrada por pala

Cada JSON generado contiene `schemaVersion`, `source`, `scenarioId`, `replicateId` y un arreglo `profiles`. Cada pala incluye `shovelIndex`, `faceId`, `p80Mm` (mm), `rockMassIndex` (A), `diggability` (D) y `powderFactorKgM3` (q, kg/m³). El esquema formal está en `public/research-v3/fragmentation-profile.schema.json`.

## Datos externos SAG de Constancia

Los archivos de `data/constancia_aggregated/` contienen estadísticos derivados de 14 surveys publicados por Hudbay Minerals Inc. (2021), Tabla 13-2. La transcripción fuente fila por fila no está incluida; se necesita preparar localmente un CSV conforme a `docs/FUENTE_Y_NOTAS_CONSTANCIA.md` para volver a calcular las tablas. Estos resultados pertenecen a otra operación y no validan M-3.
