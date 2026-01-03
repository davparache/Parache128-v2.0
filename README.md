<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Ejecuta tu app de AI Studio localmente

Esta guía explica, paso a paso, cómo preparar y levantar la app en tu máquina.

Puedes abrir la app directamente en AI Studio aquí: https://ai.studio/apps/drive/1yDP0EEUxS0KpqfxPep9PtPUI2R3fjoYc.

## Requisitos previos
- Node.js 18 o superior
- Una clave de API de Gemini

## Pasos para correr la app
1. **Instala dependencias**
   ```bash
   npm install
   ```

2. **Configura la clave de Gemini**
   Crea (o edita) un archivo `.env.local` en la raíz del proyecto con el siguiente contenido, reemplazando `TU_CLAVE` por tu clave real:
   ```bash
   GEMINI_API_KEY=TU_CLAVE
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   La terminal te mostrará una URL similar a `http://localhost:5173`. Ábrela en el navegador.

## Consejos rápidos
- Si el puerto 5173 está ocupado, Vite elegirá otro y te lo indicará en la terminal.
- Para actualizar la clave de API, solo modifica `.env.local` y reinicia `npm run dev`.
- Si falta la variable `GEMINI_API_KEY`, la app no podrá llamar a Gemini y mostrará errores.
