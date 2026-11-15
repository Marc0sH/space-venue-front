# Space&Venue - Cliente Web Frontend

Cliente web de Space&Venue, una aplicación para descubrir espacios, consultar su disponibilidad y gestionar reservas y publicaciones. Este repositorio contiene exclusivamente el frontend Angular; la API y su infraestructura se mantienen por separado.

## 1. Información del Sistema

- **Nombre**: Space&Venue (Cliente Web Frontend).
- **Tipo de sistema**: Single Page Application (SPA) responsive desarrollada con Angular.
- **Carácter del proyecto**: Proyecto Académico Integrador de las asignaturas **Programación IV** y **Gestión de Desarrollo de Software** de la **Universidad Tecnológica Nacional (UTN FRMDP)**, cursada 2026.
- **Descripción**: Interfaz gráfica para explorar espacios y sus ubicaciones, solicitar reservas de corta duración, administrar espacios propios, consultar reservas y moderar contenido y usuarios según el rol.
- **Problema que soluciona**: Ofrece una experiencia centralizada para encontrar espacios ociosos con criterios geográficos y gestionar visualmente publicaciones, agendas y reservas.
- **Visión y objetivos**: Brindar una experiencia de usuario clara y fluida, adaptable a pantallas móviles y con navegación protegida según la sesión. La carga dinámica en menos de 2 segundos es un objetivo de experiencia, no un SLA medido o garantizado por este repositorio.

## 2. Reglas de Negocio y Decisiones de Arquitectura Frontend

- **API desacoplada**: los componentes delegan las llamadas HTTP a servicios Angular que usan `HttpClient` y, para recursos reactivos, `httpResource`. La URL base se centraliza en `src/environments/enviroment.ts`.
- **Sesión en cliente**: el servicio `Session` mantiene el estado de autenticación con señales de Angular y persiste la respuesta de login como JSON en `localStorage`, bajo la clave `session`. Esto permite restaurar el estado al recargar la SPA; no sustituye la validación del servidor.
- **Autorización HTTP**: `authInterceptor` agrega `Authorization: <tipo> <token>` a solicitudes dirigidas a la API cuando hay una sesión. El tipo se toma del campo `tipo` de la respuesta de login (normalmente `Bearer`). Omite login y registro; permite que logout incluya el token. Ante una respuesta HTTP 401 limpia la sesión y redirige al login.
- **Rutas protegidas**: las funciones `logInGuard`, `adminGuard` y `publicadorGuard` controlan el acceso a reservas y perfil, administración y gestión de espacios, respectivamente. Son controles de navegación/UX; la API debe seguir validando permisos y propiedad de los recursos.
- **Roles reconocidos por el frontend**: `ROLE_CLIENT`, `ROLE_OFFERER` y `ROLE_ADMIN`. La aplicación habilita gestión de espacios para oferentes y administradores.
- **Reservas**: el formulario limita la duración del evento a menos de 24 horas. La disponibilidad, el precio definitivo y los cambios de estado dependen también del contrato y validaciones del backend.
- **Imágenes y mapas**: las ubicaciones se representan con Leaflet y teselas de OpenStreetMap; el buscador de lugares usa Photon. Las imágenes se sirven con la URL base de medios y el frontend solicita al backend el flujo de subida correspondiente.

## 3. Convenciones de Programación y Guía de Estilo (Estándar Cátedra Angular 2026)

- Código organizado por características bajo `src/app` (autenticación, espacios, reservas, usuarios y componentes comunes).
- Componentes Angular con sus plantillas y estilos separados, servicios inyectables para lógica compartida y modelos TypeScript para las estructuras del dominio.
- Estado local y derivado mediante `signal()` y `computed()` donde corresponde; uso de `httpResource` para recursos vinculados a señales.
- Formularios implementados con la **API de Signal Forms** (`form`, `formField` y reglas de validación) en lugar de `ReactiveFormsModule`/`FormGroup`.
- Los componentes se desarrollan en el estilo standalone actual de Angular; no se usa una arquitectura basada en NgModules o *feature modules*.
- Mantener tipos y contratos del backend, validaciones y mensajes de interfaz en español, además de reutilizar servicios y modelos existentes.
- Las pruebas unitarias se ejecutan con Angular CLI y Vitest (`npm test`).

## 4. Roles del Sistema y Matriz de Vistas / Accesos

| Rol | Vistas y capacidades del frontend | Protección de rutas |
| --- | --- | --- |
| Público | Inicio/catálogo de espacios, filtros y búsqueda por cercanía, detalle del espacio y mapa. Login y registro. | Catálogo, detalle, login y registro son públicos. `/` redirige a `/espacios`. |
| Cliente (`ROLE_CLIENT`) | Solicitar una reserva, consultar listado y detalle de reservas, perfil, notificaciones y comentarios/valoraciones desde las vistas de espacios. | `logInGuard` en reservas, perfil y notificaciones. |
| Oferente (`ROLE_OFFERER`) | Consultar espacios propios, crear y editar publicaciones, administrar servicios e imágenes y revisar reservas asociadas a sus espacios. | `publicadorGuard` en creación, listado y edición de espacios propios; también protege las reservas por espacio. |
| Administrador (`ROLE_ADMIN`) | Revisar espacios inactivos/pendientes, administrar su estado y gestionar usuarios. También puede publicar y administrar espacios. | `adminGuard` en `/admin/espacios`, `/admin/usuarios` y `/admin/usuarios/:id`; `publicadorGuard` en gestión de espacios propios. |

El rol se conserva en la sesión que devuelve la API. Las guardas del cliente mejoran la navegación, pero **no constituyen una frontera de seguridad**: los permisos efectivos deben verificarse en el backend. Las capacidades de interfaz pueden variar según el estado del recurso y los permisos del servidor.

## 5. Requisitos Funcionales y No Funcionales Consolidados

### Funcionales

- Explorar el catálogo y ordenar/filtrar espacios; buscar lugares y filtrar por cercanía.
- Consultar la ficha de un espacio, ubicación, servicios, imágenes, disponibilidad, puntuación y reseñas.
- Crear y editar publicaciones propias, administrar servicios e imágenes, y consultar espacios propios.
- Solicitar y consultar reservas; la duración máxima permitida por el formulario es inferior a 24 horas.
- Consultar y gestionar reseñas, perfil y notificaciones.
- Moderar espacios y administrar usuarios mediante las vistas administrativas.

### No funcionales y UX

- Diseño responsive con reglas de estilo adaptadas a distintos anchos de pantalla, incluidas vistas móviles. La adaptación desde 360 px es un requisito de diseño; no representa por sí sola una certificación automatizada para todos los dispositivos.
- Mapas interactivos con Leaflet y OpenStreetMap, y búsqueda geográfica mediante Photon.
- Validaciones visibles en formularios y estados de carga/error en los flujos que los implementan.
- Angular CLI define presupuestos de build de producción: 500 kB de advertencia y 1 MB de error para el bundle inicial, y 4 kB de advertencia/16 kB de error por estilo de componente.
- El objetivo de carga dinámica menor a 2 segundos debe medirse en el entorno desplegado; no se garantiza solamente mediante la compilación del frontend.

## 6. Modelo de Datos del Frontend (Interfaces & Modelos TypeScript)

Las interfaces y tipos del dominio se encuentran en `src/app/models/`:

| Modelo / tipo | Archivo | Uso |
| --- | --- | --- |
| `Space`, `NewSpace`, `SpaceUpdate` | `space.model.ts` | Publicaciones, detalle, alta y edición de espacios; incluye ubicación, propietario, políticas, servicios y puntuaciones. |
| `ReservationComplete`, `NewReservation`, `ReservationCalendarEntry` | `reservation.model.ts` | Reservas, altas, estados, motivos de cancelación y entradas del calendario. |
| `UserComplete`, `UserProfileData`, `LoginRequest`, `LoginResponse`, `Rol` | `user.model.ts` | Usuarios, autenticación, perfil y roles (`ROLE_CLIENT`, `ROLE_OFFERER`, `ROLE_ADMIN`). |
| `Location`, `Coordinates`, `NearbyFilter` | `location.model.ts` | Coordenadas y filtros geográficos. |
| `ServiceSpace`, `ServiceReg`, `ServiceSelected` | `service.model.ts` | Servicios publicados y servicios asociados a reservas. |
| `CommentComplete`, `CommentInsertion`, `CommentForm` | `comment.model.ts` | Reseñas, puntuación y datos de alta/edición. |
| `Notificacion`, `NotificacionCount` | `notification.model.ts` | Notificaciones y contador. |
| `Cancellationpolicies` | `cancellationpolicies.model.ts` | Datos de las políticas de cancelación provistos por la API. |
| `SpaceImage`, `ImageUploadUrl` | `space-image.model.ts` | Imágenes de espacios y datos de la URL temporal de subida. |

Los tipos son el contrato del cliente y no implican que todos los campos sean modificables desde el navegador. El backend sigue siendo responsable de validar y persistir las operaciones.

## 7. Rutas del Sistema (Angular Router)

Las rutas activas están definidas en `src/app/app.routes.ts`. Se documentan las rutas reales del cliente; no hay alias configurados para las rutas en inglés indicadas en algunas consignas.

| Ruta | Vista / uso | Acceso |
| --- | --- | --- |
| `/` | Redirección a `/espacios`. | Público |
| `/login` | Autenticación. | Público |
| `/registro` | Registro. | Público |
| `/espacios` | Catálogo principal. | Público |
| `/espacios/todos` | Listado completo. | Público |
| `/espacios/:id` | Detalle del espacio. | Público |
| `/espacios/crear` | Alta de espacio. | `publicadorGuard` |
| `/espacios/espaciospropios` | Gestión/listado de espacios propios. | `publicadorGuard` |
| `/espacios/:id/editar` | Edición de espacio propio. | `publicadorGuard` |
| `/reserva/:idSpace` | Solicitud de reserva para un espacio. | `logInGuard` |
| `/reservas` | Listado de reservas. | `logInGuard` |
| `/reservas/:idReservation` | Detalle de una reserva. | `logInGuard` |
| `/reservas/byspace/:idSpace` | Reservas asociadas a un espacio. | `publicadorGuard` |
| `/perfil` | Perfil de usuario. | `logInGuard` |
| `/perfil/editar` | Edición de perfil. | `logInGuard` |
| `/notificaciones` | Notificaciones del usuario. | `logInGuard` |
| `/admin/espacios` | Administración y moderación de espacios. | `adminGuard` |
| `/admin/usuarios` | Administración de usuarios. | `adminGuard` |
| `/admin/usuarios/:id` | Perfil de usuario desde administración. | `adminGuard` |
| `**` | Página de ruta inexistente. | Público |

Por lo tanto, `/catalog`, `/space-detail/:id`, `/ownedspace`, `/my-reservations` y `/admin/spaces/pending` **no son rutas configuradas**: sus vistas correspondientes, cuando existen, se sirven en las rutas reales de la tabla.

## 8. Tecnologías Utilizadas y Requisitos de Versionado

- **Angular**: dependencias `^22.1.0`; Angular CLI y `@angular/build` `^22.1.8` en desarrollo.
- **TypeScript**: `~6.0.2`.
- **RxJS**: `~7.8.0`.
- **Leaflet**: `^1.9.4`, con tipos de `@types/leaflet`.
- **HTML5 y CSS3** para vistas y estilos.
- **Angular Router**, `HttpClient`, señales, `httpResource` y Signal Forms.
- **Angular CLI** para servidor de desarrollo, build y pruebas; Vitest como runner de pruebas.
- **Node.js**: la configuración de Amplify instala Node 22. Para desarrollo local se recomienda Node.js 22.x y una versión de npm compatible con el `package-lock.json`; el manifiesto declara `npm@12.0.2`.

## 9. Dependencias Externas

- **Leaflet 1.9.4**: mapas, marcadores y selección visual de coordenadas. Se carga de forma dinámica cuando se necesita un mapa.
- **Photon** (`photon.komoot.io`): geocodificación y autocompletado de lugares; servicio público basado en datos de OpenStreetMap. No es una dependencia npm del proyecto.
- **OpenStreetMap**: proveedor de teselas cartográficas mostrado mediante Leaflet. Respetar su atribución y las condiciones de uso del servicio.
- **AWS Amplify, CloudFront y S3**: infraestructura documentada para publicación web, distribución de medios y acceso de producción a la API. La configuración de subida de imágenes y las autorizaciones corresponden al backend y a AWS.

## 10. Pasos de Instalación y Requisitos de Runtime Local

### Requisitos

- Git.
- Node.js 22.x y npm compatible con el lockfile del repositorio.
- Backend disponible en `http://localhost:8080` si se quieren probar operaciones que consumen la API local, o en `https://d3l047wlzqnbc6.cloudfront.net/api`.

### Instalación y ejecución

```bash
git clone https://github.com/Marc0sH/space-venue-front.git
cd space-venue-front
npm ci
npm start
```

La aplicación queda disponible en `http://localhost:4200`. El script `npm start` ejecuta `ng serve`; también se puede iniciar directamente con `npx ng serve`.

Antes de ejecutar o publicar, revisar `src/environments/enviroment.ts` (el nombre del archivo está escrito así en el repositorio). Actualmente declara `apiUrl: 'https://d3l047wlzqnbc6.cloudfront.net/api'` y `mediaUrl: 'https://d3l047wlzqnbc6.cloudfront.net'`. Para un backend local, la API debe estar activa en ese host/puerto (generalmente 8080). No se debe cambiar la URL en componentes individuales.

Comandos útiles:

```bash
npm test
npm run build
```

## 11. Pasos de Build y Despliegue Continuo (AWS Amplify)

### Build de producción

```bash
ng build --configuration production
```

El build también se ejecuta con `npm run build`. Angular usa producción como configuración por defecto y genera los artefactos en `dist/space-venue-front/browser`. La configuración de producción habilita hash de archivos y presupuestos de tamaño.

### Infraestructura y publicación

El frontend se publica en AWS Amplify Hosting desde la rama `master` del repositorio `Marc0sH/space-venue-front`. La URL pública documentada es:

- **Frontend**: [https://master.d37a6k8i0ni70h.amplifyapp.com](https://master.d37a6k8i0ni70h.amplifyapp.com)
- **API de producción documentada**: [https://d3l047wlzqnbc6.cloudfront.net/api](https://d3l047wlzqnbc6.cloudfront.net/api)

El flujo automático se inicia al recibir cambios en la rama conectada. La configuración del repositorio en [`amplify.yml`](amplify.yml):

1. Instala y usa Node 22.
2. Ejecuta `npm ci`.
3. Ejecuta `npm run build`.
4. Publica `dist/space-venue-front/browser` y cachea `node_modules`.

### Rewrites para navegación SPA

Amplify debe tener una regla de *Rewrites and redirects* que reescriba `/<*>` a `/index.html` con tipo **404-200** (según la configuración documentada). Esto permite que rutas internas como `/espacios/12` entreguen la aplicación Angular al refrescar o al abrirse directamente; luego Angular Router resuelve la vista. No confundir la respuesta **404-200** con un redirect HTTP **404**.

### Configuración de URL de API: verificar antes de publicar

`angular.json` no define reemplazos de environment entre desarrollo y producción, y `amplify.yml` no establece una URL. Por eso, **verificar y configurar el endpoint de API de producción antes de desplegar**; de lo contrario, el bundle publicado podría intentar llamar a un `localhost` en el navegador de cada usuario. `mediaUrl` debe revisarse junto con la configuración del backend.

## 12. Detalles del Equipo de Desarrollo

- Ciro Luciano Feijoo
- Marcos Hoyuelos
- Federico Facundo Huergo
- Lautaro Daniel Perez
