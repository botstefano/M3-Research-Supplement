# Preparación de publicación GitHub–Zenodo

Este repositorio ya existe: https://github.com/botstefano/M3-Research-Supplement. Su rama predeterminada es `master`. No crear otro repositorio ni importar el historial Git del proyecto principal.

## Estado de preparación

- El repositorio permanece privado.
- El DOI todavía no está asignado.
- Los autores confirmaron las licencias para sus contribuciones originales: MIT para código y CC BY 4.0 para documentación, metadatos y tablas agregadas. El mapa y los límites están en `LICENSING.md`.
- El PR de preparación está en borrador y debe ser aprobado antes de integrar.
- La guía de reproducción está en `docs/REPRODUCCION_M3_V3.md`.

## Orden para la publicación

1. Revisar y aprobar el PR de preparación.
2. Clonar el repositorio integrado en una instalación limpia, ejecutar todas las pruebas y revisar el manifiesto SHA-256.
3. Confirmar las políticas de la Universidad y de la revista, así como el título, orden de autoría, afiliaciones y ORCID (si ambos autores desean incluirlos).
4. Decidir si los CSV individuales E1/E2 se adjuntarán al registro Zenodo. Actualmente no están versionados en Git; el código permite regenerarlos.
5. Cuando se haya aprobado el contenido, cambiar el repositorio a público.
6. En Zenodo, conectar GitHub y habilitar `M3-Research-Supplement`. La cuenta debe tener autorización de integración y permisos sobre el repositorio.
7. En el depósito de Zenodo, comprobar y declarar **ambas licencias**: MIT para el código y CC BY 4.0 para los archivos documentales y de datos. No aceptar un único valor predeterminado sin revisar la licencia mixta.
8. Solo después de habilitar la integración, crear una release GitHub versionada, por ejemplo `v1.0.0`. No crearla antes: Zenodo archiva automáticamente las nuevas releases posteriores a la habilitación.
9. Abrir el registro creado en Zenodo, revisar los archivos, metadatos y ambas licencias, y publicar el depósito.
10. Copiar el DOI específico de la versión a `CITATION.cff`, README y manuscrito. Si se modifica el repositorio después de la release, documentar una nueva versión y DOI.

## Precauciones

- No asumir que Zenodo archiva retroactivamente releases anteriores a habilitar la integración.
- No incluir credenciales, tokens, archivos de entrada externos con derechos no confirmados ni datos operativos sensibles.
- El depósito describe un modelo de simulación con perfiles sintéticos; no llamarlo gemelo digital desplegado ni validado en una mina real.
- Los resultados son simulados y la ecuación SAG no está calibrada con datos de planta; mantener estas limitaciones en el registro y manuscrito.
- Los agregados derivados de Constancia no incluyen la tabla original fila por fila y no otorgan permisos sobre el informe de Hudbay.
