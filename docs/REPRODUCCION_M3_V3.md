# Reproducción computacional de M-3 v3

## Alcance y procedencia

Esta guía describe cómo regenerar perfiles sintéticos, ejecutar los dos experimentos y recalcular las tablas estadísticas. La instantánea de código se copió del commit `72e7e78812c76eb574c80402176588507697068c` de [M3-GemeloDigital-Limpio](https://github.com/botstefano/M3-GemeloDigital-Limpio), utilizado en la ejecución integral confirmada en [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366).

**Los perfiles de entrada son reconstrucciones sintéticas** derivadas de las ecuaciones, parámetros, catálogo de escenarios y semillas declarados en el manuscrito. No son mediciones de campo, registros de perforación, ensayos de tamizado ni archivos históricos originales recuperados. La coincidencia del caso base con valores del manuscrito es una comprobación de consistencia, no una calibración.

## Requisitos

- Node.js 20 o posterior y npm.
- Python 3.11 o posterior recomendado.
- Espacio de almacenamiento suficiente para los perfiles JSON y los CSV de salida.

## 1. Instalar dependencias

Desde la raíz del repositorio:

~~~bash
npm install
python -m pip install -r scripts/requirements-research-analysis.txt
~~~

Las dependencias del análisis externo SAG de Constancia son independientes y están en `scripts/requirements.txt`.

## 2. Ejecutar las pruebas de software

~~~bash
npm run test:research-v3
~~~

Las pruebas comprueban contratos de datos, ejecución del motor, checkpoints, runner por lotes y reproducibilidad del generador. No constituyen validación geológica, calibración SAG ni validación industrial.

## 3. Generar perfiles de entrada

~~~bash
npm run generate:research-v3-profiles -- --experiment 1 --output ./research-input/exp1
npm run generate:research-v3-profiles -- --experiment 2 --output ./research-input/exp2
~~~

Cada experimento genera 24 escenarios × 300 archivos JSON = 7.200 archivos. En conjunto, ambos experimentos generan 14.400 archivos JSON. Los manifiestos registran semillas, parámetros, ecuaciones y la procedencia sintética.

Las semillas de evaluación son 20.001–20.300 para E1 y 30.001–30.300 para E2. El generador usa Park–Miller, descarta los primeros 50 valores uniformes y aplica Box–Muller (rama coseno). El orden de sorteo por pala es A, B y S.

## 4. Ejecutar los lotes completos

~~~bash
npm run run:research-v3 -- --experiment 1 --input-dir ./research-input/exp1 --output ./research-results/experiment1.csv
npm run run:research-v3 -- --experiment 2 --input-dir ./research-input/exp2 --output ./research-results/experiment2.csv
~~~

| Control | Experimento 1 | Experimento 2 |
|---|---:|---:|
| Escenarios | 24 | 24 |
| Réplicas por escenario | 300 | 300 |
| Políticas | 8 | 10 |
| Filas individuales esperadas | 57.600 | 72.000 |
| Contrastes confirmatorios | 192 | 168 |

El ejecutor valida los archivos de entrada antes de simular y escribe una fila por escenario, réplica y política. Los directorios `research-input/` y `research-results/` están excluidos de Git para evitar versionar archivos grandes generados.

## 5. Recalcular el análisis estadístico

~~~bash
python scripts/analyze_research_v3.py \
  --exp1 ./research-results/experiment1.csv \
  --exp2 ./research-results/experiment2.csv \
  --output-dir ./research-analysis
~~~

El script valida el número de filas, escenarios, réplicas y políticas, claves únicas y finitud de valores numéricos. Produce:

- `experiment1_confirmatory_contrasts.csv` y `experiment2_confirmatory_contrasts.csv`.
- `all_confirmatory_contrasts_full.csv`.
- Descriptivos globales por política y medias por escenario-política.
- `experiment1_policy_summary.csv` y `experiment2_contrasts_summary.csv`, equivalentes a los resúmenes versionados en `data/m3/`.
- `analysis_summary.json`.

El análisis incluye pruebas t pareadas por escenario, corrección de Holm dentro de cada familia confirmatoria, pruebas de Wilcoxon como análisis de sensibilidad, tamaño de efecto dz e intervalos bootstrap percentil del 95 % para la diferencia media pareada con 10.000 remuestreos. La semilla bootstrap es 20261103. La diferencia relativa porcentual se define como 100 × (media de la política / media de referencia − 1), calculada dentro de cada escenario.

## 6. Cotejo con la ejecución archivada

La ejecución integral confirmada está en [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366), ejecutada desde el commit `72e7e78812c76eb574c80402176588507697068c`. Los artefactos de GitHub Actions tienen retención temporal y no deben considerarse archivo permanente.

El manifiesto de perfiles registra cómo regenerar los inputs, pero no demuestra que sean los archivos históricos originales. El manuscrito no incluye los perfiles históricos por pala y réplica ni todos los registros históricos de ejecución.

## Interpretación y limitaciones

- Los resultados no son observaciones de una mina ni ahorros operativos medidos.
- No se cotejó cada salida con archivos históricos originales por réplica, que no estaban disponibles.
- La ecuación energética SAG no ha sido calibrada con datos de planta.
- No se implementó una función de transferencia de reducción granulométrica del chancador.
- La validación externa en una operación real permanece pendiente.

El estudio debe describirse como reproducción computacional de un modelo de simulación con perfiles sintéticos trazables, no como recuperación de datos históricos ni como gemelo digital industrial validado.
