# TierMate

[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Security: Zero-Knowledge](https://img.shields.io/badge/Security-Zero--Knowledge-green?style=flat-square)](https://en.wikipedia.org/wiki/Zero-knowledge_proof)

### Unified Multi-Cloud Dashboard | Local-First | Zero-Knowledge Security

TierMate es una consola de orquestación de infraestructura diseñada para ingenieros que no quieren comprometer la privacidad de sus credenciales. **Tus tokens nunca tocan nuestro servidor.**

![TierMate Dashboard](./public/hero-screenshot.png)

---

## ⚡ Características Principales

*   🔒 **Seguridad Zero-Knowledge**: Cifrado AES-256 local mediante `crypto-js`. Tus credenciales residen exclusivamente en tu navegador.
*   🏭 **Diseño Industrial**: Estética oscura de precisión (Asfalto profundo, acentos Bondi Blue) con tipografía **Geist Mono** para datos puros.
*   🌐 **Ecosistema Multi-Cloud**: Monitorización unificada de servicios en **Vercel** (API REST) y **Railway** (GraphQL Pro).
*   🚀 **Rendimiento Máximo**: Carga paralela de servicios con `Promise.all` para una visibilidad instantánea del estado de tu infraestructura.
*   📐 **Minimalismo Operativo**: Radio de borde de `0.3rem` estandarizado y vistas adaptables (Grid vs. List).

---

## 🛡️ Arquitectura de Seguridad (El Diferenciador)

TierMate rompe el modelo de confianza centralizada. El flujo de datos está diseñado para ser estanco:

1.  **Input**: Introduces tu PIN maestro (solo en memoria volátil de React).
2.  **Cifrado**: Las API Keys se cifran en el cliente con AES-256.
3.  **Persistencia**: Solo el blob cifrado se guarda en `localStorage`.
4.  **Descifrado**: Los datos se hidratan dinámicamente solo cuando la sesión está activa y el PIN es correcto.
5.  **Defensa**: Sistema de *lockout* local de 5 minutos tras 3 intentos fallidos y opción de **Reset Nuclear** para purgar datos locales de forma segura.

---

## 🛠️ Stack Tecnológico

*   **Framework**: Next.js 16 (App Router) + TypeScript.
*   **Styling**: Tailwind CSS v4 + shadcn/ui.
*   **Criptografía**: `crypto-js` (AES-256).
*   **APIs**: Vercel REST API v6 y Railway GraphQL v2.
*   **Iconografía**: Lucide React.

---

## 🚀 Guía de Inicio (Getting Started)

### Requisitos Previos

*   Node.js 20+
*   NPM o Bun

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/tiermate.git
cd tiermate

# 2. Instalar dependencias
npm install

# 3. Iniciar entorno de desarrollo
npm run dev
```

### Sin configuración de servidor (Local-First)

Al ser una aplicación **Local-First**, TierMate **no requiere configurar bases de datos ni variables de entorno sensibles** (.env) en el servidor para gestionar tus tokens. Una vez iniciada la aplicación, configura tus servicios directamente desde la sección de Ajustes.

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si tienes una idea para integrar un nuevo servicio (ej. Render, AWS, Google Cloud), no dudes en abrir un *Issue* o enviar un *Pull Request*.

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

**TierMate v1.1** — *Don't trust, verify.*
