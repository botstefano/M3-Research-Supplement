# Preparación de publicación GitHub–Zenodo

Este repositorio ya existe: https://github.com/botstefano/M3-Research-Supplement. Su rama predeterminada es `master`. No crear otro repositorio ni importar el historial Git del proyecto principal.

## Estado de preparación

- El repositorio permanece privado.
- El DOI todavía no está asignado.
- La licencia sigue pendiente de confirmación de ambos autores: véase `LICENSE_PENDING.md`.
- La preparación del material se realiza en una rama de revisión independiente.
- La guía de reproducción está en `docs/REPRODUCCION_M3_V3.md`.

## Orden de publicación

1. Revisar el contenido de la rama de preparación y comprobar que no se incluyan credenciales, datos no autorizados o archivos locales de entrada.
2. Clonar el repositorio en una instalación limpia, instalar dependencias y ejecutar pruebas y reproducción.
3. Confirmar con ambos autores titularidad, orden de autoría, afiliaciones, ORCID (si desean incluirlos) y licencia de cada componente.
4. Decidir si los CSV individuales E1/E2 se adjuntarán al registro Zenodo. Actualmente no están versionados en Git; el código permite regenerarlos.
5. Cuando el contenido y los derechos estén aprobados, integrar la rama a `master` y cambiar el repositorio a público.
6. En Zenodo, conectar GitHub y habilitar `M3-Research-Supplement`.
7. Solo después crear una release GitHub versionada, por ejemplo `v1.0.0`. No crearla antes de habilitar la integración.
8. Abrir el registro creado en Zenodo, revisar los archivos, metadatos y licencia y publicar el depósito.
9. Copiar el DOI específico de la versión publicada a `CITATION.cff`, README y manuscrito, y actualizar el registro si corresponde.

## Precauciones

- La integración automática de Zenodo con GitHub se debe habilitar antes de crear la release que se desea archivar.
- No asumir que Zenodo archiva retroactivamente versiones previas a habilitar la integración.
- No incluir credenciales, tokens, archivos de entrada externos con derechos no confirmados ni datos operativos sensibles.
- El depósito describe un modelo de simulación con perfiles sintéticos; no llamarlo gemelo digital desplegado ni validado en una mina real.
- No publicar hasta que ambos autores confirmen expresamente la licencia y los derechos aplicables.
