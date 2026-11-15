# Pa' La Jaba — Frontend

React + Vite + Capacitor (`com.palajaba.app`).

## Nueva versión de la app Android

La versión que ve el usuario y que compara el aviso de actualización es el **`versionName`** del APK (`android/app/build.gradle`). Debe coincidir con la versión que subes en **Admin → Apps**.

### Entornos (`.env`)

| Archivo | Uso |
| --- | --- |
| `.env.development` | API/local o staging (ver `.env.development.example`) |
| `.env.production` | API de producción (ver `.env.production.example`) |

Al generar el APK se copia el archivo del entorno a `.env` y Vite construye con ese modo.

### 1. Generar el APK

Desde `palajaba-front` (Windows / PowerShell), con Node 22 y Java (Android Studio):

```powershell
# Producción (.env.production)
npm run apk:prod -- -AppVersion 1.0.7

# Desarrollo (.env.development)
npm run apk:dev -- -AppVersion 1.0.7
```

Equivalente:

```powershell
npm run apk -- -Prod -AppVersion 1.0.7
npm run apk -- -Dev -AppVersion 1.0.7
```

Ese comando:

1. Activa `.env.production` o `.env.development`
2. Reescribe el host de deep links en `AndroidManifest.xml` y `App.entitlements` con el hostname de `VITE_SITE_URL`
3. Escribe `versionName` y sube `versionCode` en `android/app/build.gradle`
4. Hace `vite build --mode …`, `npx cap sync` y `assembleDebug`
5. Copia el APK a `apk/palajaba1.0.7.apk`

**Importante:** usa `-AppVersion`, no `-Version` (PowerShell se queda con `-Version` y no actualiza el build).

Opcional: fijar el `versionCode` a mano:

```powershell
npm run apk:prod -- -AppVersion 1.0.7 -VersionCode 10
```

### 2. Publicar en Admin

1. Entra a **Admin → Apps**
2. **Subir build** (Android) con el archivo `apk/palajabaX.Y.Z.apk`
3. En el campo **Versión** pon exactamente la misma cadena (`1.0.7`)
   - El servidor comprueba que coincida con el `versionName` embebido en el APK
4. **Set main** en ese build
   - Eso marca la versión como principal y envía push FCM de actualización a los dispositivos Android registrados (con o sin cuenta)

### 3. Comprobar en el dispositivo

- Tras instalar el APK, `App.getInfo().version` debe ser la versión nueva
- Si el main del servidor es mayor, la app muestra el modal de actualización
- Con la app en segundo plano, el Set main debe aparecer también en la bandeja del sistema (permiso de notificaciones concedido al menos una vez)

### Notas

| Concepto | Dónde |
| --- | --- |
| `versionName` (visible) | `android/app/build.gradle` → lo pone `-AppVersion` |
| `versionCode` (entero interno) | Mismo archivo; se incrementa solo si no pasas `-VersionCode` |
| APK de salida | `apk/palajaba<versión>.apk` |
| Main + push | Admin → Apps → Set main |

iOS: el script actualiza el web bundle y el `CFBundleShortVersionString` del Info.plist local; el IPA se genera en un Mac con Xcode.

## Deep links (Android App Links + iOS Universal Links)

Cualquier URL bajo **`VITE_SITE_URL`** (SITE_URL del front) puede abrir la app nativa cuando está instalada y verificada. El bridge navega a `pathname + search + hash` (todas las rutas de la SPA).

| Pieza | Dónde |
| --- | --- |
| Base de enlaces | `VITE_SITE_URL` (prod: `.env.production` / Render) |
| Android intent-filter | `android/app/src/main/AndroidManifest.xml` → `apk:dev` / `apk:prod` escriben el host de `VITE_SITE_URL` |
| iOS Associated Domains | `ios/App/App/App.entitlements` → `applinks:<host>` del mismo `VITE_SITE_URL` |
| Android association | `public/.well-known/assetlinks.json` → se sirve en `{SITE_URL}/.well-known/assetlinks.json` |
| iOS association | `public/.well-known/apple-app-site-association` → `{SITE_URL}/.well-known/apple-app-site-association` |
| JS bridge | `src/lib/nativeDeepLinks.js` (solo acepta el hostname de `VITE_SITE_URL`) |

### Android: fingerprint SHA256

El `assetlinks.json` debe incluir el SHA256 del certificado con el que firmas la APK instalada. Hoy `npm run apk` usa **debug**:

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v `
  -keystore "$env:USERPROFILE\.android\debug.keystore" `
  -storepass android -alias androiddebugkey
```

Copia la línea `SHA256:` en `public/.well-known/assetlinks.json`. Si firmas con un keystore de release, añade ese fingerprint al mismo array.

Tras instalar la APK:

```bash
adb shell pm verify-app-links --re-verify com.palajaba.app
adb shell pm get-app-links com.palajaba.app
```

Pruebas (sustituye `SITE_URL` por tu `VITE_SITE_URL`, p. ej. `https://palajaba.com`):

```bash
adb shell am start -a android.intent.action.VIEW -d "$SITE_URL/comprar"
adb shell am start -a android.intent.action.VIEW -d "$SITE_URL/tienda/pedidos"
adb shell am start -a android.intent.action.VIEW -d "$SITE_URL/aplicacion"
```

### iOS: Team ID y Associated Domains

1. En Apple Developer, activa **Associated Domains** para el App ID `com.palajaba.app`.
2. Sustituye `TEAMID` en `public/.well-known/apple-app-site-association` por tu Apple Team ID (`TEAMID.com.palajaba.app`).
3. Firma la app con un perfil que incluya Associated Domains.
4. Tras desplegar el front, comprueba que `{SITE_URL}/.well-known/apple-app-site-association` responde **200**, JSON, sin redirect.

### Verificación web

Tras el deploy del front:

- `{SITE_URL}/.well-known/assetlinks.json`
- `{SITE_URL}/.well-known/apple-app-site-association`

`apk:dev` y `apk:prod` reescriben el host en `AndroidManifest.xml` y `App.entitlements` desde `VITE_SITE_URL` de ese entorno. `.well-known` tiene que publicarse en ese mismo origen.
