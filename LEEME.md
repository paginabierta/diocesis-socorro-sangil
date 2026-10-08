# Sitio web · Diócesis de Socorro y San Gil

Sitio estático (GitHub Pages) + Firebase (Firestore y Authentication), con panel de administración en `admin.html`. Mismo esquema que el Centro de Escucha y el Club de Lectura.

Todos los archivos van **en la raíz del repositorio, sin subcarpetas**, para evitar el problema de GitHub con las carpetas al arrastrar. La carpeta `archivos/` la crea sola el panel cuando subes la primera foto o PDF.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Portada |
| `parroquias.html` | Buscador "¿Dónde hay misa?" y listado de parroquias |
| `parroquia.html` | Ficha de cada parroquia (`parroquia.html?id=…`) |
| `sacerdotes.html` | Directorio de sacerdotes |
| `noticias.html` | Actualidad y cada noticia (`noticias.html?id=…`) |
| `documentos.html` | Decretos, circulares y comunicados |
| `pagina.html` | Páginas y trámites (`pagina.html?id=…`) |
| `admin.html` + `admin.js` | Panel de administración |
| `comun.js`, `estilos.css` | Código y estilos compartidos |
| `datos-iniciales.js` | 54 parroquias, sacerdotes, decretos y páginas del sitio anterior |
| `firebase-config.js` | Claves de Firebase (**no reemplazar** al volver a subir el sitio) |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase |

## 1. Probar sin Firebase (modo demostración)

Sube los archivos a un repositorio de GitHub y activa GitHub Pages (Settings → Pages → rama `main`, carpeta `/root`). Abre la página: funciona con los datos iniciales y una franja amarilla avisa que está en demostración. En `admin.html` puedes editar todo, pero los cambios solo se guardan en ese navegador.

## 2. Conectar Firebase

1. En console.firebase.google.com crea un proyecto (ej. `diocesis-ssg`). Plan **Spark (gratis)**: no necesita tarjeta.
2. **Firestore Database** → Crear base de datos → modo producción → región `southamerica-east1` o `us-central`.
3. **Firestore → Reglas**: pega el contenido de `firestore.rules` y publica.
4. **Authentication** → Comenzar → activa **Correo electrónico/contraseña**.
5. **Authentication → Configuración → Dominios autorizados**: agrega `TU-USUARIO.github.io` y, si lo tienes, el dominio propio.
6. **Configuración del proyecto → Tus apps → Web (</>)**: registra la app y copia el bloque `firebaseConfig` en `firebase-config.js`.
7. **Primer administrador** (solo esta vez, a mano): en Firestore → Iniciar colección `admins` → ID del documento = tu correo **en minúsculas** (ej. `herwin1840@gmail.com`) → agrega un campo cualquiera (ej. `nombre` = `Herwin`) → Guardar.
8. Entra a `admin.html`, escribe tu correo y una contraseña, y toca **Crear mi contraseña (primera vez)**.
9. En el panel → **Respaldo → Cargar datos iniciales**. Eso crea las 54 parroquias, los sacerdotes, los decretos y las páginas.

A partir de ahí, los demás administradores se agregan desde **Accesos**.

## 3. Archivos (fotos y PDF) sin Drive

Se guardan en el mismo repositorio, en `archivos/AAAA-MM/`, y quedan con la dirección del sitio (ej. `diocesisdesocorroysangil.org/archivos/2026-10/decreto-080.pdf`).

1. GitHub → tu foto → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Repository access*: **Only select repositories** → el repositorio del sitio.
3. *Permissions → Repository permissions → Contents*: **Read and write**.
4. Elige una vigencia (máximo 1 año) y copia el token (`github_pat_…`).
5. En el panel → **Archivos**: usuario, repositorio, rama `main`, pega el token → **Guardar conexión** → **Probar conexión**.

El token queda guardado **solo en ese navegador**, no en la base de datos. En otro computador hay que pegarlo de nuevo. Cuando venza, se genera otro y se pega.

Notas:
- Las fotos grandes se reducen solas (máx. 1800 px, formato WebP) antes de subir.
- Un archivo recién subido tarda 1 o 2 minutos en verse en el sitio (GitHub Pages se actualiza).
- Límite por archivo en el panel: 25 MB. Videos: mejor YouTube y pegar el enlace.
- GitHub recomienda no pasar de 1 GB por repositorio; el panel muestra cuánto llevas.

## 4. Calendario litúrgico (santos y fiestas del día)

Sin hacer nada, la franja "Hoy" muestra el tiempo litúrgico y su color (cálculo propio con la fecha de Pascua). Para que aparezcan también las fiestas y memorias de Colombia:
descarga el iCal de Colombia en gcatholic.org y súbelo en **Hoy en la Diócesis → Calendario litúrgico (.ics)**. Se cambia una vez al año.

## 5. Dominio propio

Igual que con aquiteescuchamos.org: en el proveedor del dominio, 4 registros A hacia GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) y un CNAME de `www` hacia `TU-USUARIO.github.io`. Luego en GitHub → Settings → Pages → Custom domain. El dominio actual está en GoDaddy: allí se cambian los DNS y se deja de pagar el constructor de sitios.

## 6. Cómo funciona por dentro (para no gastar la cuota gratis)

Cada vez que guardas algo en el panel, se arma un solo documento `publico/sitio` con todo el contenido público. Las páginas leen solo ese documento (una lectura por visita, y se guarda 5 minutos en el navegador). Con el plan gratuito (50.000 lecturas al día) alcanza de sobra.

## Revisar antes de publicar

Los datos iniciales se tomaron del sitio anterior el 8 de octubre de 2026. Conviene revisar:
- Párrocos de Encino, San Joaquín y San José de Suaita (quedaron vacíos porque el directorio anterior no era claro).
- El cargo del P. Richard Chaparro Afanador.
- Los decretos siguen apuntando a los PDF alojados en GoDaddy; si se cierra esa cuenta dejarán de abrir. Lo ideal es volver a subirlos desde **Documentos**.
- Las páginas de trámites dicen "Información en recopilación" hasta que se escriban los requisitos reales.
