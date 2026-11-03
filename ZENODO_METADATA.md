# Metadatos propuestos para Zenodo

**Tipo de recurso propuesto:** Software (el registro reúne código de simulación y análisis junto con datos suplementarios agregados; confirmar la categoría disponible en Zenodo).  
**Título:** M-3 research supplement: simulation code, synthetic profiles and aggregated results  
**Versión propuesta:** 1.0.0 (no publicar hasta revisión y aprobación de ambos autores).  
**Idioma principal:** Español.  
**DOI:** no asignado; Zenodo lo asignará al publicar la versión archivada.

## Creadores

1. Estefano Dubersky Urbina-Justiniano — Facultad de Ingeniería, Escuela de Ingeniería de Sistemas, Universidad Nacional de Trujillo, Perú.
2. José Brandon Laiza-Condormango — Facultad de Ingeniería, Escuela de Ingeniería de Sistemas, Universidad Nacional de Trujillo, Perú.

No se incluyen ORCID porque no han sido confirmados por ambos autores.

## Descripción sugerida

Material suplementario asociado a un estudio computacional de simulación M-3 del ciclo mina-molino. Incluye un generador determinista de perfiles sintéticos basado en ecuaciones y supuestos del manuscrito; el motor de investigación v3, catálogo de escenarios y checkpoints PPO; el ejecutor por lotes y pruebas de software; resúmenes estadísticos agregados de dos experimentos completos (24 escenarios, 300 réplicas por escenario; 57.600 filas para E1 y 72.000 para E2); un script para recalcular pruebas confirmatorias, corrección de Holm, pruebas de Wilcoxon, tamaños de efecto e intervalos bootstrap; y documentación de procedencia y limitaciones. Incluye además un análisis estadístico separado de 14 surveys SAG publicados para la operación Constancia.

Los perfiles de M-3 son reconstrucciones sintéticas desde ecuaciones, parámetros y semillas declarados en el manuscrito; no son datos de campo ni archivos históricos originales recuperados. Los resultados son estimaciones de simulación, no ahorros operativos observados. La ecuación energética SAG de M-3 no está calibrada con datos de planta y no se implementó una función de transferencia del chancador.

Los resúmenes agregados se incluyen en `data/m3/`. Los CSV individuales de 129.600 filas no están incluidos en la instantánea Git; pueden regenerarse mediante los scripts. Si los autores o la revista requieren que los registros individuales formen parte del depósito, deben adjuntarse como archivos separados antes de publicar el registro. El análisis de Constancia no calibra ni valida M-3; la transcripción fila por fila de la Tabla 13-2 y el informe de Hudbay no se redistribuyen aquí.

## Palabras clave

- simulación minera
- Mine-to-Mill
- despacho de camiones
- fragmentación de roca
- molienda SAG
- reproducibilidad computacional
- perfiles sintéticos
- análisis estadístico

## Referencias relacionadas

- Repositorio del suplemento: https://github.com/botstefano/M3-Research-Supplement
- Código de origen y ejecución: https://github.com/botstefano/M3-GemeloDigital-Limpio
- Ejecución integral: https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366
- Hudbay Minerals Inc. (2021). *NI 43-101 Technical Report: Constancia Mine, Cuzco, Peru*. Tabla 13-2.

## Licencia

No seleccionar CC0, CC-BY ni otra licencia hasta que ambos autores confirmen por escrito la licencia aplicable a cada componente que pueden distribuir. Zenodo exige seleccionar una licencia compatible con los derechos del contenido depositado.
