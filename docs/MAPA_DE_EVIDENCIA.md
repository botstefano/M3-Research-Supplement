# Mapa de evidencia entre manuscrito y depósito

La numeración final de tablas y secciones debe comprobarse contra la versión del manuscrito enviada a la revista.

| Elemento | Archivo o proceso | Qué permite comprobar | Límite |
|---|---|---|---|
| Resumen de políticas E1 | `data/m3/experiment1_policy_summary.csv` | Medias, medianas y rangos de diferencias relativas por política e indicador entre escenarios | Resumen agregado; no contiene filas de cada réplica |
| Contrastes E2 | `data/m3/experiment2_contrasts_summary.csv` | Medianas, rangos y conteos de escenarios significativos tras Holm por contraste/orientación | Resumen agregado; los p por escenario se regeneran desde los CSV individuales |
| Perfiles por pala | `scripts/generate-research-v3-profiles.mjs` y `src/engine/researchScenarios.ts` | Generación determinista desde ecuaciones, semillas y escenarios | Perfiles sintéticos; no son archivos históricos ni mediciones |
| Motor y resultados por réplica | `scripts/run-research-v3-batch.mjs` y `src/engine/research-v3/` | Ejecución de 57.600 filas E1 y 72.000 E2 | Reproducción computacional del modelo reconstruido; no validación de campo |
| Contrastes estadísticos | `scripts/analyze_research_v3.py` | Pruebas pareadas, Holm, Wilcoxon, dz e intervalos bootstrap | Requiere ejecutar los CSV completos de filas individuales |
| Estadística Constancia | `data/constancia_aggregated/sag_estadisticas_descriptivas.csv` | Estadística agregada derivada de 14 surveys publicados | La tabla fuente fila por fila no se incluye |
| Comparación Shell Model/Plant | `data/constancia_aggregated/sag_metricas_modelo_vs_planta.csv` | Sesgo, MAE, RMSE, MAPE y correlación | Corresponde a otra operación; no valida M-3 |

La evidencia de ejecución integral es [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366). Los CSV individuales no están versionados en este repositorio; el generador y el ejecutor permiten regenerarlos con la instantánea de código incluida.
