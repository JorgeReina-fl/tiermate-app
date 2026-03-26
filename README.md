# TierMate

**TierMate** es un gestor unificado para servicios Cloud de capa gratuita (Free Tier). 

Su arquitectura local-first BYOK (Bring Your Own Key) garantiza una seguridad Zero-Knowledge: tus claves API o tokens nunca se envían sin cifrar a un servidor central. Todo se asegura localmente en tu navegador usando AES.

## Características
- **Local-First:** Todo ocurre en el navegador. No dependemos de DBs centralizadas.
- **Seguridad Garantizada:** Claves cifradas vía AES-256 (crypto-js) usando contraseña local ephemera (React State).
- **Protección Fuerza Bruta:** Bloqueo automático offline contra intentos de descifrado maliciosos.
- **Proxy Efímero:** Servidor tonto y sin estado que solo enruta las peticiones resolviendo los problemas CORS nativos de APIs externas sin dejar rastro en logs.

## Stack
- Next.js 16 (App Router)
- Tailwind CSS v4 + shadcn/ui
- TypeScript

## Empezar

```bash
npm install
npm run dev
```
