# Script de recálculo externo SAG

`recalcular_constancia.py` recalcula seis tablas estadísticas agregadas a partir de un CSV local preparado por el usuario desde la fuente original. El archivo con los 14 registros no está incluido en el repositorio.

## Instalación

Desde la raíz del repositorio:

```powershell
py -m pip install -r .\scripts\requirements.txt
```

## Ejecución

```powershell
py .\scripts\recalcular_constancia.py --input "RUTA\LOCAL\constancia_sag.csv"
```

Para escribir los resultados en otra carpeta:

```powershell
py .\scripts\recalcular_constancia.py --input "RUTA\LOCAL\constancia_sag.csv" --output-dir "RUTA\SALIDA"
```

El programa valida las columnas requeridas, 14 registros, ausencia de valores nulos, identificadores no duplicados y categorías de mena. No descarga el informe, no copia la entrada, no genera gráficos individuales y no ejecuta ni modifica el motor M-3.
