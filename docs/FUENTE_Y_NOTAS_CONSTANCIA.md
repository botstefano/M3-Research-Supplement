# Fuente, procedencia y esquema de entrada — Constancia SAG

**Fuente primaria:** Hudbay Minerals Inc. (2021), *NI 43-101 Technical Report: Constancia Mine, Cuzco, Peru*, Tabla 13-2: “Summary of SAG Mill Surveys and Model Calibration”.

Los resultados agregados incluidos en este repositorio se calcularon a partir de 14 surveys de dos líneas de molienda observadas en siete fechas entre junio de 2017 y septiembre de 2020.

## Alcance de esta versión

La transcripción fila por fila de la Tabla 13-2 no se incluye en este repositorio ni en el paquete propuesto para Zenodo. Se conservan únicamente tablas estadísticas agregadas derivadas del análisis. Esta decisión evita redistribuir aquí la transcripción de la tabla original; no constituye una determinación legal sobre la protección de cada dato o sobre los derechos de terceros.

El archivo de entrada que se utilice para recalcular los resultados debe obtenerse y prepararse localmente a partir de la fuente original. El repositorio no descarga el informe ni suministra los 14 registros.

## Esquema requerido por el script

El CSV local debe contener, como mínimo, estas columnas:

| Campo | Descripción | Unidad |
|---|---|---|
| `survey_no` | Identificador de survey | — |
| `grinding_line` | Línea de molienda | — |
| `ore_type` | Tipo de mena informado | — |
| `date` | Fecha del survey | AAAA-MM-DD |
| `feed_size_p80_mm` | P80 de alimentación convertido a milímetros | mm |
| `sgi_min` | SAG Grindability Index | min |
| `sag_ag_throughput_tph` | Tonelaje SAG/AG | t/h |
| `sag_mill_product_p80_microns` | P80 del producto SAG | µm |
| `sag_specific_energy_shell_model_kwh_t` | Energía específica Shell Model | kWh/t |
| `sag_specific_energy_shell_plant_kwh_t` | Energía específica Shell Plant | kWh/t |
| `sag_correction_factor` | Factor de corrección indicado en la tabla fuente | — |

Puede añadirse `feed_size_p80_in` si existe en el archivo local; el script requiere `feed_size_p80_mm` para los cálculos.

El P80 de alimentación y el P80 del producto son variables distintas. Se conserva la etiqueta P80 de alimentación indicada por el encabezado de la tabla fuente; no se sustituye por F80.

## Conversión y supuestos

La conversión entre pulgadas y milímetros usa 1 in = 25.4 mm. No deben añadirse observaciones estimadas ni completar valores ausentes mediante interpolación.

Las dos líneas aparecen medidas en las mismas siete fechas. Por ello, las inferencias que tratan los 14 registros como independientes deben considerarse exploratorias y condicionadas a ese supuesto. Los intervalos, las pruebas t y las correlaciones no modelan explícitamente la agrupación temporal.

## Relación con M-3

Los datos pertenecen a Constancia y no a la operación modelada por M-3. El conjunto no establece correspondencia entre fragmentación, transferencia del chancador y alimentación final al SAG de M-3. Su uso es comparativo y descriptivo; no representa calibración, validación ni ajuste del motor M-3.

## Referencia

Hudbay Minerals Inc. (2021). *NI 43-101 Technical Report: Constancia Mine, Cuzco, Peru*. Tabla 13-2.

PDF de referencia: https://s23.q4cdn.com/405985100/files/doc_downloads/tech_reports/peru/Constancia-NI-43-101-Technical-Report-March-29-2021_FINAL.pdf
