# ✅ Firebase Integration Checklist - MTG Proxy Labs

## 🎯 Objetivo: Persistencia de Cartas en la Nube

Tienes un proyecto Firebase creado. Este checklist te guía para conectarlo con la app.

**Tiempo total**: ~18 minutos  
**Resultado**: Cartas guardadas en la nube + sincronización automática

---

## 📋 Pre-requisitos (Verifica)

- [ ] Proyecto Firebase creado en https://console.firebase.google.com
- [ ] Firebase SDK instalado (`npm install firebase` - ya hecho)
- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] Acceso a Vercel (para deployment final)

---

## 🔐 PASO 1: Obtener Credenciales Firebase

**Tiempo**: 2-3 minutos

### Subtareas

- [ ] Abre https://console.firebase.google.com
- [ ] Selecciona tu proyecto "MTG Proxy Labs"
- [ ] Haz click en ⚙️ (Configuración del Proyecto) arriba a la izquierda
- [ ] Ve a la pestaña "Your apps"
- [ ] Localiza tu app web (debería tener un icono `</>`
- [ ] Haz click en el icono `</>` para ver credenciales
- [ ] Copia toda la configuración:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

**✓ Checklist**: Tienes los 6 valores copiados y guardados en un archivo temporal

---

## 📝 PASO 2: Crear y Configurar .env.local

**Tiempo**: 2-3 minutos

### Subtareas

- [ ] Abre terminal en el proyecto:
  ```bash
  cd /home/claude/mtg-proxy-pdf
  ```

- [ ] Copia el archivo de ejemplo:
  ```bash
  cp .env.example .env.local
  ```

- [ ] Abre .env.local:
  ```bash
  nano .env.local
  # O abre con tu editor favorito
  ```

- [ ] Reemplaza cada línea con tus valores de Firebase:
  ```
  REACT_APP_FIREBASE_API_KEY=tu_api_key_aqui
  REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
  REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
  REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
  REACT_APP_FIREBASE_APP_ID=tu_app_id
  ```

- [ ] Guarda el archivo (Ctrl+X, Y, Enter en nano)

- [ ] Verifica que el archivo se creó:
  ```bash
  cat .env.local
  # Deberías ver tus 6 valores
  ```

**✓ Checklist**: .env.local existe con las 6 variables configuradas

**⚠️ Importante**: NO subas .env.local a GitHub (ya está en .gitignore)

---

## 🗄️ PASO 3: Verificar Firestore Database

**Tiempo**: 1 minuto

### En Firebase Console

- [ ] Menú izquierdo → "Firestore Database"
- [ ] Verifica que dice "Database created" o similar
- [ ] Si no existe, haz click "Create database"
  - [ ] Elige "Test mode" (para desarrollo)
  - [ ] Selecciona región (us-central1 recomendado)
  - [ ] Click "Create"

### Configurar Firestore Rules

- [ ] Ve a la pestaña "Rules"
- [ ] Reemplaza el contenido con:
  ```firestore
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /cards/{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
- [ ] Click "Publish"

**✓ Checklist**: Firestore creado y rules publicadas

---

## 💾 PASO 4: Verificar Cloud Storage

**Tiempo**: 1 minuto

### En Firebase Console

- [ ] Menú izquierdo → "Storage"
- [ ] Si no está creado, haz click "Get started"
  - [ ] Elige "Start in test mode"
  - [ ] Selecciona región (us-central1 recomendado)
  - [ ] Click "Create"

### Configurar Storage Rules

- [ ] Ve a la pestaña "Rules"
- [ ] Reemplaza el contenido con:
  ```firestore
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /cards/{allPaths=**} {
        allow read, write: if true;
      }
    }
  }
  ```
- [ ] Click "Publish"

**✓ Checklist**: Storage creado y rules publicadas

---

## 🧪 PASO 5: Probar Localmente

**Tiempo**: 5 minutos

### Iniciar App

- [ ] En terminal:
  ```bash
  npm start
  ```

- [ ] Abre http://localhost:3000 en tu navegador
- [ ] Espera a que cargue (~10 segundos)

### Probar Upload

- [ ] Haz click "Subir"
- [ ] Selecciona 1-2 imágenes de cartas
- [ ] Espera a que se procesen y carguen
- [ ] Deberías ver las cartas en la galería

### Verificar Persistencia

- [ ] Abre DevTools (F12)
- [ ] Ve a "Application" tab
- [ ] En "Storage" → "IndexedDB"
- [ ] Busca "firebase"
- [ ] Deberías ver bases de datos indexadas

- [ ] Recarga la página (F5)
- [ ] Las cartas deberían reaparecer ✓

**✓ Checklist**: App ejecutándose, cartas visibles después de recarga

### Verifica Firestore

- [ ] Ve a Firebase Console → Firestore Database
- [ ] Abre colección "cards"
- [ ] Deberías ver documentos (1 por cada carta subida)
- [ ] Cada documento muestra: name, colors, tags, notes, etc.

### Verifica Storage

- [ ] Ve a Firebase Console → Storage
- [ ] Abre carpeta "cards"
- [ ] Deberías ver archivos (imágenes subidas)
- [ ] Formato: cards/{cardId}/image.jpg

**✓ Checklist**: Datos visibles en Firebase Console

---

## 🚀 PASO 6: Preparar para Deployment

**Tiempo**: 3 minutos

### Verifica cambios locales

- [ ] Terminal:
  ```bash
  git status
  ```
  - Deberías ver .env.local sin cambios en tracked files (está en .gitignore)
  - Packages actualizadas

### Commit cambios

- [ ] Si hay cambios sin commit:
  ```bash
  git add .
  git commit -m "Phase 5B: Firebase integration complete and tested locally"
  ```

### Push a GitHub

- [ ] Terminal:
  ```bash
  git push origin main
  ```

- [ ] Espera a que termine el push

**✓ Checklist**: Código subido a GitHub

---

## 🌐 PASO 7: Deploy a Vercel

**Tiempo**: 5 minutos

### Vercel Console

- [ ] Abre https://vercel.com
- [ ] Selecciona tu proyecto "mtg-proxy-pdf"
- [ ] Espera a que se deploy automáticamente (debería auto-deployar desde GitHub)

### Configurar Variables de Entorno

- [ ] En Vercel, ve a "Settings" → "Environment Variables"
- [ ] Agrega 6 nuevas variables (copia de .env.local):
  - [ ] Name: `REACT_APP_FIREBASE_API_KEY` Value: tu_api_key
  - [ ] Name: `REACT_APP_FIREBASE_AUTH_DOMAIN` Value: tu_domain
  - [ ] Name: `REACT_APP_FIREBASE_PROJECT_ID` Value: tu_project_id
  - [ ] Name: `REACT_APP_FIREBASE_STORAGE_BUCKET` Value: tu_bucket
  - [ ] Name: `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` Value: tu_sender_id
  - [ ] Name: `REACT_APP_FIREBASE_APP_ID` Value: tu_app_id

- [ ] Click "Save"
- [ ] Vercel redeploy automáticamente

- [ ] Espera a que termine el deploy (5-10 minutos)
- [ ] Verifica que dice "Production" en verde

**✓ Checklist**: Variables configuradas, deployment completado

---

## 🧪 PASO 8: Prueba en Producción

**Tiempo**: 2-3 minutos

### Acceder a tu URL

- [ ] Copia tu URL de Vercel (debería estar en Dashboard)
- [ ] Abre en navegador (ejemplo: https://mtg-proxy-labs.vercel.app)
- [ ] Espera a que cargue

### Prueba de Upload

- [ ] Haz click "Subir"
- [ ] Selecciona 1-2 imágenes
- [ ] Espera a que carguen
- [ ] Las cartas deberían aparecer

### Prueba de Persistencia

- [ ] Recarga la página (F5)
- [ ] Cartas deberían permanecer ✓

- [ ] Cierra pestaña completamente
- [ ] Abre una nueva pestaña
- [ ] Navega a tu URL nuevamente
- [ ] Cartas deberían estar ✓

### Verifica Sincronización

- [ ] Abre tu sitio en 2 pestañas del navegador (mismo navegador)
- [ ] En pestaña 1: Sube una carta nueva
- [ ] En pestaña 2: Recarga (F5)
- [ ] La nueva carta debería aparecer ✓

**✓ Checklist**: Persistencia funciona en producción

---

## 🎉 Verificación Final

### Todo Listo?

- [ ] Cartas persisten después de recargar (local)
- [ ] Cartas persisten después de recargar (Vercel)
- [ ] Nuevas cartas aparecen en Firestore Console
- [ ] Imágenes aparecen en Storage Console
- [ ] Sincronización entre pestañas funciona
- [ ] .env.local NO está en git
- [ ] 6 variables configuradas en Vercel

### Limpiar (Opcional)

- [ ] Deja .env.local localmente (NO lo borres)
- [ ] Otros desarrolladores usan su propio .env.local
- [ ] Vercel tiene variables globales

**✓ Checklist**: ¡Persistencia en la nube está COMPLETA!

---

## 🚨 Troubleshooting

### Cartas no persisten después de recargar

**Causa**: Variables de entorno incorrectas

**Solución**:
- [ ] Verifica .env.local tenga todos los 6 valores
- [ ] Copia nuevamente desde Firebase Console
- [ ] Reinicia servidor local: `npm start`

### Error "Failed to add card" en consola

**Causa**: Firestore rules bloqueando escritura

**Solución**:
- [ ] Ve a Firebase Console → Firestore Rules
- [ ] Verifica que dice `allow read, write: if true;`
- [ ] Click Publish
- [ ] Espera 2 minutos, intenta nuevamente

### Imágenes no suben

**Causa**: Storage rules incorrectas o Storage no existe

**Solución**:
- [ ] Ve a Firebase Console → Storage
- [ ] Verifica que existe y está en Test mode
- [ ] Verifica Rules:
  ```
  allow read, write: if true;
  ```
- [ ] Click Publish

### DevTools muestra "PERMISSION_DENIED"

**Causa**: Firebase rules están en modo estricto

**Solución**:
- [ ] Firebase Console → Firestore Rules
- [ ] Debe tener `if true;` (Test mode)
- [ ] Click Publish y espera

### Vercel deployment fallido

**Causa**: Variables de entorno incorrectas en Vercel

**Solución**:
- [ ] Ve a Vercel Settings → Environment Variables
- [ ] Verifica que los 6 valores están presentes
- [ ] Verifica que están exactamente iguales a .env.local
- [ ] Redeploy: Deployments → Redeploy

---

## 📞 Next Steps

### Una vez completado este checklist

- [ ] **Phase 5C** (Próxima): Agregar autenticación de usuarios
- [ ] **Phase 6**: Compartir galerías públicamente
- [ ] **Phase 7**: Recolecciones personalizadas

---

## 📊 Resumen

| Item | Estado |
|------|--------|
| Firebase Project | ✅ Creado |
| Credenciales obtenidas | ⬜ TODO |
| .env.local configurado | ⬜ TODO |
| Firestore Database | ⬜ TODO |
| Cloud Storage | ⬜ TODO |
| Prueba local | ⬜ TODO |
| Deploy a Vercel | ⬜ TODO |
| Prueba producción | ⬜ TODO |
| **PERSISTENCIA NUBE** | ⬜ TODO |

---

**Status**: Listo para comenzar 🚀

Sigue los pasos 1-8 en orden. Si algo no funciona, revisa la sección Troubleshooting.

¡Éxito! ☁️
