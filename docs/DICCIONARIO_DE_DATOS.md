# Diccionario de datos

## Resultados agregados M-3

### `data/m3/experiment1_policy_summary.csv`

| Campo | Tipo | Unidad / significado |
|---|---|---|
| `policy` | texto | Identificador de política de despacho |
| `tph_*_rel_pct` | numérico | Diferencia relativa porcentual de productividad frente a asignación fija |
| `esag_*_rel_pct` | numérico | Diferencia relativa porcentual de energía SAG frente a asignación fija |
| `cost_*_rel_pct` | numérico | Diferencia relativa porcentual del indicador de costo |
| `co2_*_rel_pct` | numérico | Diferencia relativa porcentual del indicador de emisiones |
| `mean` / `median` | numérico | Estadístico de diferencias porcentuales entre escenarios |
| `min_scenario` / `max_scenario` | numérico | Mínimo y máximo entre escenarios |

### `data/m3/experiment2_contrasts_summary.csv`

| Campo | Tipo | Unidad / significado |
|---|---|---|
| `outcome` | texto | Indicador (`esag` o `tph`) |
| `contrast` | texto | Contraste entre políticas |
| `orientation` | texto | Categoría de orientación (`far` o `near`) |
| `n_scenarios` | entero | Número de escenarios resumidos |
| `median_relative_pct` | numérico | Mediana de diferencias relativas porcentuales |
| `min_relative_pct` / `max_relative_pct` | numérico | Rango de diferencias relativas porcentuales |
| `significant_holm` | entero | Número de escenarios con `p_holm < 0.05` en el archivo de origen |

## Resultados agregados externos SAG

Los archivos de `data/constancia_aggregated/` contienen estadísticos derivados de 14 surveys publicados en Hudbay Minerals (2021). La transcripción fila por fila no está incluida.

| Archivo | Contenido |
|---|---|
| `sag_estadisticas_descriptivas.csv` | n, media, desviación estándar, error estándar, CV, mínimo, mediana, máximo e intervalos descriptivos |
| `sag_metricas_modelo_vs_planta.csv` | Sesgo, MAE, RMSE, MAPE, correlación y métricas asociadas |
| `sag_correlaciones.csv` | Correlaciones descriptivas entre variables publicadas y las dos columnas de energía |
| `sag_resumen_por_tipo_mena.csv` | Resúmenes agrupados por tipo de mena |
| `sag_comparacion_por_mena_exploratoria.csv` | Diferencia y prueba exploratoria entre tipos de mena |
| `sag_resumen_por_fecha.csv` | Número de surveys y promedio de Shell Plant agrupados por fecha |

Los resultados SAG no son datos de M-3 y no validan su motor.
