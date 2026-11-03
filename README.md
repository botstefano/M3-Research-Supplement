# M-3 Research Supplement

**Material suplementario del estudio computacional de simulación M-3 (Mine-to-Mill).**

> **Estado: revisión previa a publicación.** El repositorio permanece privado, no tiene DOI y el PR de preparación está pendiente de aprobación. Los autores confirmaron la distribución de sus contribuciones originales bajo el esquema de licencias duales documentado en [LICENSING.md](LICENSING.md).

## Propósito

Este repositorio reúne el código, la documentación y las tablas agregadas para reconstruir y ejecutar los experimentos computacionales M-3, junto con un análisis estadístico independiente de 14 surveys SAG publicados para la operación Constancia.

M-3 se presenta como un **modelo de simulación**. No es un gemelo digital conectado a una mina real ni una implementación validada industrialmente.

## Contenido

- **Código M-3 v3:** generador de perfiles, ejecutor por lotes, motor, catálogo de escenarios, esquema JSON, checkpoints PPO y pruebas. Esta instantánea procede del commit `72e7e78812c76eb574c80402176588507697068c` de [M3-GemeloDigital-Limpio](https://github.com/botstefano/M3-GemeloDigital-Limpio), empleado en la ejecución integral documentada.
- **Resultados agregados M-3:** dos resúmenes CSV en `data/m3/`.
- **Análisis estadístico reproducible:** `scripts/analyze_research_v3.py`, con dependencias fijadas en `scripts/requirements-research-analysis.txt`.
- **Análisis externo SAG de Constancia:** seis tablas estadísticas agregadas, documentación de procedencia y un script separado para recalcularlas.
- **Datos completos para archivo:** dos ZIP independientes, preparados y verificados para adjuntar a Zenodo. Su contenido, tamaños y SHA-256 están en [ZENODO_UPLOAD_PLAN.md](ZENODO_UPLOAD_PLAN.md).
- **Documentación y metadatos:** guía de reproducción, diccionario de datos, mapa de evidencia, procedencia, limitaciones, `CITATION.cff` y metadatos propuestos para Zenodo.

## Reproducción de M-3

La guía paso a paso está en [docs/REPRODUCCION_M3_V3.md](docs/REPRODUCCION_M3_V3.md). Para cada experimento se generan 24 escenarios × 300 réplicas: 7.200 archivos JSON por experimento, 14.400 en total. Esos perfiles son **reconstrucciones sintéticas** basadas en ecuaciones, parámetros y semillas del manuscrito; no son mediciones de campo ni archivos históricos originales recuperados.

La ejecución integral confirmada generó 57.600 filas para el experimento 1 y 72.000 para el experimento 2. Los CSV individuales no se almacenan en Git: se conservan en el ZIP suplementario destinado a Zenodo y se pueden regenerar mediante los scripts.

## Evidencia de ejecución

La ejecución integral se completó en [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366), desde el commit `72e7e78812c76eb574c80402176588507697068c`. Se verificaron los recuentos esperados, cero claves escenario-réplica-política duplicadas y cero celdas numéricas no finitas. El análisis produjo 192 contrastes confirmatorios en E1 y 168 en E2; 109 y 86, respectivamente, fueron significativos con corrección de Holm para pruebas t pareadas. Véase [docs/RESULTADOS_EJECUCION_INTEGRAL.md](docs/RESULTADOS_EJECUCION_INTEGRAL.md).

El workflow de este repositorio comprueba las pruebas de software y ejecuta smoke tests de una réplica por experimento. Ese smoke test verifica que el paquete suplementario genera las entradas y ejecuta el motor; no sustituye una nueva ejecución integral de los 48 escenarios-experimento.

## Límites de interpretación

1. Los perfiles de entrada son sintéticos y se derivan de los parámetros, ecuaciones, orientaciones y semillas indicados en el manuscrito.
2. Los resultados son estimaciones de simulación, no ahorros ni mejoras observados en una operación.
3. La ecuación energética SAG no se calibró con datos de planta y no se implementó una función de transferencia del chancador.
4. Los datos de Constancia proceden de otra operación; su análisis descriptivo/exploratorio no calibra ni valida M-3.
5. Los CSV individuales están archivados en el paquete suplementario previsto para Zenodo; el código también permite regenerarlos.

## Licencias

El código y los checkpoints se publican bajo **MIT**. La documentación, metadatos y tablas agregadas se publican bajo **CC BY 4.0**. Los archivos de Constancia no relicencian el informe ni la tabla original de Hudbay. El alcance completo está en [LICENSING.md](LICENSING.md).

## Fuente externa

Hudbay Minerals Inc. (2021). *NI 43-101 Technical Report: Constancia Mine, Cuzco, Peru*, Tabla 13-2. La tabla fuente fila por fila y el informe no se redistribuyen aquí. La referencia bibliográfica no implica autorización de Hudbay para redistribuir el documento o sus tablas.
