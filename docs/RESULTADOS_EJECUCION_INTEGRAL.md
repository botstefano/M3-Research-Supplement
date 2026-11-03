# M-3 — Ejecución integral y resultados estadísticos confirmados

## Evidencia de ejecución

La ejecución integral se completó en [GitHub Actions run 41558645366](https://github.com/botstefano/M3-GemeloDigital-Limpio/actions/runs/41558645366), desde el commit `72e7e78812c76eb574c80402176588507697068c`.

| Control | Experimento 1 | Experimento 2 |
|---|---:|---:|
| Filas individuales | 57.600 | 72.000 |
| Escenarios | 24 | 24 |
| Réplicas por escenario | 300 | 300 |
| Políticas | 8 | 10 |
| Claves duplicadas | 0 | 0 |
| Celdas numéricas no finitas | 0 | 0 |
| Contrastes confirmatorios | 192 | 168 |
| Significativos tras Holm (t pareada) | 109 | 86 |

Para cada contraste se calcularon prueba t pareada, p ajustado con Holm, tamaño de efecto dz, intervalo bootstrap percentil del 95 % para la diferencia media pareada (10.000 remuestreos) y prueba de Wilcoxon como análisis de sensibilidad. La clasificación de significancia tras Holm coincidió entre prueba t y Wilcoxon en 187 de 192 contrastes de E1 y 151 de 168 contrastes de E2.

## Experimento 1

En los cuatro escenarios sin fallas y con flotas divisibles (H1), la regla proyectada presentó mediana de −0,63 % (rango: −1,66 % a +0,02 %) frente a la asignación fija. En los 20 escenarios con fallas o flotas no divisibles (H2), la regla proyectada presentó mediana de +3,35 % (−0,29 % a +7,22 %) y fue significativamente superior en 16/20 escenarios tras Holm. PPO presentó +3,56 % (−0,01 % a +6,88 %) y fue significativamente superior en 17/20 escenarios. Ninguna de estas dos políticas fue significativamente inferior a la fija en H2 tras Holm.

Para frentes finos lejos del chancador, la política multicriterio redujo la energía SAG simulada frente a la fija en una mediana de 3,39 % (rango: −4,48 % a −2,04 %; 12/12 contrastes significativos). Frente al control sin excavabilidad, la mediana fue −2,46 % (−3,17 % a −1,14 %; 12/12).

## Experimento 2

| Contraste | Orientación | Mediana % | Rango % | Significativos Holm |
|---|---|---:|---:|---:|
| Multicriterio vs control, energía | Lejos | −2,19 | [−3,56; −1,66] | 12/12 |
| Multicriterio vs control, energía | Cerca | −0,05 | [−0,38; 0,37] | 0/12 |
| PPO peso 2 vs control limpio, energía | Lejos | −1,71 | [−2,60; −0,87] | 10/12 |
| PPO peso 2 vs control limpio, energía | Cerca | −0,25 | [−0,77; 0,28] | 0/12 |
| PPO peso 6 vs control limpio, energía | Lejos | −0,19 | [−0,97; 0,47] | 1/12 |
| PPO peso 6 vs control limpio, energía | Cerca | −0,84 | [−1,31; 0,06] | 4/12 |
| PPO peso 2 vs fija, energía | Lejos | −1,91 | [−2,58; −1,03] | 12/12 |
| PPO peso 2 vs fija, energía | Cerca | −0,30 | [−0,94; 0,29] | 1/12 |
| PPO peso 2 vs fija, productividad | Lejos | +3,06 | [−0,72; +6,97] | 10/12 |
| PPO peso 2 vs fija, productividad | Cerca | +1,41 | [−0,73; +5,52] | 8/12 |
| PPO peso 6 vs fija, energía | Lejos | −1,27 | [−2,40; 0,39] | 7/12 |
| PPO peso 6 vs fija, energía | Cerca | −0,73 | [−1,38; −0,05] | 3/12 |
| PPO peso 6 vs fija, productividad | Lejos | +2,82 | [−1,34; +6,49] | 9/12 |
| PPO peso 6 vs fija, productividad | Cerca | +0,62 | [−2,72; +4,31] | 9/12 |

## Comprobación de valores de productividad tabulados

| Escenario | Asignación fija calculada (t/h) | Valor redondeado reportado (t/h) |
|---|---:|---:|
| 2 palas/8 camiones, sin fallas, homogénea | 6.815,5 | 6.816 |
| 2 palas/8 camiones, sin fallas, heterogénea | 6.929,2 | 6.929 |
| 4 palas/16 camiones, sin fallas, homogénea | 11.719,6 | 11.720 |
| 4 palas/16 camiones, sin fallas, heterogénea | 11.723,7 | 11.724 |
| 4 palas/18 camiones, fallas severas, heterogénea | 10.083,1 | 10.083 |

Para el último escenario, la regla proyectada produjo 10.810,7 t/h (10.811 redondeado).

## Advertencias de procedencia

Estos resultados se obtuvieron con perfiles de entrada sintéticos reconstruidos desde ecuaciones y supuestos del manuscrito. No son perfiles históricos recuperados ni mediciones de campo. La ejecución integral y la coincidencia de cifras publicadas demuestran consistencia computacional con la reconstrucción, pero no calibración geológica ni validación industrial. La ecuación energética SAG no está calibrada con datos de planta y no se implementó una función de transferencia del chancador.

Los CSV individuales se regeneran con los comandos de [REPRODUCCION_M3_V3.md](REPRODUCCION_M3_V3.md). Los artefactos de GitHub Actions tienen retención temporal y no sustituyen un archivo permanente en Zenodo.
