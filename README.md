# MorfiApp: Red social de recetas

MorfiApp es una red social donde las personas comparten recetas. Cada receta es una publicación con título, descripción y una foto opcional, y las demás personas pueden darle me gusta y comentarla. 

## Enlaces

| | Dirección |
|---|---|
| Aplicación (frontend) | https://tp2-programacion-iv-more-lucas-ocdb.vercel.app |
| API (backend) | https://tp2-programacion-iv-more-lucas.vercel.app |

## Contenido

1. [Estado del proyecto](#estado-del-proyecto)
2. [Tecnologías](#tecnologías)
3. [Cómo está dividido el proyecto](#cómo-está-dividido-el-proyecto)
4. [Cómo correrlo en mi pc](#cómo-correrlo-en-mi-máquina)
5. [Variables de entorno](#variables-de-entorno)
6. [Backend en detalle](#backend-en-detalle)
7. [Frontend en detalle](#frontend-en-detalle)
8. [Decisiones técnicas ](#decisiones-técnicas)
9. [Despliegue en Vercel](#despliegue-en-vercel)
10. [Cosas por agregar](#cosas-por-agregar)

## Estado del proyecto

| Sprint | Qué incluye | Estado |
|---|---|---|
| 1 | Registro con foto de perfil opcional, login, navegación entre pantallas y despliegue | Terminado y desplegado |
| 2 | Publicaciones con imagen, listado con orden y paginación, me gusta, baja lógica y "Mi perfil" con mis últimas 3 publicaciones | Terminado |
| 3 | Autenticación con JWT, rutas `autorizar` y `refrescar`, pantalla de carga, aviso para extender la sesión, comentarios con paginación y edición | Terminado |
| 4 | Panel de administración, estadísticas, PWA, pipes y directivas propias | Pendiente |

## Tecnologías

**Backend**
- NestJS 12, escrito en TypeScript y como módulos ES (ESM).
- MongoDB Atlas con Mongoose como ODM.
- `@nestjs/jwt` para firmar y verificar los tokens.
- `@nestjs/authentication` para hashear y verificar contraseñas (`PasswordHasher`).
- `class-validator` y `class-transformer` para validar los datos que llegan.
- Multer (viene con `@nestjs/platform-express`) para recibir archivos.
- Cloudinary para guardar las imágenes.

**Frontend**
- Angular 22, con componentes standalone, signals y formularios reactivos.
- Bootstrap para la base de estilos, más mi propio CSS (colores cálidos y verde como acento).
- RxJS para las peticiones HTTP.

**Infraestructura**
- Vercel para el backend y el frontend, como dos proyectos separados.
- MongoDB Atlas como base de datos en la nube.

## Cómo está dividido el proyecto

Son dos aplicaciones independientes, cada una con su propio `package.json`:

```
tp2_programacionIV/
├── morfiApp_backend/            API en NestJS
│   └── src/
│       ├── main.ts              arranque, validación global y CORS
│       ├── app.module.ts        módulo raíz y conexión a Mongo
│       ├── auth/                registro, login, JWT, guard
│       ├── usuarios/            entidad y lógica de usuarios
│       ├── imagenes/            subida de imágenes a Cloudinary
│       └── publicaciones/       publicaciones y comentarios
└── morfiApp_frontend/           aplicación en Angular
    └── src/app/
        ├── componentes/         pantallas y piezas de la interfaz
        ├── servicios/           comunicación con el back y manejo de sesión
        ├── interceptors/        interceptor HTTP del token
        ├── guards/              guard de rutas
        ├── models/              interfaces de TypeScript
        ├── validators/          validaciones de formularios
        └── utils/               funciones auxiliares
```

Los módulos del backend se corresponden con lo que pide en el tp2: Publicaciones, Autenticación y Usuarios. Agregué un cuarto módulo, Imágenes, para no mezclar la lógica de Cloudinary con el resto.

## Cómo correrlo en mi pc

Necesito Node.js, una base en MongoDB Atlas y una cuenta de Cloudinary.

**Backend**

```bash
cd morfiApp_backend
npm install
# crear el archivo .env con las variables de la sección siguiente
npm run start:dev
```

Queda escuchando en `http://localhost:3000`.

**Frontend**

```bash
cd morfiApp_frontend
npm install
ng serve
```

Queda en `http://localhost:4200`. La dirección del backend está en `src/environments/environment.ts` (la de producción) y en `environment.development.ts` (la local).

## Variables de entorno

Van en un archivo `.env` dentro de `morfiApp_backend`, que no se sube al repositorio. En Vercel las cargo desde la configuración del proyecto.

| Variable | Para qué sirve |
|---|---|
| `MONGO_URI` | Cadena de conexión a MongoDB Atlas |
| `JWT_SECRET` | Secreto con el que firmo y verifico los tokens |
| `BASE_URL` | Dirección pública del backend |
| `PORT` | Puerto local (opcional, por defecto 3000) |
| `CLOUDINARY_CLOUD_NAME` | Nombre de mi cuenta en Cloudinary |
| `CLOUDINARY_API_KEY` | Clave de la API de Cloudinary |
| `CLOUDINARY_API_SECRET` | Secreto de la API de Cloudinary |

## Backend en detalle

### Autenticación (`auth/`)

- `POST /auth/register`: crea la cuenta. Recibe los datos como `multipart/form-data` porque puede llevar una foto de perfil. Devuelve el usuario y un token, así que quien se registra queda con la sesión iniciada.
- `POST /auth/login`: acepta correo o nombre de usuario más la contraseña. Devuelve el usuario y el token. Si algo falla responde 401 con el mismo mensaje en ambos casos, para no revelar qué correos están registrados.
- `POST /auth/autorizar`: valida el token y devuelve los datos actuales del usuario. Responde 401 si el token es inválido, está vencido o el usuario está deshabilitado.
- `POST /auth/refrescar`: si el token es válido, devuelve uno nuevo con los mismos datos y otros 15'.

El token lleva el id del usuario (`sub`), el correo, el nombre de usuario y el perfil (usuario o administrador), y vence a los 15 minutos. La contraseña nunca se guarda en texto: guardo solo el hash y la respuesta del servidor nunca la incluye.

### Guard de autenticación

`auth.guard.ts` es el que protege las rutas. Lee el header `Authorization: Bearer <token>`, verifica la firma y el vencimiento con `JwtService` y deja el contenido del token en `request.user`. Si algo falla, responde 401. Con esto el backend sabe quién hace cada pedido sin que el cliente tenga que decirlo.

### Usuarios (`usuarios/`)

Guarda nombre, apellido, correo (único), nombre de usuario (único), contraseña hasheada, fecha de nacimiento, descripción, URL de la foto, perfil y un campo `activo`. El perfil solo puede ser `usuario` o `administrador`, y `activo` queda preparado para poder deshabilitar cuentas en el Sprint 4.

### Imágenes (`imagenes/`)

Recibe un archivo, lo sube a Cloudinary y devuelve la URL pública. Esa URL es lo único que guardo en la base. Las imágenes se validan en el controller: máximo 2 MB y solo jpg, png o webp.

### Publicaciones (`publicaciones/`)

- `POST /publicaciones`: crea una publicación (título hasta 100 caracteres, mensaje hasta 1000, imagen opcional). El autor sale del token.
- `GET /publicaciones`: lista las publicaciones activas. Acepta `orden` (`fecha` o `meGusta`), `offset`, `limit` (máximo 5) y `usuarioId` para filtrar las de una persona.
- `GET /publicaciones/:id`: devuelve una publicación con los datos del autor.
- `DELETE /publicaciones/:id`: baja lógica. Solo puede hacerla el autor o un administrador; si no, responde 403.
- `POST /publicaciones/:id/me-gusta` y `DELETE /publicaciones/:id/me-gusta`: dar y quitar el me gusta. Cada usuario puede darlo una sola vez por publicación.

### Comentarios (dentro de `publicaciones/`)

- `POST /publicaciones/:id/comentarios`: agrega un comentario (hasta 500 caracteres) con el usuario del token y la fecha.
- `GET /publicaciones/:id/comentarios`: devuelve los comentarios paginados con `offset` y `limit`, del más reciente al más antiguo, junto con el total.
- `PUT /publicaciones/:id/comentarios/:comentarioId`: cambia el mensaje. Solo lo puede hacer el autor del comentario y deja el campo `modificado` en `true`.

### Validación

Valido en dos capas. En el frontend uso formularios reactivos para avisar rápido al usuario, pero como esa validación se puede saltear, la que cuenta es la del backend: cada ruta tiene un DTO con decoradores de `class-validator`, y en `main.ts` activé un `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`, que descarta o rechaza los campos que el DTO no declara.

## Frontend en detalle

### Pantallas

- **Cargando:** es la primera que se ve. Muestra un spinner mientras consulto `autorizar`; si el token es válido paso a las publicaciones y si no, al login.
- **Login y registro:** formularios reactivos con validaciones (por ejemplo, la contraseña con 8 caracteres, una mayúscula y un número). Los errores del backend se muestran en un modal.
- **Publicaciones:** el listado, con selector de orden, paginación de a cinco y el formulario para publicar.
- **Publicación:** la receta en grande con sus comentarios.
- **Mi perfil:** mis datos, mi foto y mis últimas 3 publicaciones.

### Componentes principales

- `publicacion-item`: cada publicación es un componente, como pide el enunciado. Recibe los datos por `input` y maneja el me gusta y el eliminar.
- `nueva-publicacion`: el formulario para publicar. Arma un `FormData` porque lleva la imagen.
- `comentarios`: la lista y el formulario de comentarios. "Cargar más" suma los siguientes sin borrar los anteriores, y el autor puede editar su comentario, que pasa a mostrar "(editado)".
- `modal`: un modal propio. Sirve tanto para avisos como para pedir confirmación.

### Manejo de la sesión

- **`servicios/auth.ts`:** guarda el token y el usuario en `localStorage`, y expone `login`, `register`, `autorizar`, `refrescar` y `logout`.
- **Interceptor (`auth-interceptor.ts`):** agrega `Authorization: Bearer` a cada petición y, si alguna respuesta es 401, borra la sesión y manda al login.
- **Guard de rutas (`solo-logueados.ts`):** si no hay token, redirige al login.
- **Aviso de vencimiento:** al iniciar sesión se programa un temporizador. A los 10 minutos (cuando quedan 5 de los 15 del token) aparece un modal que pregunta si quiero extender la sesión; si acepto, llamo a `refrescar` y se reinicia.

## Decisiones técnicas y por qué las tomé

**El token va en `localStorage` y lo mando por header, no en cookies.** El enunciado permite ambas. Elegí header porque mi frontend y mi backend viven en dominios distintos de Vercel, y las cookies entre dominios distintos traen problemas de `SameSite`, `Secure` y CORS con credenciales. 

**Las imágenes van a Cloudinary y en la base guardo solo la URL.** Vercel no permite escribir archivos en su disco, así que no podía guardarlas en el servidor. Además así la base queda liviana.

**La baja de publicaciones es lógica.** En vez de borrar el documento cambio `activa` a `false`. Así no pierdo datos y se puede recuperar.

**Los comentarios están en su propia colección.** Pueden crecer sin límite, se paginan y se editan uno por uno. Dentro de la publicación inflarían el documento.

**La identidad sale del token, no del pedido.** El backend toma el usuario del token firmado.

**El me gusta es atómico.** Uso `$addToSet` con la condición de que el usuario no esté ya en el array, así dos clics seguidos no pueden sumar dos me gusta. Además guardo un contador aparte para poder ordenar por cantidad sin recorrer el array.

**Paginación con `offset` y `limit`.** Me sirve tanto para las páginas de publicaciones como para el "cargar más" de comentarios. Ordeno también por `_id` para desempatar y que el orden sea estable.

**El backend es ESM.** Las versiones nuevas de Nest y algunas dependencias lo exigen. Por eso `package.json` tiene `"type": "module"`, el `tsconfig` usa `nodenext` y los imports relativos terminan en `.js`.

**Autorización consultando la base.** Las rutas `autorizar` y `refrescar` buscan al usuario en Mongo aunque el token sea válido, para devolver datos actuales y rechazar cuentas deshabilitadas.

**Signals y `inject()` en Angular.** Uso signals para el estado de las pantallas y `computed` para lo derivado, como la cantidad de páginas.

## Despliegue en Vercel

Son dos proyectos de Vercel, cada uno apuntando a su carpeta (`Root Directory`):

- **Backend:** preset de NestJS, con las variables de entorno cargadas. En Atlas habilité el acceso desde cualquier IP (`0.0.0.0/0`), porque Vercel no tiene una IP fija.
- **Frontend:** el directorio de salida es `dist/morfiApp_frontend`, y un `vercel.json` redirige todas las rutas a `index.html` para que funcione la navegación de Angular al recargar.


## Cosas por agregar

- Panel de administración, con estadísticas y la posibilidad de habilitar y deshabilitar usuarios (Sprint 4).
- PWA, pipes y directivas propias (Sprint 4).
- Mostrar los comentarios de mis últimas publicaciones directamente en "Mi perfil". Hoy se ven entrando a cada publicación.
- Pasar el token a una cookie `httpOnly` para mejorar la protección frente a XSS.
- Un refresh token separado, en lugar de refrescar con el mismo token vigente.
- Tests automatizados.