# Pa' La Jaba — Frontend

React + Vite + Capacitor (`com.palajaba.app`).

## Nueva versión de la app Android

La versión que ve el usuario y que compara el aviso de actualización es el **`versionName`** del APK (`android/app/build.gradle`). Debe coincidir con la versión que subes en **Admin → Apps**.

### 1. Generar el APK

Desde `palajaba-front` (Windows / PowerShell), con Node 22 y Java (Android Studio):

```powershell
npm run apk -- -AppVersion 1.0.7
```

Ese comando:

1. Escribe `versionName` y sube `versionCode` en `android/app/build.gradle`
2. Hace `npm run build` y `npx cap sync`
3. Compila `assembleDebug`
4. Copia el APK a `apk/palajaba1.0.7.apk` (el nombre incluye la versión)

**Importante:** usa `-AppVersion`, no `-Version` (PowerShell se queda con `-Version` y no actualiza el build).

Opcional: fijar el `versionCode` a mano:

```powershell
npm run apk -- -AppVersion 1.0.7 -VersionCode 10
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
