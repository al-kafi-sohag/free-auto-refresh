# Auto Refresh

A Manifest V3 browser extension (Chrome and Firefox) that reloads a tab at a fixed or random interval, with a live on-page counter, refresh limits, and page watching that alerts you when something changes.

## Features

- **Fixed or random intervals**: set Min and Max to the same value for fixed, or different values for a new random wait on every refresh
- **Live on-page badge**: a draggable pill with the refresh count, countdown, progress bar, and pause/stop buttons (rendered in a Shadow DOM, so it never clashes with the page)
- **Toolbar counter**: the extension icon shows the refresh count for the current tab, or a countdown to the next refresh, or nothing
- **Limits**: stop after N minutes, after N refreshes, or both
- **Page watching**: stop and notify when text appears, when text disappears, or when the page (or a CSS selector) changes. It waits for the page to finish loading, plus an adjustable extra delay, before checking
- **Smart pause**: holds back a refresh while you are typing in a form field and, optionally, when you click or scroll. A click or scroll can either restart the countdown or stop refreshing
- **Hard reload**: optional cache bypass
- **Keep scroll position**: returns to the same place on the page after each refresh
- **Keep the tab awake**: asks the browser not to put the tab to sleep while it is refreshing
- **Remember this page**: optionally, a page you started begins refreshing by itself when it is opened again, including after a browser restart, until you press Stop
- **Quick presets you can edit**: change the times, add your own, remove the ones you don't use
- **Pause / resume** and a keyboard shortcut (`Alt+Shift+R`, changeable in your browser's shortcut settings)
- **Desktop notification** and tab-title flash when a watch matches
- **Simple or advanced**: the popup shows only the essentials; everything else lives under Advanced settings, and any setting can be pinned to the main view
- **Profiles and backup**: save named sets of settings, switch between them from the popup, and export or import everything as a file
- **Plain-language help**: every setting has an (i) button that explains what it does
- **7 languages**: English, Romanian, Russian, Chinese (Simplified), Japanese, Bengali and Thai. It follows the browser language, or pick one in the popup
- Per-tab settings, dark mode, no data collection, no network requests

## Installation

### Chrome

1. Clone this repository:
```bash
   git clone https://github.com/al-kafi-sohag/chrome-auto-refresh
```
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension from the puzzle-piece menu.

The compiled `popup.css` is committed, so no build step is needed just to use it.

### Firefox

Firefox uses a separate manifest (`manifest.firefox.json`) staged into `dist-firefox/` at build time. See [Chrome and Firefox builds](#chrome-and-firefox-builds) below.

## Development

The popup is styled with [Tailwind CSS](https://tailwindcss.com). Manifest V3 blocks remote scripts, so Tailwind is compiled to a local stylesheet instead of using the CDN.

```bash
npm install
npm run build:css    # one-off build -> popup.css
npm run watch:css    # rebuild on change
```

After editing any file, click the reload icon on the extension card at `chrome://extensions`, then reload the tab you are testing.

To work on the popup or the settings page without reloading the extension, run `npm run preview` and open `http://localhost:4173/dev/preview.html` (add `?page=options` for the settings page). It runs the real markup and scripts against a small fake `chrome` API in `dev/`, which is never shipped.

`http://localhost:4173/dev/e2e.html` goes further: it runs the real `background.js` and `content.js` together on a test page, so refreshing, page watching, scroll restore and smart pause can be tried without loading the extension. Drive it from the console with `e2e.start({ min: 3, max: 3 })`, `e2e.stop()` and `e2e.state()`.

Two checks run in Node, with no browser:

```bash
node dev/check-i18n.js         # every language has every string
node dev/check-background.js   # background logic against a fake chrome API
```

### Chrome and Firefox builds

Both browsers are built from the same source files; only the manifest differs. `scripts/build.js` stages one clean, loadable folder per browser, and Mozilla's official [`web-ext`](https://github.com/mozilla/web-ext) CLI (a dev dependency) zips them.

```bash
npm install

npm run build            # both upload-ready zips in web-ext-artifacts/
npm run build:chrome     # dist-chrome/  + free-auto-refresh-chrome-<version>.zip
npm run build:firefox    # dist-firefox/ + free-auto-refresh-firefox-<version>.zip

npm run run:firefox      # build CSS, stage dist-firefox/, launch Firefox with the extension loaded
npm run lint:firefox     # run AMO's validation checks locally
```

`dist-chrome/` and `dist-firefox/` only ever contain the runtime files listed in `scripts/build.js`, the icons and the right `manifest.json` — never `node_modules`, `.git`, `dev/` or build tooling. When you add a source file, add it to the `FILES` list there.

## Usage

1. Open the tab you want to refresh.
2. Click the extension icon (or press `Alt+Shift+R` to start with your last settings).
3. Pick a preset or set **Min** and **Max** seconds.
4. Optionally set **Stop after**, **Max refreshes**, or a **Watch** rule.
5. Click **Start** — it refreshes immediately, then continues at your chosen interval. Use the badge on the page or the popup to pause or stop.

### Watch modes

| Mode | Stops when | Input |
| --- | --- | --- |
| Text appears | the text is visible on the page (case-insensitive) | text |
| Text disappears | the text is no longer on the page | text |
| Content changes | the watched content differs from the first load | optional CSS selector |

Tips:

- For "changes", use a CSS selector such as `#price` so ads and timestamps don't trigger it.
- "Disappears" stops immediately if the text isn't on the page when you start.

## How it works

| File | Purpose |
| --- | --- |
| `manifest.json` | Chrome (MV3) manifest |
| `manifest.firefox.json` | Firefox manifest — adds `background.scripts` fallback and `browser_specific_settings.gecko` |
| `settings.js` | The single list of settings (type, default, label, group). Shared by the popup, the settings page and the background |
| `ui.js` | Renders settings controls from that list, including the pin buttons |
| `popup.html` / `popup.js` | Popup: live stats, main view, Advanced settings (Tailwind) |
| `options.html` / `options.js` | Full settings page: all settings, profiles, export and import |
| `background.js` | Service worker: per-tab state, remembered pages, toolbar badge, notifications, shortcut |
| `content.js` | Runs in the page: timer, page watching, on-page badge |
| `src/input.css`, `tailwind.config.js` | Tailwind source and config; build output is `popup.css` |
| `scripts/build.js` | Stages clean `dist-chrome/` and `dist-firefox/` folders for `web-ext` |
| `i18n.js`, `locales/` | All user-facing text. English is in `i18n.js`; each other language is one file in `locales/` |
| `dev/` | Browser previews, an end-to-end test page and Node checks (development only) |
| `icons/`, `scripts/make-icons.js` | Extension icons, and the script that renders them (`npm run build:icons`) |

The timer runs in the content script rather than `chrome.alarms`, because alarms cannot fire more often than every 30 seconds.

### Languages

The extension has its own small translation layer instead of the browser's `_locales`, because that one cannot switch language at runtime. The choice is stored as `lang` (`auto` follows the browser). The background resolves the on-page badge texts when a run starts and passes them to the tab in `state.strings`, so the content script that runs on every page carries no translations.

To add a language, copy a file in `locales/`, translate the values, and add it to `LANGS` in `i18n.js`, to the script lists in `popup.html`, `options.html` and `background.js`, and to `background.scripts` in `manifest.firefox.json`.

### Adding a setting

Add one entry to `SETTINGS` in `settings.js`, and its label and explanation to `i18n.js` and each file in `locales/` (`node dev/check-i18n.js` reports anything missing). It then shows up under its group in Advanced settings and on the settings page, can be pinned, is saved, and is included in profiles and exports. The background passes the full settings object to the tab as `state.cfg`. Settings saved by older versions stay valid: any key they lack falls back to its default.

### Remembered pages

With **Remember this page** on (Advanced settings, Start automatically; off by default), the background saves the address of the page a tab is refreshing, with its settings, in `storage.local` as `pages`. The address comes from the page's own content script (`sender.url`), so no `tabs` permission is needed. Each time a page loads, its content script asks the background for its state; if the tab has none and the address is remembered, a run starts and waits one interval before the first refresh. Stop forgets the page; closing the tab or the browser does not. The settings page lists remembered pages and can forget them.

## Permissions

- `storage`: saves your settings and per-tab state
- `notifications`: alerts you when a watch matches
- Content script on all sites: lets the timer and badge run on the pages you choose. Nothing runs until you press Start.

## Limitations

- Does not work on `chrome://`/`about:` pages, extension stores, or the built-in PDF viewer.
- "Keep the tab awake" is a request to the browser. It can still put the tab to sleep when memory is critically low.
- Background tabs may have timers delayed by about a second.
- Watching checks the page once it has loaded plus the extra wait you set (one second by default). Content that appears later than that is missed; raise the extra wait for such pages.
- A remembered page starts when it loads. A tab the browser restores without loading it (Firefox does this for background tabs) starts once you switch to it.
- Remembered pages match the exact address (ignoring the `#fragment`). A page whose address changes between visits is not recognised.
- Firefox build requires Firefox 140+ (desktop) due to `data_collection_permissions` support.

## Roadmap

- [x] Refresh counter
- [x] Stop or notify when page text changes
- [x] Firefox build
- [x] Saved profiles, export and import
- [x] Languages and per-setting help
- [x] Wait for load, keep scroll position, click and scroll pause, toolbar countdown, keep tab awake
- [ ] Sound alert on match
- [x] Remember a page and resume after a browser restart, editable quick presets
- [ ] Local history page

## License

MIT. See [LICENSE](LICENSE).