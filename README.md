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
- **Documentación y metadatos:** guía de reproducción, diccionario de datos, mapa de evidencia, procedencia, limitaciones, `CITATION.cff` y metadatos propuestos para Zenodo.

## Reproducción de M-3

La guía paso a paso está en [docs/REPRODUCCION_M3_V3.md](docs/REPRODUCCION_M3_V3.md). Para cada experimento se generan 24 escenarios × 300 réplicas: 7.200 archivos JSON por experimento, 14.400 en total. Esos perfiles son **reconstrucciones sintéticas** basadas en ecuaciones, parámetros y semillas del manuscrito; no son mediciones de campo ni archivos históricos originales recuperados.

La ejecución integral confirmada generó 57.600 filas para el experimento 1 y 72.000 para el experimento 2. Los CSV de fila individual no están versionados en este repositorio; se regeneran mediante los scripts. Las tablas agregadas incluidas pueden recalcularse desde esos CSV.

## Evidencia de ejecución

La ejecución integral se completó en [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366), desde el commit `72e7e78812c76eb574c80402176588507697068c`. Se verificaron los recuentos esperados, cero claves escenario-réplica-política duplicadas y cero celdas numéricas no finitas. El análisis produjo 192 contrastes confirmatorios en E1 y 168 en E2; 109 y 86, respectivamente, fueron significativos con corrección de Holm para pruebas t pareadas. Véase [docs/RESULTADOS_EJECUCION_INTEGRAL.md](docs/RESULTADOS_EJECUCION_INTEGRAL.md).

El workflow de este repositorio también comprueba las pruebas de software y ejecuta smoke tests de una réplica por experimento. Ese smoke test verifica que el paquete suplementario genera las entradas y ejecuta el motor; no sustituye una nueva ejecución integral de los 48 escenarios-experimento.

## Límites de interpretación

1. Los perfiles de entrada son sintéticos y se derivan de los parámetros, ecuaciones, orientaciones y semillas indicados en el manuscrito.
2. Los resultados son estimaciones de simulación, no ahorros ni mejoras observados en una operación.
3. La ecuación energética SAG no se calibró con datos de planta y no se implementó una función de transferencia del chancador.
4. Los datos de Constancia proceden de otra operación; su análisis descriptivo/exploratorio no calibra ni valida M-3.
5. Esta instantánea no incluye los 129.600 registros individuales de salida. El código permite regenerarlos. La decisión de adjuntarlos al depósito Zenodo debe tomarse antes de publicar la versión archivada.

## Estructura principal

~~~text
M3-Research-Supplement/
├── data/                       # resúmenes agregados M-3 y Constancia
├── docs/                       # método, procedencia, reproducción y resultados
├── public/research-v3/          # esquema, plantilla y checkpoints PPO
├── scripts/                    # generador, runner, pruebas y análisis
├── src/                         # motor y escenarios de investigación
├── LICENSES/                    # textos MIT y CC BY 4.0
├── LICENSING.md                 # mapa de licencias por carpeta/tipo
├── CITATION.cff
├── MANIFEST_SHA256.txt
└── ZENODO_METADATA.md
~~~

## Zenodo y cita

No crear una release ni solicitar un DOI hasta aprobar el PR y completar [docs/CHECKLIST_PREPUBLICACION.md](docs/CHECKLIST_PREPUBLICACION.md). Después de integrar el PR, cambiar el repositorio a público y habilitarlo en Zenodo; **solo entonces** crear la release `v1.0.0`. La integración archiva nuevas releases posteriores a su habilitación. El DOI se añadirá a `CITATION.cff`, README y manuscrito una vez asignado.

## Licencias

El código y los checkpoints se publican bajo **MIT**. La documentación, metadatos y tablas agregadas se publican bajo **CC BY 4.0**. Los archivos de Constancia se refieren a cálculos agregados de los autores y no relicencian el informe ni la tabla fuente de Hudbay. El alcance completo y los avisos están en [LICENSING.md](LICENSING.md), [LICENSES/](LICENSES/) y [NOTICE.md](NOTICE.md).

## Fuente externa

Hudbay Minerals Inc. (2021). *NI 43-101 Technical Report: Constancia Mine, Cuzco, Peru*, Tabla 13-2. La tabla fuente fila por fila y el informe no se redistribuyen aquí. La referencia bibliográfica no implica autorización de Hudbay para redistribuir el documento o sus tablas.
