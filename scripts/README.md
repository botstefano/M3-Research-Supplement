# Scripts del suplemento M-3

## Motor de investigación M-3 v3 (Node.js)

- `generate-research-v3-profiles.mjs`: genera perfiles sintéticos deterministas desde el catálogo de escenarios y las ecuaciones documentadas.
- `run-research-v3-batch.mjs`: ejecuta los experimentos desde carpetas con archivos JSON por escenario y réplica.
- `test-research-v3-profile-generator.mjs`: prueba semillas, ecuaciones, orientación y reproducibilidad.
- `test-research-v3-data.mjs`: prueba contratos de datos y catálogo de escenarios.
- `test-research-v3-engine.mjs`: prueba el motor, checkpoints y ejecución.
- `test-research-batch.mjs`: prueba la interfaz del ejecutor por lotes.

La guía completa está en `docs/REPRODUCCION_M3_V3.md`. Requiere Node.js 20+ y TypeScript 5.8.2. Los perfiles generados son reconstrucciones sintéticas, no mediciones de campo.

## Análisis estadístico M-3 (Python)

Instalación:

~~~bash
python -m pip install -r scripts/requirements-research-analysis.txt
~~~

Ejecución después de generar los CSV individuales:

~~~bash
python scripts/analyze_research_v3.py --exp1 ./research-results/experiment1.csv --exp2 ./research-results/experiment2.csv --output-dir ./research-analysis
~~~

El script valida dimensiones, claves y valores numéricos; calcula los contrastes confirmatorios, Holm, Wilcoxon, tamaños de efecto, intervalos bootstrap y tablas agregadas.

## Recálculo externo SAG de Constancia

`recalcular_constancia.py` conserva el análisis externo original y requiere un CSV local preparado desde la fuente original. Ese archivo de entrada no se distribuye. Su esquema está en `docs/FUENTE_Y_NOTAS_CONSTANCIA.md`.

~~~powershell
py -m pip install -r .\scripts\requirements.txt
py .\scripts\recalcular_constancia.py --input "RUTA\LOCAL\constancia_sag.csv"
~~~

El análisis de Constancia no ejecuta, calibra ni valida el motor M-3.
