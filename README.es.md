# CLC Agenda

[Read in English](README.md)

Tus contactos no tienen que vivir solo en WhatsApp.

## Por qué existe

Al principio servía para extraer contactos. Hoy también sirve para que un bloqueo de Meta no se lleve tu agenda.

Si las personas solo están en WhatsApp, pierdes el acceso cuando cierran la cuenta. CLC Agenda los saca de WhatsApp Web y los deja listos para importar en **Google Contacts** o en la **agenda del celular**. Así los contactos quedan en otro lugar, y no dependes de una sola aplicación.

## Cómo usarlo

1. Instala la extensión y abre [WhatsApp Web](https://web.whatsapp.com).
2. Haz clic en **Extraer Contactos**.
3. Elige de dónde: un grupo, una etiqueta, los chats o todos.
4. Descarga el archivo e impórtalo donde quieras conservar la agenda.

| Descarga | Para qué sirve |
| --- | --- |
| CSV para Google Contacts | Columnas exactas para importar en Google Contacts. La agenda queda en Google, no solo en WhatsApp. |
| vCard (.vcf) | Importarlos en la agenda del celular. Después se puede sincronizar con Telegram. |
| CSV | Revisarlos o editarlos en Excel o en una hoja de cálculo. No los carga en la agenda del teléfono. |
| JSON | Un respaldo técnico, o un archivo que otra herramienta puede leer. |

No se envían a ningún servidor. Se quedan en tu computadora.

## Para quien quiere el detalle

Extensión de navegador, Manifest V3. Funciona en Chrome, Brave, Edge, Opera y Firefox. Corre solo en `https://web.whatsapp.com`. Permisos: `tabs` y `storage`. Cero peticiones externas y cero telemetría.

Instalación local:

1. Ejecuta `npm install` y luego `npm run build`. Esto empaqueta `src/` en `dist/`, que es lo que carga Chrome.
2. Ve a `chrome://extensions` (o `brave://extensions` / `edge://extensions`).
3. Activa el **Modo de desarrollador**.
4. Haz clic en **Cargar descomprimida** y elige esta carpeta.
5. Recarga WhatsApp Web.

Pruebas: `npm test` (compila antes). Mientras desarrollas, `npm run watch` vuelve a compilar con cada cambio.

Exportadores: `src/exporters/google-contacts.js`, `src/exporters/vcard.js`, `src/exporters/csv.js`, `src/exporters/json.js`. La ventana que ves en WhatsApp está en `src/ui/overlay.js`, y el motor que lee WhatsApp Web está en `src/page/`.
