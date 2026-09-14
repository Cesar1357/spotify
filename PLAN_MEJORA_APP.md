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

- Auditar agregar/quitar canciones, duplicados, limites premium, playlists publicas y sincronizacion offline.
- Unificar el modelo de playlist y las acciones de bottom sheets.
- Corregir identificadores de documentos, estados optimistas y listeners de Firestore.
- Mejorar tarjetas, menus, estados vacios y feedback de error sin cambiar el estilo minimalista.

## Fase 4: ReproGrande y experiencia de reproduccion

- Extraer el estado del reproductor a un servicio/controlador unico.
- Definir claramente los modos: orden, aleatorio, repetir cola y repetir pista.
- Corregir cola, siguiente/anterior, restauracion de pista y sincronizacion entre TrackPlayer y video.
- Separar anuncios de canciones, incluyendo pausa, eliminacion de la cola y reanudacion.
- Mejorar buffering, reproduccion offline, descargas, letras y sincronizacion de video.
- Evitar listeners duplicados y renders innecesarios.

## Fase 5: calidad, rendimiento y seguridad

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
