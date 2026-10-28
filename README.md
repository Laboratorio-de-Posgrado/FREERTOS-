# FreeRTOS Lab

Prototipo educativo web para aprender FreeRTOS desde cero con ESP32 y ESP32-C6.

## Requisitos
- Node.js 20 o superior recomendado
- npm

## Ejecutar en tu computadora
```bash
npm install
npm run dev
```
Abre la URL local que muestra Vite en la terminal.

## Preparar para producción
```bash
npm run build
npm run preview
```
La compilación se genera en `dist/`.

## Publicar en Vercel
1. Sube este proyecto a un repositorio de GitHub.
2. Entra en https://vercel.com/new e inicia sesión.
3. Importa el repositorio `freertos-lab`.
4. Vercel detectará Vite. Usa `npm run build` como comando de compilación y `dist` como directorio de salida si te los solicita.
5. Pulsa **Deploy**. Obtendrás una URL pública `*.vercel.app`.

## Alcance de esta versión
El simulador de Scheduler es ilustrativo y simplificado: no compila ni ejecuta el código en un ESP32 real. El ejemplo de código requiere comprobar el GPIO LED de la placa antes de cargarlo.
