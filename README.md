# CLC Agenda

[Leer en español](README.es.md)

Your contacts do not have to live only in WhatsApp.

## Why it exists

It started as a way to extract contacts. It also exists so a Meta ban does not take your address book with it.

If people only live in WhatsApp, you lose access when the account is closed. CLC Agenda pulls them out of WhatsApp Web and prepares them for **Google Contacts** or your **phone's address book**. The contacts stay somewhere else. You do not depend on one app.

## How to use it

1. Install the extension and open [WhatsApp Web](https://web.whatsapp.com).
2. Click **Extraer Contactos**.
3. Choose a source: a group, a label, chats, or everyone.
4. Download the file and import it where you want to keep the address book.

| Download | What it is for |
| --- | --- |
| CSV para Google Contacts | Exact columns for importing into Google Contacts. The address book lives in Google, not only in WhatsApp. |
| vCard (.vcf) | Import into the phone address book. You can then sync it with Telegram. |
| CSV | Open and edit in Excel or Sheets. It does not load contacts into a phone address book. |
| JSON | A technical backup, or a file another tool can read. |

Nothing is sent to a server. It stays on your computer.

## For the technical details

Browser extension, Manifest V3. Works on Chrome, Brave, Edge, Opera, and Firefox. Runs only on `https://web.whatsapp.com`. Permissions: `tabs` and `storage`. No external requests and no telemetry.

Local install:

1. Run `npm install` and then `npm run build`. This bundles `src/` into `dist/`, which is what Chrome loads.
2. Open `chrome://extensions` (or `brave://extensions` / `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this folder.
5. Reload WhatsApp Web.

Tests: `npm test` (builds first). While developing, `npm run watch` rebuilds on every change.

Exporters: `src/exporters/google-contacts.js`, `src/exporters/vcard.js`, `src/exporters/csv.js`, `src/exporters/json.js`. The window you see on WhatsApp is `src/ui/overlay.js`, and the engine that reads WhatsApp Web is `src/page/`.
