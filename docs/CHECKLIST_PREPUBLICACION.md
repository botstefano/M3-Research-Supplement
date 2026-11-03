# Lista de comprobación antes de publicar en Zenodo

## Contenido y correspondencia científica

- [x] Incorporar generador de perfiles sintéticos, ejecutor por lotes, motor v3, catálogo, esquema JSON y checkpoints PPO de la versión ejecutada.
- [x] Incorporar las pruebas de datos, motor, runner y generador.
- [x] Incorporar el script estadístico reproducible y sus dependencias fijadas.
- [x] Mantener los resúmenes agregados E1 y E2 en `data/m3/`.
- [x] Excluir la transcripción fila por fila de la Tabla 13-2 de Hudbay y no redistribuir el informe.
- [x] Registrar las limitaciones de perfiles sintéticos, resultados simulados, ecuación SAG no calibrada y ausencia de función de transferencia del chancador.
- [x] Documentar el esquema de licencias duales y sus límites de materiales de terceros.
- [ ] Confirmar que el título, orden de autores y afiliaciones coinciden exactamente con el manuscrito definitivo.
- [ ] Confirmar las políticas de la Universidad y de la revista sobre licencia y depósito.
- [x] Preparar y verificar los ZIP suplementarios con perfiles sintéticos, CSV individuales E1/E2, manifiestos y análisis; registrar SHA-256 en `ZENODO_UPLOAD_PLAN.md`.
- [ ] Adjuntar ambos ZIP al registro Zenodo y verificar sus SHA-256 después de la descarga.

## Reproducibilidad e integridad

- [x] Registrar el commit exacto utilizado en la ejecución integral: `72e7e78812c76eb574c80402176588507697068c`.
- [x] Registrar la ejecución integral: [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366).
- [x] Versionar generador, ejecutor, motor, checkpoints, pruebas y script estadístico.
- [x] Incorporar CI con pruebas del motor y smoke tests de generación/ejecución para ambos experimentos.
- [x] Ejecutar las pruebas del repositorio en un clon limpio de GitHub Actions.
- [x] Regenerar el manifiesto SHA-256 para la instantánea de preparación.
- [ ] Clonar el repositorio integrado y verificar nuevamente el manifiesto antes del release.
- [ ] Ejecutar la reproducción integral de 24 escenarios × 300 réplicas en ambos experimentos desde esta instantánea del suplemento.
- [ ] Ejecutar el análisis sobre ambos CSV completos y comparar todos los resúmenes con `data/m3/`.
- [x] Definir los dos ZIP suplementarios como archivos del depósito definitivo; no almacenar los binarios en Git.
- [ ] Verificar el SHA-256 de los dos ZIP después de cargarlos y volverlos a descargar desde Zenodo.
- [x] No afirmar recuperación literal de archivos históricos ni validación industrial.

## Licencia y metadatos

- [x] Registrar la confirmación de los autores para licenciar sus contribuciones originales.
- [x] Adoptar MIT para código y CC BY 4.0 para documentación, metadatos y tablas agregadas.
- [x] Identificar expresamente que las licencias no se extienden al informe ni a la tabla original de Hudbay.
- [ ] Confirmar las políticas institucionales y editoriales.
- [ ] Confirmar ORCID solo si ambos autores desean incluirlos.
- [ ] En el registro Zenodo, seleccionar simultáneamente MIT y CC BY 4.0 y comprobar la asignación por tipo de archivo.
- [ ] Revisar título, tipo de recurso, autores, afiliaciones, resumen, palabras clave y referencia externa.

## Publicación

- [ ] Aprobar y fusionar el PR.
- [ ] Cambiar el repositorio a público después de la revisión final.
- [ ] Conectar GitHub con Zenodo y habilitar este repositorio.
- [ ] Crear la release versionada (por ejemplo `v1.0.0`) después de habilitar la integración.
- [ ] Verificar que Zenodo archive el release correcto y genere los DOI de versión y concepto.
- [ ] Revisar archivos, licencias múltiples y metadatos en el depósito antes de publicar.
- [ ] Añadir el DOI de versión al manuscrito y a la declaración de disponibilidad.
