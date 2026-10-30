# CLC Agenda

[Leer en español](README.es.md)

Your contacts do not have to live only in WhatsApp.

## Why it exists

It started as a way to extract contacts. It also exists so a Meta ban does not take your address book with it.

If people only live in WhatsApp, you lose access when the account is closed. CLC Agenda pulls them out of WhatsApp Web and prepares them for **Google Contacts** or your **phone's address book**. The contacts stay somewhere else. You do not depend on one app.

## Install without coding

1. [Download clc-agenda.zip](https://github.com/CarlosLeonCode/clc-agenda/releases/latest/download/clc-agenda.zip), always the latest version.
2. Unzip it (Windows: right-click > Extract All; Mac: double-click) and keep the `clc-agenda` folder somewhere safe, like Documents.
3. Open `chrome://extensions` (Brave: `brave://extensions`, Edge: `edge://extensions`, Opera: `opera://extensions`).
4. Turn on **Developer mode**, top right.
5. Click **Load unpacked** and choose the `clc-agenda` folder.
6. Pin the icon: puzzle piece > pin next to CLC Agenda.
7. Open [WhatsApp Web](https://web.whatsapp.com): the **Extraer contactos** button appears at the bottom right.

The landing page has the same guide, illustrated and in Spanish, at `/instalar`.

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

Browser extension, Manifest V3. Works on Chromium browsers version 111 or newer: Chrome, Brave, Edge, and Opera. Runs only on `https://web.whatsapp.com`. No extra permissions: only access to WhatsApp Web. No external requests and no telemetry.

Local install:

1. Run `npm install` and then `npm run build`. This bundles `src/` into `dist/`, which is what Chrome loads.
2. Open `chrome://extensions` (or `brave://extensions` / `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this folder.
5. Reload WhatsApp Web.

Tests: `npm test` (builds first). While developing, `npm run watch` rebuilds on every change.

Exporters: `src/exporters/google-contacts.js`, `src/exporters/vcard.js`, `src/exporters/csv.js`, `src/exporters/json.js`. The window you see on WhatsApp is `src/ui/overlay.js`, and the engine that reads WhatsApp Web is `src/page/`.

### Landing page (`site/`)

Astro, deployed on Netlify (`netlify.toml`). In `site/`: `npm ci`, then `npm run dev`, or `npm test` to build and check it.

The optional "new version" emails use [clc-leads](https://github.com/CarlosLeonCode/clc-leads). Its client, `@carlosleoncode/lead-capture`, is a private package on GitHub Packages and an optional dependency:

- **Without `NODE_AUTH_TOKEN`** npm skips it and the site still builds, with no email card and no privacy page. The extension is unaffected: it never sends anything anywhere.
- **With it** (a GitHub token with `read:packages`, in your shell and in Netlify's environment variables) the card, the footer links and the privacy policy at `/privacidad` and `/en/privacy` are on. `LEADS_DISABLED=1` turns them off for a build.
- The clc-leads function must list `clc-agenda` in `ALLOWED_PROJECTS` and the site's origins in `ALLOWED_ORIGINS`.
- Before a production deploy with leads on, fill the `TODO` values in `site/src/data/privacy.js` (Supabase region, last updated date). Netlify production builds (`CONTEXT=production`) and `PRIVACY_STRICT=1` builds fail while any remain.
