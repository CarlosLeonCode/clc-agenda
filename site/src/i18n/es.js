// Spanish copy (the original site). Strings with markup are rendered with set:html.

const INSTALL_STEPS = [
  { name: 'Descarga el archivo', text: 'Descarga clc-agenda.zip desde la guía. Suele guardarse en la carpeta Descargas.' },
  { name: 'Descomprímelo y guarda la carpeta', text: 'En Windows, clic derecho y «Extraer todo»; en Mac, doble clic. Guarda la carpeta clc-agenda en un lugar donde no la borres, como Documentos.' },
  { name: 'Abre la página de extensiones', text: 'Escribe o pega chrome://extensions en la barra de direcciones y presiona Enter (brave://, edge:// u opera://extensions en otros navegadores).' },
  { name: 'Activa el «Modo de desarrollador»', text: 'Activa el interruptor «Modo de desarrollador», arriba a la derecha de la página de extensiones.' },
  { name: 'Toca «Cargar descomprimida»', text: 'Toca «Cargar descomprimida» («Load unpacked» en inglés) y elige la carpeta clc-agenda.' },
  { name: 'Fija el ícono en la barra', text: 'Toca la pieza de rompecabezas de la barra del navegador y el pin junto a CLC Agenda.' },
  { name: 'Abre WhatsApp Web', text: 'Entra a web.whatsapp.com e inicia sesión. Abajo a la derecha aparece el botón «Extraer contactos».' }
];

const FAQ = [
  {
    q: '¿Cómo exportar los contactos de un grupo de WhatsApp?',
    a: 'Abre WhatsApp Web con CLC Agenda instalada, toca «Extraer contactos» y elige el grupo de la lista. Verás a todos sus miembros con nombre y número, listos para descargar en el formato que prefieras.'
  },
  {
    q: '¿Cómo pasar contactos de WhatsApp a Google Contacts?',
    a: 'Extrae los contactos y toca «Google Contacts»: se descarga un archivo CSV con las columnas que pide Google. Luego, en contacts.google.com, usa «Importar» y elige ese archivo.'
  },
  {
    q: '¿Puedo guardar en el celular los números que no tengo agendados?',
    a: 'Sí. Al extraer un grupo, toca el filtro «sin guardar» para quedarte solo con los números que no tienes en tu agenda. Después elige «Celular (.vcf)» y abre el archivo en tu teléfono para agregarlos.'
  },
  {
    q: '¿Se puede exportar a Excel?',
    a: 'Sí. En «Más» elige «Excel (CSV)»: el archivo se abre en Excel o Google Sheets con las columnas que elegiste.'
  },
  {
    q: '¿Mis contactos salen de mi computadora?',
    a: 'No. CLC Agenda lee los datos que WhatsApp Web ya tiene en tu navegador y arma el archivo ahí mismo. No hay servidores ni telemetría.'
  },
  {
    q: '¿Funciona con WhatsApp Business?',
    a: 'Sí. Además de grupos y chats, puedes sacar los contactos de cada etiqueta de WhatsApp Business.'
  },
  {
    q: '¿En qué navegadores funciona?',
    a: 'En navegadores basados en Chromium, versión 111 o superior: Chrome, Brave, Edge y Opera.'
  },
  {
    q: '¿Necesito crear una cuenta?',
    a: 'No. No hay registro ni inicio de sesión: instalas la extensión y la usas sobre WhatsApp Web.'
  },
  {
    q: '¿Qué permisos pide?',
    a: 'Solo acceso a web.whatsapp.com. No lee tu historial ni tus otras pestañas.'
  },
  {
    q: '¿Puedo revisar el código?',
    a: 'Sí. Es código abierto, con licencia MIT, y está publicado en GitHub.'
  }
];

export default {
  lang: 'es',
  ogLocale: 'es_419',
  routes: { home: '/', install: '/instalar' },
  ids: { how: 'como-funciona', formats: 'formatos', privacy: 'privacidad', faq: 'preguntas', step: 'paso' },
  meta: {
    // Titles lead with what people search; the brand closes them (≤ 60 characters)
    title: 'Exporta contactos de WhatsApp a Google Contacts | CLC Agenda',
    description: 'Exporta los contactos de WhatsApp Web (grupos, chats y etiquetas) a Google Contacts, al celular o a Excel. Código abierto: todo pasa en tu navegador.',
    ogImage: '/og.png',
    ogAlt: 'CLC Agenda: la ventana de la extensión sobre WhatsApp Web con los contactos de un grupo listos para exportar a Google Contacts.'
  },
  // Quotable on its own (search snippets and AI answers lift sentences like this one)
  definition: 'CLC Agenda es una extensión de código abierto para WhatsApp Web que exporta los contactos de tus grupos, chats y etiquetas a Google Contacts, al celular (vCard), a Excel (CSV) o a JSON. Todo pasa en tu navegador, sin copiar número por número.',
  skip: 'Saltar al contenido',
  nav: {
    homeLabel: 'CLC Agenda, ir al inicio',
    mainLabel: 'Principal',
    how: 'Cómo funciona',
    formats: 'Formatos',
    privacy: 'Privacidad',
    faq: 'Preguntas',
    install: 'Instalar',
    installLong: ' la extensión',
    languageLabel: 'Idioma'
  },
  hero: {
    eyebrow: 'Exporta contactos de WhatsApp Web',
    line1: 'Tu agenda,',
    hl1: 'fuera',
    middle: ' de ',
    hl2: 'WhatsApp.',
    cta: 'Instalar la extensión',
    ctaAlt: 'Ver cómo funciona',
    creditBy: 'Creado por',
    cursors: ['Ana · Ventas', 'Bruno · Comunidad', 'Tú'],
    chipUnsaved: 'sin guardar',
    video: 'clc-agenda',
    videoLabel: 'Video de 45 segundos sin audio: CLC Agenda saca los contactos de un grupo de WhatsApp Web, filtra a los que no tienes guardados y los exporta a Google Contacts o al celular.',
    pause: 'Pausar video',
    play: 'Reproducir video'
  },
  marquee: ['Grupos', 'Chats', 'Etiquetas', 'Google Contacts', 'Celular', 'Excel', 'JSON'],
  steps: {
    title1: 'Tres clics.',
    title2: 'Cero copiar y pegar.',
    items: [
      { title: 'Elige de dónde', text: 'Un grupo, una etiqueta de WhatsApp Business, tus chats o todos tus contactos.' },
      { title: 'Revisa quién falta', text: 'Ve quién ya está en tu agenda y filtra con un clic a los que no tienes guardados.' },
      { title: 'Guárdalos', text: 'Un archivo listo para Google Contacts o para la agenda de tu celular.' }
    ]
  },
  panels: {
    formatsTitle: 'Listos para importar',
    formats: [
      { name: 'Google Contacts', tag: 'CSV', note: 'Columnas exactas para importar en Google.' },
      { name: 'Celular', tag: '.vcf', note: 'vCard para la agenda de iPhone o Android.' },
      { name: 'Excel o Sheets', tag: 'CSV', note: 'Las columnas que elijas, para revisar.' },
      { name: 'Respaldo', tag: 'JSON', note: 'Para guardar o usar en otra herramienta.' }
    ],
    privacyTitle: 'Tus contactos no salen de tu navegador.',
    ticks: [
      'Sin servidores: todo se procesa en tu computadora.',
      'Sin permisos extra: solo accede a WhatsApp Web.',
      'Sin cuentas y sin telemetría.',
      'Código abierto, para que lo compruebes.'
    ]
  },
  faq: { title: 'Preguntas frecuentes', items: FAQ },
  finalCta: { title: 'Recupera tu agenda.', button: 'Instalar la extensión' },
  footer: { license: 'CLC Agenda · Código abierto, licencia MIT · ', notAffiliated: 'No está afiliada a WhatsApp ni a Meta.' },
  install: {
    title: 'Cómo instalar CLC Agenda en Chrome paso a paso',
    description: 'Instala CLC Agenda en tu navegador en 7 pasos simples, sin saber de tecnología: descarga, descomprime y carga la extensión en Chrome, Brave, Edge u Opera.',
    kicker: 'Guía de instalación',
    h1: 'Instala CLC Agenda en 7 pasos',
    lead: 'No necesitas saber de tecnología. Toma unos 3 minutos y funciona en Chrome, Brave, Edge y Opera.',
    steps: INSTALL_STEPS,
    download: 'Descargar CLC Agenda',
    body: {
      download: 'Toca el botón. Se descarga un archivo llamado <strong>clc-agenda.zip</strong>, normalmente en tu carpeta Descargas.',
      downloadHint: 'Archivo .zip de unos 35 KB. Siempre es la última versión.',
      unzip: '<strong>En Windows:</strong> haz clic derecho sobre el archivo y elige «Extraer todo». <strong>En Mac:</strong> haz doble clic.',
      unzipFolder: 'Aparece una carpeta llamada <strong>clc-agenda</strong>. Muévela a un lugar donde no la vayas a borrar, como Documentos: el navegador la usa mientras la extensión esté instalada.',
      open: 'Copia esta dirección, pégala en la barra de direcciones del navegador y presiona Enter. Hay que escribirla o pegarla: el navegador no deja abrirla desde un enlace.',
      otherBrowsers: '¿Usas otro navegador? Brave: <code>brave://extensions</code> · Edge: <code>edge://extensions</code> · Opera: <code>opera://extensions</code>',
      devMode: 'Arriba a la derecha de esa página hay un interruptor con ese nombre. Actívalo: aparecen tres botones nuevos.',
      load: 'Es el primer botón de la izquierda. Se abre una ventana: elige la carpeta <strong>clc-agenda</strong> que guardaste en el paso 2 y confirma.',
      loadHint: 'Si tu navegador está en inglés, el botón dice «Load unpacked».',
      pin: 'Toca el ícono de la pieza de rompecabezas, arriba a la derecha, y luego el pin junto a CLC Agenda. Así siempre lo tienes a mano.',
      whatsapp: 'Entra a <strong>web.whatsapp.com</strong> e inicia sesión como siempre. Abajo a la derecha aparece el botón «Extraer contactos». Listo: ya puedes guardar tus contactos.'
    },
    illo: {
      unzipMenu: ['Abrir', 'Extraer todo…', 'Copiar'],
      extensions: 'Extensiones',
      devMode: 'Modo de desarrollador',
      actions: ['Cargar descomprimida', 'Empaquetar', 'Actualizar'],
      launcher: 'Extraer contactos'
    },
    copy: {
      button: 'Copiar',
      done: 'Copiado',
      copied: 'Copiado: {value}. Ahora pégalo en la barra de direcciones.',
      failed: 'No se pudo copiar solo. La dirección quedó seleccionada: cópiala con Ctrl+C o Cmd+C.'
    },
    trouble: {
      title: 'Si algo no funciona',
      items: [
        { q: 'No veo el botón «Extraer contactos»', a: 'Recarga WhatsApp Web con la tecla F5 o el ícono de recargar. Si instalaste la extensión con WhatsApp Web ya abierto, hace falta recargar una vez.' },
        { q: 'El navegador muestra un aviso sobre el modo de desarrollador', a: 'Es normal. El navegador avisa cuando una extensión se instala desde una carpeta y no desde su tienda. Puedes cerrar el aviso: la extensión sigue funcionando.' },
        { q: '¿Cómo actualizo a una versión nueva?', a: 'Descarga el archivo otra vez, descomprímelo y reemplaza el contenido de tu carpeta clc-agenda por el nuevo. Después, en la página de extensiones, toca la flecha circular de la tarjeta de CLC Agenda.' },
        { q: '¿Por qué no está en la Chrome Web Store?', a: 'Todavía no está publicada ahí. Cuando lo esté, instalarla será un solo clic y se actualizará sola.' }
      ]
    },
    howTo: {
      name: 'Cómo instalar CLC Agenda',
      description: 'Instala la extensión CLC Agenda en Chrome, Brave, Edge u Opera en 7 pasos, sin saber de tecnología.',
      tool: 'Chrome, Brave, Edge u Opera (versión 111 o superior)'
    },
    breadcrumb: ['Inicio', 'Instalar']
  }
};
