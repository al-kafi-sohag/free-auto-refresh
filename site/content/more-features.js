// Long-form additions for the feature pages, keyed by slug. Merged over the base entry in pages.js.
// h1 is [dark part, blue part]. sections come before the "At a glance" list built from the base points.

module.exports = {
  "auto-refresh-timer": {
    nav: "Auto refresh timer", icon: "timer", shotTitle: "Auto refresh timer", caption: "Next refresh in 30 seconds",
    h1: ["Set a timer.", "Get on with your day."],
    sections: [
      { h: "Auto refresh a page, tab or site on your schedule",
        p: ["An auto refresh timer reloads the current tab at the interval you choose and keeps going until you pause it, stop it, or it reaches a limit. Use a short interval for pages that update often and a longer one when you only need an occasional check.",
          "Free Auto Refresh gives each tab its own timer. You can auto reload a news page every minute, a dashboard every five, and leave every other tab alone."] },
      { h: "Refresh a page every 5 seconds, 30 seconds or 5 minutes",
        p: ["The presets cover the common cases: 5–10 seconds, 15–30, 30–60, 1–2 minutes and 5 minutes. For anything else, type the seconds yourself. Setting the minimum and maximum to the same number gives a fixed interval; different numbers give a [random interval](features/random-interval-refresh/)."],
        sub: [
          ["Which interval should I use?", "Match it to how fast the page really changes. Auctions and build pages: 5 to 10 seconds, briefly. Stock and ticket pages: 30 to 60 seconds. Dashboards and status pages: 2 to 5 minutes."],
          ["Why not just use the shortest?", "Each refresh is a full request to the website. Very fast reloading wastes bandwidth and can get you rate-limited or temporarily blocked."],
        ] },
      { h: "Stay in control while it runs",
        p: ["The popup shows the refresh count, the time until the next reload and the time elapsed. The same information appears in a small [counter on the page](features/on-page-countdown/), with pause and stop buttons, and the keyboard shortcut Alt+Shift+R toggles the timer without opening anything.",
          "For longer runs, add a [time or count limit](features/refresh-limits/) so the tab stops on its own."] },
    ],
    faqs: [
      ["How do I use the auto refresh timer?", "Open the page, click the extension icon, choose a preset or type an interval, and press Start."],
      ["Can I pause the timer?", "Yes. Use Pause in the popup or on the page counter, and Resume to carry on with the same settings."],
      ["Is the timer included for free?", "Yes, along with every other feature."],
      ["Can different tabs have different timers?", "Yes. Each tab has its own interval, counter and limits."],
      ["Does it remember my interval?", "Yes. Your last settings are used next time, and Alt+Shift+R starts with them straight away."],
    ],
  },

  "random-interval-refresh": {
    nav: "Random intervals", icon: "shuffle", shotTitle: "Random interval", caption: "A new wait every time",
    h1: ["Never the same", "wait twice."],
    sections: [
      { h: "What is a random auto refresh?",
        p: ["Instead of reloading on a fixed beat, a random auto refresh picks a new wait for every cycle, somewhere between a minimum and a maximum you set. Enter 20 and 45 seconds and one refresh might come after 23 seconds, the next after 41.",
          "The countdown always shows the wait chosen for the current round, so you still know exactly when the next reload is due."] },
      { h: "Why random beats a fixed timer",
        list: [
          "**It looks like a person, not a machine.** Requests that arrive on the exact same second are easy for a website to flag.",
          "**It is gentler on the site.** Spreading reloads out avoids piling onto a busy server at regular intervals.",
          "**It suits long waits.** For a restock or a queue you may watch for hours, a range such as 30 to 90 seconds is a sensible default.",
        ] },
      { h: "Good ranges to start with",
        sub: [
          ["Active watching", "15 to 40 seconds, with a [watch rule](features/page-monitor-keyword-alert/) so it stops on a change."],
          ["Background checking", "60 to 180 seconds, with a [time limit](features/refresh-limits/)."],
          ["Slow status pages", "5 to 10 minutes (300 to 600 seconds)."],
        ] },
    ],
    faqs: [
      ["How do I turn on random intervals?", "Type different values into Min and Max. That is all; there is no separate switch."],
      ["Is random refresh a paid feature?", "No. It is free here, although some refresh extensions charge for it."],
      ["Can I see when the next refresh will happen?", "Yes. The popup, the on-page counter and optionally the toolbar icon show the countdown for the current wait."],
      ["Does a random interval avoid being blocked?", "It reduces the obvious pattern, but it does not bypass rate limits or a site's rules."],
      ["Can I use decimals?", "Yes, in steps of half a second, with a minimum of one second."],
    ],
  },

  "page-monitor-keyword-alert": {
    nav: "Page change monitor", icon: "scan-eye", shotTitle: "Page watch", caption: "Match found, refreshing stopped",
    h1: ["Stop refreshing", "when the page changes."],
    sections: [
      { h: "Website change detection, built into the refresh",
        p: ["Most people refresh a page because they are waiting for something. A page monitor does the waiting for you: after every reload it checks the page, and when your condition is met it stops and tells you.",
          "Free Auto Refresh can track website changes in three ways, all free and all running locally in your browser."],
        sub: [
          ["Stop when text appears", "Type a word or phrase such as In stock or Results published. Refreshing ends the first time it shows up."],
          ["Stop when text disappears", "Watch for a message such as Sold out or No appointments available to go away."],
          ["Stop when content changes", "Compare the page with how it looked on the first load. Add a CSS selector to watch one element only."],
        ] },
      { h: "Get a website change alert you will actually notice",
        p: ["On a match you get a desktop notification, and the tab title flashes until you look at it. The toolbar icon shows an exclamation mark, and the on-page counter turns red and says a match was found.",
          "Alerts stay on your computer. There is no email, text message or phone push, so the browser needs to be open."] },
      { h: "Avoiding false alarms",
        list: [
          "**Watch one element.** In Content changes mode, a selector such as #price or .stock-status ignores adverts, clocks and counters elsewhere on the page.",
          "**Give slow pages time.** It waits for the page to finish loading; raise Extra wait to 2 or 3 seconds if content arrives late.",
          "**Use exact wording.** Copy the phrase from the page. Matching ignores upper and lower case.",
        ] },
      { h: "How it differs from a monitoring service",
        p: ["Online website monitors check a page from their own servers, on their schedule, and usually need an account. This checks from your own browser, so it works on pages behind your login and shares nothing with anyone. The trade-off is that your computer has to stay on."] },
    ],
    faqs: [
      ["Can it notify me when a page changes?", "Yes. Choose Stop when content changes and it sends a desktop notification on the first difference."],
      ["How do I monitor a website for changes for free?", "Install the extension, pick a watch mode, set an interval and press Start. There is no account or paid plan."],
      ["Can I watch for more than one keyword?", "Not yet. One phrase or one selector per tab."],
      ["Does it work on pages behind a login?", "Yes. It runs in your own signed-in tab."],
      ["What exactly is compared in Content changes mode?", "The visible text of the page, or of the element you selected. Images and layout are not compared."],
      ["Does it keep refreshing after a match?", "No. It stops so you can act. Press Start again to carry on."],
    ],
  },

  "on-page-countdown": {
    nav: "Live countdown", icon: "gauge", shotTitle: "On-page counter", caption: "12 refreshes, next in 8 seconds",
    h1: ["See every", "refresh coming."],
    sections: [
      { h: "A refresh counter and countdown on the page",
        p: ["Once a refresh is running, a small pill appears in the corner of the page. It shows how many times the page has reloaded, the seconds left until the next one, and a thin progress bar.",
          "You can pause, resume or stop from the pill itself, without opening the popup."] },
      { h: "Put it where it suits you",
        p: ["Drag the counter anywhere on the page and it stays there after the next reload. It is drawn separately from the website, so it looks the same on every site and cannot be broken by the page's own styling."],
        sub: [["What the colours mean", "Green and pulsing: running. Amber: paused. Purple: finished on a limit. Red: a watch rule matched."]] },
      { h: "Or use the toolbar icon instead",
        p: ["Prefer nothing on the page? Switch the on-page badge off. The extension icon can then show the refresh count, a countdown to the next refresh, or nothing. Pick whichever you like under Display."] },
    ],
    faqs: [
      ["How do I hide the counter?", "Open Advanced settings, Display, and switch off On-page badge."],
      ["Can I see the countdown without opening the popup?", "Yes, on the page counter, or on the toolbar icon if you choose Time until the next refresh."],
      ["Does the counter slow the page down?", "No. It is a few small elements updated ten times a second, and only while the tab is visible."],
      ["Why did the counter disappear?", "Refreshing was stopped, the badge was switched off, or the extension was updated. Press Start again."],
      ["Does it show on every website?", "On any page where the extension can run. Browser pages and extension stores are excluded."],
    ],
  },

  "smart-pause": {
    nav: "Pause while typing", icon: "keyboard", shotTitle: "Smart pause", caption: "Waiting, you are typing",
    h1: ["It refreshes.", "Never mid-sentence."],
    sections: [
      { h: "Auto refresh without losing what you typed",
        p: ["The usual problem with auto refresh is a reload that lands while you are filling in a form, and wipes it. Smart pause watches for that. If you have typed in a text field in the last few seconds, the refresh is held and tried again a moment later.",
          "The on-page counter says it is waiting, so you know the reload has been delayed and not forgotten."] },
      { h: "Pause on clicks and scrolling too",
        p: ["Two optional switches extend the idea to reading and browsing. Turn on **Pause when you click** or **Pause when you scroll** and any interaction with the page holds the next refresh."],
        sub: [
          ["Restart the countdown", "Each click or scroll starts the wait again from the beginning. The page only reloads once you have left it alone for a full interval."],
          ["Stop refreshing", "The first click or scroll ends the run completely. Useful when you only want refreshing while you are away."],
        ] },
      { h: "Where it helps most",
        list: [
          "**Inboxes and admin screens** you both watch and work in.",
          "**Long articles or lists** you read between refreshes, together with [keep scroll position](features/keep-scroll-position/).",
          "**Auctions**, so a bid you are typing is not cleared.",
        ] },
    ],
    faqs: [
      ["Does auto refresh delete what I am typing?", "Not while you are typing. Smart pause holds the reload, then refreshes a few seconds after you stop, so save or submit first."],
      ["Is smart pause on by default?", "Pause while typing is on. The click and scroll options are off until you enable them."],
      ["What counts as scrolling?", "The mouse wheel, touch scrolling, and keys such as Page Down and the arrow keys. Scrolling done by the website itself is ignored."],
      ["Can I turn it off?", "Yes, under Advanced settings, Smart pause."],
      ["Does it work with every form?", "With standard text boxes, text areas, drop-downs and rich-text editors."],
    ],
  },

  "keep-scroll-position": {
    nav: "Restore scroll position", icon: "arrow-down-up", shotTitle: "Scroll restore", caption: "Back where you were",
    h1: ["Reload the page.", "Keep your place."],
    sections: [
      { h: "Refresh a page and stay in the same place",
        p: ["On a long page, every reload can throw you back to the top. With Keep scroll position on, the extension notes where you were just before the refresh and returns you there afterwards.",
          "It restores the position again once the page has reached its full height, which matters for pages that add content as they load."] },
      { h: "Made for long pages",
        list: [
          "**Tables and lists** where the row you care about is far down.",
          "**Live text commentary** and score pages.",
          "**Search results and listings** you are part-way through.",
          "**Documentation or a page you are building**, alongside [hard reload](features/hard-reload-bypass-cache/).",
        ] },
      { h: "It gives way to you",
        p: ["If you scroll while the page is still loading, your movement wins and the saved position is dropped. Pair it with [pause when you scroll](features/smart-pause/) to read without the page reloading under you."] },
    ],
    faqs: [
      ["Why does my page jump to the top after a refresh?", "Many sites reset the view on load. Turn on Keep scroll position to return to where you were."],
      ["Does it remember horizontal scrolling?", "Yes, both directions."],
      ["Will it work on very long or lazy-loading pages?", "It works for content present after the reload. Items that only load as you scroll may not be there to return to."],
      ["Is it on by default?", "No. Switch it on under Advanced settings, Reloading."],
      ["Does it work with hard reload?", "Yes. The two settings are independent."],
    ],
  },

  "hard-reload-bypass-cache": {
    nav: "Hard refresh", icon: "rotate-cw", shotTitle: "Hard reload", caption: "Cache bypassed on every refresh",
    h1: ["A hard refresh.", "On repeat."],
    sections: [
      { h: "What a hard refresh is",
        p: ["Browsers save copies of a page's files so it loads faster next time. A normal refresh can reuse them, which is why a page sometimes shows old prices, old styles or an old version. A hard refresh, or hard reload, skips those copies and downloads everything again.",
          "You can do one by hand with Ctrl + Shift + R, or Cmd + Shift + R on a Mac. The [hard refresh guide](guides/how-to-hard-refresh/) lists every shortcut."] },
      { h: "Hard reload automatically, every time",
        p: ["Turn on Hard reload and each automatic refresh bypasses the cache, the same as pressing the shortcut yourself. Nothing else changes: the timer, limits and page watching work as usual."],
        sub: [
          ["For developers", "Reload a local or staging page every few seconds and always see your newest CSS and JavaScript."],
          ["For cached pages", "Force quotes, scores and stock pages to fetch fresh data instead of a stored copy."],
        ] },
      { h: "When to leave it off",
        p: ["A hard reload downloads more and takes longer. Pages that already tell the browser not to cache them gain nothing from it. If a normal refresh shows the new data, leave it off, and use intervals of ten seconds or more when it is on."] },
    ],
    faqs: [
      ["What is the difference between refresh and hard refresh?", "A refresh may reuse saved files. A hard refresh downloads everything again."],
      ["Does hard reload clear my cache?", "No. It ignores the cache for that load. Your saved files, cookies and logins are untouched."],
      ["Does it fix a page that will not update?", "Often. If it does not, the website's own server or CDN is caching the page, which only the site owner can clear."],
      ["Can I hard refresh on a schedule in Firefox too?", "Yes. The setting works the same in Chrome and Firefox."],
      ["Does it use more data?", "Yes, because nothing is reused. Keep intervals longer when it is on."],
    ],
  },

  "refresh-limits": {
    nav: "Refresh limits", icon: "circle-stop", shotTitle: "Refresh limits", caption: "Stops after 60 minutes",
    h1: ["It knows", "when to stop."],
    sections: [
      { h: "Auto refresh for a set time, then stop",
        p: ["An auto refresh left running overnight is easy to forget. Limits make it end by itself. Set **Stop after** in minutes and refreshing finishes when the time is up, with the popup showing the time left as it goes."] },
      { h: "Refresh a set number of times",
        p: ["**Max refreshes** caps the count instead. After that many reloads the run ends and the popup tells you the limit was reached. Use both together and whichever comes first wins."],
        sub: [
          ["A polite cap", "A count limit keeps you from sending thousands of requests to a site by accident."],
          ["A natural end", "A time limit suits events with a known length, such as a sale, a match or a working day."],
        ] },
      { h: "Limits, watch rules and manual stop",
        p: ["A run ends in one of four ways: you press Stop, a time limit passes, a count limit is reached, or a [watch rule](features/page-monitor-keyword-alert/) matches. The on-page counter and the popup always say which one it was."] },
    ],
    faqs: [
      ["How do I make auto refresh stop automatically?", "Set Stop after (minutes) or Max refreshes under Advanced settings, Limits."],
      ["What does 0 mean?", "No limit. With both at 0 it runs until you stop it."],
      ["Can I see how long is left?", "Yes. The popup shows Time left when a time limit is set."],
      ["Does pausing extend the time limit?", "No. The time limit is a fixed end time from when you pressed Start."],
      ["Can I keep limits on the main popup view?", "Yes. Click the pin next to either setting in Advanced."],
    ],
  },

  "profiles-and-backup": {
    nav: "Saved profiles", icon: "bookmark", shotTitle: "Profiles", caption: "Switch set-ups in one click",
    h1: ["Save a set-up once.", "Reuse it anywhere."],
    sections: [
      { h: "Different pages, different refresh settings",
        p: ["A restock watch, a dashboard and a development preview need very different settings. Rather than re-entering them, save each as a named profile and switch from a menu at the top of the popup."] },
      { h: "Pin the settings you use most",
        p: ["The popup keeps to the essentials. Everything else lives under Advanced, and any setting can be pinned to the main view with one click. If you always set a time limit or a watch rule, pin it and it is there every time."] },
      { h: "Export and import",
        p: ["From the settings page you can export your settings, pins and profiles to a single file, and import that file in another browser or on another computer. It is also a simple backup before reinstalling."],
        sub: [["No account, on purpose", "Nothing is synced through a server, because the extension makes no network requests. The file is how you move things."]] },
    ],
    faqs: [
      ["How do I save a profile?", "Open All settings from the gear icon, type a name under Profiles and press Save profile."],
      ["How many profiles can I have?", "Up to 50."],
      ["Do profiles sync between devices?", "Not automatically. Export a file and import it on the other device."],
      ["Does importing overwrite my profiles?", "Settings and pins are replaced. Profiles are merged, with imported ones winning if a name clashes."],
      ["Are profiles shared between Chrome and Firefox?", "Yes, through export and import. The file works in both."],
    ],
  },

  "languages": {
    nav: "7 languages", icon: "languages", shotTitle: "Languages", caption: "Română, Русский, 日本語 and more",
    h1: ["Auto refresh,", "in your language."],
    sections: [
      { h: "An auto refresh extension in seven languages",
        p: ["Free Auto Refresh is available in English, Romanian (Română), Russian (Русский), Simplified Chinese (简体中文), Japanese (日本語), Bengali (বাংলা) and Thai (ไทย). The popup, the settings page, the on-page counter and the notifications are all translated."] },
      { h: "It follows your browser",
        p: ["By default the extension uses your browser's language, so most people never touch the setting. To choose one yourself, use the Language menu at the bottom of the popup or the top of the settings page. The change applies immediately."] },
      { h: "Every setting explained in plain words",
        p: ["Each setting has a small (i) icon. Hover over it for a short explanation of what it does, written without jargon and translated along with everything else."],
        sub: [["Help improve a translation", "Each language is one small file in the project. If something reads oddly, open an issue on GitHub."]] },
    ],
    faqs: [
      ["How do I change the language?", "Use the Language menu at the bottom of the popup, or choose Auto to follow the browser."],
      ["Is there a Romanian version?", "Yes. Română is fully translated and is used automatically if your browser is set to Romanian."],
      ["Are the store listings translated?", "Not yet. The extension itself is; the store pages are in English."],
      ["Can I request another language?", "Yes, on GitHub. New languages are straightforward to add."],
      ["Does the language affect how it works?", "No. Only the text changes."],
    ],
  },
};
