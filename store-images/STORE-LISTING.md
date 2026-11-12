# Store listing for 1.2.0

Copy-and-paste texts for the Chrome Web Store and Firefox Add-ons, written from the keyword
research in `site/KEYWORDS.md`. The images are in this folder.

The wording uses the search terms people actually type ("auto refresh", "auto reload",
"page refresher", "tab reloader", "website change detection", "restock alert", "price drop
alert"), once each and in normal sentences. Both stores penalise keyword lists and repeated
terms, so do not add a block of keywords at the end.

---

## Images

| File | Size | Where it goes |
| --- | --- | --- |
| `screenshot-1.png` … `screenshot-7.png` | 1280 x 800 | Chrome: Screenshots (pick 5). Firefox: Screenshots (all 7) |
| `promo-small.png` | 440 x 280 | Chrome: Small promo tile |
| `promo-marquee.png` | 1400 x 560 | Chrome: Marquee promo tile |
| `../icons/icon-128.png` | 128 x 128 | Chrome: Store icon. Firefox: Add-on icon |

All are 24-bit PNG without alpha, as Chrome requires.

Suggested five for Chrome, in this order: 1 (timer), 2 (page watching), 4 (remembers pages),
3 (live counter), 5 (your own presets). Screenshots 6 (smart pause) and 7 (languages) are
extra for Firefox, which has no limit of five.

Firefox captions (the box under each screenshot):

1. Auto refresh any tab on a fixed or random timer
2. Stops and notifies you when text appears, disappears or the page changes
3. Live refresh count and countdown on the page and the toolbar icon
4. Remember this page: starts again by itself, even after a browser restart
5. Quick presets you can edit to your own times
6. Smart pause holds the refresh while you type, click or scroll
7. Available in 7 languages

To regenerate: `npm run preview`, then `node scripts/make-store-images.js`.

---

## Chrome Web Store

**Title** and **Summary** come from `manifest.json`. The summary below is 126 characters
(limit 132). To use it, change `description` in `manifest.json` and `manifest.firefox.json`
and rebuild; it is not editable in the dashboard.

> Auto refresh any tab on a fixed or random timer. Get alerted when a page changes. Free, private, starts again after a restart.

**Category:** Workflow and planning is fine. "Tools" also fits and has the direct competitors.

**Homepage URL:** `https://freeautorefresh.com/`

**Support URL:** `https://github.com/al-kafi-sohag/free-auto-refresh/issues` (or keep the form
you use now; an issues page shows users that questions get answered).

**Description** (about 2,900 characters):

```
Free Auto Refresh reloads any tab automatically, on a fixed or random timer, and tells you when the page changes. It is free, has no account and no ads, and everything runs inside your browser.

AUTO REFRESH ANY PAGE
Pick a quick preset or type your own seconds. Give Min and Max the same value for a fixed interval, or different values for a new random wait before every reload. Each tab has its own timer and its own settings.

NEW: REMEMBER THIS PAGE
Switch on "Remember this page" and auto refresh starts again by itself when that page is reopened, even after you restart the browser. Press Stop to forget the page.

NEW: YOUR OWN QUICK PRESETS
Change the preset buttons to the intervals you actually use. Add your own, remove the rest, or go back to the defaults.

WEBSITE CHANGE DETECTION
Stop refreshing and get a desktop notification when:
• text appears on the page ("In stock", "Available", your name)
• text disappears ("Sold out", "Pending")
• the page content changes, or just one part of it (optional CSS selector)
It waits for the page to finish loading before it checks, so late content is not missed.

LIVE COUNTER
A small movable counter on the page shows the refresh count and the countdown, with pause and stop buttons. The toolbar icon shows the refresh count or the time until the next reload.

SMART PAUSE
Holds the refresh while you are typing in a form. Optionally also when you click or scroll, so the page does not reload while you are reading it. Keep scroll position returns you to the same place after each reload.

LIMITS
Stop after a number of minutes, after a number of refreshes, or both.

ALSO INCLUDED
• Hard reload (bypass the cache) on every refresh
• Keep the tab awake so the browser does not put it to sleep
• Pause and resume
• Keyboard shortcut: Alt+Shift+R starts or stops the current tab
• Profiles: save named sets of settings and switch between them
• Export and import your settings
• Simple popup, with advanced settings you can pin to the main view
• A plain-language explanation next to every setting
• Dark mode
• 7 languages: English, Romanian, Russian, Chinese (Simplified), Japanese, Bengali, Thai

WHAT PEOPLE USE IT FOR
• Restock alerts and "back in stock" pages
• Price drop alerts
• Ticket sales and appointment slots
• Order, application and exam result pages
• Live dashboards, status pages and wall screens
• Job boards and auctions
• Web development: reload a page while you work on it

PRIVACY
No data is collected and nothing is sent anywhere. Settings stay in your browser. The source code is public.

It does not work on browser pages (chrome://), the extension store or the built-in PDF viewer; browsers do not allow extensions there.

Website and guides: https://freeautorefresh.com/
Source code: https://github.com/al-kafi-sohag/free-auto-refresh
```

---

## Firefox Add-ons

The current description says "Chrome extension" and "Chrome tab" several times. Replace it
with the text below, which is the same content written for Firefox.

**Summary** (comes from the manifest; same as Chrome above).

**Description:** use the Chrome description above with these three changes:

1. Last paragraph before the links: `It does not work on browser pages (about:), addons.mozilla.org or the built-in PDF viewer; Firefox does not allow extensions there.`
2. Under REMEMBER THIS PAGE add: `Tabs that Firefox restores without loading them start refreshing when you switch to them.`
3. The shortcut line: `Keyboard shortcut: Alt+Shift+R starts or stops the current tab (change it under Manage Extension Shortcuts)`

**Categories:** Alerts & Updates, Tabs, Shopping (keep).

**Tags:** remove `google` and `search`; they do not describe the add-on. Firefox only accepts
tags from its own list, which I could not see from outside your account. When editing, pick
the ones closest to refreshing, tabs, monitoring, shopping and web development.

**Homepage:** `https://freeautorefresh.com/` (change it from the github.io address).

**Website / support site:** the Google Form is fine; the GitHub issues page is an alternative.

**Release notes** (Firefox goes from 1.0.0 straight to 1.2.0, so these cover 1.1.0 too):

```
This update brings Firefox from 1.0.0 to 1.2.0.

New in 1.2.0
• Remember this page: switch it on under Advanced settings > Start automatically, and auto refresh starts again by itself when that page is reopened, also after a browser restart. Press Stop to forget the page.
• Quick presets you can edit: click Edit next to the presets to change the times, add your own or remove the ones you don't use.
• The settings page lists your remembered pages and lets you forget them.

New since 1.0.0 (version 1.1.0)
• Simpler popup: the essentials on the main view, everything else under Advanced settings. Pin any setting to keep it on the main view.
• 7 languages: English, Romanian, Russian, Chinese (Simplified), Japanese, Bengali and Thai, with a plain-language explanation next to every setting.
• Page watching now waits for the page to finish loading, plus an adjustable extra wait, before it checks.
• Keep scroll position after each refresh.
• Pause when you click or scroll, with a choice to restart the countdown or stop.
• The toolbar icon can show a countdown to the next refresh.
• Keep the tab awake while it is refreshing.
• Profiles: save named sets of settings and switch between them.
• A full settings page, with export and import.

Thanks to Dodsy-91 for asking for remembered pages and editable presets.
```

**Notes to reviewer:**

```
This submission updates the add-on from 1.0.0 to 1.2.0 (1.1.0 was not submitted here). Permissions are unchanged since 1.0.0: storage, notifications, and a content script on all URLs. No remote code, no network requests, no data collection.

What changed since 1.0.0

Structure
- New shared scripts loaded by the background, the popup and the settings page: settings.js (the list of settings), i18n.js and locales/*.js (translations), ui.js (renders the settings controls).
- New settings page: options.html / options.js (options_ui, opens in a tab).
- The background lists the shared scripts in background.scripts.

Features (1.1.0)
- Popup redesign with Advanced settings and pinning; 7 languages, switched at runtime and stored in storage.local.
- Page watching waits for the load event plus a delay; keep scroll position; pause on click or scroll; toolbar countdown; "keep the tab awake" (tabs.update autoDiscardable, which needs no extra permission).
- Profiles, export to a JSON file and import from one, all local.

Features (1.2.0)
- "Remember this page" (off by default; Advanced settings > Start automatically). When on, the address of the page being refreshed and its settings are saved in storage.local. The address comes from the content script's sender.url. When that page loads again, the background starts the refresh for that tab. Stop removes the saved address. Nothing is sent anywhere.
- Editable quick presets, stored in storage.local.

How to test
1. Basic refresh: open any web page, open the popup, pick a preset, press Start. The page reloads and shows a counter.
2. Page watching: in Advanced settings > Watch the page choose "Stop when text appears", enter a word that is on the page, press Start. It stops and shows a notification.
3. Remember this page: Advanced settings > Start automatically > turn on "Remember this page", go back and press Start. Close the tab and open the same address again: refreshing starts by itself after one interval. Press Stop: opening the page again no longer starts it. Remembered pages are listed on the settings page (gear icon).

Build
The only generated file is popup.css (Tailwind CSS, minified). All JavaScript is hand-written and not minified or bundled.
Source: https://github.com/al-kafi-sohag/free-auto-refresh
  npm ci
  npm run build:firefox
Requires Node 22. The output is web-ext-artifacts/free-auto-refresh-firefox-1.2.0.zip.
```

---

## Chrome: "What's new" is not a field

Chrome has no release-notes box. The "NEW:" sections in the description do that job; remove
the word "NEW:" at the next release.
