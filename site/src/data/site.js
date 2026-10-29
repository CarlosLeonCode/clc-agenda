// Single source for links and FAQ: the page and its JSON-LD read the same data
export const REPO = 'https://github.com/CarlosLeonCode/clc-agenda';
export const INSTALL_URL = `${REPO}#for-the-technical-details`;

export const TITLE = 'CLC Agenda · Tu agenda, fuera de WhatsApp';
export const DESCRIPTION =
  'Extensión para WhatsApp Web que exporta los contactos de tus grupos, chats y etiquetas a Google Contacts o a tu celular. Todo pasa en tu navegador.';

export const FAQ = [
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
