// Long-form additions for the use-case and browser pages, keyed by slug. Merged over pages.js.
// Rule for every use case: the extension reloads and alerts. It never clicks, buys, books or bypasses limits.

const fair = "Use intervals that are reasonable for the site and only monitor pages you are allowed to access. The extension does not get around logins, queues, rate limits or other access restrictions.";

module.exports = {
  "restock-alerts": {
    nav: "Restock alerts", icon: "package-check", shotTitle: "Restock alerts", caption: "Watching for a useful update",
    h1: ["Keep an eye on", "a product restock."],
    sections: [
      { h: "A restock alert for any online shop",
        p: ["Shops rarely tell you when a sold-out item returns, and their own back in stock notification emails often arrive after it has gone again. A restock alert you run yourself checks the product page every minute or so and tells you the moment the wording changes.",
          "Because it runs in your own browser tab, it works on any shop, including ones you are signed in to, and needs no account."] },
      { h: "In stock alert: which text to watch",
        sub: [
          ["Stop when text disappears", "Watch the sold-out message, such as Out of stock, Sold out or Currently unavailable. This is usually the most reliable signal."],
          ["Stop when text appears", "Watch for Add to cart or In stock. Use this only if that text is not already shown elsewhere on the page."],
          ["Stop when content changes", "If the wording is unpredictable, point a CSS selector at the availability box and be alerted on any change."],
        ] },
      { h: "A thoughtful way to monitor restocks", p: [fair, "Stay signed in with payment details saved, so you can check out quickly when the notification arrives. You complete the purchase yourself."] },
    ],
    faqs: [
      ["Can I use Free Auto Refresh for restock alerts?", "Yes. Set an interval, add a watch rule for the availability text, and it notifies you when the wording changes."],
      ["Does it get around queues, logins or purchase limits?", "No. It makes the same request as pressing reload."],
      ["How often should it check?", "Every 30 to 60 seconds at random is a sensible start. Faster checking risks being rate-limited."],
      ["Do I need to keep the tab open?", "Yes, and the browser running. Keep the tab awake is on by default so it is not put to sleep."],
    ],
  },
  "price-tracking": {
    nav: "Price changes", icon: "tag", shotTitle: "Price watch", caption: "Alert on any price change",
    h1: ["Know the moment", "a price changes."],
    sections: [
      { h: "A price drop alert without an account",
        p: ["Price tracker extensions usually cover a handful of big shops and want you to sign up. This takes a simpler route: it watches the price on the exact page you have open and tells you when that number changes. It works on any site that shows a price, including flights, hotels and classifieds."] },
      { h: "How to watch only the price",
        p: ["Right-click the price, choose Inspect, and note its id or class. Enter that as the selector in Stop when content changes, for example #price or .product-price. Now banners, timers and recommendations on the same page are ignored."],
        sub: [["What you are told", "That the watched text changed, not whether it went up or down. Open the tab to see the new price. There is no price history chart."]] },
      { h: "Checking politely", p: ["Prices do not change by the second. An interval of two to five minutes is plenty.", fair] },
    ],
    faqs: [
      ["Is this a price tracker extension?", "It alerts you when the price on a page changes. It does not keep a price history or compare shops."],
      ["Can it alert only below a target price?", "No. It reports any change to the watched element."],
      ["Does it work on any shop?", "On any page that shows the price as text in the page."],
      ["Why am I getting alerts when the price is the same?", "Something else on the page changed. Add a CSS selector for the price so only that is watched."],
    ],
  },
  "ticket-sales": {
    nav: "Ticket drops", icon: "ticket", shotTitle: "Ticket watch", caption: "Waiting for availability",
    h1: ["Catch a ticket drop", "without the reload button."],
    sections: [
      { h: "A ticket alert for returns and resale",
        p: ["Sold-out events often release a few more tickets: returns, production holds, face-value resale. They appear without warning and go quickly. Leaving the event page on a gentle auto refresh with a watch rule means you hear about it without sitting on the page."] },
      { h: "Set it up to be safe",
        list: [
          "**Never refresh inside a queue or waiting room.** Reloading there can lose your place.",
          "**Use a random range**, such as 20 to 45 seconds, and a time limit.",
          "**Watch the sold-out wording** with Stop when text disappears.",
          "**Leave Pause while typing on** so a reload never interrupts checkout.",
        ] },
      { h: "Check the ticket site's rules", p: ["Many ticket sellers limit automated activity and may slow or block browsers that reload too often. Read their terms and keep to moderate intervals.", fair] },
    ],
    faqs: [
      ["Will it buy tickets for me?", "No. It reloads the page and alerts you. You buy them yourself."],
      ["Can it skip the queue?", "No, and you should not run it while queuing."],
      ["How fast can I refresh a ticket page?", "Technically every second, but 20 to 45 seconds is far less likely to get you blocked."],
      ["Does it work with resale pages?", "Yes, on any page where availability is shown as text."],
    ],
  },
  "appointment-slots": {
    nav: "Appointment availability", icon: "calendar-check", shotTitle: "Slot watch", caption: "Checking for a free slot",
    h1: ["Find a slot", "without checking all day."],
    sections: [
      { h: "An appointment checker that runs in your browser",
        p: ["Cancellations put appointments back into booking systems at unpredictable times. An appointment checker keeps the availability page fresh and tells you when the no-slots message goes away, whether that is a driving test, a clinic, a council service or a visa slot."] },
      { h: "Setting up a slot watch",
        p: ["Sign in, go to the page that lists dates, and copy the exact message shown when nothing is free. Use Stop when text disappears with that message, a random interval of one to three minutes, and leave the tab open."],
        sub: [["Staying signed in", "Regular reloads keep many sessions alive, but some portals sign you out after a fixed time. If the page shows a login form, the watch rule will see the message disappear and alert you, so check the tab."]] },
      { h: "Official portals deserve extra care", p: ["Government and visa booking systems often cap how many times you may load a page, and can lock an account that exceeds it. Use long intervals, follow the portal's published rules, and make the booking yourself.", fair] },
    ],
    faqs: [
      ["Is this a visa slot checker?", "It can watch any booking page for a change, including visa appointment pages. It does not log in, select dates or book for you."],
      ["Will it book the appointment?", "No. It notifies you and you book."],
      ["How often should it check?", "Every one to three minutes. Faster checking risks locking your account on official portals."],
      ["Why did it alert when no slot was free?", "The page probably changed for another reason, such as a session timeout. Check the tab and sign in again."],
    ],
  },
  "online-auctions": {
    nav: "Auctions and launches", icon: "gavel", shotTitle: "Auction watch", caption: "Current bid kept fresh",
    h1: ["Follow the bidding", "to the last second."],
    sections: [
      { h: "Keep an auction page current",
        p: ["Some auction and limited-release pages only show a new bid or status after a reload. A short refresh interval in the closing minutes keeps the real figure in front of you, with your scroll position held so the bid box stays in view."] },
      { h: "Bid without being interrupted",
        p: ["Leave Pause while typing on. If a refresh comes due while you are entering an amount, it waits. You can also watch the current-bid element with Stop when content changes to be told the instant someone outbids you; press Start again to keep following."] },
      { h: "Short bursts only", p: ["Reload every five to ten seconds just for the final minutes, and use a longer interval before then.", fair] },
    ],
    faqs: [
      ["Can it place bids for me?", "No. It refreshes and alerts only."],
      ["Will a refresh clear a bid I am typing?", "Not while you are typing. Smart pause holds the reload."],
      ["Does it work for product launches and drops?", "Yes. Watch for the Coming soon text to disappear."],
      ["How fast should I refresh near the end?", "Five to ten seconds, briefly."],
    ],
  },
  "exam-results": {
    nav: "Results pages", icon: "graduation-cap", shotTitle: "Results watch", caption: "Waiting for publication",
    h1: ["Be told when", "results are out."],
    sections: [
      { h: "Stop reloading the results page by hand",
        p: ["On results day thousands of people refresh the same page. Set a watch on the not-yet-published message, pick a relaxed interval, and do something else. The notification arrives when the wording changes."] },
      { h: "Be kind to a busy server",
        p: ["Results sites are overloaded exactly when you want them. A random interval of one to two minutes gets you the news almost as fast as hammering the page, and does not add to the problem. If the page fails to load, the next refresh simply tries again."] },
      { h: "Private", p: ["Your candidate number and your results stay in your browser. Nothing is read by or sent to anyone else.", fair] },
    ],
    faqs: [
      ["What if the page has no fixed message?", "Use Stop when content changes, ideally with a selector for the results area."],
      ["Will it help if the site is down?", "It keeps retrying for you, but it cannot make the site respond."],
      ["Can it work behind a student login?", "Yes, in your signed-in tab."],
      ["Does it work for admissions and lottery results?", "Yes. Any page whose text changes when a result is published."],
    ],
  },
  "order-and-application-status": {
    nav: "Status pages", icon: "clipboard-check", shotTitle: "Status watch", caption: "Waiting for the next step",
    h1: ["Stop checking.", "Get told when it moves."],
    sections: [
      { h: "Order, delivery and application status alerts",
        p: ["Parcels, refunds, visa and job applications all have a status line that changes a few times over days or weeks. Checking it by hand is tedious. Watch the status element instead and be notified on the first change."] },
      { h: "Slow pages, slow intervals",
        p: ["Status pages rarely change more than a few times a day, so check every five to ten minutes. Add a selector for the status text; without one, any change on the page counts, including clocks and adverts."] },
      { h: "Leave it running", p: ["Keep the tab awake is on by default so the browser does not put the tab to sleep.", fair] },
    ],
    faqs: [
      ["Will it keep me signed in?", "Often, since reloads keep a session active. Some sites still sign you out after a set time."],
      ["Can I track several orders?", "Yes, one tab each."],
      ["What if I close the browser?", "Refreshing stops. Open the page and press Start again."],
      ["Does it read my order details?", "Only to compare the watched text locally. Nothing leaves your browser."],
    ],
  },
  "live-dashboards": {
    nav: "Dashboards", icon: "layout-dashboard", shotTitle: "Dashboard refresh", caption: "Updated every 5 minutes",
    h1: ["Dashboards that", "stay up to date."],
    sections: [
      { h: "Auto refresh a dashboard on a wall screen",
        p: ["Many reporting and BI dashboards only update when the page reloads. On a wall screen or second monitor, that means stale numbers until someone walks over. A fixed five-minute auto refresh keeps them current all day."] },
      { h: "Set up for an unattended screen",
        list: ["**Hide the on-page counter** for a clean display.", "**Keep the tab awake** so the browser does not unload it.", "**Turn on Hard reload** if figures look cached.", "**Use a fixed interval**; there is no need for random timing on your own tools."] },
      { h: "Good to know", p: ["Switch on Remember this page (Advanced settings, Start automatically) before you press Start, and the dashboard starts refreshing by itself when the browser is reopened. Without it, press Start, or Alt+Shift+R, when the screen comes back on."] },
    ],
    faqs: [
      ["How do I refresh a dashboard every 5 minutes?", "Set both Min and Max to 300 seconds and press Start."],
      ["Does it work in kiosk or full-screen mode?", "Yes. Start it before entering full screen, or use the keyboard shortcut."],
      ["Can I refresh several dashboards?", "Yes. Each tab has its own timer."],
      ["Will the dashboard log me out?", "Regular reloads usually keep the session alive."],
    ],
  },
  "server-and-status-pages": {
    nav: "Builds and queues", icon: "server", shotTitle: "Build watch", caption: "Waiting for Success",
    h1: ["Get told when", "the build finishes."],
    sections: [
      { h: "Watch a build, deploy or job page",
        p: ["CI pipelines, long-running jobs and support queues all end with a word: Success, Failed, Complete. Set a watch for that word, switch to other work, and let the notification and flashing tab title bring you back."] },
      { h: "One rule for both outcomes",
        p: ["If a job can end in success or failure, watch for the Running text to disappear. That fires either way. On your own tools a five to ten second interval is fine."] },
      { h: "Works on internal sites", p: ["It runs on any http or https page your browser can reach, including localhost and intranet addresses."] },
    ],
    faqs: [
      ["Does it work on localhost?", "Yes."],
      ["Can it watch a support or ticket queue?", "Yes. Use Stop when content changes with a selector for the queue list."],
      ["Will it notify me in another window?", "Yes, with a desktop notification and a flashing tab title."],
      ["Can it restart the build?", "No. It only watches and alerts."],
    ],
  },
  "web-development": {
    nav: "Web development", icon: "code", shotTitle: "Live reload", caption: "Fresh every 3 seconds",
    h1: ["Live reload,", "with nothing to set up."],
    sections: [
      { h: "Auto reload localhost without a build tool",
        p: ["Live reload normally needs a dev server or a plugin. When you are editing a static page, a legacy site or a remote staging server, that is not always possible. Putting the preview tab on a three-second timer gives you the same effect with no configuration."] },
      { h: "Settings that suit development",
        list: ["**Hard reload** so new CSS and JavaScript are never served from cache.", "**Keep scroll position** to stay on the section you are styling.", "**Pause while typing** when testing forms.", "**Alt+Shift+R** to start and stop without leaving the keyboard."] },
      { h: "When a real live-reload tool is better", p: ["A timer reloads whether or not anything changed. On large projects a file-watching tool is more efficient. Use this for quick jobs and for sites you cannot add tooling to."] },
    ],
    faqs: [
      ["Is this a live reload extension?", "It reloads on a timer, not on file save. For small projects the result is much the same."],
      ["Does it work with file:// pages?", "Only if you allow the extension access to file URLs in the browser's extension settings."],
      ["Will it show my latest CSS?", "Yes, with Hard reload on."],
      ["Does it work with any framework?", "Yes. It only reloads the tab."],
    ],
  },
  "job-boards": {
    nav: "Job boards", icon: "briefcase", shotTitle: "Job watch", caption: "New listing spotted",
    h1: ["See new jobs", "as they are posted."],
    sections: [
      { h: "Be early without living on the page",
        p: ["Applications sent in the first hours get more attention. Keep your filtered search open, watch the results list for changes, and be notified when something new appears."] },
      { h: "Watch the list, not the page",
        p: ["Add a CSS selector for the results container so only new listings trigger an alert. Turn on Pause when you scroll so the page does not reload while you are reading."] },
      { h: "Respect the job site", p: ["Some job sites restrict automated reloading. A check every two to five minutes is plenty, and most offer email alerts as well.", fair] },
    ],
    faqs: [
      ["Can it apply for jobs?", "No. It alerts you to changes."],
      ["How often should I check?", "Every two to five minutes."],
      ["Why does it alert when there is no new job?", "Watch the results list with a selector; otherwise adverts and counters trigger it."],
      ["Do job sites allow this?", "It varies. Read the site's terms."],
    ],
  },
  "freelance-marketplaces": {
    nav: "Freelance marketplaces", icon: "triangle-alert", shotTitle: "Read this first", caption: "Check the platform's rules",
    h1: ["Freelance marketplaces:", "refresh with care."],
    sections: [
      { h: "Why this page is a warning, not a recipe",
        p: ["Freelancers want a fresh project feed, because early bids win. But several large marketplaces explicitly ban refresh and automation tools, and accounts have been restricted or closed for using them. An account is worth far more than a faster feed."] },
      { h: "Safer ways to see new projects first",
        list: ["**Saved searches and email alerts** offered by the platform.", "**The platform's mobile app** with push notifications.", "**RSS feeds**, where the marketplace provides them."] },
      { h: "If the platform allows it", p: ["Use long random intervals of three to seven minutes, a time limit, and watch only the project list.", fair] },
    ],
    faqs: [
      ["Is auto refresh allowed on freelance sites?", "On several major ones, no. Check the terms of service first."],
      ["Can the marketplace detect it?", "Sites can see how often a page is requested. Frequent, regular requests stand out."],
      ["What is the safest option?", "The platform's own alerts."],
      ["Will Free Auto Refresh bid for me?", "No."],
    ],
  },
  "wordpress": {
    nav: "WordPress", icon: "file-code", shotTitle: "WordPress preview", caption: "No plugin required",
    h1: ["Auto refresh WordPress.", "No plugin needed."],
    sections: [
      { h: "Refresh a WordPress page from the browser",
        p: ["WordPress auto refresh plugins add code to your site. For your own use you do not need one: the reload can happen in your browser, on any WordPress site you can open, with nothing installed on the server."] },
      { h: "Common WordPress uses",
        sub: [
          ["Theme and CSS editing", "Reload the front-end preview every few seconds with Hard reload on."],
          ["WooCommerce orders", "Leave the orders screen open and be notified when the list changes."],
          ["Comments and form entries", "Watch the list with Stop when content changes."],
        ] },
      { h: "If the page will not update", p: ["A caching plugin or CDN is serving a stored copy. Purge that cache or exclude the page; a browser reload cannot bypass a server-side cache."] },
    ],
    faqs: [
      ["Do I need a WordPress plugin?", "No. It works from your browser."],
      ["Will visitors see the page refreshing?", "No. Only your own tab reloads."],
      ["Does it work in wp-admin?", "Yes, on any admin screen."],
      ["Will it lose a post I am writing?", "Pause while typing holds the reload, but save your draft first."],
    ],
  },
  "sports-scores": {
    nav: "Live scores", icon: "trophy", shotTitle: "Live scores", caption: "Updated every 30 seconds",
    h1: ["Live scores that", "update themselves."],
    sections: [
      { h: "For score pages that do not refresh on their own",
        p: ["Plenty of score and text-commentary pages stay frozen until you reload them. A 30-second timer keeps them current through the whole match, with your scroll position held on your fixture."] },
      { h: "Get told when the score changes",
        p: ["Watch the score element with Stop when content changes for a notification on every goal or wicket. Press Start again afterwards to keep following."] },
      { h: "Not for video", p: ["A reload restarts any video on the page. Use this on text and score pages, not live streams."] },
    ],
    faqs: [
      ["How often should a score page refresh?", "Every 30 seconds is enough for most sports."],
      ["Will it stop when the match ends?", "Set Stop after to the length of the game, plus a margin."],
      ["Does it work on any sport's site?", "On any page that shows the score as text."],
      ["Will it interrupt a stream?", "Yes. Do not use it on a page playing video."],
    ],
  },
  "stocks-and-crypto": {
    nav: "Price pages", icon: "chart-line", shotTitle: "Quote refresh", caption: "Fresh every minute",
    h1: ["Keep quote pages", "current."],
    sections: [
      { h: "For pages that only update on reload",
        p: ["Some quote, watchlist and exchange pages do not stream prices. A one-minute refresh keeps the figures recent, and a watch rule on one number can tell you when it moves."] },
      { h: "This is not a trading tool",
        p: ["Page reloads are much slower than a market data feed, and prices on free pages are often delayed. Do not rely on this for time-critical decisions, and never refresh a page while placing an order."] },
      { h: "Private", p: ["Your watchlists and holdings are never read by or sent to anyone. Everything runs locally."] },
    ],
    faqs: [
      ["Can it alert at a target price?", "No. It tells you a watched figure changed, not the direction or amount."],
      ["How often should it refresh?", "Every 30 to 60 seconds."],
      ["Will it log me out of my broker?", "Reloading can interrupt some trading sessions. Use it on read-only quote pages."],
      ["Does it work on crypto exchanges?", "On any page that shows the price as text."],
    ],
  },

  /* ---------- browsers ---------- */
  "chrome": {
    nav: "Chrome extension", icon: "chrome", shotTitle: "Chrome Web Store", caption: "Free, no account",
    h1: ["The free auto refresh", "Chrome extension."],
    sections: [
      { h: "Auto refresh Chrome on a timer",
        p: ["Chrome cannot reload a tab on a schedule by itself. This auto refresh Chrome extension adds that: choose an interval, press Start, and the page reloads until you stop it. It also works as a tab reloader in Edge, Brave, Opera and other Chromium browsers."] },
      { h: "What you get, free",
        list: ["[Auto refresh timer](features/auto-refresh-timer/) with presets and custom seconds", "[Random intervals](features/random-interval-refresh/)", "[Page change monitor](features/page-monitor-keyword-alert/) with desktop alerts", "[Smart pause](features/smart-pause/) while you type, click or scroll", "[Hard reload](features/hard-reload-bypass-cache/), limits, profiles and 7 languages"] },
      { h: "Small and private",
        p: ["The extension asks for storage, notifications and access to the pages you refresh. It collects no data, shows no ads and makes no network requests. The source code is public on GitHub."] },
    ],
    faqs: [
      ["How do I add auto refresh to Chrome?", "Open the Chrome Web Store listing, click Add to Chrome, then pin the icon from the puzzle-piece menu."],
      ["Can Chrome auto refresh without an extension?", "Not repeatedly. See [how to auto refresh a page](guides/how-to-auto-refresh-a-page/) for the one-off script method."],
      ["Does it work on Chromebooks?", "Yes, in Chrome on ChromeOS."],
      ["Does it work in Edge, Brave and Opera?", "Yes. They install extensions from the Chrome Web Store."],
      ["Does it work in Chrome on Android or iPhone?", "No. Mobile Chrome does not support extensions."],
    ],
  },
  "firefox": {
    nav: "Firefox add-on", icon: "globe", shotTitle: "Firefox Add-ons", caption: "No data collected",
    h1: ["Auto refresh for Firefox,", "free and private."],
    sections: [
      { h: "A Firefox auto reload add-on",
        p: ["Firefox has no auto refresh setting. This add-on reloads the tab you choose on a fixed or random timer, and can stop and notify you when the page changes. It is the same extension as the Chrome version, with every feature."] },
      { h: "Built with Firefox's privacy rules in mind",
        p: ["The add-on declares to Mozilla that it collects no data, and it makes no network requests. Its packaged code is readable and matches the public source."] },
      { h: "Tips for Firefox",
        list: ["Change the shortcut under Add-ons, the gear menu, **Manage Extension Shortcuts**.", "To stop a website refreshing itself, see [how to stop auto refresh](guides/how-to-stop-auto-refresh/).", "The hard refresh shortcut in Firefox is Ctrl + Shift + R."] },
    ],
    faqs: [
      ["How do I auto refresh a tab in Firefox?", "Install the add-on, open the page, click the icon, set an interval and press Start."],
      ["Is it the same as the Chrome version?", "Yes, the same code and features."],
      ["Does it work in private windows?", "Only if you allow it to run in private windows in the add-on's settings."],
      ["Which Firefox version do I need?", "Firefox 140 or newer on desktop."],
    ],
  },
};
