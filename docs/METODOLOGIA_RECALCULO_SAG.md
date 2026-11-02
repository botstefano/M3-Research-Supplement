# Metodología del recálculo SAG de Constancia

El script `scripts/recalcular_constancia.py` recibe un CSV local mediante el argumento obligatorio `--input`. La transcripción fila por fila de la Tabla 13-2 de Hudbay Minerals Inc. (2021) no se incluye en este depósito. El esquema y los nombres de las columnas requeridas se documentan en `FUENTE_Y_NOTAS_CONSTANCIA.md`.

El script valida que el archivo contenga 14 surveys, las columnas requeridas, valores completos y números de survey no duplicados. Genera seis tablas estadísticas agregadas dentro de `data/constancia_aggregated/`; no genera ni distribuye figuras con observaciones individuales.

## Estadística descriptiva

Para cada variable numérica se calcula n, media, desviación estándar muestral, error estándar, coeficiente de variación, mínimo, mediana y máximo. El intervalo t se calcula como:

`media ± t(0.975, n − 1) × s / √n`.

La fórmula supone observaciones independientes y una distribución aproximadamente normal de la media. Dado que dos líneas fueron observadas en las mismas siete fechas, los intervalos se interpretan como descriptivos bajo ese supuesto, no como un modelo de agrupación temporal.

## Comparación Shell Model frente a Shell Plant

Se define `dᵢ = Shell Modelᵢ − Shell Plantᵢ`.

- Sesgo: media de `dᵢ`.
- MAE: media de `|dᵢ|`.
- RMSE: raíz de la media de `dᵢ²`.
- MAPE: media de `|dᵢ / Shell Plantᵢ| × 100`.
- Correlación: coeficiente de Pearson entre ambas columnas.
- Prueba del sesgo: prueba t de una muestra sobre las diferencias pareadas frente a cero.

No rechazar la hipótesis de sesgo cero no demuestra equivalencia entre las dos series.

## Comparación exploratoria por tipo de mena

Se presentan estadísticos descriptivos por tipo de mena y una prueba t de Welch con tamaños de efecto convencionales para la energía Shell Plant. El resultado inferencial es exploratorio y condicionado a independencia. No se ajusta un modelo de efectos de fecha ni se presenta la prueba como evidencia generalizable.

## Correlaciones

Las correlaciones de P80 de alimentación, SGI y tonelaje con ambas columnas de energía son descriptivas. No permiten inferir causalidad.

## Límites

Este análisis no modela la transferencia del chancador, no relaciona la fragmentación con la alimentación final al SAG y no utiliza datos de M-3. No constituye validación ni calibración de la ecuación energética de M-3. Los agregados incluidos permiten consultar los resultados, pero no recalcularlos sin preparar localmente el CSV de entrada desde la fuente original.
