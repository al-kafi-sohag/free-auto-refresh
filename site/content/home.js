// Home page, hub pages, FAQ page, changelog and privacy text.
// Text may use **bold** and [links](path/from/site/root/).

const home = {
  title: "Free Auto Refresh – Auto Refresh Chrome Extension & Page Monitor",
  desc: "Free auto refresh extension for Chrome and Firefox. Auto reload any tab on a timer or random interval and get alerted when a page changes. No tracking.",
  kw: ["auto refresh", "auto refresh chrome", "auto refresh extension", "auto reload chrome", "auto refresher", "page refresher", "auto refresh page", "free auto refresh extension"],
  eyebrow: "Chrome + Firefox / 7 languages",
  h1: ["Auto refresh any tab.", "Know when the page changes."],
  lede: "Free Auto Refresh reloads a page on a fixed or random timer, stops when your text appears or the content changes, and waits while you type. No account, no ads, no tracking.",

  featuresTitle: "Not just a timer",
  featuresText: "An auto refresh extension that also watches the page, protects what you are typing and knows when to stop.",
  stepsTitle: "Three steps, ten seconds.",
  stepsText: "No account or setup wizard. Open a tab, pick a rhythm, and get back to what you were doing.",
  steps: [
    ["Open the page", "Go to the page you want to refresh and click the Free Auto Refresh icon in the toolbar."],
    ["Choose your rules", "Pick a preset or set your own interval. Add a limit or a watch rule if you like."],
    ["Press Start", "Pause or stop from the popup, the on-page counter, or with Alt+Shift+R."],
  ],
  usesTitle: "What people use it for",
  usesText: "From waiting on a product drop to watching a dashboard, let a tab check itself.",
  watchTitle: "It tells you when something changes.",
  watchText: ["Set a simple watch rule and let the extension keep checking. When it finds what you are looking for, it stops refreshing and sends a desktop notification. See [how page monitoring works](features/page-monitor-keyword-alert/)."],
  watchRules: [["Text appears", "Stops when a phrase shows up on the page"], ["Text disappears", "Stops when the text is gone"], ["Content changes", "Stops when the page, or one element, changes"]],

  sections: [
    { h: "A free auto refresh extension for Chrome and Firefox",
      p: ["Browsers have no built-in way to reload a tab on a schedule. Free Auto Refresh adds one: an **auto refresher** that reloads the page you choose every few seconds or minutes, for as long as you need. It works as an [auto refresh Chrome extension](chrome/) and as a [Firefox add-on](firefox/), and the Chrome version also runs in Edge, Brave and Opera.",
        "Every tab keeps its own timer, so a fast auto reload on one page never affects another. Start it from the popup or with a keyboard shortcut, and stop it the same way."] },
    { h: "More than a page refresher",
      p: ["Most tab reloader tools stop at the timer. This one adds the parts people usually pay for elsewhere, and keeps them free:"],
      list: [
        "**Random intervals.** Give a minimum and a maximum and every refresh waits a different time. [Random interval refresh](features/random-interval-refresh/)",
        "**Website change detection.** Stop and notify when text appears, disappears, or the page changes. [Page change monitor](features/page-monitor-keyword-alert/)",
        "**Smart pause.** It holds the reload while you type, click or scroll. [Smart pause](features/smart-pause/)",
        "**Hard refresh on a timer.** Bypass the cache on every reload. [Automatic hard reload](features/hard-reload-bypass-cache/)",
        "**Limits.** Stop after a set time or a number of refreshes. [Refresh limits](features/refresh-limits/)",
      ] },
    { h: "Private by design",
      p: ["Free Auto Refresh collects no data and makes no network requests. The timer, the page watching and your settings all stay inside your browser. There is no account to create and nothing to pay for. The code is open source, so anyone can check these claims."] },
    { h: "New to auto refresh?",
      p: ["Start with the guide on [how to auto refresh a page](guides/how-to-auto-refresh-a-page/), or see [how to hard refresh](guides/how-to-hard-refresh/) when a page will not show its latest version."] },
  ],

  faqs: [
    ["What is Free Auto Refresh?", "It is a free browser extension that automatically reloads a tab on a timer or at random intervals, and can alert you when the page changes. It works in Chrome, Firefox and Chromium browsers such as Edge and Brave."],
    ["Is Free Auto Refresh really free?", "Yes. Every feature is free, including random intervals and page watching. There are no ads, no account and no paid tier."],
    ["Does it collect any data?", "No. It makes no network requests and stores your settings only in your browser."],
    ["How do I auto refresh a page in Chrome?", "Install the extension, open the page, click the icon, choose an interval and press Start. The full walkthrough is in [how to auto refresh a page](guides/how-to-auto-refresh-a-page/)."],
    ["Can it tell me when a page changes?", "Yes. It can stop and send a desktop notification when text appears, when text disappears, or when the page content changes."],
    ["Can I refresh at random intervals?", "Yes. Set a minimum and a maximum, and each refresh waits a new random time in between."],
    ["Which browsers does it support?", "Chrome 111 or newer, other Chromium browsers such as Edge, Brave and Opera, and desktop Firefox 140 or newer."],
    ["Will it interrupt me while I am typing?", "No. Smart pause holds the refresh while you type in a form field, and optionally when you click or scroll."],
  ],
};

const hubFaq = (subject) => [
  [`What can Free Auto Refresh do?`, "It reloads a tab on a fixed or random timer, watches the page for text or content changes, alerts you on a match, and stops on a time or count limit."],
  ["Do I need an account or a paid plan?", "No. Everything is free and works without signing up."],
  [`Can I combine several ${subject}?`, "Yes. A timer, a watch rule, limits and smart pause all work together on the same tab."],
  ["Does it work in Firefox as well as Chrome?", "Yes. Both browsers get the same features."],
  ["Can I suggest something that is not listed?", "Yes. Open an issue on GitHub; requests shape what is built next."],
];

const featuresHub = {
  path: "features/", nav: "Features",
  title: "Features – Auto Refresh Timer, Page Monitor & More",
  desc: "All Free Auto Refresh features: auto refresh timer, random intervals, website change detection, smart pause, hard reload, limits and profiles.",
  kw: ["auto refresh features", "auto refresh timer", "page monitor", "website change detection", "random auto refresh", "smart auto refresh"],
  eyebrow: "Built for your browser",
  h1: ["Small controls.", "A lot less checking."],
  lede: "Explore the tools that make Free Auto Refresh more than a timer: watch for page changes, protect your typing, keep your place, and control exactly when refreshing stops.",
  shotTitle: "The right tool for every tab", caption: "Refresh controls are ready", alt: "Free Auto Refresh settings grouped by feature",
  gridTitle: "Every feature, at a glance", gridText: "Choose a feature to see how it works and when it is useful.",
  sections: [
    { h: "Built for the way you check the web",
      p: ["Free Auto Refresh brings recurring page checks into one simple browser extension. Choose a fixed or random auto refresh timer, watch for a specific change, and set limits so a tab stops when you are done.",
        "Start with the feature that fits your task, then combine timer controls, change rules and saved profiles as needed. Everything runs in your browser, with no account required."] },
    { h: "Simple first, advanced when you need it",
      p: ["The popup shows only the essentials. Every other setting sits under Advanced, each with a plain-language explanation, and you can pin the ones you use most to the main view."] },
  ],
  faqs: hubFaq("features"),
  cta: ["Ready to let a tab do the checking?", "Install the free extension for Chrome or Firefox. No account required."],
  ideaTitle: "Not seeing the feature you need?", ideaText: "Share the browser task you would like to make easier. Your idea helps guide what gets built next.", ideaLabel: "Request a feature",
};

const useCasesHub = {
  path: "use-cases/", nav: "Use cases",
  title: "Use Cases – Restock Alerts, Price Changes, Tickets & More",
  desc: "What people use auto refresh for: restock alerts, price drop alerts, ticket alerts, appointment checkers, dashboards and more, with step-by-step set-ups.",
  kw: ["restock alert", "in stock alert", "price drop alert", "ticket alert", "appointment checker", "auto refresh use cases"],
  eyebrow: "Let a tab keep watch",
  h1: ["What are you", "waiting for?"],
  lede: "From a restock to a dashboard update, set a page to refresh and get notified when the thing you care about changes. Pick a use case to see a simple set-up.",
  shotTitle: "Let the page do the checking", caption: "Watching for a useful update", alt: "Browser windows being kept up to date by Free Auto Refresh",
  gridTitle: "A few good reasons to automate a tab", gridText: "These are examples, not limits. If a page changes when it refreshes, Free Auto Refresh can keep an eye on it.",
  sections: [
    { h: "A practical browser tool for pages that change",
      p: ["Some pages update quietly while you are doing something else. Free Auto Refresh can check a tab on a schedule and stop when a chosen phrase or page change appears.",
        "Use these examples as starting points, not guarantees. Choose a reasonable interval, monitor only pages you are allowed to access, and follow each website's usage policies."] },
    { h: "It alerts you; it does not act for you",
      p: ["The extension reloads the page and tells you when something changes. It does not click, buy, book or submit anything, and it does not get around logins, queues or rate limits."] },
  ],
  faqs: [
    ["What kinds of pages can I monitor?", "Any normal web page you can open in a tab, including pages behind a login you are signed in to."],
    ["Can it stop when a page changes?", "Yes. Choose a watch rule and it stops and notifies you when the text appears, disappears, or the content changes."],
    ["Does the extension bypass a site's access rules?", "No. It makes the same request as pressing reload. Queues, logins and rate limits still apply."],
    ["How often should I refresh?", "As rarely as the job allows. For most pages 30 seconds to a few minutes is enough, and a random range is kinder to the site."],
    ["Will it complete a purchase or booking?", "No. It alerts you, and you take the next step yourself."],
  ],
  cta: ["Choose what the extension should watch for.", "Use a timer alone, or stop when specific text or page content changes."],
  ideaTitle: "Have a different use case in mind?", ideaText: "Tell us what kind of page or update you want to keep an eye on.", ideaLabel: "Suggest a use case",
};

const guidesHub = {
  path: "guides/", nav: "Guides",
  title: "Guides – How to Auto Refresh, Hard Refresh and More",
  desc: "Step-by-step guides: how to auto refresh a page in any browser, how to hard refresh with shortcuts for Windows and Mac, and how to stop auto refresh.",
  kw: ["how to auto refresh a page", "hard refresh", "hard refresh chrome", "stop auto refresh", "easy auto refresh alternative"],
  eyebrow: "Short, practical guides",
  h1: ["Answers to the things", "people search for."],
  lede: "Clear instructions for refreshing pages automatically, forcing a hard reload, and choosing a refresh extension.",
  shotTitle: "Guides", caption: "Shortcuts and step-by-step help", alt: "Three numbered steps leading to the Free Auto Refresh Start button",
  gridTitle: "All guides", gridText: "Each one is written to be followed in a couple of minutes.",
  sections: [{ h: "Written to be useful with or without the extension", p: ["These guides explain the built-in browser options first, then show where an extension saves time. Use whichever fits."] }],
  faqs: hubFaq("guides").slice(0, 4),
  cta: ["Prefer it done for you?", "Free Auto Refresh reloads on a timer. Free for Chrome and Firefox."],
  ideaTitle: "Need a guide that is not here?", ideaText: "Tell us what you were trying to do.", ideaLabel: "Suggest a guide",
};

const faqPage = {
  nav: "FAQ", eyebrow: "Help centre",
  h1: ["Frequently asked", "questions."],
  title: "FAQ – Free Auto Refresh Extension Questions Answered",
  desc: "Answers about Free Auto Refresh: how to auto refresh a page, price, privacy, browsers, intervals, page monitoring, alerts and troubleshooting.",
  kw: ["auto refresh faq", "how to auto refresh a page", "is auto refresh extension safe", "auto refresh not working"],
  lede: "Everything people ask about auto refreshing pages, watching for changes, privacy and troubleshooting.",
  groups: [
    { title: "The basics.", intro: "What it is and what it costs.", items: [
      ["What is Free Auto Refresh?", "A free browser extension that reloads a tab automatically on a timer or at random intervals, and can alert you when the page changes."],
      ["Is it really free?", "Yes. It is open source, with no ads, no account and no paid features."],
      ["Which browsers are supported?", "Chrome 111 or newer, Chromium browsers such as Edge, Brave and Opera, and desktop Firefox 140 or newer."],
      ["Does it work on phones?", "No. Mobile Chrome does not support extensions, and the Firefox build is desktop only."],
      ["Is it available in my language?", "It is translated into English, Romanian, Russian, Chinese, Japanese, Bengali and Thai, and follows your browser language."],
    ] },
    { title: "Refreshing pages.", intro: "Timers, intervals and limits.", items: [
      ["How do I auto refresh a page?", "Open the page, click the extension icon, pick an interval and press Start. See [how to auto refresh a page](guides/how-to-auto-refresh-a-page/)."],
      ["What is the shortest interval?", "One second. Very short intervals can get you rate-limited by some sites, so use them briefly."],
      ["Can I refresh at random intervals?", "Yes. Set different minimum and maximum values; each refresh picks a new wait in between."],
      ["Does it keep running when I switch tabs?", "Yes. It keeps refreshing in the background until you stop it, a limit is reached, or a watch rule matches."],
      ["Does it resume after I restart the browser?", "Yes, if you ask it to. Open Advanced settings, Start automatically, and switch on Remember this page before you press Start. That page then starts refreshing by itself whenever it is opened again, including after a browser restart, until you press Stop. A tab the browser restores without loading it starts once you switch to it."],
      ["Can I change the quick presets?", "Yes. Click Edit next to Quick presets in the popup, or open All settings. You can change the times, add presets, remove them, or go back to the defaults."],
      ["How do I stop it?", "Press Stop in the popup, use the stop button on the on-page counter, or press Alt+Shift+R. See [how to stop auto refresh](guides/how-to-stop-auto-refresh/)."],
      ["Can it do a hard refresh every time?", "Yes. Turn on Hard reload to bypass the cache on every refresh. See [how to hard refresh](guides/how-to-hard-refresh/)."],
    ] },
    { title: "Watching for changes.", intro: "Page monitoring and alerts.", items: [
      ["Can it notify me when a page changes?", "Yes. It can stop and notify you when text appears, when text disappears, or when the page content changes."],
      ["Can I watch only part of a page?", "Yes. In Content changes mode, add a CSS selector such as #price to watch a single element."],
      ["How am I alerted?", "With a desktop notification and a flashing tab title. The browser must be running."],
      ["Can it email or text me?", "No. Alerts stay on your computer."],
      ["Why did it miss a change?", "The content probably appeared after the check. Raise Extra wait under Watch the page."],
    ] },
    { title: "Privacy and safety.", intro: "What it can and cannot see.", items: [
      ["Does it collect my data?", "No. It collects nothing and makes no network requests."],
      ["Why does it need access to all websites?", "So the timer and counter can run on whichever page you choose. Nothing runs on a page until you press Start there."],
      ["Does it read what I type?", "No. It only notices that you are typing, so it can hold the refresh. It never records the text."],
      ["Can it click buttons or fill in forms?", "No. It reloads pages and alerts you; it does not act on the page."],
      ["Is auto refreshing allowed on every site?", "No. Some sites forbid automated reloading in their terms. Check before using it on marketplaces, ticket sites and booking portals."],
    ] },
    { title: "Troubleshooting.", intro: "When something does not work.", items: [
      ["Why will it not run on this page?", "Browsers block extensions on their own pages (chrome://, about:), the extension stores and the built-in PDF viewer."],
      ["Why did refreshing stop?", "A limit was reached, a watch rule matched, the extension was updated, or the browser put the tab to sleep. Keep the tab awake is on by default to prevent the last one."],
      ["Why did I lose what I typed?", "Smart pause delays the refresh while you type, then reloads a few seconds after you stop. Save or submit first."],
    ] },
  ],
};

const changelog = [
  ["1.2.0", ["Remember this page: a page you started can start refreshing by itself when it is opened again, also after a browser restart", "Quick presets you can edit: change the times, add your own, or remove the ones you never use", "A list of remembered pages on the settings page"]],
  ["1.1.0", ["Simpler popup, with advanced settings you can pin", "7 languages and a plain-language explanation on every setting", "Waits for the page to load before checking it", "Keep scroll position, pause on click or scroll, toolbar countdown, keep the tab awake", "Profiles, export and import, and a full settings page"]],
  ["1.0.0", ["First release: refresh timer, random intervals, page watching, smart pause, limits, on-page counter and notifications"]],
];

const privacy = [
  { h: "The extension", p: ["It reads the visible text of a page only in the tab where you turned on page watching, and only inside your browser. It never records what you type. Settings, profiles, presets and your language choice are stored locally. If you switch on Remember this page, the address of that page is stored locally too, so it can start again later; pressing Stop removes it. Nothing is sent to the developer or anyone else."] },
  { h: "Permissions", list: ["**Storage** saves your settings.", "**Notifications** shows an alert when a watch rule matches.", "**Website access** lets the timer and counter run on the page you choose."] },
  { h: "This website", p: ["It uses Microsoft Clarity on every visit to see how the pages are used (clicks, scrolling and mouse movement). Clarity sets cookies only after you click Accept on the cookie banner. Google Analytics, which counts visits, also loads only after Accept. Your choice is remembered in your browser.", "The contact form sends what you type (your message, and your name and email if you give them) to the developer through Telegram, so he can read and answer it. It is not stored on this website and is not used for anything else."] },
];

module.exports = { home, featuresHub, useCasesHub, guidesHub, faqPage, changelog, privacy };
