# Contributing to CLC Agenda

¡Gracias por tu interés en contribuir! / Thanks for your interest in contributing!

## Cómo contribuir (How to contribute)

1. **Fork** el repositorio.
2. Clona tu fork localmente: `git clone https://github.com/TU_USUARIO/wasup_contact_extractor_clc.git`
3. Crea una rama (branch) para tu feature o fix: `git checkout -b mi-nueva-feature`
4. Realiza los cambios en el código.
5. Ejecuta los tests para asegurarte de que todo funciona: `npm test`
6. Haz commit de tus cambios usando [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: agregada nueva exportación"`
7. Haz push de la rama a tu fork: `git push origin mi-nueva-feature`
8. Abre un **Pull Request** hacia la rama `main` del repositorio original.

## Entorno de Desarrollo (Development Environment)

Para probar la extensión localmente mientras desarrollas:
1. Ejecuta `npm install` y luego `npm run build` para generar `dist/`. Usa `npm run watch` para que se vuelva a compilar con cada cambio en `src/`.
2. Abre Chrome (o Brave/Edge) y ve a `chrome://extensions/`.
3. Activa el "Modo de desarrollador".
4. Haz clic en "Cargar descomprimida" y selecciona la carpeta del proyecto.
5. Cualquier cambio en `popup/` o `src/` (ya compilado) va a requerir que refresques la extensión desde la página de extensiones y luego recargues WhatsApp Web.

## Landing (`site/`)

La página está hecha con Astro y se publica en Netlify. En `site/`: `npm ci` y luego `npm run dev`, o `npm test` para compilarla y revisarla.

Los avisos de versiones nuevas por correo usan `@carlosleoncode/lead-capture`, un paquete privado de GitHub Packages que es una dependencia opcional:

- **Sin `NODE_AUTH_TOKEN`**, npm lo omite y la página compila igual, sin la tarjeta de avisos ni la política de privacidad. No necesitas el token para contribuir.
- **Con el token** (de GitHub, con permiso `read:packages`), la tarjeta, los enlaces del pie y la política en `/privacidad` y `/en/privacy` aparecen. `LEADS_DISABLED=1` los apaga en una compilación.
- Antes de publicar en producción con los avisos activos, completa los valores `TODO` de `site/src/data/privacy.js`. Las compilaciones de producción de Netlify y las que usan `PRIVACY_STRICT=1` fallan mientras quede alguno.

## Publicar una versión (Releasing)

1. `npm run package` compila y genera `clc-agenda.zip` con solo lo que Chrome necesita. Sirve para probar el paquete que descarga la gente.
2. Actualiza la versión en `manifest.json` y `package.json` (deben coincidir).
3. Crea y sube la etiqueta: `git tag v1.3.0 && git push --tags`. El workflow `release.yml` corre los tests, arma el ZIP y lo adjunta al Release. La guía de instalación siempre descarga el último.

Cualquier mejora es bienvenida. Abre un Issue si tienes dudas o encontraste un error.
