// Second layer of long-form content for the feature pages: a worked example, common mistakes,
// and how the feature combines with others. Appended after the sections in more-features.js.

module.exports = {
  "auto-refresh-timer": [
    { h: "A worked example: refresh a page every 30 seconds",
      p: ["Say you are waiting for a courier's tracking page to update. Open the page, click the Free Auto Refresh icon and tap the 30–60s preset. To make it exactly 30 seconds, type 30 into both Min and Max. Press Start.",
        "The page reloads at once, the toolbar icon shows a green number, and a small counter appears in the corner of the page counting down from 30. Carry on working in another tab. When you are done, press Alt+Shift+R or the stop button on the counter."] },
    { h: "Common mistakes with an auto refresh timer",
      list: [
        "**Choosing the shortest interval by habit.** A page that changes once an hour does not need a reload every five seconds.",
        "**Forgetting it is running.** Add a time limit, or check the number on the toolbar icon.",
        "**Refreshing a page with an unsaved form.** Pause while typing protects you while you type, not after you stop.",
        "**Expecting it on browser pages.** Extensions cannot run on chrome:// or about: pages, or in the extension stores.",
      ] },
    { h: "How the timer fits with the other features",
      p: ["On its own the timer is an auto reload for one tab. Add a [watch rule](features/page-monitor-keyword-alert/) and it becomes a page monitor that stops on a change. Add [limits](features/refresh-limits/) and it ends by itself. Add [hard reload](features/hard-reload-bypass-cache/) and each refresh fetches fresh files. Save the combination as a [profile](features/profiles-and-backup/) and it is one click away next time."],
      sub: [["Auto refresh a website, a tab or the whole browser?", "The extension works per tab, which is what most people mean by auto refresh a website. To refresh several pages, start it in each tab; they run independently."]] },
  ],

  "random-interval-refresh": [
    { h: "A worked example: a 30 to 90 second range",
      p: ["You are watching a product page that may restock at any time today. Type 30 into Min and 90 into Max and press Start. The first refresh happens immediately. The counter then shows the wait picked for this round, perhaps 0:52, then 1:14, then 0:37.",
        "Over an hour that averages one request a minute, the same as a fixed 60-second timer, but without the regular rhythm."] },
    { h: "Fixed or random: which should you choose?",
      sub: [
        ["Choose fixed when", "the page is your own tool (a dashboard, a build page, a local site) or when you want a predictable display on a wall screen."],
        ["Choose random when", "you are checking someone else's website for a long time, especially a shop, a booking page or a results page under load."],
      ] },
    { h: "Common mistakes",
      list: [
        "**A range that is too narrow.** 29 to 31 seconds is fixed in all but name. Give it room, such as 30 to 90.",
        "**A minimum that is too low.** With 1 to 120 seconds, some waits will be only a second or two.",
        "**Assuming it makes you invisible.** Sites still count requests. Random timing is politeness, not a disguise.",
      ] },
    { h: "Smart auto refresh: random timing plus a watch rule",
      p: ["The most useful set-up for waiting on something is a random range together with a [page change rule](features/page-monitor-keyword-alert/) and a [time limit](features/refresh-limits/). The tab checks at an easy pace, stops the moment the page changes, and gives up by itself if nothing happens."] },
  ],

  "page-monitor-keyword-alert": [
    { h: "A worked example: watch a page until it changes",
      p: ["A course registration page says Registration opens soon. You want to know when that line goes. Open Advanced settings, Watch the page, choose **Stop when text disappears**, and type Registration opens soon. Set Min 60 and Max 120, then press Start.",
        "On the first load the extension confirms the text is there. Each refresh after that, it waits for the page to finish loading, waits your extra second, and looks again. The moment the phrase is gone, refreshing stops, a notification appears, and the tab title flashes."] },
    { h: "Finding a CSS selector for one element",
      p: ["To monitor a website for changes in one spot, right-click that part of the page and choose **Inspect**. In the panel that opens, look at the highlighted line for an id (written id=\"price\") or a class (class=\"stock-status\"). An id becomes **#price**; a class becomes **.stock-status**. Paste it into the selector box in Content changes mode.",
        "If the selector matches nothing, the extension treats the watched text as empty, so test it once before walking away."] },
    { h: "Common mistakes when tracking website changes",
      list: [
        "**Watching the whole page on a busy site.** Rotating banners and timestamps change on every load. Use a selector.",
        "**A phrase that appears twice.** If Add to cart is also shown for other products, watching for it to appear fires straight away.",
        "**Content that loads late.** Raise Extra wait until matches are reliable.",
        "**Closing the browser.** This is a browser-based page monitor; it needs the tab open.",
      ] },
    { h: "Auto refresh until the page changes, then stop",
      p: ["That sentence is the whole feature. Pair it with [random intervals](features/random-interval-refresh/) for a gentle pace, [keep the tab awake](features/auto-refresh-timer/) so the browser does not unload it, and a [limit](features/refresh-limits/) so it does not run forever."] },
  ],

  "on-page-countdown": [
    { h: "A worked example",
      p: ["Start a 60-second refresh on a status page. A dark pill appears bottom right: a green dot, the number 1 with the word refreshes, and 59.4s counting down above a thin bar that fills as the reload approaches. Drag it to the top left so it does not cover the page's own chat button. It will be there, in that spot, after every reload."] },
    { h: "Refresh countdown in the toolbar",
      p: ["Under Display, **Toolbar icon shows** has three choices. Number of refreshes is the default. Time until the next refresh turns the icon's badge into a countdown, showing seconds, then minutes for longer waits. Nothing keeps the icon clean.",
        "The toolbar badge is per tab, so each tab shows its own count or countdown when you switch to it."] },
    { h: "Common questions about the counter",
      sub: [
        ["It covers something I need to click", "Drag it elsewhere, or switch it off and use the toolbar countdown."],
        ["It shows Waiting, you are typing", "Smart pause has delayed the refresh because you typed recently. It retries every few seconds."],
        ["It says Countdown restarted", "You clicked or scrolled with that pause option on, and the wait began again."],
      ] },
    { h: "Works with every other feature",
      p: ["The counter reflects whatever is happening: checking the page for a [watch rule](features/page-monitor-keyword-alert/), paused, finished on a [limit](features/refresh-limits/), or stopped on a match. It is the quickest way to see the state of a tab at a glance."] },
  ],

  "smart-pause": [
    { h: "A worked example: a shared inbox",
      p: ["You keep a support inbox on a 60-second refresh so new messages appear. A customer writes; you click into the reply box and start typing. At the 60-second mark the counter shows Waiting, you are typing, and nothing reloads. You finish, press Send, and a few seconds later the refresh resumes.",
        "Switch on Pause when you click as well, with Restart the countdown, and merely clicking into a message buys you another full minute to read it."] },
    { h: "Restart the countdown or stop refreshing?",
      sub: [
        ["Restart the countdown suits", "pages you dip in and out of: inboxes, admin lists, dashboards with filters. Refreshing carries on once you leave the page alone."],
        ["Stop refreshing suits", "pages you only want refreshed while you are away. The moment you come back and touch the page, the run ends."],
      ] },
    { h: "What smart pause cannot do",
      list: [
        "**It does not save your text.** Once you stop typing for a few seconds, the page reloads. Submit or copy first.",
        "**It does not see inside embedded frames** from other sites, such as some payment forms.",
        "**It does not pause for mouse movement alone.** Only typing, clicks and scrolling count.",
      ] },
    { h: "Auto refresh without losing form data",
      p: ["For a page with a long form, the safest set-up is Pause while typing plus Pause when you click with Stop refreshing. Your first click into the form ends the auto refresh entirely, and you restart it when you are done."] },
  ],

  "keep-scroll-position": [
    { h: "A worked example: a long league table",
      p: ["You are following a team in 14th place on a page that reloads to the top. Scroll to the row, switch on Keep scroll position, and start a 30-second refresh. Each reload, the page briefly loads and then returns to 14th place without you touching anything."] },
    { h: "How it decides where to return",
      p: ["Just before each reload the extension notes how far down and across the page you are. After the reload it scrolls there straight away, again when the page has finished loading, and once more a moment later for content that arrives late.",
        "If the page is now shorter than before, you land as close as the new length allows."] },
    { h: "Common mistakes",
      list: [
        "**Expecting it on endless feeds.** Posts loaded by scrolling are not there after a reload.",
        "**Scrolling during the reload.** Your movement cancels the restore for that load.",
        "**Leaving it off.** It is off by default; turn it on under Reloading.",
      ] },
    { h: "Best together with",
      p: ["[Pause when you scroll](features/smart-pause/), so reading is not interrupted, and a [content change rule](features/page-monitor-keyword-alert/) on the part of the page you are watching."] },
  ],

  "hard-reload-bypass-cache": [
    { h: "A worked example: a stylesheet that will not update",
      p: ["You change a colour in your site's CSS, reload, and nothing happens: the browser is using its saved copy. Turn on Hard reload, set a three-second interval and press Start. Every reload now fetches the stylesheet again, so each save shows up within seconds."] },
    { h: "Hard refresh, hard reload, force refresh: the same thing",
      p: ["People search for this under several names: hard refresh, hard reload, force refresh, force reload, Ctrl+F5. They all mean a reload that ignores the browser cache. Chrome's developer tools add one more, Empty Cache and Hard Reload, which also clears the stored files for that page first."],
      sub: [["Shortcuts, for when you only need it once", "Ctrl + Shift + R on Windows and Linux, Cmd + Shift + R on a Mac, in Chrome, Firefox and Edge. The [full list is in the guide](guides/how-to-hard-refresh/)."]] },
    { h: "Common mistakes",
      list: [
        "**Using it everywhere.** It slows every refresh and uses more data.",
        "**Blaming the browser for a server cache.** If a hard refresh shows the same old page, a CDN or caching plugin is the cause.",
        "**Very short intervals.** Give a hard reload time to finish: ten seconds or more on heavy pages.",
      ] },
  ],

  "refresh-limits": [
    { h: "A worked example: a two-hour sale",
      p: ["A flash sale runs from 6 to 8 pm. At 6, set a 30 to 60 second random refresh on the product page, type 120 into Stop after, and press Start. The popup shows Time left counting down from 2h 00m. At 8 the run ends, the counter reads Time's up, and nothing is left reloading overnight."] },
    { h: "Choosing between a time limit and a count limit",
      sub: [
        ["Use a time limit when", "the event has a clock: a sale, a match, a shift, a booking window."],
        ["Use a count limit when", "you want to bound the number of requests, for example no more than 200 checks of someone else's site."],
        ["Use both when", "you want whichever comes first, as a safety net."],
      ] },
    { h: "Common mistakes",
      list: [
        "**Leaving both at 0 on a long watch.** That means no limit at all.",
        "**Expecting pause to stop the clock.** The end time is fixed when you press Start.",
        "**A count limit that is too small.** At 30 seconds, 100 refreshes lasts only 50 minutes.",
      ] },
  ],

  "profiles-and-backup": [
    { h: "A worked example: three profiles",
      p: ["Set up a restock watch (30 to 60 seconds, Stop when text disappears, a two-hour limit) and save it as Restock. Change the form to a fixed 300 seconds with the page counter off and save it as Dashboard. Then three seconds with Hard reload on, saved as Dev. From then on, the Profile menu at the top of the popup loads any of them in one click."] },
    { h: "What is saved, and what is not",
      list: [
        "**Saved in a profile:** every setting, including the watch text.",
        "**Saved separately:** which settings are pinned, and your language.",
        "**Remembered pages:** with Remember this page switched on (Advanced settings, Start automatically), the page you start on is kept with its settings and starts again by itself when it is reopened, also after a browser restart. Press Stop to forget it.",
      ] },
    { h: "Moving to a new computer",
      p: ["On the old machine, open All settings and choose Export to file. On the new one, install the extension, open All settings and choose Import from file. Settings and pins are replaced; profiles are merged."] },
  ],

  "languages": [
    { h: "Auto refresh in Romanian, Russian and more",
      p: ["If your browser is set to Romanian, the extension opens in Romanian: Pornește instead of Start, Setări avansate instead of Advanced settings. The same goes for Russian, Chinese, Japanese, Bengali and Thai. Nothing needs to be chosen."] },
    { h: "What is translated",
      list: [
        "The popup and the full settings page.",
        "The counter shown on the web page.",
        "The desktop notification when a watch rule matches.",
        "The explanation behind every (i) icon.",
      ] },
    { h: "What is not translated yet",
      p: ["The store listings and this website are in English. Watch text is never translated: type the phrase exactly as it appears on the page you are watching, in that page's language."] },
  ],
};
