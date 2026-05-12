# BandStack Manager - Cliente Frontend

Este es el cliente web para **BandStack Manager**, una aplicación diseñada para gestionar el inventario, ventas (POS) y eventos de bandas musicales. Está construido con **Angular 18+**.

## 🚀 Características (Features)

- **Panel de Control (Dashboard):** Resumen en tiempo real de los ingresos por evento, sumando ventas de merchandising y el caché cobrado.
- **Punto de Venta (POS):** Interfaz ágil diseñada para registrar ventas rápidas en conciertos, soportando varios métodos de pago (Efectivo, Tarjeta, Bizum).
- **Gestión de Eventos:** Creación de conciertos, ensayos o festivales. Control de su ciclo de vida (planeado, abierto, cerrado) y liquidaciones.
- **Gestión de Inventario:** Visualización del catálogo de productos, categorías y sus diferentes variantes (tallas, formatos).
- **Autenticación Segura:** Sistema de login basado en JWT con un interceptor HTTP que maneja la renovación automática de tokens de forma transparente.

## 🛠️ Tecnologías

- Angular 18.2.12
- RxJS (Programación reactiva)
- TypeScript
- HTML5 & CSS/SCSS

## 📦 Instalación y Desarrollo

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   ng serve
   ```

3. Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias algún archivo fuente.

## 🏗️ Construcción (Build) para Producción

Ejecuta el siguiente comando para compilar el proyecto. Los artefactos optimizados para producción se almacenarán en el directorio `dist/`.
```bash
ng build
```
