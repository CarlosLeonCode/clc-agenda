// English copy, written for English search intent rather than translated word by word

const INSTALL_STEPS = [
  { name: 'Download the file', text: 'Download clc-agenda.zip from the guide. It usually lands in your Downloads folder.' },
  { name: 'Unzip it and keep the folder', text: 'On Windows, right-click and choose "Extract All"; on Mac, double-click. Keep the clc-agenda folder somewhere you won\'t delete it, like Documents.' },
  { name: 'Open the extensions page', text: 'Type or paste chrome://extensions into the address bar and press Enter (brave://, edge:// or opera://extensions in other browsers).' },
  { name: 'Turn on "Developer mode"', text: 'Turn on the "Developer mode" switch at the top right of the extensions page.' },
  { name: 'Click "Load unpacked"', text: 'Click "Load unpacked" and choose the clc-agenda folder.' },
  { name: 'Pin the icon to the toolbar', text: 'Click the puzzle-piece icon in the browser toolbar, then the pin next to CLC Agenda.' },
  { name: 'Open WhatsApp Web', text: 'Go to web.whatsapp.com and sign in. The "Extract contacts" button appears at the bottom right.' }
];

const FAQ = [
  {
    q: 'How do I export the contacts from a WhatsApp group?',
    a: 'Open WhatsApp Web with CLC Agenda installed, click "Extract contacts" and pick the group from the list. You\'ll see every member with their name and number, ready to download in the format you prefer.'
  },
  {
    q: 'How do I move WhatsApp contacts to Google Contacts?',
    a: 'Extract the contacts and click "Google Contacts": you get a CSV file with the columns Google expects. Then, on contacts.google.com, use "Import" and pick that file.'
  },
  {
    q: 'Can I save numbers I don\'t have in my contacts to my phone?',
    a: 'Yes. When you extract a group, click the "unsaved" filter to keep only the numbers that aren\'t in your contacts. Then choose "Phone (.vcf)" and open the file on your phone to add them.'
  },
  {
    q: 'Can I export WhatsApp contacts to Excel?',
    a: 'Yes. Under "More", choose "Excel (CSV)": the file opens in Excel or Google Sheets with the columns you picked.'
  },
  {
    q: 'Do my contacts leave my computer?',
    a: 'No. CLC Agenda reads the data WhatsApp Web already has in your browser and builds the file right there. There are no servers and no telemetry.'
  },
  {
    q: 'Does it work with WhatsApp Business?',
    a: 'Yes. Besides groups and chats, you can export the contacts behind each WhatsApp Business label.'
  },
  {
    q: 'Which browsers does it work on?',
    a: 'Chromium-based browsers, version 111 or later: Chrome, Brave, Edge and Opera.'
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. There\'s no sign-up or login: you install the extension and use it on WhatsApp Web.'
  },
  {
    q: 'What permissions does it ask for?',
    a: 'Only access to web.whatsapp.com. It doesn\'t read your history or your other tabs.'
  },
  {
    q: 'Can I review the code?',
    a: 'Yes. It\'s open source under the MIT license and published on GitHub.'
  }
];

export default {
  lang: 'en',
  ogLocale: 'en_US',
  routes: { home: '/en/', install: '/en/install', privacy: '/en/privacy' },
  ids: { how: 'how-it-works', formats: 'formats', privacy: 'privacy', faq: 'faq', step: 'step' },
  meta: {
    title: 'Export WhatsApp contacts to Google Contacts | CLC Agenda',
    description: 'Export WhatsApp Web contacts from groups, chats and labels to Google Contacts, your phone or Excel. Open source: it all runs in your browser.',
    ogImage: '/og-en.png',
    ogAlt: 'CLC Agenda: the extension window on WhatsApp Web with a group\'s contacts ready to export to Google Contacts.'
  },
  definition: 'CLC Agenda is an open-source browser extension for WhatsApp Web that exports the contacts from your groups, chats and labels to Google Contacts, your phone (vCard), Excel (CSV) or JSON. It all runs in your browser, with no copying numbers one by one.',
  skip: 'Skip to content',
  nav: {
    homeLabel: 'CLC Agenda, go to home',
    mainLabel: 'Main',
    how: 'How it works',
    formats: 'Formats',
    privacy: 'Privacy',
    faq: 'FAQ',
    install: 'Install',
    installLong: ' the extension',
    languageLabel: 'Language'
  },
  hero: {
    eyebrow: 'Export WhatsApp Web contacts',
    line1: 'Your contacts,',
    hl1: 'out',
    middle: ' of ',
    hl2: 'WhatsApp.',
    cta: 'Install the extension',
    ctaAlt: 'See how it works',
    creditBy: 'Created by',
    cursors: ['Ana · Sales', 'Bruno · Community', 'You'],
    chipUnsaved: 'unsaved',
    video: 'clc-agenda-en',
    videoLabel: '45-second silent video: CLC Agenda pulls the contacts from a WhatsApp Web group, filters the ones you haven\'t saved and exports them to Google Contacts or your phone.',
    pause: 'Pause video',
    play: 'Play video'
  },
  marquee: ['Groups', 'Chats', 'Labels', 'Google Contacts', 'Phone', 'Excel', 'JSON'],
  steps: {
    title1: 'Three clicks.',
    title2: 'Zero copy and paste.',
    items: [
      { title: 'Pick a source', text: 'A group, a WhatsApp Business label, your chats or all your contacts.' },
      { title: 'See who\'s missing', text: 'See who\'s already in your contacts and filter the ones you haven\'t saved with one click.' },
      { title: 'Save them', text: 'A file ready for Google Contacts or your phone\'s address book.' }
    ]
  },
  panels: {
    formatsTitle: 'Ready to import',
    formats: [
      { name: 'Google Contacts', tag: 'CSV', note: 'The exact columns Google needs to import.' },
      { name: 'Phone', tag: '.vcf', note: 'vCard for your iPhone or Android contacts.' },
      { name: 'Excel or Sheets', tag: 'CSV', note: 'The columns you choose, to review.' },
      { name: 'Backup', tag: 'JSON', note: 'To keep or use in another tool.' }
    ],
    privacyTitle: 'Your contacts never leave your browser.',
    ticks: [
      'No servers: everything runs on your computer.',
      'No extra permissions: it only accesses WhatsApp Web.',
      'No accounts and no telemetry.',
      'Open source, so you can check it yourself.'
    ]
  },
  faq: { title: 'Frequently asked questions', items: FAQ },
  finalCta: { title: 'Take back your contacts.', button: 'Install the extension' },
  footer: { license: 'CLC Agenda · Open source, MIT license · ', notAffiliated: 'Not affiliated with WhatsApp or Meta.', leads: 'Get new-version emails', privacy: 'Privacy' },
  install: {
    title: 'How to install CLC Agenda in Chrome, step by step',
    description: 'Install CLC Agenda in your browser in 7 simple steps, no tech skills needed: download, unzip and load the extension in Chrome, Brave, Edge or Opera.',
    kicker: 'Installation guide',
    h1: 'Install CLC Agenda in 7 steps',
    lead: 'No tech skills needed. It takes about 3 minutes and works in Chrome, Brave, Edge and Opera.',
    steps: INSTALL_STEPS,
    download: 'Download CLC Agenda',
    body: {
      download: 'Click the button. A file called <strong>clc-agenda.zip</strong> downloads, usually to your Downloads folder.',
      downloadHint: 'A .zip file of about 35 KB. Always the latest version.',
      unzip: '<strong>On Windows:</strong> right-click the file and choose "Extract All". <strong>On Mac:</strong> double-click it.',
      unzipFolder: 'A folder called <strong>clc-agenda</strong> appears. Move it somewhere you won\'t delete it, like Documents: the browser uses it for as long as the extension is installed.',
      open: 'Copy this address, paste it into your browser\'s address bar and press Enter. You have to type or paste it: browsers don\'t let a link open it.',
      otherBrowsers: 'Using another browser? Brave: <code>brave://extensions</code> · Edge: <code>edge://extensions</code> · Opera: <code>opera://extensions</code>',
      devMode: 'At the top right of that page there\'s a switch with that name. Turn it on: three new buttons appear.',
      load: 'It\'s the first button on the left. A window opens: choose the <strong>clc-agenda</strong> folder you saved in step 2 and confirm.',
      loadHint: 'If your browser uses another language, the button has a translated name: it\'s always the first one on the left.',
      pin: 'Click the puzzle-piece icon at the top right, then the pin next to CLC Agenda. That way it\'s always within reach.',
      whatsapp: 'Go to <strong>web.whatsapp.com</strong> and sign in as usual. The "Extract contacts" button appears at the bottom right. That\'s it: you can save your contacts now.'
    },
    illo: {
      unzipMenu: ['Open', 'Extract All…', 'Copy'],
      extensions: 'Extensions',
      devMode: 'Developer mode',
      actions: ['Load unpacked', 'Pack extension', 'Update'],
      launcher: 'Extract contacts'
    },
    copy: {
      button: 'Copy',
      done: 'Copied',
      copied: 'Copied: {value}. Now paste it into the address bar.',
      failed: 'Couldn\'t copy it automatically. The address is selected: copy it with Ctrl+C or Cmd+C.'
    },
    leads: {
      invite: 'Want to hear about new versions?',
      open: 'Notify me',
      title: 'We\'ll tell you when a new version is out',
      intro: 'Installed from a file, the extension doesn\'t update itself. Leave your email and we\'ll write when a new version ships.',
      emailLabel: 'Your email',
      placeholder: 'name@email.com',
      consent: 'I agree that CLC Agenda stores my email to tell me about new versions. I can unsubscribe at any time.',
      privacy: 'We only use it to tell you about new versions. Nothing else.',
      privacyLink: 'Details in the privacy policy',
      submit: 'Notify me',
      compactText: 'Want an email when there is a new version?',
      compactYes: 'Yes, notify me',
      submitting: 'Sending…',
      success: 'Done, we\'ll let you know.',
      close: 'Close',
      errors: {
        'email.required': 'Enter your email.',
        'email.invalid': 'Check your email: something seems to be missing.',
        'email.too_long': 'That email is too long.',
        'email.not_allowed': 'We can\'t use that email. Try another one.',
        'consent.required': 'Tick the box so we can let you know.',
        rate_limited: 'Too many attempts in a row. Try again in a minute.',
        network: 'You seem to be offline. Check your connection and try again.',
        server: 'Something went wrong on our side. Try again later.'
      }
    },
    trouble: {
      title: 'If something doesn\'t work',
      items: [
        { q: 'I don\'t see the "Extract contacts" button', a: 'Reload WhatsApp Web with F5 or the reload icon. If you installed the extension with WhatsApp Web already open, it needs one reload.' },
        { q: 'The browser shows a notice about developer mode', a: 'That\'s normal. Browsers show it when an extension is installed from a folder instead of their store. You can close it: the extension keeps working.' },
        { q: 'How do I update to a new version?', a: 'Download the file again, unzip it and replace the contents of your clc-agenda folder with the new one. Then, on the extensions page, click the circular arrow on the CLC Agenda card.' },
        { q: 'Why isn\'t it on the Chrome Web Store?', a: 'It isn\'t published there yet. When it is, installing will take one click and it will update itself.' }
      ]
    },
    howTo: {
      name: 'How to install CLC Agenda',
      description: 'Install the CLC Agenda extension in Chrome, Brave, Edge or Opera in 7 steps, no tech skills needed.',
      tool: 'Chrome, Brave, Edge or Opera (version 111 or later)'
    },
    breadcrumb: ['Home', 'Install']
  },
  privacy: {
    title: 'Privacy policy | CLC Agenda',
    description: 'What CLC Agenda stores if you ask for new-version emails, what for, who processes it and how to unsubscribe. The extension itself sends nothing.',
    kicker: 'Privacy',
    h1: 'Privacy policy',
    lead: 'The CLC Agenda extension sends nothing to any server: your contacts and the files you export stay in your browser. This policy covers only one optional thing on this site: the emails we send when a new version is out.',
    updated: 'Last updated',
    back: 'Back to home',
    // p: PRIVACY (src/data/privacy.js). Strings may hold HTML; arrays are lists.
    sections: (p) => [
      { title: 'Controller', body: [`${p.controller}, ${p.location}. Contact: <a href="mailto:${p.contactEmail}">${p.contactEmail}</a>.`] },
      {
        title: 'What data we collect',
        body: [
          'Only what you give us in the new-version form, and only when you send it:',
          [
            '<strong>Your email address.</strong>',
            '<strong>Proof of your consent:</strong> the exact sentence you agreed to and the date and time.',
            '<strong>Minimal technical data:</strong> the page you subscribed from (the home page or the install guide), your browser language and your browser type (for example, "Chrome" or "Safari on mobile"), with no versions or device identifiers.'
          ],
          'We do not ask for your name, occupation or country.',
          '<strong>We do not store</strong> your IP address (to stop abuse we use an irreversible, salted digest that is deleted shortly after), your location or tracking cookies. We never see your contacts or anything you do with the extension. Whether you already closed the prompt or subscribed is kept only in your browser.'
        ]
      },
      { title: 'What we use it for', body: ['Only to write to you when there is a new version of CLC Agenda. We do not send ads or other newsletters, and we do not sell or hand your data to third parties.'] },
      { title: 'Legal basis', body: ['Your <strong>prior, express and informed consent</strong>, which you give by ticking the box (Colombia\'s Law 1581 of 2012, art. 9, and Decree 1377 of 2013; GDPR, art. 6(1)(a)). You can withdraw it at any time; that does not affect emails already sent.'] },
      {
        title: 'Processors',
        body: [
          'We use providers that process the data on our behalf and under our instructions:',
          [
            `<strong>Supabase</strong> (database). Region: ${p.supabaseRegion}.`,
            ...(p.usesBrevo ? ['<strong>Brevo</strong> (sending emails and handling unsubscribes).'] : [])
          ],
          'Some of these providers may store data outside your country. When they do, they rely on appropriate contractual safeguards.'
        ]
      },
      { title: 'How long we keep it', body: [`For as long as you stay subscribed. If you unsubscribe, we stop writing right away and delete your data within ${p.retentionDaysAfterUnsubscribe} days, except the minimum record needed not to write to you again. If ${p.inactiveListMonths} months go by without a new-version email, we delete the list.`] },
      {
        title: 'Your rights',
        body: [
          'You can <strong>know, update, correct and delete</strong> your data, <strong>withdraw your consent</strong> and ask for <strong>proof of the authorization</strong> you gave (Law 1581, art. 8). If you are in the European Union, you also have the rights of <strong>access, rectification, erasure, restriction, objection and portability</strong> (GDPR, arts. 15 to 21).',
          `To use them, write to <a href="mailto:${p.contactEmail}">${p.contactEmail}</a>. We will answer within ${p.responseDays.queries} business days for questions and ${p.responseDays.claims} business days for complaints, as Law 1581 sets.`,
          'If you are not satisfied, you can go to the <strong>Superintendencia de Industria y Comercio</strong> (Colombia\'s data protection authority) or to the data protection authority in your country.'
        ]
      },
      {
        title: 'How to unsubscribe',
        body: [[
          p.usesBrevo ? 'With the unsubscribe link included in every email, or' : 'By replying to any of our emails to ask to be removed, or',
          `by writing to <a href="mailto:${p.contactEmail}">${p.contactEmail}</a> from the subscribed address.`
        ]]
      },
      { title: 'Minors', body: [`The emails are meant for people aged ${p.minimumAge} or over. If you are younger, ask a parent or guardian to authorize it.`] },
      { title: 'Changes', body: ['If we change this policy in an important way, we will say so here with the date of the update.'] }
    ]
  }
};
