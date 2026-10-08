// =========================================================
// comun.js · funciones compartidas por todas las páginas
// =========================================================
import { firebaseConfig } from './firebase-config.js';
import * as INI from './datos-iniciales.js';

export const FB_VERSION = '10.12.2';
export const COLECCIONES = ['parroquias', 'sacerdotes', 'paginas', 'noticias', 'eventos', 'documentos'];
export const modoDemo = !firebaseConfig || !firebaseConfig.apiKey;
const CLAVE_DEMO = 'diocesis-demo-v1';
const CLAVE_CACHE = 'diocesis-sitio-v1';
const MINUTOS_CACHE = 5;

// ---------- Firebase (se carga solo si hay configuración) ----------
let _fb = null;
export async function fb() {
  if (modoDemo) return null;
  if (_fb) return _fb;
  const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
  const appM = await import(base + 'firebase-app.js');
  const fs = await import(base + 'firebase-firestore.js');
  const app = appM.getApps().length ? appM.getApp() : appM.initializeApp(firebaseConfig);
  _fb = { app, db: fs.getFirestore(app), fs };
  return _fb;
}

// ---------- Utilidades ----------
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function slug(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'item-' + Date.now();
}
export function param(nombre) { return new URLSearchParams(location.search).get(nombre) || ''; }
export function urlSegura(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (/^[a-z0-9_\-./?=&#%]+$/i.test(s) && !/^[a-z]+:/i.test(s)) return s; // ruta relativa
  return '';
}
function enlazar(t) {
  return t.replace(/(https?:\/\/[^\s<]+[^\s<.,;:)])/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
}
function enLinea(t) {
  return enlazar(esc(t)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<em>$2</em>');
}
// Texto sencillo → HTML: párrafos, **negrita**, _cursiva_, ## subtítulos, listas con "- " y enlaces.
export function textoRico(t) {
  if (!t) return '';
  return String(t).replace(/\r/g, '').split(/\n{2,}/).map(bloque => {
    const lineas = bloque.split('\n');
    if (lineas.every(l => /^\s*[-•]\s+/.test(l))) {
      return '<ul>' + lineas.map(l => '<li>' + enLinea(l.replace(/^\s*[-•]\s+/, '')) + '</li>').join('') + '</ul>';
    }
    if (/^##\s+/.test(bloque)) return '<h3>' + enLinea(bloque.replace(/^##\s+/, '')) + '</h3>';
    return '<p>' + lineas.map(enLinea).join('<br>') + '</p>';
  }).join('');
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export function aFecha(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  return y ? new Date(y, (m || 1) - 1, d || 1) : null;
}
export function fechaLarga(iso) {
  const f = aFecha(iso);
  return f ? `${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}` : '';
}
export function fechaCorta(iso) {
  const f = aFecha(iso);
  return f ? `${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)} ${f.getFullYear()}` : '';
}
export function mesCorto(iso) { const f = aFecha(iso); return f ? MESES[f.getMonth()].slice(0, 3) : ''; }
export function diaMes(iso) { const f = aFecha(iso); return f ? f.getDate() : ''; }
export function hoyISO(f = new Date()) {
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}
export function hoyTexto(f = new Date()) {
  const d = DIAS_SEMANA[f.getDay()];
  return `${d.charAt(0).toUpperCase() + d.slice(1)} ${f.getDate()} de ${MESES[f.getMonth()]}`;
}

// ---------- Misas ----------
export const OPCIONES_DIAS = [
  ['dom', 'Domingo'], ['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'],
  ['vie', 'Viernes'], ['sab', 'Sábado'], ['lun-vie', 'Lunes a viernes'], ['lun-sab', 'Lunes a sábado'], ['todos', 'Todos los días']
];
const IDX = { dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6 };
export function diaIncluido(valor, dia) {
  if (valor === 'todos') return true;
  if (valor === 'lun-vie') return dia >= 1 && dia <= 5;
  if (valor === 'lun-sab') return dia >= 1 && dia <= 6;
  return IDX[valor] === dia;
}
export function textoDias(valor) { return (OPCIONES_DIAS.find(o => o[0] === valor) || ['', valor])[1]; }
export function hora12(h) {
  if (!h) return '';
  const [H, M] = h.split(':').map(Number);
  const suf = H < 12 ? 'a. m.' : 'p. m.';
  const h12 = H % 12 === 0 ? 12 : H % 12;
  return `${h12}:${String(M || 0).padStart(2, '0')} ${H === 12 && !M ? 'm.' : suf}`;
}
export function misasDelDia(parroquia, dia) {
  return (parroquia.misas || []).filter(m => diaIncluido(m.dias, dia)).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
}
export function distanciaKm(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export function soloDigitos(s) { return String(s || '').replace(/\D/g, ''); }
export function enlaceWhatsApp(numero, texto = '') {
  let n = soloDigitos(numero);
  if (!n) return '';
  if (n.length === 10) n = '57' + n;
  return `https://wa.me/${n}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
}

// ---------- Íconos (trazo, sin emojis) ----------
const T = (d) => `<svg class="icono" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONOS = {
  agua: T('<path d="M12 3c3 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.5 6-11z"/>'),
  anillos: T('<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 4h4l-2 3z"/>'),
  documento: T('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>'),
  ubicacion: T('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  vela: T('<path d="M12 3c1.8 2.2 2.5 3.8 2.5 5a2.5 2.5 0 0 1-5 0c0-1.2.7-2.8 2.5-5z"/><path d="M9 12h6v9H9z"/>'),
  escucha: T('<path d="M4 5h16v11H9l-5 4z"/><path d="M12 13s-3-1.8-3-3.6A1.6 1.6 0 0 1 12 8.6a1.6 1.6 0 0 1 3 .8c0 1.8-3 3.6-3 3.6z"/>'),
  cruz: T('<path d="M12 3v18M7 8h10"/><path d="M5 21h14"/>'),
  casa: T('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>'),
  libro: T('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M12 7v6M9 10h6"/>'),
  corazon: T('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  personas: T('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8 0 5 2.3 5 5.5"/>'),
  calendario: T('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  telefono: T('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  musica: T('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  manos: T('<path d="M7 11V5a2 2 0 0 1 4 0v6M11 9V4a2 2 0 0 1 4 0v7M15 10V7a2 2 0 0 1 4 0v6c0 4-3 8-7 8s-7-3-8-6l-1-3a2 2 0 0 1 3.5-1.5L7 13"/>')
};
export const ICONO_BUSCAR = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
export const ICONO_WA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg>';
export const ICONO_CRUZ_ESCUDO = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v18M6 9h12"/></svg>';

// ---------- Datos ----------
function profundo(base, extra) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return extra === undefined ? base : extra;
  const r = { ...base };
  for (const k of Object.keys(extra || {})) {
    r[k] = (typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])) ? profundo(base[k], extra[k]) : extra[k];
  }
  return r;
}
export function completarConfig(c) { return profundo(INI.CONFIG_INICIAL, c || {}); }

export function datosIniciales() {
  return {
    config: INI.CONFIG_INICIAL,
    parroquias: INI.PARROQUIAS_INICIALES,
    sacerdotes: INI.SACERDOTES_INICIALES,
    paginas: INI.PAGINAS_INICIALES,
    noticias: INI.NOTICIAS_INICIALES,
    eventos: INI.EVENTOS_INICIALES,
    documentos: INI.DOCUMENTOS_INICIALES
  };
}
export function leerDemo() {
  try { const t = localStorage.getItem(CLAVE_DEMO); if (t) return JSON.parse(t); } catch (e) { /* sin almacenamiento */ }
  return JSON.parse(JSON.stringify(datosIniciales()));
}
export function guardarDemo(datos) {
  try { localStorage.setItem(CLAVE_DEMO, JSON.stringify(datos)); } catch (e) { alert('No se pudo guardar en este navegador.'); }
}
export function borrarDemo() { try { localStorage.removeItem(CLAVE_DEMO); } catch (e) { /* nada */ } }
export function limpiarCache() { try { sessionStorage.removeItem(CLAVE_CACHE); } catch (e) { /* nada */ } }

function ordenar(datos) {
  const porOrden = (a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999) || String(a.nombre || a.titulo || '').localeCompare(String(b.nombre || b.titulo || ''), 'es');
  datos.parroquias = (datos.parroquias || []).filter(p => p.activa !== false).sort(porOrden);
  datos.sacerdotes = (datos.sacerdotes || []).filter(s => s.visible !== false).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
  datos.paginas = (datos.paginas || []).filter(p => p.visible !== false).sort(porOrden);
  datos.noticias = (datos.noticias || []).filter(n => n.visible !== false).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  datos.eventos = (datos.eventos || []).sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
  datos.documentos = (datos.documentos || []).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  datos.config = completarConfig(datos.config);
  return datos;
}

// Carga todo el contenido público. Con Firebase se lee UN solo documento
// (publico/sitio), que el panel reconstruye cada vez que se guarda algo.
export async function cargarSitio({ fresco = false } = {}) {
  if (modoDemo) return ordenar(leerDemo());
  if (!fresco && !param('fresco')) {
    try {
      const c = JSON.parse(sessionStorage.getItem(CLAVE_CACHE) || 'null');
      if (c && Date.now() - c.t < MINUTOS_CACHE * 60000) return ordenar(c.d);
    } catch (e) { /* sin caché */ }
  }
  const { db, fs } = await fb();
  const snap = await fs.getDoc(fs.doc(db, 'publico', 'sitio'));
  const d = snap.exists() ? snap.data() : { config: INI.CONFIG_INICIAL };
  try { sessionStorage.setItem(CLAVE_CACHE, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* lleno */ }
  return ordenar(d);
}

// ---------- Tema ----------
const FUENTES_GOOGLE = {
  'Source Serif 4': 'Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700',
  'Public Sans': 'Public+Sans:wght@400;500;600;700',
  'Lora': 'Lora:wght@400;600;700',
  'Merriweather': 'Merriweather:wght@400;700',
  'Playfair Display': 'Playfair+Display:wght@500;700',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@500;600;700',
  'EB Garamond': 'EB+Garamond:wght@400;600;700',
  'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
  'Cinzel': 'Cinzel:wght@500;700',
  'Nunito Sans': 'Nunito+Sans:wght@400;600;700',
  'Source Sans 3': 'Source+Sans+3:wght@400;600;700',
  'Work Sans': 'Work+Sans:wght@400;500;600;700',
  'Libre Franklin': 'Libre+Franklin:wght@400;500;600;700',
  'Atkinson Hyperlegible': 'Atkinson+Hyperlegible:wght@400;700',
  'Montserrat': 'Montserrat:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:wght@400;600;700'
};
export const LISTA_FUENTES = Object.keys(FUENTES_GOOGLE);

function mezclar(hex, otro, p) {
  const a = hex.replace('#', ''), b = otro.replace('#', '');
  const ca = [0, 2, 4].map(i => parseInt(a.substr(i, 2), 16)), cb = [0, 2, 4].map(i => parseInt(b.substr(i, 2), 16));
  if (ca.some(isNaN) || cb.some(isNaN)) return hex;
  return '#' + ca.map((v, i) => Math.round(v * (1 - p) + cb[i] * p).toString(16).padStart(2, '0')).join('');
}

export function aplicarTema(config) {
  const c = config.colores || {}, r = document.documentElement.style;
  if (c.primario) r.setProperty('--primario', c.primario);
  if (c.primarioOscuro) r.setProperty('--primario-oscuro', c.primarioOscuro);
  if (c.acento) { r.setProperty('--acento', c.acento); r.setProperty('--acento-texto', mezclar(c.acento, '#000000', 0.38)); }
  if (c.fondo) r.setProperty('--fondo', c.fondo);
  if (c.texto) { r.setProperty('--texto', c.texto); r.setProperty('--suave', mezclar(c.texto, '#ffffff', 0.32)); }
  if (c.escucha) { r.setProperty('--escucha', c.escucha); r.setProperty('--escucha-fondo', mezclar(c.escucha, '#ffffff', 0.92)); }
  if (c.pie) r.setProperty('--pie', c.pie);
  const f = config.fuentes || {};
  const familias = [f.titulos, f.cuerpo].filter(x => FUENTES_GOOGLE[x]);
  if (familias.length) {
    const href = 'https://fonts.googleapis.com/css2?' + [...new Set(familias)].map(x => 'family=' + FUENTES_GOOGLE[x]).join('&') + '&display=swap';
    let l = document.getElementById('fuentes-tema');
    if (!l) { l = document.createElement('link'); l.id = 'fuentes-tema'; l.rel = 'stylesheet'; document.head.appendChild(l); }
    if (l.href !== href) l.href = href;
  }
  if (f.titulos) r.setProperty('--fuente-titulos', `'${f.titulos}', Georgia, serif`);
  if (f.cuerpo) r.setProperty('--fuente-cuerpo', `'${f.cuerpo}', 'Segoe UI', sans-serif`);
  const fav = urlSegura(config.favicon || config.logo);
  if (fav) {
    let l = document.querySelector('link[rel="icon"]');
    if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
    l.href = fav;
  }
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  meta.content = c.primario || '#6B0F3A';
  if (config.seoDescripcion) {
    let d = document.querySelector('meta[name="description"]');
    if (!d) { d = document.createElement('meta'); d.name = 'description'; document.head.appendChild(d); }
    d.content = config.seoDescripcion;
  }
}

export function ponerTitulo(texto, config) {
  document.title = texto ? `${texto} · ${config.nombre}` : config.nombre;
}

// ---------- Encabezado y pie ----------
export function enlacePagina(p) { return urlSegura(p.enlace) || `pagina.html?id=${encodeURIComponent(p.id)}`; }

function escudoHTML(config) {
  const logo = urlSegura(config.logo);
  return `<span class="escudo">${logo ? `<img src="${esc(logo)}" alt="">` : `<span style="color:#F1DFA8">${ICONO_CRUZ_ESCUDO}</span>`}</span>`;
}

export function pintarEncabezado(datos, activo = '') {
  const { config, paginas } = datos;
  const r = config.redes || {};
  const redes = [['Facebook', r.facebook], ['Instagram', r.instagram], ['YouTube', r.youtube], ['TikTok', r.tiktok], ['X', r.x]]
    .filter(x => urlSegura(x[1])).map(([n, u]) => `<a href="${esc(urlSegura(u))}" target="_blank" rel="noopener">${n}</a>`).join('');
  const tramites = paginas.filter(p => p.grupo === 'tramites');
  const diocesis = paginas.filter(p => p.grupo === 'diocesis' || p.grupo === 'instituciones');
  const sub = (lista) => lista.map(p => `<a href="${esc(enlacePagina(p))}">${esc(p.titulo)}</a>`).join('');
  const act = (k) => activo === k ? ' activo' : '';
  const app = urlSegura(config.enlaces?.app);
  const tel = config.contacto?.telefonos ? `Curia diocesana · ${esc(config.contacto.telefonos)}` : '';
  const html = `
  ${modoDemo ? '<div class="aviso-demo">Modo demostración: el contenido se guarda solo en este navegador hasta conectar Firebase.</div>' : ''}
  <div class="barra-util"><div class="contenedor"><span>${tel}</span><div class="redes">${redes}</div></div></div>
  <header class="encabezado"><div class="contenedor" style="position:relative">
    <a class="marca" href="index.html">${escudoHTML(config)}<span><span class="marca-nombre">${esc(config.nombre)}</span><span class="marca-lema">${esc(config.lema)}</span></span></a>
    <button class="btn-menu" type="button" aria-label="Abrir menú" aria-expanded="false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <nav class="menu" aria-label="Principal">
      <a class="${act('parroquias')}" href="parroquias.html">Parroquias y misas</a>
      ${tramites.length ? `<div class="grupo"><button type="button" aria-expanded="false">Trámites</button><div class="submenu">${sub(tramites)}</div></div>` : ''}
      <a class="${act('noticias')}" href="noticias.html">Actualidad</a>
      <a class="${act('documentos')}" href="documentos.html">Documentos</a>
      <div class="grupo"><button type="button" aria-expanded="false">Nuestra Diócesis</button><div class="submenu"><a href="sacerdotes.html">Sacerdotes</a>${sub(diocesis)}</div></div>
      <a href="#contacto">Contacto</a>
      ${app ? `<a class="btn-app" href="${esc(app)}" target="_blank" rel="noopener">Descarga la app</a>` : ''}
    </nav>
  </div></header>`;
  const cont = document.getElementById('encabezado');
  cont.innerHTML = html;
  const btn = cont.querySelector('.btn-menu'), menu = cont.querySelector('.menu');
  btn.addEventListener('click', () => { const ab = menu.classList.toggle('abierto'); btn.setAttribute('aria-expanded', ab); });
  cont.querySelectorAll('.grupo > button').forEach(b => b.addEventListener('click', () => {
    const g = b.parentElement; const ab = g.classList.toggle('abierto'); b.setAttribute('aria-expanded', ab);
  }));
}

export function pintarPie(datos) {
  const { config, paginas } = datos;
  const c = config.contacto || {};
  const wa = enlaceWhatsApp(c.whatsapp);
  const enlacesPie = String(config.pieEnlaces || '').split('\n').map(l => l.split('|').map(x => x.trim())).filter(x => x[0] && urlSegura(x[1]));
  const diocesis = paginas.filter(p => p.grupo === 'diocesis').slice(0, 6);
  const priv = urlSegura(config.enlaces?.privacidad);
  document.getElementById('pie').innerHTML = `
  <footer class="pie" id="contacto">
    <div class="contenedor">
      <div class="col"><h3>Curia diocesana</h3>
        ${c.telefonos ? `<span>${esc(c.telefonos)}</span>` : ''}
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener">WhatsApp ${esc(c.whatsapp.replace(/^57/, ''))}</a>` : ''}
        ${c.correo ? `<a href="mailto:${esc(c.correo)}">${esc(c.correo)}</a>` : ''}
        ${c.direccion ? `<span>${esc(c.direccion)}</span>` : ''}
      </div>
      <div class="col"><h3>Horario de atención</h3><span>${esc(c.horario || '').replace(/\n/g, '<br>')}</span></div>
      <div class="col"><h3>Nuestra Diócesis</h3>
        <a href="sacerdotes.html">Sacerdotes</a>
        ${diocesis.map(p => `<a href="${esc(enlacePagina(p))}">${esc(p.titulo)}</a>`).join('')}
        ${priv ? `<a href="${esc(priv)}" target="_blank" rel="noopener">Política de tratamiento de datos</a>` : ''}
      </div>
      <div class="col"><h3>En comunión con</h3>${enlacesPie.map(([t, u]) => `<a href="${esc(urlSegura(u))}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}</div>
    </div>
    <div class="pie-final"><div class="contenedor">© ${new Date().getFullYear()} ${esc(config.nombre)}</div></div>
  </footer>`;
}

export async function iniciarPagina(activo = '') {
  let datos;
  try { datos = await cargarSitio(); }
  catch (e) {
    console.error(e);
    document.getElementById('contenido').innerHTML = '<div class="cargando">No pudimos cargar el contenido. Revisa tu conexión e intenta de nuevo.</div>';
    throw e;
  }
  aplicarTema(datos.config);
  pintarEncabezado(datos, activo);
  pintarPie(datos);
  return datos;
}

// ---------- Liturgia del día ----------
function pascua(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mes - 1, dia);
}
const sumar = (f, n) => new Date(f.getFullYear(), f.getMonth(), f.getDate() + n);
function primerDomingoAdviento(y) {
  const nav = new Date(y, 11, 25);
  const domAntes = sumar(nav, -(nav.getDay() || 7));
  return sumar(domAntes, -21);
}
function bautismoSenor(y) {
  // En Colombia la Epifanía se celebra el domingo entre el 2 y el 8 de enero.
  let epi = new Date(y, 0, 2); while (epi.getDay() !== 0) epi = sumar(epi, 1);
  return epi.getDate() >= 7 ? sumar(epi, 1) : sumar(epi, 7);
}
export function tiempoLiturgico(f = new Date()) {
  const d = new Date(f.getFullYear(), f.getMonth(), f.getDate()), y = d.getFullYear();
  const p = pascua(y), ceniza = sumar(p, -46), ramos = sumar(p, -7), pente = sumar(p, 49);
  const adv = primerDomingoAdviento(y), bau = bautismoSenor(y);
  if (+d === +pente) return { nombre: 'Domingo de Pentecostés', color: 'rojo' };
  if (+d === +sumar(p, -2)) return { nombre: 'Viernes Santo de la Pasión del Señor', color: 'rojo' };
  if (+d === +ramos) return { nombre: 'Domingo de Ramos de la Pasión del Señor', color: 'rojo' };
  if (+d === +ceniza) return { nombre: 'Miércoles de Ceniza', color: 'morado' };
  if (d <= bau || d >= new Date(y, 11, 25)) return { nombre: 'Tiempo de Navidad', color: 'blanco' };
  if (d >= adv) return { nombre: 'Tiempo de Adviento', color: 'morado' };
  if (d > ramos && d < p) return { nombre: 'Semana Santa', color: 'morado' };
  if (d >= ceniza && d < p) return { nombre: 'Tiempo de Cuaresma', color: 'morado' };
  if (d >= p && d < pente) return { nombre: 'Tiempo de Pascua', color: 'blanco' };
  return { nombre: 'Tiempo Ordinario', color: 'verde' };
}
export const COLORES_LITURGICOS = { verde: '#2F7A3E', blanco: '#FFFFFF', rojo: '#B3261E', morado: '#5B2A86', rosado: '#E6A3C0', dorado: '#C9A84C' };
function colorDeTexto(t) {
  const s = (t || '').toLowerCase();
  for (const k of Object.keys(COLORES_LITURGICOS)) if (s.includes(k)) return k;
  if (s.includes('púrpura') || s.includes('purpura') || s.includes('violet')) return 'morado';
  if (s.includes('green')) return 'verde';
  if (s.includes('white')) return 'blanco';
  if (s.includes('red')) return 'rojo';
  if (s.includes('violet') || s.includes('purple')) return 'morado';
  return '';
}
// Lee un archivo .ics (por ejemplo, el calendario litúrgico de Colombia de GCatholic subido a "archivos/").
async function liturgiaDesdeIcs(url, fecha) {
  const resp = await fetch(url, { cache: 'force-cache' });
  if (!resp.ok) return null;
  const txt = (await resp.text()).replace(/\r?\n[ \t]/g, '');
  const clave = hoyISO(fecha).replace(/-/g, '');
  const eventos = txt.split('BEGIN:VEVENT').slice(1);
  for (const ev of eventos) {
    const ini = (ev.match(/DTSTART[^:\n]*:(\d{8})/) || [])[1];
    if (ini !== clave) continue;
    const campo = (n) => ((ev.match(new RegExp('\\n' + n + '[^:\\n]*:(.*)')) || [])[1] || '').replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
    const nombre = campo('SUMMARY');
    const color = colorDeTexto(campo('COLOR') || campo('CATEGORIES') || campo('DESCRIPTION') || nombre);
    if (nombre) return { nombre, color };
  }
  return null;
}
export async function liturgiaDeHoy(config, fecha = new Date()) {
  const h = config.hoy || {};
  const base = tiempoLiturgico(fecha);
  if (h.liturgiaManual) return { nombre: h.liturgiaManual, color: h.colorManual || base.color };
  const ics = urlSegura(h.calendarioIcs);
  if (ics) {
    try { const r = await liturgiaDesdeIcs(ics, fecha); if (r) return { nombre: r.nombre, color: r.color || base.color }; }
    catch (e) { console.warn('Calendario litúrgico no disponible', e); }
  }
  return base;
}

export function diaDelAno(f = new Date()) {
  return Math.floor((new Date(f.getFullYear(), f.getMonth(), f.getDate()) - new Date(f.getFullYear(), 0, 0)) / 86400000);
}
