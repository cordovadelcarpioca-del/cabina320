# Cabina · Flujos del A320

Abre `index.html` en tu navegador. El editor y la práctica funcionan sin instalación y sin conexión. Este HTML incluye el código y las imágenes necesarios.

## Crear y practicar
1. Pulsa **Nuevo flujo**. Escribe el nombre y la fuente que usarás como referencia (manual, revisión y página).
2. Elige **PF** o **PM**, selecciona el panel y haz clic en cada mando en orden. Indica su nombre, su acción y el tamaño de su área de acierto.
3. Pulsa un paso de la lista para modificarlo, reubicarlo, cambiar su orden o eliminarlo. **Ver ambos roles** superpone las dos rutas. En **Completa** puedes ver las conexiones entre paneles.
4. Pulsa **Practicar flujo**, elige un rol y marca los mandos de memoria. Usa + para acercar y arrastra la imagen para desplazarte. Con teclado, enfoca la cabina, mueve la mira con las flechas (Mayús para avanzar más rápido) y usa Intro para marcar.
5. Pulsa **Comparar intento**. Los círculos numerados muestran la referencia y los rombos azules tus clics. Puedes ocultar cada capa o seleccionar una fila para acercarte. La puntuación cuenta el mayor número de mandos que reconociste en el orden correcto. El informe identifica omisiones, clics extra y pasos fuera de orden. Una omisión no desplaza el resto de las respuestas.
6. Tus flujos se guardan en el navegador. En **Mis flujos** puedes descargar todos juntos o guardar el flujo actual como JSON. Descárgalos antes de eliminar los datos del navegador o cambiar de dispositivo.

## Llevar todos los flujos a otro navegador
1. En el navegador original, abre **Mis flujos** y pulsa **Descargar todos**. Se descargará un archivo `cabina320-flujos-AAAA-MM-DD.cabina320`.
2. Abre Cabina en el otro navegador, entra en **Mis flujos** y pulsa **Subir flujos**.
3. Selecciona el archivo `.cabina320`. Todos sus flujos quedarán cargados y guardados en el nuevo navegador. Se abrirá el flujo que estaba activo al descargar la copia.

La copia conserva los nombres, referencias, secuencias PF y PM, posiciones, áreas de acierto y curvas de las flechas. Los flujos importados se añaden a los existentes como copias independientes; no los reemplazan. Si subes el mismo archivo otra vez, se añadirán otras copias.

**Subir flujos** también acepta los archivos `.json` individuales exportados anteriormente. **Flujo actual (.json)** mantiene esa descarga individual. El formato `.cabina320` es un archivo JSON identificado con `format: "cabina-a320-library"` y `version: 1`, con fecha de exportación, flujo activo y lista de flujos. No incluye los intentos de práctica.

Se aceptan archivos de hasta 20 MB. Si el archivo está dañado, usa una versión desconocida o el navegador no puede guardarlo, se muestra un error y no se añade ningún flujo de esa importación.

La demostración es un ejercicio de ubicación. Para practicar procedimientos específicos, crea la referencia a partir del SOP vigente de tu centro. El ejercicio evalúa la ubicación y el orden de las selecciones. El campo de acción sirve de referencia en el editor; el programa no simula sistemas ni valida la posición física de un interruptor.

## GitHub Pages
Coloca `index.html` en la raíz del repositorio. En Settings → Pages selecciona la publicación desde la rama que contiene el archivo y la carpeta raíz. El HTML es autónomo y no requiere dependencias ni compilación.

## Comprobaciones
Con Node.js instalado, ejecuta `node --test`. Las pruebas de las copias comprueban tanto `engine.js` como el motor integrado en el HTML publicado.

