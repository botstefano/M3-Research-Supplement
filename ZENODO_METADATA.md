# Metadatos propuestos para Zenodo

**Tipo de recurso propuesto:** Software (incluye código ejecutable y datos complementarios agregados).  
**Título:** M-3 research supplement: simulation software, synthetic profiles and aggregated research data  
**Versión propuesta:** 1.0.0 (release prevista después de aprobar el PR y habilitar la integración).  
**Idioma principal:** Español.  
**DOI:** no asignado; Zenodo lo asignará al publicar la versión archivada.

## Creadores

1. Estefano Dubersky Urbina-Justiniano — Facultad de Ingeniería, Escuela de Ingeniería de Sistemas, Universidad Nacional de Trujillo, Perú.
2. José Brandon Laiza-Condormango — Facultad de Ingeniería, Escuela de Ingeniería de Sistemas, Universidad Nacional de Trujillo, Perú.

No se incluyen ORCID porque no han sido confirmados.

## Descripción sugerida

Material suplementario asociado a un estudio computacional de simulación M-3 del ciclo mina-molino. Incluye un generador determinista de perfiles sintéticos basado en ecuaciones y supuestos del manuscrito; el motor de investigación v3, catálogo de escenarios y checkpoints PPO; el ejecutor por lotes y pruebas de software; resúmenes estadísticos agregados de dos experimentos completos (24 escenarios, 300 réplicas por escenario; 57.600 filas para E1 y 72.000 para E2); un script para recalcular pruebas confirmatorias, corrección de Holm, pruebas de Wilcoxon, tamaños de efecto e intervalos bootstrap; y documentación de procedencia y limitaciones. Incluye además un análisis estadístico separado de 14 surveys SAG publicados para la operación Constancia.

Los perfiles de M-3 son reconstrucciones sintéticas desde ecuaciones, parámetros y semillas declarados en el manuscrito; no son datos de campo ni archivos históricos originales recuperados. Los resultados son estimaciones de simulación, no ahorros operativos observados. La ecuación energética SAG de M-3 no está calibrada con datos de planta y no se implementó una función de transferencia del chancador.

El registro debe incluir los dos archivos suplementarios descritos en `ZENODO_UPLOAD_PLAN.md`: el ZIP de resultados individuales y análisis estadístico, y el ZIP de perfiles sintéticos y manifiestos. Los CSV individuales no se almacenan en Git, pero se adjuntan al depósito permanente para preservar la versión exacta ejecutada.

El análisis de Constancia no calibra ni valida M-3; la transcripción fila por fila de la Tabla 13-2 y el informe de Hudbay no se redistribuyen aquí.

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

## Licencias múltiples

Este depósito contiene materiales con dos licencias, de acuerdo con el esquema vigente de Zenodo para cargas con licencias mixtas:

1. **MIT** — código fuente, scripts, motor, pruebas, esquemas JSON, plantilla y checkpoints PPO.
2. **CC BY 4.0** — documentación, metadatos y tablas de datos agregadas, incluido el contenido de los dos ZIP suplementarios.

En el formulario de Zenodo, usar el selector para incluir ambas licencias y verificar su alcance antes de publicar. No usar únicamente la licencia predeterminada del formulario. La guía oficial está en https://help.zenodo.org/docs/deposit/describe-records/licenses/.

CC BY 4.0 cubre únicamente derechos que los autores pueden licenciar en sus cálculos, selección y presentación; no cubre el informe de Hudbay ni supone autorización de Hudbay sobre sus materiales.
