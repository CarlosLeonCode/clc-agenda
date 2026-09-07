# 🚀 Wasup Contact Extractor CLC (Manifest V3)

🌐 [Leer en Español](#-español)

A professional, secure, and **Open Source** browser extension to extract contacts from **WhatsApp Web** (`https://web.whatsapp.com`) with **custom data and column selection**.

Compatible with **Google Chrome, Brave, Microsoft Edge, Opera, and Mozilla Firefox**.

---

## ✨ Main Features (v1.3.0)

- ⚙️ **Dynamic Data Selector for Download**:
  - **1-Click Quick Presets**:
    - ⭐ **Name & Phone** (Most popular standard preset).
    - 📱 **Phones Only** (Only phone numbers).
    - 👤 **Names Only** (Only contact names).
    - 📊 **All Data** (Name, International Phone, Clean Phone, Saved in Contacts, Group Role, Account Type, Country, Origin, WhatsApp ID).
  - **Custom Checkboxes**: Choose exactly which columns to include in your downloaded file.
- 📥 **Dynamic Export Formats**:
  - **CSV (Excel UTF-8 BOM)**: Generates the file with only the selected columns and protection against formula injection.
  - **vCard 3.0 (`.vcf`)**: Ready to import into Google Contacts, iPhone, and Android.
  - **Structured JSON**: JSON object with key filtering according to your selection.
  - **Copy Data**: Copies to clipboard according to the active fields.
- 🎛️ **Draggable and Relocatable Floating Button**: Move the button around the screen or anchor it to **Top**, **Middle**, or **Bottom**.
- 📊 **Live Metrics Ribbons**: Breakdown of *Total*, *In Contacts*, *Unsaved*, and *Admins*.
- 🛡️ **100% Local Security (Zero-Knowledge)**: 0 external requests, 0 telemetry, and strict XSS sanitization.

---

## 🛠️ Installation Guide

1. Open your browser and go to `chrome://extensions` (or `brave://extensions` / `edge://extensions`).
2. Enable **"Developer mode"** (top right corner).
3. Click on **"Load unpacked"** (or **"Load unpacked extension"**).
4. Select the folder where you downloaded or clonned this project.
5. Open or reload [WhatsApp Web](https://web.whatsapp.com).

---

## 🧪 Automated Tests

```bash
npm test
```

---
---

# 🇪🇸 Español

🌐 [Read in English](#-wa-contact-extractor-pro-manifest-v3)

Extensión de navegador profesional, segura y de código abierto (**Open Source**) para extraer contactos desde **WhatsApp Web** (`https://web.whatsapp.com`) con **selección personalizada de columnas y datos**.

Compatible con **Google Chrome, Brave, Microsoft Edge, Opera y Mozilla Firefox**.

---

## ✨ Características Principales (v1.3.0)

- ⚙️ **Selector Dinámico de Datos a Descargar**:
  - **Presets Rápidos con 1 Clic**:
    - ⭐ **Nombre y Teléfono** (Preset estándar más popular).
    - 📱 **Solo Teléfonos** (Solo números telefónicos).
    - 👤 **Solo Nombres** (Solo nombres de los contactos).
    - 📊 **Todos los Datos** (Nombre, Teléfono Internacional, Teléfono Limpio, En Agenda, Rol de Grupo, Tipo de Cuenta, País, Origen, WhatsApp ID).
  - **Checkboxes Personalizados**: Elige exactamente qué columnas incluir en tu archivo descargado.
- 📥 **Formatos de Exportación Dinámicos**:
  - **CSV (Excel UTF-8 BOM)**: Genera el archivo con solo las columnas seleccionadas y protección contra inyección de fórmulas.
  - **vCard 3.0 (`.vcf`)**: Listo para importar en Google Contacts, iPhone y Android.
  - **JSON Estructurado**: Objeto JSON con filtrado de claves según tu selección.
  - **Copiar Datos**: Copia al portapapeles según los campos que tengas activos.
- 🎛️ **Botón Flotante Arrastrable y Reubicable**: Mueve el botón por la pantalla o ánclalo a **Arriba**, **Al Medio** o **Abajo**.
- 📊 **Cintas de Métricas en Vivo**: Desglose de *Total*, *En Agenda*, *No Guardados* y *Admins*.
- 🛡️ **Seguridad 100% Local (Zero-Knowledge)**: 0 peticiones externas, 0 telemetría y sanitización estricta contra XSS.

---

## 🛠️ Guía de Instalación

1. Abre tu navegador y ve a `chrome://extensions` (o `brave://extensions` / `edge://extensions`).
2. Activa el **"Modo de desarrollador"** (arriba a la derecha).
3. Haz clic en **"Cargar descomprimida"**.
4. Selecciona la carpeta donde descargaste o clonaste este proyecto.
5. Abre o recarga [WhatsApp Web](https://web.whatsapp.com).

---

## 🧪 Pruebas Automatizadas

```bash
npm test
```
