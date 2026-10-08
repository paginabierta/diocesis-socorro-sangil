// =========================================================
// Panel de administración
// Con Firebase: entra con correo y contraseña; solo los correos
// registrados en la colección "admins" pueden editar.
// Sin Firebase: modo demostración (se guarda en este navegador).
// =========================================================
import {
  modoDemo, fb, FB_VERSION, esc, slug, completarConfig, leerDemo, guardarDemo, borrarDemo, limpiarCache,
  datosIniciales, OPCIONES_DIAS, LISTA_FUENTES, ICONOS, aplicarTema, urlSegura, liturgiaDeHoy, hoyISO, fechaCorta
} from './comun.js';

const raiz = document.getElementById('app');
const COLS = ['parroquias', 'sacerdotes', 'paginas', 'noticias', 'eventos', 'documentos'];
const ST = { config: null, usuario: '', pestana: 'inicio', parroquias: [], sacerdotes: [], paginas: [], noticias: [], eventos: [], documentos: [] };
const vistasLocales = {}; // ruta subida → URL temporal para vista previa
let authM = null, auth = null, mensajeEntrada = '';

// ---------- Utilidades ----------
function notificar(msg, error = false) {
  document.querySelectorAll('.notif').forEach(x => x.remove());
  const n = document.createElement('div');
  n.className = 'notif'; n.setAttribute('role', 'status');
  if (error) n.style.background = '#7F1A13';
  n.textContent = msg; document.body.appendChild(n);
  setTimeout(() => n.remove(), error ? 6500 : 3200);
}
const limpio = (o) => JSON.parse(JSON.stringify(o ?? null));
const obtener = (o, ruta) => ruta.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
function poner(o, ruta, v) {
  const ks = ruta.split('.'); let a = o;
  ks.slice(0, -1).forEach(k => { if (typeof a[k] !== 'object' || a[k] === null) a[k] = {}; a = a[k]; });
  a[ks[ks.length - 1]] = v;
}
function contraste(hex1, hex2) {
  const lum = h => {
    const c = h.replace('#', ''); if (c.length !== 6) return 0;
    return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
function vistaUrl(v) {
  if (!v) return '';
  if (vistasLocales[v]) return vistasLocales[v];
  return urlSegura(v);
}
async function conEspera(boton, tarea) {
  const txt = boton ? boton.textContent : '';
  if (boton) { boton.disabled = true; boton.textContent = 'Guardando…'; }
  try { await tarea(); }
  catch (e) { console.error(e); notificar(e.message || 'No se pudo completar la acción.', true); }
  finally { if (boton) { boton.disabled = false; boton.textContent = txt; } }
}

// ---------- Datos ----------
async function cargarTodo() {
  if (modoDemo) {
    const d = leerDemo();
    ST.config = completarConfig(d.config);
    COLS.forEach(c => { ST[c] = (d[c] || []).map(x => ({ ...x })); });
    return;
  }
  const { db, fs } = await fb();
  const cs = await fs.getDoc(fs.doc(db, 'ajustes', 'sitio'));
  ST.config = completarConfig(cs.exists() ? cs.data() : {});
  await Promise.all(COLS.map(async c => {
    const snap = await fs.getDocs(fs.collection(db, c));
    ST[c] = snap.docs.map(d => ({ ...d.data(), id: d.id }));
  }));
}
function paqueteDemo() { return { config: ST.config, ...Object.fromEntries(COLS.map(c => [c, ST[c]])) }; }

// Reconstruye el documento público (una sola lectura por visita).
async function publicar() {
  limpiarCache();
  if (modoDemo) { guardarDemo(limpio(paqueteDemo())); return; }
  const { db, fs } = await fb();
  const hace60 = hoyISO(new Date(Date.now() - 60 * 86400000));
  const noticias = ST.noticias.filter(n => n.visible !== false).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))).slice(0, 60);
  const paquete = {
    config: ST.config, parroquias: ST.parroquias, sacerdotes: ST.sacerdotes, paginas: ST.paginas, noticias,
    eventos: ST.eventos.filter(e => !e.fecha || e.fecha >= hace60), documentos: ST.documentos, actualizado: new Date().toISOString()
  };
  let txt = JSON.stringify(paquete);
  if (txt.length > 900000) {
    paquete.noticias = noticias.map((n, i) => i < 12 ? n : { ...n, contenido: '', parcial: true });
    txt = JSON.stringify(paquete);
  }
  if (txt.length > 1000000) throw new Error('El contenido público supera 1 MB. Acorta textos muy largos (por ejemplo, historias de parroquias).');
  await fs.setDoc(fs.doc(db, 'publico', 'sitio'), JSON.parse(txt));
}
async function guardarConfig() {
  if (!modoDemo) { const { db, fs } = await fb(); await fs.setDoc(fs.doc(db, 'ajustes', 'sitio'), limpio(ST.config)); }
  await publicar();
  aplicarTema(ST.config);
  notificar('Cambios guardados y publicados.');
}
async function guardarItem(col, item) {
  const lista = ST[col];
  const i = lista.findIndex(x => x.id === item.id);
  if (i >= 0) lista[i] = item; else lista.push(item);
  if (!modoDemo) {
    const { db, fs } = await fb();
    const { id, ...resto } = item;
    await fs.setDoc(fs.doc(db, col, id), limpio(resto));
  }
  await publicar();
}
async function borrarItem(col, id) {
  ST[col] = ST[col].filter(x => x.id !== id);
  if (!modoDemo) { const { db, fs } = await fb(); await fs.deleteDoc(fs.doc(db, col, id)); }
  await publicar();
}
async function escribirTodo(datos, { reemplazar = false } = {}) {
  if (modoDemo) {
    if (datos.config) ST.config = completarConfig(datos.config);
    COLS.forEach(c => {
      if (!datos[c]) return;
      if (reemplazar) ST[c] = datos[c].map(x => ({ ...x }));
      else datos[c].forEach(x => { if (!ST[c].some(y => y.id === x.id)) ST[c].push({ ...x }); });
    });
    await publicar(); return;
  }
  const { db, fs } = await fb();
  const ops = [];
  if (datos.config) ops.push(['set', fs.doc(db, 'ajustes', 'sitio'), limpio(datos.config)]);
  COLS.forEach(c => (datos[c] || []).forEach(x => {
    if (!reemplazar && ST[c].some(y => y.id === x.id)) return;
    const { id, ...resto } = x;
    ops.push(['set', fs.doc(db, c, id || slug(x.nombre || x.titulo || x.asunto)), limpio(resto)]);
  }));
  for (let i = 0; i < ops.length; i += 400) {
    const lote = fs.writeBatch(db);
    ops.slice(i, i + 400).forEach(([, ref, d]) => lote.set(ref, d));
    await lote.commit();
  }
  await cargarTodo();
  await publicar();
}

// ---------- Archivos en GitHub ----------
const CLAVE_TOKEN = 'diocesis-github-token';
const leerToken = () => { try { return localStorage.getItem(CLAVE_TOKEN) || ''; } catch (e) { return ''; } };
const ponerToken = (t) => { try { t ? localStorage.setItem(CLAVE_TOKEN, t) : localStorage.removeItem(CLAVE_TOKEN); } catch (e) { /* nada */ } };
function datosRepo() {
  const a = ST.config.archivos || {};
  return { usuario: (a.usuario || '').trim(), repo: (a.repositorio || '').trim(), rama: (a.rama || 'main').trim(), carpeta: (a.carpeta || 'archivos').trim().replace(/^\/+|\/+$/g, '') };
}
function cabecerasGH() { return { Authorization: 'Bearer ' + leerToken(), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }; }
function errorGH(estado, msg) {
  if (estado === 401) return 'El token de GitHub no es válido o expiró. Genera uno nuevo en la pestaña Archivos.';
  if (estado === 403) return 'El token no tiene permiso de escritura (Contents: Read and write) en este repositorio.';
  if (estado === 404) return 'No se encontró el repositorio o la rama. Revisa usuario, repositorio y rama en la pestaña Archivos.';
  if (estado === 422) return 'GitHub rechazó el archivo: ' + (msg || 'datos no válidos');
  return 'Error de GitHub (' + estado + '): ' + (msg || '');
}
function aBase64(blob) {
  return new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = mal; r.readAsDataURL(blob); });
}
async function comprimir(file, max = 1800) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return await new Promise(ok => cv.toBlob(b => ok(b || file), 'image/webp', 0.82));
}
async function subirArchivo(file, esImagen) {
  const { usuario, repo, rama, carpeta } = datosRepo();
  if (!usuario || !repo || !leerToken()) throw new Error('Para subir archivos, primero completa la pestaña Archivos (usuario, repositorio y token de GitHub). También puedes pegar un enlace.');
  let blob = file, nombre = file.name || 'archivo';
  if (esImagen && /image\/(jpeg|png|webp)/.test(file.type) && file.size > 350000) {
    blob = await comprimir(file);
    if (blob !== file) nombre = nombre.replace(/\.[^.]+$/, '') + '.webp';
  }
  if (blob.size > 25 * 1024 * 1024) throw new Error('El archivo pesa más de 25 MB. Comprímelo o, si es un video, súbelo a YouTube y pega el enlace.');
  const ext = ((nombre.match(/\.([a-z0-9]+)$/i) || [])[1] || 'bin').toLowerCase();
  const f = new Date();
  const ruta = `${carpeta}/${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}/${slug(nombre.replace(/\.[^.]+$/, '')).slice(0, 50)}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const r = await fetch(`https://api.github.com/repos/${encodeURIComponent(usuario)}/${encodeURIComponent(repo)}/contents/${ruta}`, {
    method: 'PUT', headers: cabecerasGH(),
    body: JSON.stringify({ message: 'Subir ' + ruta, content: await aBase64(blob), branch: rama })
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(errorGH(r.status, e.message)); }
  vistasLocales[ruta] = URL.createObjectURL(blob);
  return ruta;
}

// ---------- Campos de formulario ----------
const AYUDA_FORMATO = '<span class="ayuda-formato">Formato: deja una línea en blanco entre párrafos · <code>**negrita**</code> · <code>_cursiva_</code> · <code>## Subtítulo</code> · líneas que empiezan con <code>- </code> forman una lista · los enlaces https:// se activan solos.</span>';

function campoHTML(c, valor, attr) {
  const id = 'c-' + Math.random().toString(36).slice(2, 9);
  const a = `${attr}="${esc(c.k)}" id="${id}"`;
  const ancho = ['area', 'rico', 'misas', 'imagen', 'archivo'].includes(c.tipo) || c.ancho ? ' ancho' : '';
  const ayuda = c.ayuda ? `<span class="ayuda">${c.ayuda}</span>` : '';
  const v = valor ?? '';
  switch (c.tipo) {
    case 'si':
      return `<label class="campo-check${c.ancho ? ' ancho' : ''}"><input type="checkbox" ${a} ${v ? 'checked' : ''}> ${esc(c.t)}</label>`;
    case 'area': case 'rico':
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<textarea ${a} rows="${c.filas || 4}">${esc(v)}</textarea>${c.tipo === 'rico' ? AYUDA_FORMATO : ''}</label>`;
    case 'opciones':
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<select ${a}>${c.opciones.map(([k, t]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
    case 'fuente':
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<select ${a}>${LISTA_FUENTES.map(f => `<option ${f === v ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label>`;
    case 'icono':
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<select ${a}>${Object.keys(ICONOS).map(k => `<option value="${k}" ${k === v ? 'selected' : ''}>${k}</option>`).join('')}</select></label>`;
    case 'color':
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<span class="fila-color"><input type="color" value="${esc(v || '#000000')}" data-espejo="${id}" aria-label="Elegir ${esc(c.t)}"><input type="text" ${a} value="${esc(v)}" maxlength="7" pattern="#[0-9A-Fa-f]{6}"></span></label>`;
    case 'numero':
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<input type="number" ${a} value="${esc(v)}"></label>`;
    case 'fecha':
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<input type="date" ${a} value="${esc(v)}"></label>`;
    case 'imagen': case 'archivo': {
      const prev = c.tipo === 'imagen' && vistaUrl(v) ? `<img class="vista-previa" src="${esc(vistaUrl(v))}" alt="">` : '';
      return `<div class="campo${ancho}"><label for="${id}">${esc(c.t)}</label>${ayuda}
        <span class="fila-archivo"><input type="text" ${a} value="${esc(v)}" placeholder="Pega un enlace o sube un archivo">
        <button type="button" class="btn btn-borde btn-peq btn-subir" data-destino="${id}" data-imagen="${c.tipo === 'imagen' ? 1 : 0}">Subir</button></span>
        <input type="file" class="oculto" data-para="${id}" ${c.tipo === 'imagen' ? 'accept="image/*"' : ''}>
        <span data-prev="${id}">${prev}</span></div>`;
    }
    case 'misas': {
      const filas = (Array.isArray(v) ? v : []).map(filaMisa).join('');
      return `<div class="campo ancho" ${a}><span>${esc(c.t)}</span>${ayuda}<div class="misas-filas">${filas}</div>
        <button type="button" class="btn btn-borde btn-peq btn-mas-misa" style="align-self:flex-start">+ Agregar horario</button></div>`;
    }
    default:
      return `<label class="campo${ancho}" for="${id}">${esc(c.t)}${ayuda}<input type="text" ${a} value="${esc(v)}" ${c.req ? 'required' : ''}></label>`;
  }
}
function filaMisa(m = {}) {
  return `<div class="misa-fila">
    <select aria-label="Días">${OPCIONES_DIAS.map(([k, t]) => `<option value="${k}" ${m.dias === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <input type="time" aria-label="Hora" value="${esc(m.hora || '')}">
    <input type="text" aria-label="Lugar" placeholder="Lugar (opcional): templo, vereda…" value="${esc(m.lugar || '')}">
    <button type="button" class="btn btn-peligro btn-peq btn-quitar-misa" aria-label="Quitar horario">Quitar</button></div>`;
}
function leerCampos(cont, attr) {
  const r = {};
  cont.querySelectorAll(`[${attr}]`).forEach(el => {
    const k = el.getAttribute(attr);
    if (el.classList.contains('campo') && el.querySelector('.misas-filas')) {
      r[k] = [...el.querySelectorAll('.misa-fila')].map(f => {
        const [s, h, l] = f.querySelectorAll('select, input');
        return { dias: s.value, hora: h.value, lugar: l.value.trim() };
      }).filter(m => m.hora);
    } else if (el.type === 'checkbox') r[k] = el.checked;
    else if (el.type === 'number') r[k] = el.value === '' ? '' : Number(el.value);
    else r[k] = el.value.trim();
  });
  return r;
}
// Eventos comunes de formularios (subir archivos, colores, misas)
document.addEventListener('click', async (e) => {
  const sub = e.target.closest('.btn-subir');
  if (sub) { document.querySelector(`input[type=file][data-para="${sub.dataset.destino}"]`).click(); return; }
  if (e.target.closest('.btn-mas-misa')) { e.target.closest('.campo').querySelector('.misas-filas').insertAdjacentHTML('beforeend', filaMisa()); return; }
  const q = e.target.closest('.btn-quitar-misa'); if (q) { q.closest('.misa-fila').remove(); }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.matches('input[type=file][data-para]') && t.files[0]) {
    const destino = document.getElementById(t.dataset.para);
    const btn = document.querySelector(`.btn-subir[data-destino="${t.dataset.para}"]`);
    const esImg = btn.dataset.imagen === '1';
    btn.disabled = true; btn.textContent = 'Subiendo…';
    try {
      const ruta = await subirArchivo(t.files[0], esImg);
      destino.value = ruta;
      if (esImg) document.querySelector(`[data-prev="${t.dataset.para}"]`).innerHTML = `<img class="vista-previa" src="${esc(vistaUrl(ruta))}" alt="">`;
      notificar('Archivo subido. Estará visible en el sitio en 1 o 2 minutos. Recuerda guardar.');
    } catch (err) { notificar(err.message, true); }
    finally { btn.disabled = false; btn.textContent = 'Subir'; t.value = ''; }
  }
  if (t.matches('input[type=color][data-espejo]')) document.getElementById(t.dataset.espejo).value = t.value;
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('.fila-color input[type=text]') && /^#[0-9a-f]{6}$/i.test(t.value)) t.previousElementSibling.value = t.value;
});

// ---------- Esquemas de contenidos ----------
const SI_NO = [['true', 'Sí'], ['false', 'No']];
const ESQUEMAS = {
  parroquias: {
    titulo: 'Parroquias', singular: 'parroquia', nuevo: () => ({ activa: true, misas: [] }),
    etiqueta: x => x.nombre, sub: x => [x.municipio, x.parroco && 'Pbro. ' + x.parroco, (x.misas || []).length ? (x.misas.length + ' horarios') : 'sin horarios'].filter(Boolean).join(' · '),
    clave: x => x.municipio + ' ' + x.nombre, img: x => x.foto, ver: x => 'parroquia.html?id=' + encodeURIComponent(x.id),
    ordenar: (a, b) => String(a.municipio).localeCompare(String(b.municipio), 'es') || String(a.nombre).localeCompare(String(b.nombre), 'es'),
    campos: [
      { k: 'nombre', t: 'Nombre de la parroquia', req: true },
      { k: 'municipio', t: 'Municipio', req: true },
      { k: 'parroco', t: 'Párroco', ayuda: 'Sin "Pbro.", se agrega solo.' },
      { k: 'fotoParroco', t: 'Foto del párroco', tipo: 'imagen' },
      { k: 'descripcion', t: 'Descripción corta', tipo: 'area', filas: 2 },
      { k: 'foto', t: 'Foto del templo', tipo: 'imagen' },
      { k: 'misas', t: 'Horarios de misa', tipo: 'misas', ayuda: 'Una fila por cada misa. Ej.: "Lunes a sábado · 6:30 p. m." o "Domingo · 9:00 a. m. · Vereda El Cucharo".' },
      { k: 'despacho', t: 'Horario del despacho parroquial', tipo: 'area', filas: 2 },
      { k: 'whatsapp', t: 'WhatsApp del despacho', ayuda: '10 dígitos, ej.: 3201234567' },
      { k: 'telefono', t: 'Teléfono fijo' },
      { k: 'correo', t: 'Correo' },
      { k: 'facebook', t: 'Página de Facebook (enlace)' },
      { k: 'direccion', t: 'Dirección' },
      { k: 'coordenadas', t: 'Ubicación en el mapa', ayuda: 'Pega las coordenadas ("6.5547, -73.1334") o un enlace de Google Maps.' },
      { k: 'fiesta', t: 'Fiesta patronal' },
      { k: 'veredas', t: 'Veredas y capillas que atiende', tipo: 'area', filas: 2 },
      { k: 'historia', t: 'Historia o presentación de la parroquia', tipo: 'rico', filas: 6 },
      { k: 'orden', t: 'Orden', tipo: 'numero' },
      { k: 'activa', t: 'Mostrar en el sitio', tipo: 'si' }
    ]
  },
  sacerdotes: {
    titulo: 'Sacerdotes', singular: 'sacerdote', nuevo: () => ({ visible: true }),
    etiqueta: x => 'Pbro. ' + x.nombre, sub: x => [x.cargo, x.municipio].filter(Boolean).join(' · '), clave: x => x.nombre, img: x => x.foto,
    ordenar: (a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'),
    campos: [
      { k: 'nombre', t: 'Nombre completo', req: true, ayuda: 'Sin "Pbro."' },
      { k: 'cargo', t: 'Cargo o servicio' },
      { k: 'municipio', t: 'Municipio' },
      { k: 'foto', t: 'Foto', tipo: 'imagen' },
      { k: 'visible', t: 'Mostrar en el directorio', tipo: 'si' }
    ]
  },
  noticias: {
    titulo: 'Noticias', singular: 'noticia', nuevo: () => ({ visible: true, categoria: 'diocesis', fecha: hoyISO() }),
    etiqueta: x => x.titulo, sub: x => [fechaCorta(x.fecha), { diocesis: 'Diócesis', parroquias: 'Vida parroquial', universal: 'Iglesia universal' }[x.categoria], x.visible === false ? 'oculta' : ''].filter(Boolean).join(' · '),
    clave: x => x.titulo, img: x => x.imagen, ver: x => 'noticias.html?id=' + encodeURIComponent(x.id),
    ordenar: (a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')),
    campos: [
      { k: 'titulo', t: 'Título', req: true, ancho: true },
      { k: 'categoria', t: 'Categoría', tipo: 'opciones', opciones: [['diocesis', 'Diócesis'], ['parroquias', 'Vida parroquial'], ['universal', 'Iglesia universal']] },
      { k: 'fecha', t: 'Fecha', tipo: 'fecha' },
      { k: 'autor', t: 'Autor o corresponsal (opcional)' },
      { k: 'resumen', t: 'Resumen (una o dos frases)', tipo: 'area', filas: 2 },
      { k: 'imagen', t: 'Imagen principal', tipo: 'imagen' },
      { k: 'contenido', t: 'Texto de la noticia', tipo: 'rico', filas: 12 },
      { k: 'adjunto', t: 'Documento adjunto (opcional)', tipo: 'archivo' },
      { k: 'visible', t: 'Publicada', tipo: 'si' }
    ]
  },
  eventos: {
    titulo: 'Agenda', singular: 'evento', nuevo: () => ({ fecha: hoyISO() }),
    etiqueta: x => x.titulo, sub: x => [fechaCorta(x.fecha), x.lugar].filter(Boolean).join(' · '), clave: x => x.fecha + ' ' + x.titulo,
    ordenar: (a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')),
    campos: [
      { k: 'titulo', t: 'Actividad', req: true, ancho: true },
      { k: 'fecha', t: 'Fecha', tipo: 'fecha' },
      { k: 'lugar', t: 'Lugar y hora' },
      { k: 'detalle', t: 'Detalle breve', ancho: true }
    ]
  },
  documentos: {
    titulo: 'Documentos', singular: 'documento', nuevo: () => ({ tipo: 'Decreto', fecha: hoyISO() }),
    etiqueta: x => `${x.tipo} ${x.numero || ''}`.trim(), sub: x => [x.asunto, fechaCorta(x.fecha)].filter(Boolean).join(' · '),
    clave: x => `${x.tipo}-${x.numero || x.asunto}-${(x.fecha || '').slice(0, 4)}`,
    ordenar: (a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')),
    campos: [
      { k: 'tipo', t: 'Tipo', tipo: 'opciones', opciones: ['Decreto', 'Circular', 'Comunicado', 'Carta pastoral', 'Documento del Papa', 'Formato', 'Otro'].map(x => [x, x]) },
      { k: 'numero', t: 'Número' },
      { k: 'fecha', t: 'Fecha', tipo: 'fecha' },
      { k: 'asunto', t: 'Asunto', req: true, ancho: true },
      { k: 'url', t: 'Archivo PDF', tipo: 'archivo', req: true }
    ]
  },
  paginas: {
    titulo: 'Páginas y trámites', singular: 'página', nuevo: () => ({ visible: true, grupo: 'tramites', icono: 'documento' }),
    etiqueta: x => x.titulo, sub: x => [{ tramites: 'Trámite', diocesis: 'Nuestra Diócesis', instituciones: 'Institución', ninguno: 'Sin menú' }[x.grupo], x.enInicio ? 'en "Yo quiero…"' : '', x.visible === false ? 'oculta' : ''].filter(Boolean).join(' · '),
    clave: x => x.titulo, img: x => x.imagen, ver: x => 'pagina.html?id=' + encodeURIComponent(x.id),
    ordenar: (a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999),
    campos: [
      { k: 'titulo', t: 'Título', req: true },
      { k: 'grupo', t: 'Dónde aparece en el menú', tipo: 'opciones', opciones: [['tramites', 'Trámites'], ['diocesis', 'Nuestra Diócesis'], ['instituciones', 'Instituciones (dentro de Nuestra Diócesis)'], ['ninguno', 'No aparece en el menú']] },
      { k: 'enInicio', t: 'Mostrar en "Yo quiero…" de la portada', tipo: 'si' },
      { k: 'icono', t: 'Ícono', tipo: 'icono' },
      { k: 'resumen', t: 'Resumen (aparece en la tarjeta)', tipo: 'area', filas: 2 },
      { k: 'contenido', t: 'Contenido', tipo: 'rico', filas: 12 },
      { k: 'imagen', t: 'Imagen (opcional)', tipo: 'imagen' },
      { k: 'adjunto', t: 'Documento descargable (opcional)', tipo: 'archivo' },
      { k: 'adjuntoTexto', t: 'Texto del botón de descarga', ayuda: 'Ej.: "Descargar requisitos"' },
      { k: 'enlace', t: 'Enlace directo (opcional)', ayuda: 'Si la página no tiene contenido, la tarjeta lleva directo a este enlace (otra página o sitio).' },
      { k: 'orden', t: 'Orden', tipo: 'numero' },
      { k: 'visible', t: 'Publicada', tipo: 'si' }
    ]
  }
};
function coordenadasDe(txt) {
  const s = String(txt || '');
  const m = s.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  return m ? { lat: m[1], lng: m[2] } : { lat: '', lng: '' };
}

// ---------- Pantalla de entrada ----------
function pantallaEntrada() {
  raiz.innerHTML = `<div class="adm-entrada"><form class="tarjeta" id="f-entrada">
    <h1 style="font-size:28px">Panel de administración</h1>
    <p style="color:var(--suave)">${esc(ST.config?.nombre || 'Diócesis de Socorro y San Gil')}</p>
    ${mensajeEntrada ? `<div class="aviso mal">${esc(mensajeEntrada)}</div>` : ''}
    <label class="campo">Correo<input type="email" name="correo" autocomplete="username" required></label>
    <label class="campo">Contraseña<input type="password" name="clave" autocomplete="current-password" required minlength="6"></label>
    <button class="btn btn-primario" type="submit">Entrar</button>
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:14px">
      <button type="button" class="btn btn-borde btn-peq" id="crear">Crear mi contraseña (primera vez)</button>
      <button type="button" class="btn btn-borde btn-peq" id="olvide">Olvidé mi contraseña</button>
    </div>
    <a href="index.html" style="font-size:14px">← Volver al sitio</a>
  </form></div>`;
  mensajeEntrada = '';
  const f = document.getElementById('f-entrada');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await authM.signInWithEmailAndPassword(auth, f.correo.value.trim(), f.clave.value); }
    catch (err) { notificar(traducirAuth(err), true); }
  });
  document.getElementById('crear').addEventListener('click', async () => {
    if (!f.reportValidity()) return;
    try { await authM.createUserWithEmailAndPassword(auth, f.correo.value.trim(), f.clave.value); }
    catch (err) { notificar(traducirAuth(err), true); }
  });
  document.getElementById('olvide').addEventListener('click', async () => {
    const c = f.correo.value.trim();
    if (!c) { notificar('Escribe tu correo primero.', true); return; }
    try { await authM.sendPasswordResetEmail(auth, c); notificar('Te enviamos un correo para cambiar la contraseña.'); }
    catch (err) { notificar(traducirAuth(err), true); }
  });
}
function traducirAuth(e) {
  const c = e.code || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Correo o contraseña incorrectos.';
  if (c.includes('email-already-in-use')) return 'Ese correo ya tiene contraseña. Usa "Entrar" u "Olvidé mi contraseña".';
  if (c.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (c.includes('too-many-requests')) return 'Demasiados intentos. Espera unos minutos.';
  if (c.includes('operation-not-allowed')) return 'Activa "Correo electrónico/contraseña" en Firebase → Authentication.';
  return 'No se pudo entrar: ' + (e.message || c);
}
async function iniciarAuth() {
  authM = await import(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-auth.js`);
  const { app } = await fb();
  auth = authM.getAuth(app);
  authM.onAuthStateChanged(auth, async (u) => {
    if (!u) { pantallaEntrada(); return; }
    const correo = (u.email || '').toLowerCase();
    try {
      const { db, fs } = await fb();
      const s = await fs.getDoc(fs.doc(db, 'admins', correo));
      if (!s.exists()) throw new Error('sin permiso');
    } catch (e) {
      mensajeEntrada = `El correo ${correo} no tiene permiso de administración. Pide a un administrador que lo agregue en la pestaña Accesos.`;
      await authM.signOut(auth);
      return;
    }
    ST.usuario = correo;
    raiz.innerHTML = '<div class="cargando">Cargando contenidos…</div>';
    await cargarTodo();
    aplicarTema(ST.config);
    pintarPanel();
  });
}

// ---------- Estructura del panel ----------
const PESTANAS = [
  ['General', [['inicio', 'Inicio'], ['apariencia', 'Apariencia'], ['textos', 'Textos de la portada'], ['hoy', 'Hoy en la Diócesis'], ['contacto', 'Contacto y redes']]],
  ['Contenidos', [['parroquias', 'Parroquias y misas'], ['sacerdotes', 'Sacerdotes'], ['noticias', 'Noticias'], ['eventos', 'Agenda'], ['documentos', 'Documentos'], ['paginas', 'Páginas y trámites']]],
  ['Sistema', [['archivos', 'Archivos'], ...(modoDemo ? [] : [['accesos', 'Accesos']]), ['respaldo', 'Respaldo']]]
];
function pintarPanel() {
  raiz.innerHTML = `
  ${modoDemo ? '<div class="aviso-demo">Modo demostración: los cambios se guardan solo en este navegador. Conecta Firebase (ver LEEME.md) para publicar de verdad.</div>' : ''}
  <div class="adm">
    <nav class="adm-lado" aria-label="Secciones del panel">
      <div class="titulo">${esc(ST.config.nombre)}<small>Panel de administración${ST.usuario ? ' · ' + esc(ST.usuario) : ''}</small></div>
      ${PESTANAS.map(([g, ps]) => `<div class="grupo-t">${g}</div>${ps.map(([k, t]) => `<button type="button" class="pest" data-p="${k}">${t}</button>`).join('')}`).join('<div class="sep"></div>')}
      <div class="sep"></div>
      <a class="pest" href="index.html?fresco=1" target="_blank" rel="noopener" style="color:#E9DCE2;padding:10px 12px;font-weight:600;text-decoration:none">Ver el sitio ↗</a>
      ${modoDemo ? '' : '<button type="button" class="pest" id="salir">Salir</button>'}
    </nav>
    <main class="adm-cuerpo" id="cuerpo"></main>
  </div>`;
  raiz.querySelectorAll('.pest[data-p]').forEach(b => b.addEventListener('click', () => mostrar(b.dataset.p)));
  const salir = document.getElementById('salir');
  if (salir) salir.addEventListener('click', () => authM.signOut(auth));
  mostrar(ST.pestana);
}
function mostrar(p) {
  ST.pestana = p;
  raiz.querySelectorAll('.pest[data-p]').forEach(b => b.classList.toggle('activa', b.dataset.p === p));
  const cuerpo = document.getElementById('cuerpo');
  cuerpo.scrollTop = 0; window.scrollTo(0, 0);
  const vistas = { inicio: vistaInicio, apariencia: vistaApariencia, textos: vistaTextos, hoy: vistaHoy, contacto: vistaContacto, archivos: vistaArchivos, accesos: vistaAccesos, respaldo: vistaRespaldo };
  if (vistas[p]) vistas[p](cuerpo);
  else if (ESQUEMAS[p]) vistaLista(cuerpo, p);
}

// ---------- Formularios de configuración ----------
function formConfig(cuerpo, titulo, intro, bloques, despues) {
  cuerpo.innerHTML = `<h1>${esc(titulo)}</h1><p class="intro">${intro}</p>
    <form id="f-config">${bloques.map(b => `<section class="panel">${b.h ? `<h2>${esc(b.h)}</h2>` : ''}${b.antes || ''}
      <div class="rej-campos">${b.campos.map(c => campoHTML(c, obtener(ST.config, c.k), 'data-ruta')).join('')}</div></section>`).join('')}
      <div class="barra-acciones"><button class="btn btn-primario" type="submit">Guardar y publicar</button></div></form>`;
  const f = document.getElementById('f-config');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]');
    conEspera(btn, async () => {
      const v = leerCampos(f, 'data-ruta');
      for (const [k, val] of Object.entries(v)) {
        if (/colores\./.test(k) && val && !/^#[0-9a-f]{6}$/i.test(val)) throw new Error(`El color "${val}" no es válido. Usa el formato #RRGGBB.`);
        poner(ST.config, k, val);
      }
      await guardarConfig();
    });
  });
  if (despues) despues(f);
}

const PALETAS = [
  ['Vino institucional', { primario: '#6B0F3A', primarioOscuro: '#4A0A28', acento: '#B8923A', fondo: '#FBF9F6', texto: '#221C1F', escucha: '#1A2D6B', pie: '#2A0718' }],
  ['Rojo, azul y dorado', { primario: '#8B1A1A', primarioOscuro: '#5E1010', acento: '#C9A84C', fondo: '#FAF8F4', texto: '#1F1D24', escucha: '#1A2D6B', pie: '#14204D' }],
  ['Azul mariano', { primario: '#1A2D6B', primarioOscuro: '#101D47', acento: '#C9A84C', fondo: '#F7F8FB', texto: '#1C2133', escucha: '#2F6B5E', pie: '#0E1838' }],
  ['Verde esperanza', { primario: '#2E5E3A', primarioOscuro: '#1E4027', acento: '#B8923A', fondo: '#F8F8F3', texto: '#1F2420', escucha: '#1A2D6B', pie: '#17301E' }],
  ['Morado penitencial', { primario: '#4E2A6E', primarioOscuro: '#341A4C', acento: '#B8923A', fondo: '#F9F7FA', texto: '#221E26', escucha: '#1A2D6B', pie: '#24143A' }]
];
function vistaApariencia(cuerpo) {
  const colores = [['primario', 'Color principal', 'Encabezado de portada, botones y enlaces.'], ['primarioOscuro', 'Principal oscuro', 'Barra superior y botones al pasar el mouse.'],
    ['acento', 'Acento (dorado)', 'Detalles, borde del escudo y etiquetas.'], ['fondo', 'Fondo general', ''], ['texto', 'Color del texto', ''],
    ['escucha', 'Color de la franja "No estás solo"', ''], ['pie', 'Fondo del pie de página', '']];
  formConfig(cuerpo, 'Apariencia', 'Colores, tipografías, escudo e imagen de portada. Los cambios se ven en todo el sitio al guardar.', [
    { h: 'Paletas sugeridas', antes: `<p style="color:var(--suave);margin-bottom:12px">Toca una paleta para cargarla en los campos de abajo; luego guarda.</p>
      <div class="muestras">${PALETAS.map(([n, c], i) => `<button type="button" class="muestra" data-pal="${i}"><span>${['primario', 'acento', 'escucha'].map(k => `<i style="background:${c[k]}"></i>`).join('')}</span> ${esc(n)}</button>`).join('')}</div>
      <div id="aviso-contraste" style="margin-top:14px"></div>`, campos: [] },
    { h: 'Colores', campos: colores.map(([k, t, a]) => ({ k: 'colores.' + k, t, tipo: 'color', ayuda: a })) },
    { h: 'Tipografía', campos: [{ k: 'fuentes.titulos', t: 'Fuente de los títulos', tipo: 'fuente' }, { k: 'fuentes.cuerpo', t: 'Fuente del texto', tipo: 'fuente' }] },
    { h: 'Escudo e imágenes', campos: [
      { k: 'logo', t: 'Escudo o logo', tipo: 'imagen', ayuda: 'Ideal: PNG cuadrado con fondo transparente, 512 × 512 px.' },
      { k: 'favicon', t: 'Ícono de la pestaña del navegador (opcional)', tipo: 'imagen', ayuda: 'Si lo dejas vacío se usa el escudo.' },
      { k: 'textos.portadaImagen', t: 'Foto de fondo de la portada (opcional)', tipo: 'imagen', ayuda: 'Se muestra suave detrás del color principal. Horizontal, mínimo 1600 px de ancho.' }
    ] }
  ], (f) => {
    const revisar = () => {
      const p = f.querySelector('[data-ruta="colores.primario"]').value;
      const r = contraste(p, '#FFFFFF');
      document.getElementById('aviso-contraste').innerHTML = /^#[0-9a-f]{6}$/i.test(p) && r < 4.5
        ? `<div class="aviso mal">El color principal es muy claro para texto blanco (contraste ${r.toFixed(1)}:1). Elige un tono más oscuro para que se lea bien.</div>` : '';
    };
    f.querySelectorAll('[data-pal]').forEach(b => b.addEventListener('click', () => {
      const c = PALETAS[Number(b.dataset.pal)][1];
      Object.entries(c).forEach(([k, v]) => { const el = f.querySelector(`[data-ruta="colores.${k}"]`); el.value = v; el.previousElementSibling.value = v; });
      revisar(); notificar('Paleta cargada. Toca "Guardar y publicar" para aplicarla.');
    }));
    f.addEventListener('input', revisar);
    revisar();
  });
}
function vistaTextos(cuerpo) {
  const T = (k, t, extra = {}) => ({ k: 'textos.' + k, t, ...extra });
  const S = (k, t) => ({ k: 'secciones.' + k, t, tipo: 'si' });
  formConfig(cuerpo, 'Textos de la portada', 'Todo lo que se lee en la página de inicio. Puedes ocultar secciones completas.', [
    { h: 'Secciones visibles', campos: [S('hoy', 'Franja "Hoy en la Diócesis"'), S('yoQuiero', '"Yo quiero…"'), S('actualidad', 'Actualidad'), S('agenda', 'Agenda'), S('documentos', 'Decretos y comunicados'), S('escucha', '"No estás solo"'), S('app', 'Aplicación')] },
    { h: 'Portada', campos: [T('portadaEtiqueta', 'Texto pequeño superior'), T('portadaTitulo', 'Título grande'), T('portadaTexto', 'Texto de presentación', { tipo: 'area', filas: 3 }), T('buscadorTitulo', 'Título del buscador de misas')] },
    { h: 'Secciones', campos: [T('yoQuieroTitulo', 'Título "Yo quiero…"'), T('yoQuieroTexto', 'Texto bajo "Yo quiero…"'), T('actualidadTitulo', 'Título de Actualidad'), T('agendaTitulo', 'Título de la Agenda'),
      T('documentosTitulo', 'Título de Documentos'), T('documentosTexto', 'Texto de Documentos')] },
    { h: 'Franja "No estás solo"', campos: [T('escuchaEtiqueta', 'Etiqueta'), T('escuchaTitulo', 'Título'), T('escuchaTexto', 'Texto', { tipo: 'area', filas: 3 }),
      T('escuchaBoton1', 'Botón principal'), T('escuchaEnlace1', 'Enlace del botón principal', { ayuda: 'Ej.: pagina.html?id=ser-escuchado' }), T('escuchaBoton2', 'Botón secundario'), T('escuchaEnlace2', 'Enlace del botón secundario')] },
    { h: 'Aplicación', campos: [T('appTitulo', 'Título'), T('appTexto', 'Texto', { tipo: 'area', filas: 2 }), T('appBoton', 'Texto del botón'), { k: 'enlaces.app', t: 'Enlace de Google Play', ayuda: 'Si está vacío se muestra "Muy pronto en Google Play".' }] }
  ]);
}
function vistaHoy(cuerpo) {
  formConfig(cuerpo, 'Hoy en la Diócesis', 'La franja bajo la portada. El tiempo litúrgico y su color se calculan solos; si subes el calendario litúrgico de Colombia (.ics de GCatholic) también aparecen las fiestas y memorias del día.', [
    { h: 'Liturgia del día', antes: '<div id="prueba-liturgia" class="aviso info">Calculando la liturgia de hoy…</div>', campos: [
      { k: 'hoy.calendarioIcs', t: 'Calendario litúrgico (.ics)', tipo: 'archivo', ayuda: 'Descárgalo de gcatholic.org (calendario de Colombia, formato iCal) y súbelo aquí. Hay que cambiarlo cada año.' },
      { k: 'hoy.lecturasEnlace', t: 'Enlace "Lecturas y Evangelio de hoy"' },
      { k: 'hoy.liturgiaManual', t: 'Texto manual (opcional)', ayuda: 'Si lo escribes, reemplaza al cálculo automático. Déjalo vacío normalmente.' },
      { k: 'hoy.colorManual', t: 'Color manual', tipo: 'opciones', opciones: [['', 'Automático'], ['verde', 'Verde'], ['blanco', 'Blanco'], ['rojo', 'Rojo'], ['morado', 'Morado'], ['rosado', 'Rosado']] }
    ] },
    { h: 'Intención del Papa', campos: [{ k: 'hoy.intencionPapa', t: 'Intención del mes' }, { k: 'hoy.intencionPapaEnlace', t: 'Enlace al video del mes (opcional)' }] },
    { h: 'Otros', campos: [{ k: 'hoy.oracionParroquia', t: 'Mostrar "Hoy oramos por" (una parroquia distinta cada día)', tipo: 'si', ancho: true },
      { k: 'hoy.cafeTitulo', t: 'Título del recurso diario' }, { k: 'hoy.cafeEnlace', t: 'Enlace del recurso diario', ayuda: 'Ej.: la imagen de El Café Espiritual. Si está vacío, no se muestra.' }] }
  ]);
  liturgiaDeHoy(ST.config).then(l => { const el = document.getElementById('prueba-liturgia'); if (el) el.textContent = `Hoy el sitio muestra: ${l.nombre} · color ${l.color}.`; });
}
function vistaContacto(cuerpo) {
  formConfig(cuerpo, 'Contacto y redes', 'Datos de la Curia, redes sociales y enlaces del pie de página.', [
    { h: 'Identidad', campos: [{ k: 'nombre', t: 'Nombre de la Diócesis' }, { k: 'lema', t: 'Lema o subtítulo' }, { k: 'seoDescripcion', t: 'Descripción para Google y al compartir', tipo: 'area', filas: 2 }] },
    { h: 'Curia diocesana', campos: [{ k: 'contacto.telefonos', t: 'Teléfonos' }, { k: 'contacto.whatsapp', t: 'WhatsApp', ayuda: 'Con o sin 57. Ej.: 3202477708' },
      { k: 'contacto.correo', t: 'Correo' }, { k: 'contacto.direccion', t: 'Dirección' }, { k: 'contacto.horario', t: 'Horario de atención', tipo: 'area', filas: 3 }] },
    { h: 'Redes sociales', campos: ['facebook', 'instagram', 'youtube', 'tiktok', 'x'].map(r => ({ k: 'redes.' + r, t: r === 'x' ? 'X (Twitter)' : r.charAt(0).toUpperCase() + r.slice(1), ayuda: 'Enlace al perfil. Vacío = no se muestra.' })) },
    { h: 'Enlaces', campos: [{ k: 'enlaces.privacidad', t: 'Política de tratamiento de datos', tipo: 'archivo' }, { k: 'enlaces.calendarioPublico', t: 'Calendario diocesano completo (Google Calendar público)' },
      { k: 'pieEnlaces', t: 'Enlaces "En comunión con" (pie de página)', tipo: 'area', filas: 5, ayuda: 'Uno por línea: <code>Texto | https://enlace</code>' }] }
  ]);
}

// ---------- Listas de contenidos ----------
function vistaLista(cuerpo, col, busqueda = '') {
  const E = ESQUEMAS[col];
  cuerpo.innerHTML = `<h1>${esc(E.titulo)}</h1>
    <div class="barra-acciones"><button class="btn btn-primario" type="button" id="nuevo">+ Agregar ${esc(E.singular)}</button>
      <label class="campo" style="flex:1 1 260px;flex-direction:row;align-items:center"><span class="sr">Buscar</span><input type="search" id="buscar" placeholder="Buscar…" value="${esc(busqueda)}"></label></div>
    <p id="total" style="color:var(--suave);margin-bottom:10px"></p>
    <div class="lista-items" id="lista"></div>`;
  const pintar = () => {
    const q = document.getElementById('buscar').value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const l = [...ST[col]].sort(E.ordenar).filter(x => !q || (E.etiqueta(x) + ' ' + E.sub(x)).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q));
    document.getElementById('total').textContent = `${l.length} de ${ST[col].length}`;
    document.getElementById('lista').innerHTML = l.map(x => `<div class="item">
      ${E.img ? (vistaUrl(E.img(x)) ? `<img src="${esc(vistaUrl(E.img(x)))}" alt="" loading="lazy">` : '<span class="mini"></span>') : ''}
      <div class="info"><strong>${esc(E.etiqueta(x))}</strong><span>${esc(E.sub(x))}</span></div>
      <button type="button" class="btn btn-borde btn-peq" data-editar="${esc(x.id)}">Editar</button></div>`).join('') || '<div class="panel vacio">No hay elementos.</div>';
  };
  document.getElementById('buscar').addEventListener('input', pintar);
  document.getElementById('nuevo').addEventListener('click', () => vistaEditar(cuerpo, col, null));
  document.getElementById('lista').addEventListener('click', (e) => { const b = e.target.closest('[data-editar]'); if (b) vistaEditar(cuerpo, col, b.dataset.editar, document.getElementById('buscar').value); });
  pintar();
}
function vistaEditar(cuerpo, col, id, busqueda = '') {
  const E = ESQUEMAS[col];
  const existente = id ? ST[col].find(x => x.id === id) : null;
  const item = existente ? { ...existente } : E.nuevo();
  if (col === 'parroquias') item.coordenadas = item.lat && item.lng ? `${item.lat}, ${item.lng}` : '';
  cuerpo.innerHTML = `<p><button type="button" class="btn btn-borde btn-peq" id="volver">← Volver a ${esc(E.titulo)}</button></p>
    <h1 style="margin-top:14px">${existente ? esc(E.etiqueta(existente)) : 'Nuevo: ' + esc(E.singular)}</h1>
    <form id="f-item" class="panel" style="margin-top:16px"><div class="rej-campos">${E.campos.map(c => campoHTML(c, item[c.k], 'data-k')).join('')}</div>
      <div class="barra-acciones" style="margin-top:22px;margin-bottom:0">
        <button class="btn btn-primario" type="submit">Guardar y publicar</button>
        ${existente && E.ver ? `<a class="btn btn-borde" href="${esc(E.ver(existente))}" target="_blank" rel="noopener">Ver en el sitio ↗</a>` : ''}
        ${existente ? '<button class="btn btn-peligro" type="button" id="eliminar" style="margin-left:auto">Eliminar</button>' : ''}
      </div></form>`;
  const volver = () => vistaLista(cuerpo, col, busqueda);
  document.getElementById('volver').addEventListener('click', volver);
  const f = document.getElementById('f-item');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    conEspera(f.querySelector('button[type=submit]'), async () => {
      const v = leerCampos(f, 'data-k');
      for (const c of E.campos) if (c.req && !v[c.k]) throw new Error(`Falta: ${c.t}`);
      const nuevo = { ...(existente || {}), ...v };
      if (col === 'parroquias') { Object.assign(nuevo, coordenadasDe(v.coordenadas)); delete nuevo.coordenadas; }
      if (!nuevo.id) {
        let base = slug(E.clave(nuevo)), cand = base, n = 2;
        while (ST[col].some(x => x.id === cand)) cand = `${base}-${n++}`;
        nuevo.id = cand;
      }
      await guardarItem(col, nuevo);
      notificar('Guardado y publicado.');
      volver();
    });
  });
  const del = document.getElementById('eliminar');
  if (del) del.addEventListener('click', () => {
    if (!confirm(`¿Eliminar "${E.etiqueta(existente)}"? Esta acción no se puede deshacer.`)) return;
    conEspera(del, async () => { await borrarItem(col, existente.id); notificar('Eliminado.'); volver(); });
  });
}

// ---------- Inicio ----------
function vistaInicio(cuerpo) {
  const sinHorario = ST.parroquias.filter(p => !(p.misas || []).length).length;
  const sinWa = ST.parroquias.filter(p => !p.whatsapp).length;
  const r = datosRepo();
  const tarjetas = [['parroquias', 'Parroquias'], ['sacerdotes', 'Sacerdotes'], ['noticias', 'Noticias'], ['documentos', 'Documentos'], ['paginas', 'Páginas'], ['eventos', 'Eventos']];
  const pend = [
    [!ST.config.logo, 'Sube el escudo de la Diócesis', 'apariencia'],
    [!(r.usuario && r.repo && leerToken()), 'Configura dónde se guardan los archivos (GitHub)', 'archivos'],
    [sinHorario > 0, `${sinHorario} parroquias aún no tienen horarios de misa`, 'parroquias'],
    [sinWa > 0, `${sinWa} parroquias aún no tienen WhatsApp`, 'parroquias'],
    [!ST.config.hoy.calendarioIcs, 'Sube el calendario litúrgico de Colombia (.ics) para mostrar santos y fiestas', 'hoy'],
    [!ST.config.enlaces.app, 'Agrega el enlace de la app en Google Play', 'textos']
  ].filter(x => x[0]);
  cuerpo.innerHTML = `<h1>Bienvenido</h1><p class="intro">Desde aquí se administra todo el sitio. Cada vez que guardas, los cambios se publican.</p>
    <div class="rej-campos" style="margin-bottom:18px">${tarjetas.map(([k, t]) => `<button type="button" class="panel" data-ir="${k}" style="text-align:left;cursor:pointer;margin:0">
      <div class="cifra">${ST[k].length}</div><div style="font-weight:600;margin-top:6px">${t}</div></button>`).join('')}</div>
    ${pend.length ? `<section class="panel"><h2>Pendientes</h2>${pend.map(([, t, k]) => `<div class="item" style="margin-bottom:8px"><div class="info"><strong style="white-space:normal">${esc(t)}</strong></div>
      <button type="button" class="btn btn-borde btn-peq" data-ir="${k}">Ir</button></div>`).join('')}</section>` : ''}
    <section class="panel"><h2>Publicación</h2><p style="color:var(--suave);margin-bottom:12px">Si algo no se ve actualizado en el sitio, vuelve a publicar todo.</p>
      <button type="button" class="btn btn-borde" id="republicar">Volver a publicar todo</button></section>`;
  cuerpo.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => mostrar(b.dataset.ir)));
  const rb = document.getElementById('republicar');
  rb.addEventListener('click', () => conEspera(rb, async () => { await publicar(); notificar('Sitio publicado de nuevo.'); }));
}

// ---------- Archivos ----------
function vistaArchivos(cuerpo) {
  const r = datosRepo();
  cuerpo.innerHTML = `<h1>Archivos</h1>
    <p class="intro">Fotos y PDF se guardan en el mismo repositorio de GitHub donde vive el sitio, en la carpeta <code>${esc(r.carpeta)}/</code>. Así quedan con la dirección de la propia página, sin Drive y sin costo. Las imágenes grandes se reducen solas antes de subir.</p>
    <form id="f-repo" class="panel"><h2>Conexión con GitHub</h2>
      <div class="rej-campos">
        <label class="campo">Usuario u organización de GitHub<input type="text" name="usuario" value="${esc(r.usuario)}" placeholder="Ej.: paginabierta"></label>
        <label class="campo">Repositorio<input type="text" name="repositorio" value="${esc(r.repo)}" placeholder="Ej.: diocesis-web"></label>
        <label class="campo">Rama<input type="text" name="rama" value="${esc(r.rama)}"></label>
        <label class="campo">Carpeta<input type="text" name="carpeta" value="${esc(r.carpeta)}"></label>
        <label class="campo ancho">Token de acceso (solo en este equipo)
          <span class="ayuda">Se guarda únicamente en este navegador, nunca en la base de datos. Créalo en GitHub → Settings → Developer settings → Fine-grained tokens, solo para este repositorio, con permiso <b>Contents: Read and write</b>.</span>
          <input type="password" name="token" value="${esc(leerToken())}" autocomplete="off" placeholder="github_pat_…"></label>
      </div>
      <div class="barra-acciones" style="margin:18px 0 0"><button class="btn btn-primario" type="submit">Guardar conexión</button><button class="btn btn-borde" type="button" id="probar">Probar conexión</button></div>
      <div id="estado-gh" style="margin-top:12px"></div>
    </form>
    <section class="panel"><h2>Subir un archivo suelto</h2>
      <p style="color:var(--suave);margin-bottom:12px">Para obtener un enlace y usarlo donde quieras (por ejemplo, en el texto de una noticia).</p>
      <div class="campo"><span class="fila-archivo"><input type="text" id="ruta-suelta" readonly placeholder="Aquí aparecerá la dirección del archivo">
        <button type="button" class="btn btn-borde btn-peq btn-subir" data-destino="ruta-suelta" data-imagen="0">Subir</button></span>
        <input type="file" class="oculto" data-para="ruta-suelta"><span data-prev="ruta-suelta"></span></div>
    </section>
    <section class="panel"><h2>Archivos subidos</h2><button type="button" class="btn btn-borde btn-peq" id="listar">Ver archivos</button><div id="lista-archivos" style="margin-top:14px"></div></section>`;
  const f = document.getElementById('f-repo');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    conEspera(f.querySelector('button[type=submit]'), async () => {
      ST.config.archivos = { usuario: f.usuario.value.trim(), repositorio: f.repositorio.value.trim(), rama: f.rama.value.trim() || 'main', carpeta: f.carpeta.value.trim() || 'archivos' };
      ponerToken(f.token.value.trim());
      await guardarConfig();
    });
  });
  document.getElementById('probar').addEventListener('click', async () => {
    const est = document.getElementById('estado-gh');
    const d = datosRepo();
    if (f.token.value.trim() !== leerToken()) ponerToken(f.token.value.trim());
    try {
      const resp = await fetch(`https://api.github.com/repos/${encodeURIComponent(f.usuario.value.trim() || d.usuario)}/${encodeURIComponent(f.repositorio.value.trim() || d.repo)}`, { headers: cabecerasGH() });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(errorGH(resp.status, j.message));
      est.innerHTML = j.permissions && j.permissions.push
        ? `<div class="aviso ok">Conexión correcta con ${esc(j.full_name)}. Ya puedes subir archivos.</div>`
        : `<div class="aviso mal">Se ve el repositorio ${esc(j.full_name)}, pero el token no tiene permiso de escritura.</div>`;
    } catch (err) { est.innerHTML = `<div class="aviso mal">${esc(err.message)}</div>`; }
  });
  document.getElementById('listar').addEventListener('click', listarArchivos);
}
async function listarArchivos() {
  const caja = document.getElementById('lista-archivos');
  const { usuario, repo, rama, carpeta } = datosRepo();
  if (!usuario || !repo || !leerToken()) { caja.innerHTML = '<div class="aviso mal">Completa y guarda la conexión primero.</div>'; return; }
  caja.textContent = 'Cargando…';
  try {
    const resp = await fetch(`https://api.github.com/repos/${encodeURIComponent(usuario)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(rama)}?recursive=1`, { headers: cabecerasGH() });
    const j = await resp.json();
    if (!resp.ok) throw new Error(errorGH(resp.status, j.message));
    const arch = (j.tree || []).filter(x => x.type === 'blob' && x.path.startsWith(carpeta + '/')).sort((a, b) => b.path.localeCompare(a.path));
    const total = arch.reduce((s, x) => s + (x.size || 0), 0);
    caja.innerHTML = `<p style="color:var(--suave);margin-bottom:10px">${arch.length} archivos · ${(total / 1048576).toFixed(1)} MB en total (GitHub recomienda no pasar de 1 GB por repositorio).</p>
      <div class="lista-items">${arch.map(x => `<div class="item"><div class="info"><strong>${esc(x.path.replace(carpeta + '/', ''))}</strong><span>${((x.size || 0) / 1024).toFixed(0)} KB</span></div>
        <a class="btn btn-borde btn-peq" href="${esc(x.path)}" target="_blank" rel="noopener">Abrir</a>
        <button type="button" class="btn btn-borde btn-peq" data-copiar="${esc(x.path)}">Copiar dirección</button>
        <button type="button" class="btn btn-peligro btn-peq" data-borrar="${esc(x.path)}" data-sha="${esc(x.sha)}">Eliminar</button></div>`).join('') || '<div class="vacio">Aún no hay archivos.</div>'}</div>`;
    caja.onclick = async (e) => {
      const c = e.target.closest('[data-copiar]');
      if (c) { try { await navigator.clipboard.writeText(c.dataset.copiar); notificar('Dirección copiada: ' + c.dataset.copiar); } catch (er) { prompt('Copia la dirección:', c.dataset.copiar); } return; }
      const b = e.target.closest('[data-borrar]');
      if (b && confirm('¿Eliminar este archivo? Si alguna página lo usa, dejará de verse.')) {
        const r = await fetch(`https://api.github.com/repos/${encodeURIComponent(usuario)}/${encodeURIComponent(repo)}/contents/${b.dataset.borrar}`, {
          method: 'DELETE', headers: cabecerasGH(), body: JSON.stringify({ message: 'Eliminar ' + b.dataset.borrar, sha: b.dataset.sha, branch: rama })
        });
        if (r.ok) { notificar('Archivo eliminado.'); listarArchivos(); } else { const j2 = await r.json().catch(() => ({})); notificar(errorGH(r.status, j2.message), true); }
      }
    };
  } catch (err) { caja.innerHTML = `<div class="aviso mal">${esc(err.message)}</div>`; }
}

// ---------- Accesos ----------
async function vistaAccesos(cuerpo) {
  cuerpo.innerHTML = `<h1>Accesos</h1><p class="intro">Correos que pueden entrar al panel. La persona agregada entra a <code>admin.html</code> y usa "Crear mi contraseña (primera vez)".</p>
    <form id="f-acc" class="panel"><h2>Agregar administrador</h2><div class="barra-acciones" style="margin:0">
      <label class="campo" style="flex:1 1 280px">Correo<input type="email" name="correo" required></label>
      <button class="btn btn-primario" type="submit" style="align-self:flex-end">Agregar</button></div></form>
    <section class="panel"><h2>Administradores</h2><div id="lista-acc" class="lista-items">Cargando…</div></section>`;
  const { db, fs } = await fb();
  const pintar = async () => {
    const snap = await fs.getDocs(fs.collection(db, 'admins'));
    document.getElementById('lista-acc').innerHTML = snap.docs.map(d => `<div class="item"><div class="info"><strong>${esc(d.id)}</strong>
      <span>${d.data().agregadoPor ? 'Agregado por ' + esc(d.data().agregadoPor) : ''}</span></div>
      ${d.id === ST.usuario ? '<span style="color:var(--suave);font-size:14px">Tú</span>' : `<button type="button" class="btn btn-peligro btn-peq" data-quitar="${esc(d.id)}">Quitar</button>`}</div>`).join('');
  };
  await pintar();
  document.getElementById('lista-acc').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-quitar]');
    if (b && confirm(`¿Quitar el acceso de ${b.dataset.quitar}?`)) { await fs.deleteDoc(fs.doc(db, 'admins', b.dataset.quitar)); notificar('Acceso retirado.'); pintar(); }
  });
  const f = document.getElementById('f-acc');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    conEspera(f.querySelector('button'), async () => {
      const c = f.correo.value.trim().toLowerCase();
      await fs.setDoc(fs.doc(db, 'admins', c), { agregadoPor: ST.usuario, fecha: new Date().toISOString() });
      f.reset(); notificar('Administrador agregado.'); await pintar();
    });
  });
}

// ---------- Respaldo ----------
function vistaRespaldo(cuerpo) {
  cuerpo.innerHTML = `<h1>Respaldo</h1><p class="intro">Descarga una copia de todo el contenido, restáurala o carga los datos iniciales tomados del sitio anterior.</p>
    <section class="panel"><h2>Descargar copia</h2><p style="color:var(--suave);margin-bottom:12px">Un archivo .json con configuración, parroquias, sacerdotes, noticias, agenda, documentos y páginas. Guárdalo de vez en cuando.</p>
      <button type="button" class="btn btn-primario" id="exportar">Descargar copia de seguridad</button></section>
    <section class="panel"><h2>Restaurar copia</h2><p style="color:var(--suave);margin-bottom:12px">Reemplaza el contenido actual por el de un archivo de respaldo.</p>
      <input type="file" id="importar" accept="application/json,.json"></section>
    <section class="panel"><h2>Datos iniciales</h2><p style="color:var(--suave);margin-bottom:12px">Agrega las 54 parroquias, los sacerdotes, los decretos y las páginas básicas tomadas del sitio anterior. Solo se agregan los que no existan; no borra nada.</p>
      <button type="button" class="btn btn-borde" id="iniciales">Cargar datos iniciales</button>
      ${modoDemo ? '<button type="button" class="btn btn-peligro" id="reiniciar" style="margin-left:8px">Borrar la demostración</button>' : ''}</section>`;
  document.getElementById('exportar').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(limpio(paqueteDemo()), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `respaldo-diocesis-${hoyISO()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  document.getElementById('importar').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!d.config && !d.parroquias) throw new Error('El archivo no parece un respaldo del sitio.');
      if (!confirm('¿Reemplazar el contenido actual por el del respaldo?')) return;
      if (!modoDemo) {
        const { db, fs } = await fb();
        for (const c of COLS) if (d[c]) for (const x of ST[c]) if (!d[c].some(y => y.id === x.id)) await fs.deleteDoc(fs.doc(db, c, x.id));
      }
      await escribirTodo(d, { reemplazar: true });
      notificar('Respaldo restaurado.'); pintarPanel();
    } catch (err) { notificar(err.message, true); }
    finally { e.target.value = ''; }
  });
  const ini = document.getElementById('iniciales');
  ini.addEventListener('click', () => {
    if (!confirm('¿Agregar los datos iniciales? Lo que ya exista no se toca.')) return;
    conEspera(ini, async () => {
      const d = datosIniciales();
      const conConfig = modoDemo ? { ...d, config: undefined } : d;
      if (!modoDemo) {
        const { db, fs } = await fb();
        const s = await fs.getDoc(fs.doc(db, 'ajustes', 'sitio'));
        if (s.exists()) delete conConfig.config;
      }
      await escribirTodo(conConfig, { reemplazar: false });
      notificar('Datos iniciales cargados.'); pintarPanel();
    });
  });
  const re = document.getElementById('reiniciar');
  if (re) re.addEventListener('click', () => { if (confirm('¿Borrar todo lo editado en esta demostración?')) { borrarDemo(); location.reload(); } });
}

// ---------- Arranque ----------
(async () => {
  try {
    if (modoDemo) {
      await cargarTodo();
      aplicarTema(ST.config);
      pintarPanel();
    } else {
      await iniciarAuth();
    }
  } catch (e) {
    console.error(e);
    raiz.innerHTML = `<div class="cargando">No se pudo iniciar el panel: ${esc(e.message)}</div>`;
  }
})();
