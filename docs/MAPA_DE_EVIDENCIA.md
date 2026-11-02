# Mapa de evidencia entre manuscrito y depósito

La numeración final de tablas y secciones debe comprobarse contra la versión del manuscrito que se envíe a la revista.

| Elemento del manuscrito | Archivo relacionado | Qué permite comprobar | Límite |
|---|---|---|---|
| Resultados agregados del experimento 1 | `data/m3/experiment1_policy_summary.csv` | Resumen de diferencias relativas por política e indicador entre escenarios | No contiene resultados individuales ni todas las celdas por escenario |
| Contrastes del experimento 2 | `data/m3/experiment2_contrasts_summary.csv` | Medianas, rangos y conteos `p_holm < 0.05` por resultado, contraste y orientación | No contiene valores p individuales ni las 168 filas de contraste |
| Estadística descriptiva Constancia | `data/constancia_aggregated/sag_estadisticas_descriptivas.csv` | Estadísticos agregados calculados a partir de 14 surveys publicados | La tabla de entrada no está incluida; requiere archivo local para recalcular |
| Comparación energética Constancia | `data/constancia_aggregated/sag_metricas_modelo_vs_planta.csv` | Sesgo, MAE, RMSE, MAPE y correlación entre dos columnas energéticas | Datos de otra operación; no validan M-3 |
| Correlaciones Constancia | `data/constancia_aggregated/sag_correlaciones.csv` | Asociaciones descriptivas entre variables publicadas y ambas columnas de energía | No implica causalidad |
| Comparaciones exploratorias por mena | `data/constancia_aggregated/sag_comparacion_por_mena_exploratoria.csv` | Diferencias descriptivas y prueba exploratoria por tipo de mena | Dependencia potencial por fecha; no generalizable |

Las salidas SAG son agregados derivados de la Tabla 13-2 de Hudbay Minerals Inc. (2021). El depósito no contiene la tabla fuente fila por fila ni figuras con observaciones individuales. No debe afirmarse que estos archivos permiten reproducir íntegramente las simulaciones M-3.
