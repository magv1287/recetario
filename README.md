# Recetario - Tu Recetario Personal Inteligente

App web de recetas con extraccion automatica desde URLs, screenshots de Instagram/TikTok, y PDFs usando IA (Gemini).

## Stack

- **Next.js 15** + React 19 + TypeScript
- **Firebase** (Auth + Firestore)
- **Google Gemini AI** (extraccion de recetas)
- **Tailwind CSS 4** (dark theme)
- **Vercel** (hosting gratuito)

---

## Configuracion Rapida

### 1. Instalar dependencias

```bash
cd "Documents/4-Personal/4- Recetario"
npm install
```

### 2. Configurar Firebase

La app ya esta conectada al proyecto Firebase `recetario-bd58f`. Necesitas configurar lo siguiente en la [Firebase Console](https://console.firebase.google.com/project/recetario-bd58f):

#### a) Authentication
1. Ve a **Authentication** > **Sign-in method**
2. Habilita **Google** como proveedor
3. Habilita **Email/Password** como proveedor
4. En **Settings** > **Authorized domains**, agrega tu dominio de Vercel cuando lo tengas

#### b) Firestore Database
1. Ve a **Firestore Database**
2. Si no existe, crea la base de datos (modo produccion)
3. Ve a **Rules** y pega estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Recipes: shared between all authenticated users
    match /recipes/{recipeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    // Access control config: any authenticated user can read, only admin can write
    match /config/access {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && resource.data.adminEmail == request.auth.token.email;
    }
  }
}
```

**IMPORTANTE:** Debes actualizar estas reglas en Firebase Console para que el control de acceso y las recetas compartidas funcionen correctamente. Las recetas son compartidas entre todos los usuarios autorizados.

4. Ve a **Indexes** y crea un indice compuesto:
   - Coleccion: `recipes`
   - Campo 1: `createdAt` (Descending)

**Nota:** Firebase Storage NO es necesario. Las imagenes se comprimen y guardan directamente en Firestore como base64 (sin costo adicional, sin plan Blaze).

### 3. Configurar Gemini API Key

El archivo `.env.local` ya deberia tener la key. Si no:

1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Crea una API key
3. Crea/edita el archivo `.env.local`:

```
GEMINI_API_KEY=tu_api_key_aqui
```

### 4. Ejecutar en local

```bash
npm run dev
```

La app estara disponible en `http://localhost:3000`

---

## Deploy en Vercel (Gratis)

### Opcion A: Deploy directo con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy (primera vez, te pedira login)
vercel

# Para produccion
vercel --prod
```

### Opcion B: Deploy via GitHub

1. Crea un repo en GitHub y sube el codigo:

```bash
cd "Documents/4-Personal/4- Recetario"
git init
git add .
git commit -m "Initial commit - Recetario app"
git remote add origin https://github.com/TU_USUARIO/recetario.git
git push -u origin main
```

2. Ve a [vercel.com](https://vercel.com) e inicia sesion con GitHub
3. Click en **"Add New" > "Project"**
4. Selecciona tu repo `recetario`
5. En **Environment Variables**, agrega:
   - `GEMINI_API_KEY` = tu API key de Gemini
6. Click **Deploy**

Vercel te dara un dominio gratis tipo `recetario-xxx.vercel.app`.

**IMPORTANTE:** Agrega este dominio en Firebase Console > Authentication > Settings > Authorized domains.

---

## Usar en iPhone

1. Abre la URL de tu app en **Safari** (ej: `https://recetario-xxx.vercel.app`)
2. Toca el icono de **Compartir** (cuadrado con flecha hacia arriba)
3. Selecciona **"Agregar a pantalla de inicio"**
4. Confirma el nombre y toca **Agregar**
5. La app aparecera como un icono en tu pantalla de inicio, sin barra de Safari

---

## Funcionalidades

- **Importar desde URL**: Pega cualquier link de receta y la IA la extrae automaticamente
- **Importar desde foto/screenshot**: Sube una foto o screenshot de Instagram/TikTok y la IA lee la receta
- **Importar desde PDF**: Sube un PDF de recetas, selecciona las paginas, y la IA extrae todas las recetas
- **Categorias**: Sopas, Carnes, Pescados, Postres, Ensaladas, Pastas, Arroces, Snacks, Desayunos, Otros
- **Dietas**: Keto, Low Carb, Carnivora, Mediterranea
- **Busqueda**: Busca por nombre, descripcion o ingredientes
- **Editar/Eliminar**: Modifica cualquier receta despues de importarla
- **Multi-usuario**: Login con Google o Email/Password
- **PWA**: Funciona como app nativa en iPhone y Android

---

## Estructura del Proyecto

```
src/
  app/
    page.tsx              # Pagina principal (grid de recetas + filtros)
    login/page.tsx        # Login (Google + Email)
    recipe/[id]/page.tsx  # Detalle de receta (ver/editar/borrar)
    api/
      extract-url/        # API: extraer receta de URL
      extract-image/      # API: extraer receta de imagen/screenshot
      extract-pdf/        # API: extraer recetas de PDF
  components/
    AuthProvider.tsx       # Contexto de autenticacion
    CategoryFilter.tsx     # Filtro por categorias
    DietFilter.tsx         # Filtro por dietas
    SearchBar.tsx          # Barra de busqueda
    RecipeCard.tsx         # Card de receta
    ImportModal.tsx        # Modal de importacion (URL/Foto/PDF)
    PDFPageSelector.tsx    # Selector de paginas de PDF
    DeleteConfirm.tsx      # Confirmacion de borrado
  hooks/
    useAuth.ts             # Hook de autenticacion
    useRecipes.ts          # Hook CRUD de recetas
  lib/
    firebase.ts            # Configuracion Firebase
    types.ts               # Tipos TypeScript
    categories.ts          # Categorias y dietas
```
