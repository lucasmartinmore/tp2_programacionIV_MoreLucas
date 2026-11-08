# MorfiApp: Red social de recetas

MorfiApp es una red social donde las personas comparten recetas. Cada receta es una publicación con título, descripción y una foto opcional, y las demás personas pueden darle me gusta y comentarla. Hay dos tipos de perfil: usuario y administrador. El administrador puede gestionar usuarios, dar de baja publicaciones y comentarios ajenos asi mismo puede ver estadísticas de uso.

## Enlaces

| | Dirección |
|---|---|
| Aplicación (frontend) | https://tp2-programacion-iv-more-lucas-ocdb.vercel.app |
| API (backend) | https://tp2-programacion-iv-more-lucas.vercel.app |

## Contenido

1. [Estado del proyecto](#estado-del-proyecto)
2. [Tecnologías](#tecnologías)
3. [Cómo está dividido el proyecto](#cómo-está-dividido-el-proyecto)
4. [Cómo correrlo en mi pc](#cómo-correrlo-en-mi-pc)
5. [Variables de entorno](#variables-de-entorno)
6. [Cómo crear el primer administrador](#cómo-crear-el-primer-administrador)
7. [Backend en detalle](#backend-en-detalle)
8. [Frontend en detalle](#frontend-en-detalle)
9. [Decisiones técnicas](#decisiones-técnicas)
10. [Despliegue en Vercel](#despliegue-en-vercel)

## Estado del proyecto

| Sprint | Qué incluye | Estado |
|---|---|---|
| 1 | Registro con foto de perfil opcional, login, navegación entre pantallas y despliegue | Terminado y desplegado |
| 2 | Publicaciones con imagen, listado con orden y paginación, me gusta, baja lógica y "Mi perfil" con mis últimas 3 publicaciones | Terminado |
| 3 | Autenticación con JWT, rutas `autorizar` y `refrescar`, pantalla de carga, aviso para extender la sesión, comentarios con paginación y edición | Terminado |
| 4 | Perfil de administrador (gestión de usuarios y bajas), estadísticas con gráficos, eliminar comentarios, editar mi perfil, listado de publicaciones, pipes y directivas propias, PWA | Terminado |

## Tecnologías

**Backend**
- NestJS 12, escrito en TypeScript y como módulos ES (ESM).
- MongoDB Atlas con Mongoose como ODM. Para las estadísticas uso `aggregate`.
- `@nestjs/jwt` para firmar y verificar los tokens.
- `@nestjs/authentication` para hashear y verificar contraseñas (`PasswordHasher`).
- `class-validator` y `class-transformer` para validar los datos que llegan.
- Multer (viene con `@nestjs/platform-express`) para recibir archivos.
- Cloudinary para guardar las imágenes.

**Frontend**
- Angular 22, con componentes standalone, signals y formularios reactivos.
- Bootstrap para la base de estilos, más estilo propio CSS.
- RxJS para las peticiones HTTP.
- Chart.js para los gráficos de estadísticas.
- `@angular/pwa` (manifest y service worker) para que se pueda instalar como aplicación.

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
│       ├── auth/                registro, login, JWT, guards (AuthGuard y AdminGuard)
│       ├── usuarios/            entidad, perfil y administración de usuarios
│       ├── imagenes/            subida de imágenes a Cloudinary
│       └── publicaciones/       publicaciones, comentarios y estadísticas
└── morfiApp_frontend/           aplicación en Angular
    ├── public/                  manifest de la PWA e íconos
    └── src/app/
        ├── componentes/         pantallas y piezas de la interfaz
        ├── servicios/           comunicación con el back y manejo de sesión
        ├── interceptors/        interceptor HTTP del token
        ├── guards/              guards de rutas (solo logueados y solo administrador)
        ├── pipes/               pipes propios
        ├── directivas/          directivas propias
        ├── models/              interfaces de TypeScript
        ├── validators/          validaciones de formularios
        └── utils/               funciones auxiliares
```

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

**Probar la PWA.** El service worker solo se activa en la versión de producción, así que con `ng serve` no aparece. Para probarlo:

```bash
ng build
npx http-server dist/morfiApp_frontend -p 8080 -c-1 --proxy http://localhost:8080?
```

Después entro a `http://localhost:8080` y reviso en el navegador, en DevTools, Application, las secciones Manifest y Service Workers. En la barra de direcciones aparece el ícono para instalar la aplicación.

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

## Cómo crear el primer administrador

El registro siempre crea usuarios comunes: el DTO de registro no acepta el campo `perfil`, así que nadie puede registrarse como administrador. El primer administrador se crea a mano en la base:

1. Registrar una cuenta normal desde la aplicación.
2. En MongoDB Atlas, entrar a Browse Collections, colección `usuarios`, y editar ese documento: cambiar `perfil` de `"usuario"` a `"administrador"`.
3. Cerrar sesión y volver a entrar, para que el token nuevo traiga el rol.

Desde ese momento, ese administrador puede crear otros usuarios (comunes o administradores) desde la pantalla de Usuarios.

Usuario administrador de prueba: lucasmartinmore@hotmail.com

## Backend en detalle

### Autenticación (`auth/`)

- `POST /auth/register`: crea la cuenta. Recibe los datos como `multipart/form-data` porque puede llevar una foto de perfil. Devuelve el usuario y un token, así que quien se registra queda con la sesión iniciada.
- `POST /auth/login`: acepta correo o nombre de usuario más la contraseña. Devuelve el usuario y el token. Si algo falla responde 401 con el mismo mensaje en ambos casos, para no revelar qué correos están registrados. Si las credenciales son correctas pero la cuenta fue deshabilitada por un administrador, responde 403 con un mensaje que lo aclara.
- `POST /auth/autorizar`: valida el token y devuelve los datos actuales del usuario. Responde 401 si el token es inválido, está vencido o el usuario está deshabilitado.
- `POST /auth/refrescar`: si el token es válido, devuelve uno nuevo con los mismos datos y otros 15'.

El token lleva el id del usuario (`sub`), el correo, el nombre de usuario y el perfil (usuario o administrador), y vence a los 15 minutos. La contraseña nunca se guarda en texto: guardo solo el hash y la respuesta del servidor nunca la incluye.

### Guards

- **`auth.guard.ts`** protege las rutas que piden estar logueado. Lee el header `Authorization: Bearer <token>`, verifica la firma y el vencimiento con `JwtService` y deja el contenido del token en `request.user`. Si algo falla, responde 401. Con esto el backend sabe quién hace cada pedido sin que el cliente tenga que decirlo.
- **`admin.guard.ts`** es un segundo guard que se usa. Mira el campo `perfil` del token y, si no es `administrador`, responde 403. Los uso encadenados, `@UseGuards(AuthGuard, AdminGuard)`: el primero autentica  y el segundo autoriza.

### Usuarios (`usuarios/`)

Guarda nombre, apellido, correo (único), nombre de usuario (único), contraseña hasheada, fecha de nacimiento, descripción, URL de la foto, perfil y un campo `activo`. El perfil solo puede ser `usuario` o `administrador`.

- `PUT /usuarios/perfil`: cualquier usuario logueado modifica su propio perfil (nombre, apellido, descripción, fecha de nacimiento y foto). El id sale del token, no de la URL, para que nadie pueda editar el perfil de otra persona. El correo y el nombre de usuario no se pueden cambiar.
- `GET /usuarios`: lista de usuarios, sin contraseña. Solo administrador.
- `POST /usuarios`: el administrador crea un usuario con el perfil que elija. Recibe los mismos datos que el registro más `perfil`. Solo administrador.
- `DELETE /usuarios/:id`: deshabilita al usuario (baja lógica, `activo: false`). Un administrador no puede deshabilitarse a sí mismo. Solo administrador.
- `POST /usuarios/:id/habilitar`: lo vuelve a habilitar (alta lógica). Solo administrador.

### Imágenes (`imagenes/`)

Recibe un archivo, lo sube a Cloudinary y devuelve la URL pública. Esa URL es lo único que guardo en la base. Las imágenes se validan en el controller: máximo 2 MB y solo jpg, png o webp.

### Publicaciones (`publicaciones/`)

- `POST /publicaciones`: crea una publicación (título hasta 100 caracteres, mensaje hasta 1000, imagen opcional). El autor sale del token.
- `GET /publicaciones`: lista las publicaciones activas. Acepta `orden` (`fecha` o `meGusta`), `offset`, `limit` (con un máximo) y `usuarioId` para filtrar las de una persona.
- `GET /publicaciones/:id`: devuelve una publicación con los datos del autor.
- `DELETE /publicaciones/:id`: baja lógica. Solo puede hacerla el autor o un administrador; si no, responde 403.
- `POST /publicaciones/:id/me-gusta` y `DELETE /publicaciones/:id/me-gusta`: dar y quitar el me gusta. Cada usuario puede darlo una sola vez por publicación.

### Comentarios (dentro de `publicaciones/`)

- `POST /publicaciones/:id/comentarios`: agrega un comentario (hasta 500 caracteres) con el usuario del token y la fecha.
- `GET /publicaciones/:id/comentarios`: devuelve los comentarios paginados con `offset` y `limit`, del más reciente al más antiguo, junto con el total. No incluye los eliminados.
- `PUT /publicaciones/:id/comentarios/:comentarioId`: cambia el mensaje. Solo lo puede hacer el autor del comentario y deja el campo `modificado` en `true`.
- `DELETE /publicaciones/:id/comentarios/:comentarioId`: baja lógica (`activo: false`). Lo puede hacer el autor del comentario o un administrador; si no, responde 403.

### Estadísticas (dentro de `publicaciones/`)

Las tres rutas están protegidas con `AuthGuard` y `AdminGuard`, y reciben el lapso como `desde` y `hasta` (formato AAAA-MM-DD). Si no los mando, usa los últimos 30 días. Cada una es un `aggregate` de Mongo (`$match`, `$group`, `$sort`, `$project`):

- `GET /estadisticas/publicaciones-por-usuario`: cantidad de publicaciones de cada usuario en el lapso.
- `GET /estadisticas/comentarios-por-dia`: cantidad de comentarios por día.
- `GET /estadisticas/comentarios-por-publicacion`: cantidad de comentarios de cada publicación (las 10 con más).

### Validación

Valido en dos capas. En el frontend uso formularios reactivos para avisar rápido al usuario, pero como esa validación se puede saltear, la que cuenta es la del backend: cada ruta tiene un DTO con decoradores de `class-validator`, y en `main.ts` activé un `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`, que descarta o rechaza los campos que el DTO no declara.

## Frontend en detalle

### Pantallas

- **Cargando:** es la primera que se ve. Muestra el logo con un spinner mientras consulto `autorizar`; si el token es válido paso a las publicaciones y si no, al login.
- **Login y registro:** formularios reactivos con validaciones (por ejemplo, la contraseña con 8 caracteres, una mayúscula y un número, y repetirla). Los errores del backend se muestran en un modal. Si la cuenta está deshabilitada, el modal lo dice con un título propio.
- **Publicaciones:** publicaciones en listado, con selector de orden, paginación de a cinco y el formulario para publicar.
- **Publicación:** la receta en grande con sus likes y comentarios.
- **Mi perfil:** mis datos, mi foto y mis últimas 3 publicaciones, con un botón para editar el perfil.
- **Editar perfil:** formulario con mis datos actuales para cambiar nombre, apellido, fecha, descripción y foto.
- **Usuarios (administrador):** tabla con todos los usuarios, botón para habilitar o deshabilitar y un formulario para crear usuarios, y la elección del perfil con radio buttons.
- **Estadísticas (administrador):** tres gráficos hechos con Chart.js (barras, líneas y torta) y un selector de lapso con dos fechas.

### Componentes principales

- `publicacion-item`: cada publicación es un componente. Recibe los datos por `input` y maneja el me gusta y el eliminar (lo ve el autor o un administrador).
- `nueva-publicacion`: el formulario para publicar. Arma un `FormData` porque lleva la imagen.
- `comentarios`: la lista y el formulario de comentarios. "Cargar más" suma los siguientes sin borrar los anteriores. El autor puede editar su comentario, que pasa a mostrar "(editado)", y el autor o un administrador pueden eliminarlo.
- `modal`: un modal propio. Sirve tanto para avisos como para pedir confirmación.
- `navbar`: se colapsa en un menú desplegable en pantallas chicas, y los links de administración solo aparecen para administradores.

### Manejo de la sesión

- **`servicios/auth.ts`:** guarda el token y el usuario en `localStorage`, y expone `login`, `register`, `autorizar`, `refrescar`, `actualizarUsuario` y `logout`.
- **Interceptor (`auth-interceptor.ts`):** agrega `Authorization: Bearer` a cada petición y, si alguna respuesta es 401, borra la sesión y manda al login.
- **Guards de rutas:** `solo-logueados.ts` redirige al login si no hay token, y `solo-admin.ts` manda a las publicaciones a quien no sea administrador. Las pantallas de administración usan los dos, en ese orden.
- **Aviso de vencimiento:** al iniciar sesión se programa un temporizador. A los 10 minutos (cuando quedan 5 de los 15 del token) aparece un modal que pregunta si quiero extender la sesión; si acepto, llamo a `refrescar` y se reinicia.

### Pipes propios (`pipes/`)

- `tiempoRelativo`: muestra "hace 5 minutos" en lugar de la fecha. Pasado un mes muestra la fecha completa.
- `recortar`: corta los textos largos y agrega puntos suspensivos; el largo máximo es un parámetro.
- `iniciales`: "Usuario Prueba" pasa a "UP", para el avatar.

### Directivas propias (`directivas/`)

- `appResaltar` (de atributo): pinta de otro color el elemento mientras el mouse está encima. La uso en las filas de la tabla de usuarios.
- `*appSoloAdmin` (estructural): agrega el elemento al HTML solo si el usuario logueado es administrador. La uso en los links de la barra de navegación.
- `appAutoFoco` (de atributo): pone el cursor en el campo apenas aparece, por ejemplo al editar un comentario.

### PWA

Con `ng add @angular/pwa` se generó el `manifest.webmanifest` (nombre, colores e íconos) y el service worker. La aplicación se puede instalar desde el navegador, tanto en la computadora como en el celular, y abre como una aplicación propia. El service worker solo se registra en producción.

## Decisiones técnicas 

**El token va en `localStorage` y lo mando por header, no en cookies.** El enunciado permite ambas. Elegí header porque mi frontend y mi backend viven en dominios distintos de Vercel, y las cookies entre dominios distintos traen problemas de `SameSite`, `Secure` y CORS con credenciales.

**Dos guards en cadena para el administrador.** `AuthGuard` comprueba que el token sea válido y `AdminGuard` que el perfil sea administrador. Los separé porque cada uno tiene una sola responsabilidad y `AuthGuard` lo reutilizo en todo el back. Si no es administrador respondo 403 y no 401, porque sé quién es pero no tiene permiso.

**El rol sale del token.** No consulto la base en cada pedido. La contrapartida es que si a un administrador le sacan el rol, lo conserva hasta que su token venza (máximo 15 minutos).

**Esconder opciones no es seguridad.** Los links y botones de administrador los oculto con `*appSoloAdmin` para que la interfaz sea clara, pero la seguridad real está en el backend: aunque alguien llame a la API directamente, los guards lo frenan.

**La baja es lógica en publicaciones, comentarios y usuarios.** En vez de borrar el documento cambio `activa` o `activo` a `false`. Así no pierdo datos y se puede recuperar. 

**Un usuario deshabilitado recibe 403 al ingresar.** Verifico el estado después de comprobar la contraseña, para no revelar el estado de una cuenta a quien no conoce la clave. Si lo deshabilitan con la sesión abierta, `autorizar` y `refrescar` lo rechazan con 401.

**El perfil se edita sin correo ni nombre de usuario.** Son únicos e identifican la cuenta.

**Las imágenes van a Cloudinary y en la base guardo solo la URL.** Vercel no permite escribir archivos en su disco, así que no podria guardarlas en el servidor.

**Los comentarios están en su propia colección.** Pueden crecer sin límite, se paginan y se editan uno por uno. Dentro de la publicación inflarían el documento. En el módulo, van dentro de Publicaciones porque un comentario no existe sin su publicación.

**La identidad sale del token, no del pedido.** El backend toma el usuario del token firmado, nunca de un dato que mande el cliente.

**El me gusta es atómico.** Uso `$addToSet` con la condición de que el usuario no esté ya en el array, así dos clics seguidos no pueden sumar dos me gusta. Además guardo un contador aparte para poder ordenar por cantidad sin recorrer el array.

**Paginación con `offset` y `limit`.** Me sirve tanto para las páginas de publicaciones como para el "cargar más" de comentarios. Ordeno también por `_id` para desempatar y que el orden sea estable. En el listado uso 5 publicaciones por página.

**Las estadísticas las calcula la base con `aggregate`.** Es un pipeline de pasos encadenados: filtro por fecha con `$match`, agrupo y cuento con `$group` y ordeno con `$sort`. Así al servidor llegan solo los totales y no todos los documentos. Después uso `populate` para cambiar los ids por el nombre de usuario o el título.

**Chart.js directo, sin wrapper de Angular.** Obtengo el `canvas` con `viewChild`, dibujo después del render y destruyo el gráfico anterior antes de redibujar.

**El backend es ESM.** Las versiones nuevas de Nest y algunas dependencias lo exigen. Por eso `package.json` tiene `"type": "module"`, el `tsconfig` usa `nodenext` y los imports relativos terminan en `.js`.

**Autorización consultando la base.** Las rutas `autorizar` y `refrescar` buscan al usuario en Mongo aunque el token sea válido, para devolver datos actuales y rechazar cuentas deshabilitadas.

**Signals y `inject()` en Angular.** Uso signals para el estado de las pantallas y `computed` para lo derivado, como la cantidad de páginas o si puedo eliminar un comentario.

**Pipes puros.** Se recalculan solo cuando cambia el valor de entrada. La contrapartida es que "hace 5 minutos" no se actualiza solo con el paso del tiempo hasta que la pantalla se redibuja.

## Despliegue en Vercel

Son dos proyectos de Vercel, cada uno apuntando a su carpeta (`Root Directory`):

- **Backend:** preset de NestJS, con las variables de entorno cargadas. En Atlas habilité el acceso desde cualquier IP (`0.0.0.0/0`), porque Vercel no tiene una IP fija.
- **Frontend:** el directorio de salida es `dist/morfiApp_frontend`, y un `vercel.json` redirige todas las rutas a `index.html` para que funcione la navegación de Angular al recargar. Como Vercel sirve con HTTPS, la aplicación se puede instalar como PWA.
