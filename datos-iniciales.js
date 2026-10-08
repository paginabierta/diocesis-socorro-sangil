// =========================================================
// Datos iniciales del sitio.
// Se usan (1) para el modo demostración, antes de conectar Firebase,
// y (2) para cargar la base de datos la primera vez desde el panel
// (pestaña "Respaldo" → "Cargar datos iniciales").
// Parroquias, sacerdotes y decretos se tomaron del sitio anterior
// (octubre de 2026): conviene revisarlos uno por uno.
// =========================================================

export const CONFIG_INICIAL = {
  nombre: 'Diócesis de Socorro y San Gil',
  lema: 'Iglesia que peregrina en el sur de Santander',
  logo: '',
  favicon: '',
  colores: {
    primario: '#6B0F3A',
    primarioOscuro: '#4A0A28',
    acento: '#B8923A',
    fondo: '#FBF9F6',
    texto: '#221C1F',
    escucha: '#1A2D6B',
    pie: '#2A0718'
  },
  fuentes: { titulos: 'Source Serif 4', cuerpo: 'Public Sans' },
  textos: {
    portadaEtiqueta: '54 parroquias · un solo pueblo',
    portadaTitulo: 'Una Iglesia que camina con su gente',
    portadaTexto: 'Hacia una Diócesis con estilo sinodal, que se reencuentra con la misión. Encuentra tu parroquia, la misa más cercana y lo que necesitas para vivir los sacramentos.',
    portadaImagen: '',
    buscadorTitulo: '¿Dónde hay misa?',
    yoQuieroTitulo: 'Yo quiero…',
    yoQuieroTexto: 'Lo que más nos preguntan, resuelto en un solo lugar.',
    actualidadTitulo: 'Actualidad',
    agendaTitulo: 'Agenda diocesana',
    documentosTitulo: 'Decretos y comunicados',
    documentosTexto: 'Archivo oficial de la Curia diocesana.',
    escuchaEtiqueta: 'Cultura del cuidado',
    escuchaTitulo: 'No estás solo',
    escuchaTexto: 'Si atraviesas un momento difícil, la Iglesia quiere escucharte sin juzgar. Ofrecemos acompañamiento espiritual y orientación, y la Oficina de Acogida, Escucha y Acompañamiento para casos de abuso o vulneración.',
    escuchaBoton1: 'Quiero hablar con alguien',
    escuchaEnlace1: 'pagina.html?id=ser-escuchado',
    escuchaBoton2: 'Protocolo y Oficina de Acogida',
    escuchaEnlace2: 'pagina.html?id=cultura-del-cuidado',
    appTitulo: 'Lleva la Diócesis en tu bolsillo',
    appTexto: 'Ordo y lecturas, Liturgia de las Horas, directorio de sacerdotes y parroquias, y lo que pasa hoy en la Diócesis.',
    appBoton: 'Descargar en Google Play'
  },
  hoy: {
    liturgiaManual: '',
    colorManual: '',
    calendarioIcs: '',
    lecturasEnlace: 'https://www.dominicos.org/predicacion/evangelio-del-dia/hoy/',
    intencionPapa: 'Por la pastoral de la salud mental',
    intencionPapaEnlace: '',
    cafeTitulo: 'El Café Espiritual',
    cafeEnlace: '',
    oracionParroquia: true
  },
  contacto: {
    telefonos: '607 724 2205 · 607 698 5317',
    whatsapp: '573202477708',
    correo: 'socorrodioc@cec.org.co',
    direccion: '',
    horario: 'Lunes: 8:45 a. m. – 12:00 m. y 2:00 – 5:00 p. m.\nMartes a viernes: 7:30 a. m. – 12:00 m. y 2:00 – 5:00 p. m.\nSábados, domingos y festivos: no hay atención.'
  },
  redes: {
    facebook: 'https://www.facebook.com/Diocesissocorroysangil/',
    instagram: 'https://www.instagram.com/diocesis_socorroysangil/',
    tiktok: 'https://www.tiktok.com/@diocesissocorroysangil',
    x: 'https://x.com/dioc_socysangil',
    youtube: 'https://www.youtube.com/@VicariadeSanGil'
  },
  enlaces: { app: '', radio: '', privacidad: '', calendarioPublico: '' },
  secciones: { hoy: true, yoQuiero: true, actualidad: true, agenda: true, documentos: true, escucha: true, app: true },
  pieEnlaces: 'Santa Sede | https://www.vatican.va\nConferencia Episcopal de Colombia | https://www.cec.org.co\nSEPAS San Gil | https://sepassangil.org\nInstituto del Páramo | https://institutoparamo.com/',
  seoDescripcion: 'Somos la Iglesia que peregrina en la Diócesis de Socorro y San Gil. Aquí encontrarás información de las parroquias y toda la dinámica pastoral.',
  archivos: { usuario: '', repositorio: '', rama: 'main', carpeta: 'archivos' }
};

// ---------- Parroquias ----------
function P(municipio, titular, parroco = '', extra = {}) {
  const id = (municipio + '-' + titular)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/nuestra senora/g, 'ns').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id, nombre: 'Parroquia ' + titular, municipio, parroco,
    descripcion: '', foto: '', direccion: '', telefono: '', whatsapp: '', correo: '', facebook: '',
    lat: '', lng: '', fiesta: '', veredas: '', despacho: '', misas: [], activa: true, ...extra
  };
}

export const PARROQUIAS_INICIALES = [
  P('Aratoca', 'Nuestra Señora de las Nieves', 'Gerardo Calderón Velandia'),
  P('Barichara', 'Inmaculada Concepción', 'Alirio Ardila Buenahora'),
  P('Cabrera', 'Inmaculada Concepción', 'Fernando León Cáceres'),
  P('Charalá', 'Nuestra Señora de Monguí', 'Pedro José García Puentes'),
  P('Chima', 'Inmaculada Concepción', 'Helí Burgos Ortega'),
  P('Cincelada', 'Nuestra Señora de los Dolores', 'Albeiro Cordero Figueroa'),
  P('Confines', 'Nuestra Señora de Chiquinquirá', 'José Manuel Pinzón Vega'),
  P('Contratación', 'María Auxiliadora', 'Cristian Julio Sánchez Moreno, SDB'),
  P('Coromoro', 'Nuestra Señora de las Mercedes', 'Yeison Saul Barragán'),
  P('Curití', 'San Joaquín', 'Juan Ignacio Macías Plata'),
  P('El Guacamayo', 'San Juan Bautista', 'Omar Fabián Carreño Díaz'),
  P('Encino', 'Inmaculada Concepción', ''),
  P('El Palmar', 'Nuestra Señora de los Dolores', 'José Ricardo Ballén Vanegas'),
  P('Socorro', 'Nuestra Señora del Socorro', 'Juan Carlos Hernández Pinzón', { nombre: 'Concatedral Basílica Nuestra Señora del Socorro' }),
  P('Socorro', 'Nuestra Señora de Chiquinquirá', 'Cristyan Fabián Gómez Chacón'),
  P('Socorro', 'Santa Bárbara', 'Luis Osney Gómez Mejía'),
  P('Socorro', 'María Auxiliadora', 'Fredy Orlando Aparicio Reyes'),
  P('Galán', 'San José', 'Luis Fernando Alarcón Rodríguez'),
  P('Gámbita', 'Santa Bárbara', 'Luis Morales Suárez'),
  P('Guadalupe', 'Nuestra Señora de Guadalupe', 'Juan Camilo Mejía Carreño'),
  P('Guane', 'San Isidro', 'Alcides González Porras'),
  P('Guapotá', 'San Cayetano', 'Ricardo Vargas Vargas'),
  P('Hato', 'Inmaculada Concepción', 'José Alexis Carreño Silva'),
  P('Jordán', 'San José', 'Diego Fernando Benavides Aparicio'),
  P('La Palma (Gámbita)', 'Nuestra Señora de Fátima', 'Pedro Samuel León Amaya'),
  P('La Fuente', 'Sagrado Corazón de Jesús', 'Rafael Ricardo Carreño Ballesteros'),
  P('Mogotes', 'Santa Bárbara', 'Juan de Jesús Estévez Velandia'),
  P('Ocamonte', 'San Vicente Ferrer', 'José Antonio Almeida'),
  P('Oiba', 'San Miguel Arcángel', 'Luis Alberto Rivera Hernández'),
  P('Olival', 'San Rafael Arcángel', 'Wilman Enrique Barragán Flórez'),
  P('Onzaga', 'Inmaculada Concepción', 'Ciprián Cáceres Velandia'),
  P('Palmas del Socorro', 'Inmaculada Concepción', 'Luis Alcides Higuera Tamayo'),
  P('Páramo', 'Nuestra Señora del Rosario de Chiquinquirá', 'Eduardo Bohórquez Orduz'),
  P('Pinchote', 'San Antonio de Padua', 'Eliécer Delgado Pico'),
  P('Pitiguao', 'Santo Cura de Ars', 'Fabián Aníbal López Castillo'),
  P('Riachuelo', 'Nuestra Señora del Rosario', 'Víctor Alfonso Fonseca Hernández'),
  P('San Gil', 'Santa Cruz', 'Eugenio Pelayo Rueda', { nombre: 'Catedral Santa Cruz' }),
  P('San Gil', 'Cristo Resucitado', 'Juan Carlos Fuentes Ortiz'),
  P('San Gil', 'Divina Misericordia', 'Carlos Andrés Díaz Velasco'),
  P('San Gil', 'Divino Niño', 'Gonzalo Córdoba Vega'),
  P('San Gil', 'María Auxiliadora', 'José Isidro Tarazona Duarte'),
  P('San Gil', 'Sagrada Familia', 'Juan José Rodríguez Noriega'),
  P('San Gil', 'San Juan de Dios', 'Elver Pico Hernández'),
  P('San Gil', 'San Judas Tadeo', 'Róbinson Poveda Rivera'),
  P('San Gil', 'San Martín de Porres', 'Nicolás Toro Rodríguez'),
  P('San Gil', 'San Pablo Apóstol', 'Eligio Beltrán Castro'),
  P('San Joaquín', 'San Joaquín', ''),
  P('San José de Suaita', 'San José', ''),
  P('Simacota', 'Santa Bárbara', 'Alfonso Muñoz Muñoz'),
  P('Suaita', 'Nuestra Señora de la Candelaria', 'Hernando Pimiento Mantilla'),
  P('Vado Real (Suaita)', 'San Pedro Apóstol', 'Herwin Danilo Almeida González', {
    descripcion: 'Comunidad campesina de unos 2.300 fieles en el casco urbano y 6 veredas.',
    fiesta: 'San Pedro y San Pablo · 29 de junio'
  }),
  P('Valle de San José', 'Nuestra Señora de la Purificación', 'Isaías Silva Cárdenas'),
  P('Villanueva', 'San Luis Gonzaga', 'Miguel Ángel Jerez Cifuentes'),
  P('Zapatoca', 'San Joaquín', 'Ángel de Jesús Fonseca Useda')
].map((p, i) => ({ ...p, orden: i + 1 }));

// ---------- Sacerdotes (directorio del sitio anterior) ----------
const S = (nombre, cargo = '', municipio = '') => ({ nombre, cargo, municipio, foto: '', visible: true });
export const SACERDOTES_INICIALES = [
  S('Albeiro Cordero Figueroa', 'Párroco de Cincelada', 'Cincelada'),
  S('Alcides González Porras', 'Párroco de Guane', 'Guane'),
  S('Alfonso Muñoz Muñoz', 'Párroco de Simacota', 'Simacota'),
  S('Alfredo Mogollón Afanador', 'Vicario parroquial de Charalá', 'Charalá'),
  S('Alirio Ardila Buenahora', 'Párroco de Barichara', 'Barichara'),
  S('Álvaro Romero Rueda', 'Adscrito a Curití', 'Curití'),
  S('Álvaro Velandia Rodríguez', 'Sacerdote emérito', 'San Gil'),
  S('Ánderson Yezid Calderón Pérez', 'Vicario parroquial de Onzaga', 'Onzaga'),
  S('Ángel de Jesús Fonseca Useda', 'Párroco de Zapatoca', 'Zapatoca'),
  S('Ángel Miguel Porras Porras', 'Sacerdote emérito'),
  S('Ángel Ramón Castañeda Durán'),
  S('Ángel Yesid López Medina', 'Servicio misionero en Bogotá'),
  S('Ariel Fernando Pico Rincón', 'Vicario parroquial de Barichara', 'Barichara'),
  S('Arnulfo Carreño Sarmiento', 'Sacerdote emérito'),
  S('Arnulfo Rueda Quintero', 'Foyer de Charité San Pablo, Bucaramanga'),
  S('Carlos Alberto Sanabria Durán', 'Vicario parroquial de Zapatoca', 'Zapatoca'),
  S('Carlos Andrés Díaz Velasco', 'Párroco de la Divina Misericordia', 'San Gil'),
  S('Carlos Andrés Neira Triana', 'Vicario parroquial de la Catedral', 'San Gil'),
  S('Carlos Arturo León Piñeros', 'Adscrito a la parroquia Nuestra Señora de Chiquinquirá', 'Páramo'),
  S('Cecilio Alfonso Prada', 'Sacerdote emérito'),
  S('Ciprián Cáceres Velandia', 'Párroco de Onzaga', 'Onzaga'),
  S('Ciro Octavio Sierra Arias', 'Servicio misionero en Estados Unidos'),
  S('Cristian Julio Sánchez Moreno, SDB', 'Párroco de Contratación', 'Contratación'),
  S('Cristyan Fabián Gómez Chacón', 'Párroco de Nuestra Señora de Chiquinquirá', 'Socorro'),
  S('Daniel Carreño Sarmiento', 'Sacerdote emérito'),
  S('Didier Vargas Satova', 'Servicio misionero en Vélez'),
  S('Diego Fernando Benavides Aparicio', 'Párroco de Jordán', 'Jordán'),
  S('Edgar Jerez Cifuentes'),
  S('Edinson Páez Sarmiento', 'Formador del Seminario'),
  S('Eduardo Bohórquez Orduz', 'Párroco del Páramo', 'Páramo'),
  S('Edwin Ricardo Garavito Ochoa', 'Estudiante en Roma'),
  S('Eliécer Delgado Pico', 'Párroco de Pinchote', 'Pinchote'),
  S('Eligio Beltrán Castro', 'Párroco de San Pablo; capellán de UNISANGIL', 'San Gil'),
  S('Elver Pico Hernández', 'Párroco de San Juan de Dios', 'San Gil'),
  S('Eugenio Pelayo Rueda', 'Párroco de la Catedral', 'San Gil'),
  S('Fabián Aníbal López Castillo', 'Párroco de Pitiguao', 'Pitiguao'),
  S('Feisal Eduardo Rueda Barragán', 'Vicario parroquial de Oiba', 'Oiba'),
  S('Fernando Ballesteros Chaparro', 'Vicario parroquial de la Concatedral', 'Socorro'),
  S('Fernando León Cáceres', 'Párroco de Cabrera', 'Cabrera'),
  S('Fredy Orlando Aparicio Reyes', 'Párroco de María Auxiliadora', 'Socorro'),
  S('Gabriel Francisco Vargas Barragán'),
  S('Gerardo Calderón Velandia', 'Párroco de Aratoca', 'Aratoca'),
  S('Gerardo Rojas Rueda', 'Sacerdote emérito'),
  S('Gilberto Bautista Useda'),
  S('Gonzalo Córdoba Vega', 'Párroco del Divino Niño', 'San Gil'),
  S('Helí Burgos Ortega', 'Párroco de Chima', 'Chima'),
  S('Hermógenes Arciniegas Barrera', 'Sacerdote emérito'),
  S('Hernando Pimiento Mantilla', 'Párroco de Suaita', 'Suaita'),
  S('Herwin Danilo Almeida González', 'Párroco de Vado Real', 'Vado Real'),
  S('Hugo Pico Reyes', 'Formador del Seminario'),
  S('Isaías Silva Cárdenas', 'Párroco del Valle de San José', 'Valle de San José'),
  S('Ismael Becerra Gutiérrez', 'Barrancabermeja'),
  S('Jaime Bueno Quintero'),
  S('Jaime Vargas Ruiz'),
  S('Jesús Aurelio Gómez Chaparro', 'Párroco de San José de Suaita', 'San José de Suaita'),
  S('José Alexis Carreño Silva', 'Párroco de El Hato', 'Hato'),
  S('José Antonio Almeida', 'Párroco de Ocamonte', 'Ocamonte'),
  S('José Antonio Díaz Gómez', 'Sacerdote emérito'),
  S('José Gabino Pinzón Sierra', 'Sacerdote emérito'),
  S('José Héctor Consuegra Pérez', 'Misionero en Ecuador'),
  S('José Isidro Tarazona Duarte', 'Párroco de María Auxiliadora', 'San Gil'),
  S('José Manuel Pinzón Vega', 'Párroco de Confines', 'Confines'),
  S('José Ricardo Ballén Vanegas', 'Párroco de El Palmar', 'El Palmar'),
  S('José Vicente Cabanzo Hernández', 'Sacerdote emérito'),
  S('Juan Camilo Mejía Carreño', 'Párroco de Guadalupe', 'Guadalupe'),
  S('Juan Carlos Fuentes Ortiz', 'Párroco de Cristo Resucitado', 'San Gil'),
  S('Juan Carlos Hernández Pinzón', 'Vicario General; párroco de la Concatedral Basílica Nuestra Señora del Socorro', 'Socorro'),
  S('Juan de Jesús Estévez Velandia', 'Párroco de Mogotes', 'Mogotes'),
  S('Juan Ignacio Macías Plata', 'Párroco de Curití', 'Curití'),
  S('Juan José Rodríguez Noriega', 'Párroco de la Sagrada Familia', 'San Gil'),
  S('Juvenal Landínez Porras', 'Capellán del hospital', 'Socorro'),
  S('Leonardo Camacho Murillo', 'Formador del Seminario'),
  S('Luis Abelardo Rojas Sánchez', 'Vicario parroquial de Aratoca', 'Aratoca'),
  S('Luis Alberto Rivera Hernández', 'Párroco de Oiba', 'Oiba'),
  S('Luis Alcides Higuera Tamayo', 'Párroco de Palmas del Socorro', 'Palmas del Socorro'),
  S('Luis Eduardo Velandia Rodríguez', 'Sacerdote emérito'),
  S('Luis Felipe Rodríguez Garnica', 'Misionero en Puerto Rico'),
  S('Luis Fernando Alarcón Rodríguez', 'Párroco de Galán', 'Galán'),
  S('Luis Gonzalo Riaño Olarte', 'Sacerdote emérito'),
  S('Luis Jesús Ayala Gómez', 'Capellán del Batallón de Artillería n.º 5 Cap. José Antonio Galán'),
  S('Luis Morales Suárez', 'Párroco de Gámbita', 'Gámbita'),
  S('Luis Osney Gómez Mejía', 'Párroco de Santa Bárbara', 'Socorro'),
  S('Manuel Andrés Ardila Rodríguez'),
  S('Marco Aurelio Bermúdez Quintero', 'Rector del Seminario Conciliar San Carlos Borromeo', 'San Gil'),
  S('Mario Aparicio Blanco', 'Vicario parroquial de Cristo Resucitado', 'San Gil'),
  S('Medardo Murillo Tirado', 'Adscrito a Oiba', 'Oiba'),
  S('Miguel Ángel Jerez Cifuentes', 'Párroco de Villanueva', 'Villanueva'),
  S('Moisés Carreño Cardozo', 'Capellán del Parque Cementerio Valle de la Esperanza'),
  S('Nelson de Jesús Quinchía Franco', 'Servicio misionero en Popayán'),
  S('Néstor Fernando Plata Ferreira', 'Vicario de Evangelización y Vicario Episcopal de San Gil; responsable de Comunicaciones', 'San Gil'),
  S('Néstor Javier Ariza Flórez', 'Vicario parroquial de María Auxiliadora', 'San Gil'),
  S('Nicolás Toro Rodríguez', 'Párroco de San Martín de Porres; capellán de la cárcel', 'San Gil'),
  S('Octavio Arias Arias', 'Sacerdote emérito'),
  S('Omar Fabián Carreño Díaz', 'Párroco de El Guacamayo', 'El Guacamayo'),
  S('Óscar Argüello Gómez', 'Vicario de Administración; moderador de la Curia'),
  S('Óscar Javier Pimiento Quintero', 'Estudiante en Roma'),
  S('Óscar Ramiro Vivas Tristancho', 'Director de la Casa de Encuentros La Anunciación; Pastoral Juvenil y Vocacional', 'San Gil'),
  S('Pablo Emilio Silva Murillo', 'Servicio misionero en Bogotá'),
  S('Pedro Elías Martínez Plata', 'Sacerdote emérito'),
  S('Pedro Figueroa Argüello'),
  S('Pedro José García Puentes', 'Párroco de Charalá', 'Charalá'),
  S('Pedro Samuel León Amaya', 'Párroco de La Palma', 'Gámbita'),
  S('Rafael Rangel Hernández', 'Sacerdote emérito'),
  S('Rafael Ricardo Carreño Ballesteros', 'Párroco de La Fuente', 'La Fuente'),
  S('Ramón Bueno Ballesteros', 'Vicario Judicial y director del Tribunal Eclesiástico'),
  S('Ricardo Ortiz Angarita', 'Vicario Episcopal del Socorro', 'Socorro'),
  S('Ricardo Vargas Vargas', 'Párroco de Guapotá', 'Guapotá'),
  S('Richard Chaparro Afanador', '[Verificar cargo]'),
  S('Roberto Asdrúbal Arenas Díaz', 'Adscrito a la Catedral', 'San Gil'),
  S('Róbinson Poveda Rivera', 'Párroco de San Judas Tadeo; director del Banco Diocesano de Alimentos', 'San Gil'),
  S('Rodolfo González Ballesteros', 'Estados Unidos'),
  S('Ronald Ferney Ballesteros Salazar', 'Vicario parroquial de Curití', 'Curití'),
  S('Roque Julio García Gómez', 'Sacerdote emérito'),
  S('Salomón Pineda Martínez', 'Sacerdote emérito'),
  S('Samuel González Parra', 'Sacerdote emérito'),
  S('Tomás Augusto Villar Sarmiento'),
  S('Tulio Fernando Ortiz Buitrago', 'Vicario parroquial de Barichara', 'Barichara'),
  S('Ulises Estévez Naranjo'),
  S('Víctor Alfonso Fonseca Hernández', 'Párroco de Riachuelo', 'Riachuelo'),
  S('Víctor Aurelio Vargas Galán', 'Sacerdote emérito'),
  S('Wigberto Suárez Pardo', 'Sacerdote emérito'),
  S('William Ricardo Gómez Viscaya', 'Director de SEPAS', 'San Gil'),
  S('Wilman Enrique Barragán Flórez', 'Párroco de Olival', 'Olival'),
  S('Wilman Hernando Fonseca Pinto', 'Estudiante en Bogotá'),
  S('Yeison Saúl Barragán', 'Párroco de Coromoro', 'Coromoro'),
  S('Yesid Augusto Durán Castillo', 'Servicio misionero en Bogotá')
].map(s => ({ ...s, id: s.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));

// ---------- Páginas y trámites ----------
const pendiente = 'Información en recopilación. Mientras tanto, comunícate con el despacho de tu parroquia o con la Curia diocesana.';
function G(id, titulo, grupo, icono, resumen, contenido, extra = {}) {
  return { id, titulo, grupo, icono, resumen, contenido, imagen: '', enlace: '', enInicio: false, visible: true, ...extra };
}
export const PAGINAS_INICIALES = [
  G('bautismo', 'Bautizar a mi hijo', 'tramites', 'agua', 'Requisitos, charlas prebautismales y a quién acudir.', 'El bautismo se solicita en la parroquia donde vive la familia.\n\n' + pendiente, { enInicio: true }),
  G('matrimonio', 'Casarme por la Iglesia', 'tramites', 'anillos', 'Documentos, curso prematrimonial y tiempos.', 'Acércate con tiempo al despacho de la parroquia de la novia o del novio para iniciar el expediente matrimonial.\n\n' + pendiente, { enInicio: true }),
  G('partidas', 'Pedir una partida', 'tramites', 'documento', 'Bautismo, confirmación o matrimonio: cómo solicitarla.', 'Las partidas se expiden en la parroquia donde se celebró el sacramento, porque allí reposan los libros sacramentales.\n\n' + pendiente, { enInicio: true }),
  G('mi-parroquia', 'Encontrar mi parroquia', 'tramites', 'ubicacion', 'Párroco, horarios, WhatsApp y cómo llegar.', '', { enInicio: true, enlace: 'parroquias.html' }),
  G('intencion', 'Ofrecer una intención', 'tramites', 'vela', 'Por un difunto, en acción de gracias o por la salud.', 'Las intenciones de misa se piden directamente en el despacho de cada parroquia. En la ficha de tu parroquia encontrarás su WhatsApp.', { enInicio: true }),
  G('ser-escuchado', 'Necesito ser escuchado', 'tramites', 'escucha', 'Acompañamiento espiritual y orientación, sin costo.', 'Nadie debería atravesar solo un momento difícil. Puedes acercarte a tu párroco para una conversación de acompañamiento espiritual.\n\nTambién puedes contactar el Centro de Escucha Psicoespiritual de SEPAS: https://aquiteescuchamos.org\n\nSi estás en peligro o piensas en hacerte daño, llama a la Línea 106 o al 123.', { enInicio: true }),
  G('vocacion', 'Quiero ser sacerdote', 'tramites', 'cruz', 'Pastoral vocacional y el Seminario diocesano.', 'La Pastoral Juvenil y Vocacional acompaña a los jóvenes que sienten el llamado. El Seminario Conciliar San Carlos Borromeo, en San Gil, forma a los futuros sacerdotes de la Diócesis.\n\n' + pendiente, { enInicio: true }),
  G('casa-de-encuentros', 'Reservar la Casa de Encuentros', 'instituciones', 'casa', 'Retiros, convivencias y jornadas pastorales.', 'La Casa de Encuentros La Anunciación recibe retiros, convivencias y jornadas pastorales.\n\n' + pendiente, { enInicio: true }),
  G('quienes-somos', 'Quiénes somos', 'diocesis', 'cruz', 'Historia y territorio de la Diócesis.', pendiente),
  G('obispo', 'Obispo', 'diocesis', 'cruz', 'Nuestro pastor diocesano.', pendiente),
  G('curia', 'Curia diocesana', 'diocesis', 'documento', 'Vicarías y oficinas de la Curia.', '**Vicario General:** Pbro. Juan Carlos Hernández Pinzón\n**Vicario de Administración y moderador de la Curia:** Pbro. Óscar Argüello Gómez\n**Vicario de Evangelización:** Pbro. Néstor Fernando Plata Ferreira\n**Vicario Judicial:** Pbro. Ramón Bueno Ballesteros'),
  G('cancilleria', 'Cancillería', 'diocesis', 'documento', 'Trámites ante la Cancillería diocesana.', pendiente),
  G('tribunal', 'Tribunal Eclesiástico', 'diocesis', 'documento', 'Procesos de nulidad y atención prejudicial.', 'El Tribunal Eclesiástico diocesano cuenta con una Sala de Atención Prejudicial (Decreto 077 de 2026) para orientar a quienes desean conocer su situación antes de iniciar un proceso.\n\n' + pendiente),
  G('plan-diocesano', 'Plan Diocesano (PDRE)', 'diocesis', 'documento', 'Plan Diocesano de Renovación y Evangelización.', pendiente),
  G('cementerio-san-gil', 'Cementerio San Gil', 'instituciones', 'casa', 'Información y servicios del cementerio.', pendiente),
  G('cultura-del-cuidado', 'Cultura del Cuidado', 'instituciones', 'escucha', 'Protocolo y Oficina de Acogida, Escucha y Acompañamiento.', 'La Diócesis cuenta con un Protocolo para la Promoción de la Cultura del Cuidado, Prevención, Detección y Actuación en caso de abuso o violencia sexual a menores y adultos vulnerables, y con una Oficina de Acogida, Escucha y Acompañamiento.\n\n' + pendiente),
  G('instituto-del-paramo', 'Instituto del Páramo', 'instituciones', 'casa', 'Institución educativa diocesana.', '', { enlace: 'https://institutoparamo.com/' })
].map((p, i) => ({ ...p, orden: i + 1 }));

// ---------- Noticias ----------
export const NOTICIAS_INICIALES = [
  {
    id: 'nuevo-nuncio-accattino', titulo: 'Monseñor Angelo Accattino, nuevo Nuncio Apostólico en Colombia',
    categoria: 'universal', fecha: '2026-08-15', imagen: '', destacada: true, visible: true,
    resumen: 'La Santa Sede oficializó el nombramiento del arzobispo titular de Sabiona como representante del papa León XIV en Colombia.',
    contenido: 'La Santa Sede oficializó el 15 de agosto de 2026 el nombramiento de monseñor Angelo Accattino, arzobispo titular de Sabiona, como nuevo Nuncio Apostólico en Colombia, por disposición del papa León XIV.\n\nMonseñor Accattino nació en Asti (Italia) en 1966, es doctor en Derecho Canónico y conoce nuestro país, donde sirvió en sus primeros años en el servicio diplomático de la Santa Sede. Sucede a monseñor Paolo Rudelli.\n\nDesde la Diócesis de Socorro y San Gil nos unimos a la Iglesia en Colombia para recibir con alegría al nuevo representante del Santo Padre y encomendamos su misión a la intercesión de la Santísima Virgen María.'
  },
  {
    id: 'magnifica-humanitas', titulo: 'Magnifica Humanitas: la primera encíclica de León XIV',
    categoria: 'universal', fecha: '2026-06-01', imagen: '', destacada: false, visible: true,
    resumen: 'Sobre la custodia de la persona humana en el tiempo de la inteligencia artificial.',
    contenido: 'La encíclica Magnifica Humanitas ofrece una mirada sobre nuestro tiempo y muestra que las tecnologías emergentes pueden ser aliadas de la dignidad humana cuando se orientan al bien común.\n\n[Agregar aquí el enlace al documento completo]'
  }
];

// ---------- Agenda ----------
export const EVENTOS_INICIALES = [
  { id: 'domund-2026', titulo: 'Domingo Mundial de las Misiones', fecha: '2026-10-18', detalle: 'Colecta del Domund en todas las parroquias', lugar: '' },
  { id: 'todos-santos-2026', titulo: 'Solemnidad de Todos los Santos', fecha: '2026-11-01', detalle: '', lugar: '' },
  { id: 'difuntos-2026', titulo: 'Conmemoración de los fieles difuntos', fecha: '2026-11-02', detalle: 'Horarios especiales en los cementerios', lugar: '' }
];

// ---------- Documentos (enlaces del sitio anterior; conviene volver a subirlos) ----------
const W = 'https://img1.wsimg.com/blobby/go/75c66f7a-a7f3-4a59-88f7-2c4b59b3beed/downloads/';
export const DOCUMENTOS_INICIALES = [
  { id: 'decreto-003-2026', tipo: 'Decreto', numero: '003', asunto: 'Nombramientos', fecha: '2026-07-24', url: W + '84d49d3c-1d7d-4d81-8b6f-b4238f2e02c4/NOMBRAMIENTOS.%20DECRETO%20003.%2024.07.2026.pdf?ver=1790953901359' },
  { id: 'decreto-079-2026', tipo: 'Decreto', numero: '079', asunto: 'Nombramiento del coordinador del proyecto Banco de Alimentos', fecha: '2026-04-16', url: W + '8e76db49-d153-435e-8b2f-fd63a1d44109/DECRETO%20079.%2016.04.2026.%20NOMBRAMIENTO%20COORDINA.pdf?ver=1790953901360' },
  { id: 'decreto-078-2026', tipo: 'Decreto', numero: '078', asunto: 'Nombramiento del P. Roberto Asdrúbal Arenas Díaz, adscrito a la parroquia Santa Cruz', fecha: '2026-04-16', url: W + 'f6603e31-1933-49db-9de4-51ee7ba1b116/DECRETO%20078.%2016.04.2026.%20NOMBRAMIENTO%20%20P.%20ROBE.pdf?ver=1790953901360' },
  { id: 'decreto-077-2026', tipo: 'Decreto', numero: '077', asunto: 'Creación de la Sala de Atención Prejudicial del Tribunal Eclesiástico diocesano', fecha: '2026-04-10', url: W + '2486a787-2564-44d6-9d34-81f21ca9d8e4/DECRETO%20077.%2010.04.2026.%20CREACION%20SALA%20DE%20ATEC.pdf?ver=1790953901360' },
  { id: 'decreto-076-2026', tipo: 'Decreto', numero: '076', asunto: 'Nombramiento de confesores extraordinarios del Monasterio del Socorro', fecha: '2026-04-07', url: W + '0d734340-ad37-4910-a474-fc29e7353fa8/DECRETO%20076.%2007.04.2026.%20NOMBRAMIENTO%20CONFESOR.pdf?ver=1790953901360' },
  { id: 'decreto-075-2026', tipo: 'Decreto', numero: '075', asunto: 'Nombramiento del P. Pedro Figueroa Argüello', fecha: '2026-03-30', url: W + '4b14b67b-022b-46e7-be1c-a3ae7bab05fb/DECRETO%20075.%2030.03.2026.%20NOMBRAMIENTO%20P.%20PEDRO.pdf?ver=1790953901360' },
  { id: 'decreto-074-2026', tipo: 'Decreto', numero: '074', asunto: 'Nombramiento de delegados episcopales', fecha: '2026-02-24', url: W + '380f47f9-e960-4d5d-bacc-5f891428ee4d/DECRETO%20074.%2024.02.2026.%20NOMBRAMIENTO%20DELEGADO.pdf?ver=1790953901360' },
  { id: 'decreto-071-2025', tipo: 'Decreto', numero: '071', asunto: 'Nombramientos', fecha: '2025-12-17', url: W + '3d22b20d-e301-4a36-b74a-cca78332dbf5/NOMBRAMIENTOS.%20DECRETO%20071.%2017.12.2025%20(1).pdf?ver=1790953901360' },
  { id: 'decreto-065-2025', tipo: 'Decreto', numero: '065', asunto: 'Nombramientos', fecha: '2025-07-04', url: W + '60e1acd8-33fc-4b07-8c7b-a92451585726/DECRETO%20065%20DEL%2004.07.2025.pdf?ver=1790953901360' },
  { id: 'circular-libros-sacramentales', tipo: 'Circular', numero: '', asunto: 'Acceso a los libros sacramentales', fecha: '', url: W + 'a654d530-bda5-4215-95dc-f300143d7980/CIRCULAR%20ACCESO%20A%20LOS%20LIBROS%20SACRAMENTALES.pdf?ver=1790953901360' },
  { id: 'circular-cementerios-desaparecidos', tipo: 'Circular', numero: '', asunto: 'Cementerios: búsqueda de personas desaparecidas', fecha: '', url: W + '99a9cab9-e639-457e-ae82-f36adaa82b6c/CIRCULAR%20EPISCOPAL.%20ASUNTO%20CEMENTERIOS.%20BUSQUE.pdf?ver=1790953901360' }
];
