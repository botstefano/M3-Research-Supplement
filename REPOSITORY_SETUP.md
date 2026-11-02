# Crear el repositorio GitHub independiente

Nombre recomendado: `M3-Research-Supplement`.

1. En GitHub, crea un repositorio nuevo con ese nombre.
2. Durante la preparación, mantenlo **privado** hasta que ambos autores revisen contenido, derechos y licencia.
3. No marques las opciones para crear README, `.gitignore` ni licencia: este paquete ya contiene esos archivos.
4. Extrae el ZIP y abre PowerShell dentro de la carpeta `M3-Research-Supplement`.
5. Inicializa el repositorio y realiza el primer commit:

```powershell
git init -b main
git add .
git status
git commit -m "Initial clean research supplement"
```

6. Añade el remoto (ajusta el usuario si corresponde) y publica la rama:

```powershell
git remote add origin https://github.com/botstefano/M3-Research-Supplement.git
git push -u origin main
```

7. Comprueba que no se haya agregado un archivo de entrada local con los 14 surveys y que `git status` quede limpio.

## Antes de Zenodo

- Confirmar con el coautor los metadatos y la licencia.
- Hacer público el repositorio cuando esté listo para archivo.
- Conectar GitHub a Zenodo y habilitar este repositorio.
- Solo después crear una release, por ejemplo `v1.0.0`, con la versión definitiva y aprobada.
- Zenodo archiva las nuevas releases posteriores a la habilitación del repositorio. No publiques una release hasta que la licencia esté confirmada.

No se debe reutilizar el historial Git del repositorio principal. Este repositorio comienza con un historial nuevo.
