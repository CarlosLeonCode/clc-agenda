// Site copy per language. Spanish lives at /, English under /en/.
import es from './es.js';
import en from './en.js';

export const LANGS = ['es', 'en'];
export const COPY = { es, en };

export const copyFor = (lang = 'es') => COPY[lang] || COPY.es;

/** The same page in each language: { es: '/instalar', en: '/en/install' }. */
export const twins = (page) => ({ es: es.routes[page], en: en.routes[page] });
