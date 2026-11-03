# Lista de comprobación antes de publicar en Zenodo

## Contenido y correspondencia científica

- [x] Incorporar generador de perfiles sintéticos, ejecutor por lotes, motor v3, catálogo, esquema JSON y checkpoints PPO de la versión ejecutada.
- [x] Incorporar las pruebas de datos, motor, runner y generador.
- [x] Incorporar el script estadístico reproducible y sus dependencias fijadas.
- [x] Mantener los resúmenes agregados E1 y E2 en `data/m3/`.
- [x] Excluir la transcripción fila por fila de la Tabla 13-2 de Hudbay y no redistribuir el informe.
- [ ] Revisar contenido y licencia con el coautor y asesor.
- [ ] Confirmar que nombres, orden de autores y afiliaciones coinciden con el manuscrito definitivo.
- [ ] Decidir si los CSV individuales E1/E2 se adjuntarán al registro Zenodo como archivos adicionales.

## Reproducibilidad e integridad

- [x] Registrar el commit exacto utilizado en la ejecución integral: `72e7e78812c76eb574c80402176588507697068c`.
- [x] Registrar la ejecución integral: [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366).
- [x] Versionar generador, ejecutor, motor, checkpoints, pruebas y script estadístico.
- [ ] Regenerar el manifiesto SHA-256 para la instantánea de preparación.
- [ ] Clonar esta rama en una instalación limpia.
- [ ] Ejecutar `npm install` y `npm run test:research-v3`.
- [ ] Generar perfiles y volver a ejecutar ambos experimentos.
- [ ] Ejecutar el análisis y comparar los resúmenes con `data/m3/`.
- [ ] Descargar y abrir el paquete exacto que se depositará.
- [ ] No afirmar recuperación literal de archivos históricos ni validación industrial.

## Licencia y metadatos

- [ ] Ambos autores deben acordar por escrito la licencia aplicable a cada archivo.
- [ ] Confirmar las políticas de la Universidad y de la revista.
- [ ] Confirmar ORCID únicamente si ambos autores facilitan sus identificadores.
- [ ] Seleccionar en Zenodo una licencia compatible con todos los componentes.
- [ ] Revisar el título, tipo de recurso, autores, afiliaciones, resumen, palabras clave y referencia externa.

## Publicación

- [ ] Integrar la rama de preparación tras la revisión.
- [ ] Cambiar el repositorio a público solo después de revisar derechos y contenido.
- [ ] Conectar GitHub con Zenodo y habilitar este repositorio.
- [ ] Crear la release versionada (por ejemplo `v1.0.0`) después de habilitar la integración.
- [ ] Verificar que Zenodo archive el release correcto y genere los DOI de versión y concepto.
- [ ] Añadir el DOI de versión al manuscrito y a la declaración de disponibilidad.
- [ ] Comprobar que el registro contiene todos los archivos prometidos.
