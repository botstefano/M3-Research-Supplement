# Archivos suplementarios para el depósito Zenodo

Estos dos ZIP son parte de la versión científica del suplemento, pero se mantienen fuera del historial Git para evitar almacenar grandes archivos binarios dentro del repositorio. Deben adjuntarse como archivos independientes al registro Zenodo generado desde la release `v1.0.0`.

## 1. Resultados ejecutados y análisis estadístico

**Archivo:** `M3_experimentos_ejecutados_y_analisis.zip`  
**Tamaño:** 12.124.029 bytes  
**SHA-256:** `8085f0460cedb500c011309ba743f22c36587c52fd7df55db502e9faff7cb044`  
**Licencia propuesta:** CC BY 4.0 para los resultados originales/derivados de los autores, conforme a `LICENSING.md`.

Incluye los CSV completos de fila individual de E1 (57.600 filas) y E2 (72.000 filas), manifiestos de generación, 192 y 168 contrastes confirmatorios, tabla de contrastes concatenada, descriptivos por política, medias por escenario-política, resumen JSON y reporte de ejecución y análisis.

## 2. Perfiles sintéticos reconstruidos

**Archivo:** `M3_perfiles_reconstruidos_sinteticos.zip`  
**Tamaño:** 9.619.394 bytes  
**SHA-256:** `08ccac84aa1799699e4fb15196c113f68b2d368e2b0183b0df8716ca266ea606`  
**Licencia propuesta:** CC BY 4.0 para perfiles sintéticos y manifiestos creados por los autores, conforme a `LICENSING.md`.

Incluye 14.400 archivos JSON de perfil (7.200 por experimento), equivalentes a 43.200 perfiles por pala, junto con manifiestos y documentación de generación. Son reconstrucciones sintéticas de ecuaciones y supuestos del manuscrito; no son registros históricos ni mediciones de campo.

## Verificación realizada

- Ambos ZIP superaron `unzip -t` sin errores.
- El primer archivo contiene 15 ficheros: resultados completos, contrastes, manifiestos y documentación.
- El segundo contiene 14.400 JSON de perfil y archivos auxiliares.
- Los tamaños y SHA-256 anteriores permiten comprobar la copia exacta antes de subir y después de descargar desde Zenodo.

## Instrucciones de carga

1. Crear el depósito borrador de Zenodo a partir de la release GitHub posterior a habilitar la integración.
2. Adjuntar estos dos ZIP como archivos suplementarios, sin descomprimirlos ni renombrarlos.
3. Asignar CC BY 4.0 a ambos archivos.
4. Configurar en el mismo registro las licencias múltiples: MIT para el código versionado y CC BY 4.0 para documentación y datos.
5. Comprobar tamaños y SHA-256 tras descargar los archivos desde el depósito borrador.
6. No adjuntar el informe NI 43-101 de Hudbay ni la transcripción original fila por fila de la Tabla 13-2.

Los archivos ZIP están preparados y verificados en esta conversación. No están aún cargados en Zenodo ni tienen DOI.
