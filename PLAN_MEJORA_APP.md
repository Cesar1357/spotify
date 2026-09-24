# Plan de mejora de la app de musica

## Principios

- Mantener compatibilidad con datos existentes de Firebase y AsyncStorage.
- Separar modelo de datos, reproduccion y presentacion para evitar que cada pantalla normalice la musica de forma distinta.
- Validar cada fase con TypeScript, lint y pruebas manuales de reproduccion.
- Mantener la interfaz minimalista, pero con jerarquia visual, estados vacios, carga y errores claros.

## Fase 1: autores y artistas

### Estado: implementada

- [x] Crear una normalizacion comun que acepte `string`, `string[]`, valores vacios y textos con comas.
- [x] Hacer que `ReproGrande` cargue perfiles para todos los autores de una pista.
- [x] Mostrar una ficha independiente y navegable por cada autor.
- [x] Mantener un texto unido para el campo `artist` que requiere TrackPlayer.
- [x] Propagar el campo `autores` sin perdida desde Inicio, Playlist, Search, History, descargas y anuncios.
- [x] Actualizar consultas de canciones por autor para encontrar tanto documentos antiguos como canciones con arrays.
- [x] Migrar gradualmente escrituras nuevas a `autores: string[]` y conservar `autor` como campo legado mientras existan consumidores antiguos.
- [ ] Añadir pruebas de normalizacion y casos de reproduccion con uno, varios y ningun autor.

## Fase 2: inicio dinamico

- Progreso: el Inicio ahora incluye todas las secciones cargadas y rota su orden según la hora y la sesión.
- Progreso: se añadió una sección contextual que combina hora, géneros favoritos, exclusión de likes y fallback a canciones populares.
- Progreso: ahora también se muestran la rotación reciente y las playlists del usuario cargadas por el feed.
- Progreso: se eliminaron duplicados de renderizado y canciones repetidas entre secciones.
- Progreso: se añadieron secciones de más vistas, más likeadas y canciones de un artista destacado.
- Progreso: se unificaron vistas/likes en `Lo más popular` y se añadió fallback para canciones sin `popularity`.
- Progreso: el Inicio genera hasta cuatro secciones de géneros automáticamente a partir del catálogo disponible.
- Progreso: el Inicio puede generar hasta veinte secciones de géneros, agrupando aliases y evitando repetir canciones entre categorías.
- Progreso: las secciones dinámicas se montan escalonadamente: cuatro al inicio y tres adicionales al acercarse al final del scroll; el bloque dinámico está al final para evitar saltos de scroll.
- Progreso: las secciones predefinidas dejaron de rotar; playlists y rotación reciente quedan arriba, y la recomendación según la hora ocupa el tercer lugar.

- Construir un modelo de secciones de inicio con tipo, titulo, prioridad, estrategia de seleccion y caducidad.
- Generar secciones por hora del dia, genero, decada, estado de animo, historial, favoritos y novedades.
- Evitar repeticiones entre secciones mediante ids de canciones ya mostradas y una semilla por sesion.
- Añadir estados de carga, vacio, offline y refresco.
- Permitir guardar una playlist dinamica en la biblioteca, conservando una instantanea de sus canciones y su origen.
- Medir interaccion, reproducciones y guardados para ajustar la seleccion sin bloquear el inicio.

## Fase 3: biblioteca, Playlist y acciones

- Progreso: el encabezado de Playlist ahora muestra el total de canciones y sus controles tienen áreas táctiles y feedback más claros.
- Progreso: Playlist conserva `vid` y `uri` al cargar canciones locales, por lo que el selector de video de ReproGrande funciona también desde playlists.
- Progreso: Playlist conserva el `uri` original al construir sus canciones normalizadas; las filas ya no pierden `uri[1]` al reproducir desde una playlist.
- Progreso: Playlist dejó de anidar un `FlatList` vertical dentro de un `ScrollView`; ahora usa una sola lista virtualizada para reducir el lag durante la reproducción.
- Progreso: Search ahora muestra el total de resultados activos y sus filas tienen feedback táctil consistente.
- Progreso: Search muestra tarjetas dinámicas de hasta quince géneros por defecto; el historial y resultados aparecen al enfocar el buscador.
- Progreso: las tarjetas de género ahora se muestran en un grid vertical de dos columnas y la X del buscador devuelve el estado de exploración.
- Progreso: el grid de géneros carga progresivamente en lotes de 20 hasta el límite disponible de 200, evitando montar todas las tarjetas de golpe.
- Progreso: el modal de creación de Biblioteca abre expandido, enfoca el input y sincroniza su snap mínimo/máximo con la visibilidad del teclado.
- Progreso: agregar canciones a una playlist ahora usa identificadores exactos, evita duplicados por nombre y conserva `autores`.
- Progreso: se unificó el límite de 100 canciones para cuentas no premium desde Playlist y ReproGrande.
- Progreso: ReproGrande ya no usa un callback obsoleto al seleccionar playlists; muestra guardado, errores y evita pulsaciones duplicadas.
- Progreso: el botón de lista abre la cola real de TrackPlayer, permite saltar a una canción y muestra un estado vacío claro.
- Progreso: las reproducciones fuera de una playlist ya no intentan actualizar `Likes/{nombre}`; actualizan solo la canción global y reservan la copia de playlist para orígenes reales.
- Progreso: Autor y Biblioteca corrigieron listeners, borrado/publicación de playlists, filtros durante render y batches de Firestore.
- Progreso: los bottom sheets de Autor y Biblioteca tienen paneles de ancho completo, jerarquía visual y acciones más claras.
- Auditar agregar/quitar canciones, duplicados, limites premium, playlists publicas y sincronizacion offline.
- Unificar el modelo de playlist y las acciones de bottom sheets.
- Corregir identificadores de documentos, estados optimistas y listeners de Firestore.
- Mejorar tarjetas, menus, estados vacios y feedback de error sin cambiar el estilo minimalista.

## Fase 4: ReproGrande y experiencia de reproduccion

- Progreso: se centralizó la construcción de colas en `utils/playbackQueue.ts` para que Playlist y ReproGrande compartan los mismos modos.
- Progreso: los listeners de TrackPlayer ya no se recrean con cada cambio de estado o modo; leen esos valores mediante refs y se limpian al cambiar de ruta.
- Progreso: al cambiar de pista se reinician video, buffer y latencia; el buffer ya no pausa audio si el usuario lo tenía pausado.
- Progreso: los anuncios toleran usuarios no cargados y conservan `autores` en toda la pista enviada a TrackPlayer.
- Progreso: las descargas de ReproGrande bloquean concurrencia, validan respuestas HTTP y guardan `autores` para uso offline.
- Progreso: el parser de letras acepta saltos de línea reales y el formato legado `"/n"`.
- Progreso: las pistas sin URL se detectan antes de entrar a la cola y los eventos inválidos muestran error e intentan continuar con la siguiente canción.
- Progreso: los anuncios normalizan audio/video desde campos nuevos o el `uri` legado, usan el perfil local `Anuncio` y arrancan automáticamente al cargar el video.
- Progreso: los anuncios con video esperan a que `react-native-video` cargue antes de iniciar TrackPlayer, evitando audio adelantado y desincronización.
- Extraer el estado del reproductor a un servicio/controlador unico.
- Definir claramente los modos: orden, aleatorio, repetir cola y repetir pista.
- Corregir cola, siguiente/anterior, restauracion de pista y sincronizacion entre TrackPlayer y video.
- Separar anuncios de canciones, incluyendo pausa, eliminacion de la cola y reanudacion.
- Mejorar buffering, reproduccion offline, descargas, letras y sincronizacion de video.
- Evitar listeners duplicados y renders innecesarios.

## Fase 5: calidad, rendimiento y seguridad

- Progreso: se eliminaron los errores `no-var` que bloqueaban el lint de ReproGrande; quedan advertencias de limpieza y dependencias de hooks para una pasada posterior.
- Progreso: Settings ya no aporta errores TypeScript; se protegieron datos de usuario opcionales y se tiparon sus estados de preferencias.
- Progreso: se corrigieron los errores de aplicación en sesión, Search, ParallaxScrollView y la exportación del servicio de TrackPlayer; TypeScript queda limitado a diagnósticos internos de Bottom Sheet/invariant.
- Tipar las entidades de pista, autor, playlist, anuncio y usuario.
- Añadir una capa de acceso a Firestore con consultas reutilizables y validacion de datos.
- Reducir lecturas repetidas y cachear perfiles de autores, artwork y metadatos.
- Revisar permisos, reglas de Firestore, datos incompletos y manejo de errores.
- Ejecutar lint, TypeScript, pruebas de regresion y una matriz manual Android: online, offline, video, anuncio y cuenta premium.

## Orden de ejecucion propuesto

1. Completar la propagacion retrocompatible de autores.
2. Unificar el modelo de pista y el controlador de reproduccion.
3. Arreglar Playlist y las acciones de biblioteca.
4. Rehacer el feed de Inicio con secciones dinamicas.
5. Pulir UI, rendimiento, anuncios, video y pruebas de regresion.
