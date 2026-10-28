# FreeRTOS Lab · ESP32

Sitio educativo en español que amplía el prototipo original e integra los temas disponibles en el borrador del Manual Prácticas ESP32. Está construido con React, TypeScript y Vite, listo para publicar como sitio estático en Vercel.

## Incluye

- Mapa del contenido que aparece en el PDF y aviso visible para los capítulos anunciados en el índice que faltan en la copia adjunta.
- Guía de conceptos: tareas, estados, Scheduler, prioridades, retardos, colas, semáforos, mutex, grupos de eventos, notificaciones, timers, ISR, memoria y núcleos.
- Explicación paso a paso del recorrido de un ejemplo desde setup() hasta el bloqueo y despertar de una tarea.
- Simulador didáctico de Scheduler con prioridades ajustables y tareas Ready/Blocked.
- Ejemplo de código, prácticas propuestas para ampliar el manual y preguntas de repaso.
- PDF original en public/manual/Manual-Practicas-ESP32-borrador.pdf.

## Ejecutar localmente

Requiere Node.js 20 o superior y npm.

    npm install
    npm run dev

Vite mostrará la dirección local para abrir el sitio.

## Compilar

    npm run build
    npm run preview

La versión estática se genera en dist/.

## Publicar en Vercel

1. Sube la carpeta del proyecto a un repositorio Git.
2. En Vercel, crea un proyecto e importa ese repositorio.
3. La configuración incluida usa npm run build y dist; Vercel puede detectar Vite automáticamente.
4. Publica el proyecto para obtener una URL *.vercel.app.

## Alcance y notas técnicas

- El Scheduler es una simulación de enseñanza; no ejecuta código ni reproduce todas las reglas del FreeRTOS real.
- Confirma el GPIO del LED, el tamaño y unidad de pila, la placa y la versión de Arduino-ESP32 antes de cargar ejemplos.
- ESP32 y ESP32-C6 no tienen necesariamente el mismo número de núcleos ni la misma configuración.
- El PDF adjunto tiene 22 páginas. Se señalan como pendientes los capítulos que su índice anuncia pero que no aparecen desarrollados en esa copia.
