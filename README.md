# M-3 Research Supplement

**Material suplementario del estudio de simulación M-3**

Este repositorio independiente reúne resultados agregados de dos experimentos de simulación M-3 y tablas estadísticas agregadas derivadas de un análisis externo de 14 surveys SAG publicados para la operación Constancia.

> **Alcance y límites:** este repositorio no contiene el motor ejecutable M-3 ni los registros individuales de sus simulaciones. Tampoco incluye la transcripción fila por fila de la Tabla 13-2 del informe de Hudbay Minerals ni gráficos que muestren sus observaciones individuales. Los resultados externos SAG no calibran, validan ni ajustan el motor M-3.

## Estructura

```text
M3-Research-Supplement/
├── data/
│   ├── m3/
│   │   ├── experiment1_policy_summary.csv
│   │   └── experiment2_contrasts_summary.csv
│   └── constancia_aggregated/
│       ├── sag_comparacion_por_mena_exploratoria.csv
│       ├── sag_correlaciones.csv
│       ├── sag_estadisticas_descriptivas.csv
│       ├── sag_metricas_modelo_vs_planta.csv
│       ├── sag_resumen_por_fecha.csv
│       └── sag_resumen_por_tipo_mena.csv
├── docs/
├── scripts/
├── CITATION.cff
├── ZENODO_METADATA.md
├── LICENSE_PENDING.md
└── MANIFEST_SHA256.txt
```

## Resultados de simulación M-3

- `data/m3/experiment1_policy_summary.csv`: diferencias relativas descriptivas frente a la asignación fija, resumidas entre 24 escenarios para cada política e indicador. Los resúmenes promedian primero las 300 réplicas dentro de cada escenario y resumen luego las diferencias entre escenarios.
- `data/m3/experiment2_contrasts_summary.csv`: medianas, rangos y conteos de escenarios con `p_holm < 0.05`, por resultado, contraste y orientación.

Los tamaños descritos en el estudio son 24 escenarios × 8 políticas × 300 réplicas para el experimento 1 (57 600 ejecuciones) y 24 escenarios × 10 políticas × 300 réplicas para el experimento 2 (72 000 ejecuciones). Los CSV incluidos son resúmenes agregados, no datos individuales. No permiten reconstruir todas las réplicas, todos los valores p ni el motor v3.

## Análisis externo SAG de Constancia

La carpeta `data/constancia_aggregated/` contiene seis archivos con estadísticas descriptivas, métricas de comparación Shell Model frente a Shell Plant, correlaciones y resúmenes exploratorios. Proceden de un análisis de 14 surveys publicados en la Tabla 13-2 del informe técnico NI 43-101 de Hudbay Minerals Inc. (2021).

La tabla original fila por fila no se redistribuye en este repositorio. Los resultados se presentan como cálculos derivados, con atribución de fuente. Las inferencias que tratan los 14 surveys como independientes son exploratorias, porque las dos líneas fueron observadas en las mismas siete fechas.

### Recalcular los resultados SAG

El script `scripts/recalcular_constancia.py` necesita un archivo CSV local que el usuario debe preparar desde la fuente original. El archivo de entrada no se incluye ni se copia al repositorio. El esquema requerido está documentado en `docs/FUENTE_Y_NOTAS_CONSTANCIA.md`.

```powershell
py -m pip install -r .\scripts\requirements.txt
py .\scripts\recalcular_constancia.py --input "RUTA\LOCAL\constancia_sag.csv"
```

El script produce seis tablas agregadas en `data/constancia_aggregated/`. No genera figuras individuales ni ejecuta, modifica o calibra M-3.

## Fuente externa

Hudbay Minerals Inc. (2021). *NI 43-101 Technical Report: Constancia Mine, Cuzco, Peru*. Tabla 13-2, “Summary of SAG Mill Surveys and Model Calibration”.

[Consultar el informe técnico original (PDF)](https://s23.q4cdn.com/405985100/files/doc_downloads/tech_reports/peru/Constancia-NI-43-101-Technical-Report-March-29-2021_FINAL.pdf).

El informe no se redistribuye aquí. La cita bibliográfica no implica que Hudbay haya autorizado la redistribución de su tabla original.

## Reproducibilidad y procedencia

- `docs/DICCIONARIO_DE_DATOS.md`: descripción de los archivos y variables.
- `docs/FUENTE_Y_NOTAS_CONSTANCIA.md`: procedencia, esquema local de entrada y limitaciones.
- `docs/METODOLOGIA_RECALCULO_SAG.md`: fórmulas y supuestos.
- `docs/MAPA_DE_EVIDENCIA.md`: correspondencia con los resultados del manuscrito.
- `docs/PROCEDENCIA_Y_LIMITACIONES.md`: versiones, alcance y límites de trazabilidad.
- `docs/CHECKLIST_PREPUBLICACION.md`: comprobaciones pendientes antes del DOI.
- `CITATION.cff` y `ZENODO_METADATA.md`: metadatos preliminares.

El manifiesto `MANIFEST_SHA256.txt` permite verificar la integridad de los archivos que contiene esta versión. No demuestra autoría, fecha de creación ni derechos de terceros.

## Licencia

La licencia de publicación está pendiente de confirmación expresa de ambos autores. No se debe publicar el registro en Zenodo hasta seleccionar una licencia compatible con todos los archivos incluidos y confirmar los derechos sobre los materiales propios y derivados. Véase `LICENSE_PENDING.md`.

## Uso responsable

Este material es académico y de investigación por simulación. No constituye información operativa de una mina ni sustituye evaluación profesional independiente.
