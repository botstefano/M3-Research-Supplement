# Procedencia, versión y limitaciones

## Estado de esta instantánea

- Estado: preparación privada; release 1.0.0 y DOI todavía no publicados.
- Fecha de preparación: 2 de noviembre de 2026.
- Licencia: pendiente de aprobación de ambos autores.
- El historial Git de este repositorio es independiente; no hereda el historial del repositorio principal.

## Código del motor de investigación

Los archivos del generador, ejecutor, motor de investigación, catálogo, esquema, pruebas y checkpoints PPO se copiaron de `M3-GemeloDigital-Limpio` en el commit `72e7e78812c76eb574c80402176588507697068c`, utilizado en la ejecución integral de los experimentos.

- Repositorio de origen: https://github.com/botstefano/M3-GemeloDigital-Limpio
- Ejecución integral: https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366

## Procedencia de perfiles

Los perfiles de entrada son reconstrucciones sintéticas deterministas a partir de parámetros, ecuaciones, orientaciones, semillas y supuestos descritos en el manuscrito. El generador crea un archivo JSON por escenario y réplica. El manuscrito no incluía los archivos históricos originales por pala y réplica. Por tanto, esta reconstrucción no debe describirse como recuperación literal de los inputs históricos.

El caso base de fragmentación reproduce aproximadamente Q=837,362 kg, q=1,14511 kg/m³, n=1,17939, P80=405,143 mm, B600=7,750 % y D=22,014. Es una comprobación de consistencia con los valores de referencia del manuscrito, no una calibración de campo.

## Resultados y análisis

La ejecución integral generó 57.600 filas individuales para E1 y 72.000 para E2. Se verificaron cero claves escenario-réplica-política duplicadas y cero celdas numéricas no finitas. El análisis contiene 192 contrastes confirmatorios para E1 y 168 para E2; 109 y 86, respectivamente, fueron significativos con corrección de Holm en las pruebas t pareadas.

Los CSV de salida por fila no están versionados en esta instantánea Git; pueden regenerarse con el generador, ejecutor y análisis incluidos. Los archivos en `data/m3/` son resúmenes agregados, no réplicas individuales.

## Limitaciones científicas

- Los resultados son estimaciones de simulación, no mejoras operativas ni ahorros medidos.
- No se comparó cada resultado contra archivos históricos originales por réplica, que no estaban disponibles.
- La ecuación de energía SAG no está calibrada con datos de planta.
- No se implementó una función de transferencia del chancador.
- No existe validación externa en una operación minera real.
- Los datos SAG externos de Constancia pertenecen a otra operación y no constituyen calibración ni validación de M-3.

## Análisis externo SAG de Constancia

Los agregados de `data/constancia_aggregated/` derivan de 14 surveys publicados en la Tabla 13-2 de Hudbay Minerals Inc. (2021). La transcripción fila por fila y las figuras con observaciones individuales no se redistribuyen aquí. Para recalcular los agregados se debe preparar localmente el CSV descrito en `docs/FUENTE_Y_NOTAS_CONSTANCIA.md`. No se afirma que Hudbay haya autorizado la redistribución de su tabla original.
