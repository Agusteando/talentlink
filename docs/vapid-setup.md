
# Configuración de VAPID Keys para Notificaciones Push (TalentLink)

TalentLink usa **Web Push** para enviar notificaciones en tiempo real al navegador (campana en el dashboard).  
Para que esto funcione en producción necesitas generar y configurar un **par de llaves VAPID**.

---

## 1. Instalar la herramienta `web-push`

Si aún no la tienes instalada en tu proyecto, desde la raíz del repo ejecuta:

```bash
npm install web-push --save-dev
```

> Puedes usar `pnpm` o `yarn` si tu proyecto ya lo usa:
>
> ```bash
> pnpm add -D web-push
> # o
> yarn add -D web-push
> ```

---

## 2. Generar las llaves VAPID

Desde la raíz del proyecto ejecuta:

```bash
npx web-push generate-vapid-keys
```

Verás una salida similar a:

```text
==========================================
Public Key:
BLaX3...TuClavePublica...0c

Private Key:
z9H3...TuClavePrivada...sA
==========================================
```

Copia ambos valores (sin espacios adicionales).

---

## 3. Configurar variables de entorno

En tu archivo `.env.local` (desarrollo) y en las variables de entorno de tu entorno de producción (Vercel, servidor propio, etc.), agrega:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLaX3...TuClavePublica...0c
VAPID_PRIVATE_KEY=z9H3...TuClavePrivada...sA
VAPID_SUBJECT=mailto:desarrollo.tecnologico@casitaiedis.edu.mx
```

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` **debe** empezar con `NEXT_PUBLIC_` para que el cliente (navegador) pueda leerla.
- `VAPID_PRIVATE_KEY` **nunca** se envía al cliente; se usa solo del lado servidor para firmar los mensajes.
- `VAPID_SUBJECT` es un correo o URL de contacto para el emisor (requerido por el estándar Web Push).

> Importante: No cometas la llave privada en el repositorio.  
> Colócala solo en `.env.local` y en los secretos de tu proveedor de hosting.

---

## 4. Relación con el código actual

- El servidor usa estas variables en `src/lib/push.js` y `src/lib/google.js`:
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` se configuran en `web-push`.
- El cliente (navegador) usa `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en
  `NotificationSettingsPanel` para registrar la suscripción con:

```js
reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: base64ToUint8Array(vapidPublicKey),
});
```

Mientras estas variables estén bien configuradas, el flujo es:

1. El usuario entra a **Configuración → Notificaciones personales** y pulsa “Activar en este navegador”.
2. El navegador pide permiso de notificación y registra un **Service Worker** (`/sw.js`).
3. Se crea una suscripción con la VAPID public key y se envía a `/api/push/subscribe`.
4. El backend guarda la suscripción en `PushSubscription`.
5. Cuando se dispara un evento (nueva postulación / cambio de estado), el backend llama a `sendUserPushNotifications`, que usa `web-push` y las llaves VAPID para enviar el mensaje al navegador del usuario.

---

## 5. Verificación rápida

1. Configura las variables `.env.local` con las llaves VAPID.
2. Ejecuta el proyecto en modo dev:

```bash
npm run dev
```

3. Inicia sesión como usuario de staff y abre:
   - `Dashboard → Configuración → Notificaciones personales`.
4. Activa **“Activar en este navegador”**. Si todo está correcto, deberías ver:
   - Mensaje de éxito en pantalla (“Notificaciones push activadas para este navegador.”)
   - El botón mostrando “Push activado”.

5. Genera una nueva postulación de prueba en el plantel asociado y valida que:
   - Aparece una entrada en el Centro de Notificaciones.
   - Si el navegador está abierto, ves también un **toast del navegador** (native push) con la alerta.

Si en consola del servidor ves mensajes como:
`[push] VAPID keys are not configured. Push will be skipped.`  
revisa que las variables estén correctamente definidas y accesibles en el entorno actual.
