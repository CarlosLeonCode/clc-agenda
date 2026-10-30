// Single source for links and FAQ: the page and its JSON-LD read the same data
export const REPO = 'https://github.com/CarlosLeonCode/clc-agenda';
// Every "Instalar" button opens the step-by-step guide; the guide links the download
export const INSTALL_URL = '/instalar';
export const DOWNLOAD_URL = `${REPO}/releases/latest/download/clc-agenda.zip`;
export const AUTHOR = {
  name: 'carlosleoncode',
  url: 'https://www.carlosleoncode.com/',
  sameAs: ['https://www.carlosleoncode.com/', 'https://github.com/CarlosLeonCode']
};

// Titles lead with what people search; the brand closes them (≤ 60 characters)
export const TITLE = 'Exporta contactos de WhatsApp a Google Contacts | CLC Agenda';
export const DESCRIPTION =
  'Exporta los contactos de WhatsApp Web (grupos, chats y etiquetas) a Google Contacts, al celular o a Excel. Código abierto: todo pasa en tu navegador.';
export const OG_IMAGE_ALT =
  'CLC Agenda: la ventana de la extensión sobre WhatsApp Web con los contactos de un grupo listos para exportar a Google Contacts.';

// Quotable on its own (search snippets and AI answers lift sentences like this one)
export const DEFINITION =
  'CLC Agenda es una extensión de código abierto para WhatsApp Web que exporta los contactos de tus grupos, chats y etiquetas a Google Contacts, al celular (vCard), a Excel (CSV) o a JSON. Todo pasa en tu navegador, sin copiar número por número.';

// The install guide's steps: the page headings and the HowTo structured data read this list
export const INSTALL_STEPS = [
  { name: 'Descarga el archivo', text: 'Descarga clc-agenda.zip desde la guía. Suele guardarse en la carpeta Descargas.' },
  { name: 'Descomprímelo y guarda la carpeta', text: 'En Windows, clic derecho y «Extraer todo»; en Mac, doble clic. Guarda la carpeta clc-agenda en un lugar donde no la borres, como Documentos.' },
  { name: 'Abre la página de extensiones', text: 'Escribe o pega chrome://extensions en la barra de direcciones y presiona Enter (brave://, edge:// u opera://extensions en otros navegadores).' },
  { name: 'Activa el «Modo de desarrollador»', text: 'Activa el interruptor «Modo de desarrollador», arriba a la derecha de la página de extensiones.' },
  { name: 'Toca «Cargar descomprimida»', text: 'Toca «Cargar descomprimida» («Load unpacked» en inglés) y elige la carpeta clc-agenda.' },
  { name: 'Fija el ícono en la barra', text: 'Toca la pieza de rompecabezas de la barra del navegador y el pin junto a CLC Agenda.' },
  { name: 'Abre WhatsApp Web', text: 'Entra a web.whatsapp.com e inicia sesión. Abajo a la derecha aparece el botón «Extraer contactos».' }
];

export const FAQ = [
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
