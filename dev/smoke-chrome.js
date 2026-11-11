// Development only: loads dist-chrome/ into a real, throwaway Chrome (headless, temporary
// profile) and checks that the extension actually starts and refreshes a page.
// Needs the preview server for a page to refresh:  npm run preview
//   node dev/smoke-chrome.js          (PORT=4174 if the preview server is not on 4173)
//
// Branded Chrome no longer accepts --load-extension, so this talks to Chrome over the
// DevTools Protocol pipe and loads the folder with Extensions.loadUnpacked.
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("assert");

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const EXT_DIR = path.resolve(__dirname, "..", "dist-chrome");
const TEST_PAGE = `http://localhost:${process.env.PORT || 4173}/dev/page.html`;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "far-smoke-"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Minimal DevTools Protocol client over Chrome's --remote-debugging-pipe (fd 3 in, fd 4 out,
// messages separated by a NUL byte), using flat sessions to talk to individual targets.
function client(chrome) {
  const [, , , toChrome, fromChrome] = chrome.stdio;
  const pending = new Map();
  const errors = new Map(); // sessionId -> messages
  const worlds = new Map(); // sessionId -> id of the extension's content-script world, when there is one
  let nextId = 1;
  let buffer = "";

  fromChrome.setEncoding("utf8");
  fromChrome.on("data", (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\0")) !== -1) {
      const msg = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);

      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
        continue;
      }

      if (msg.method === "Runtime.executionContextCreated") {
        const ctx = msg.params.context;
        if (ctx.auxData?.type === "isolated" && ctx.origin.startsWith("chrome-extension://")) worlds.set(msg.sessionId, ctx.id);
        continue;
      }

      let text = null;
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params.exceptionDetails;
        text = d.exception?.description || d.text;
      } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        text = msg.params.args.map((a) => a.value ?? a.description).join(" ");
      }

      if (text) errors.set(msg.sessionId, [...(errors.get(msg.sessionId) || []), text]);
    }
  });

  function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
      toChrome.write(JSON.stringify({ id, method, params, sessionId }) + "\0");
    });
  }

  // Attaches to a target and returns helpers bound to it
  async function attach(targetId) {
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    await send("Runtime.enable", {}, sessionId);
    return {
      errors: () => errors.get(sessionId) || [],
      // world: "content" runs the expression inside the extension's content script on this page
      async evaluate(expression, world) {
        const params = { expression, awaitPromise: true, returnByValue: true };
        if (world === "content") {
          if (!worlds.has(sessionId)) throw new Error("no content script on this page");
          params.contextId = worlds.get(sessionId);
        }

        const r = await send("Runtime.evaluate", params, sessionId);
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
    };
  }

  return { send, attach };
}

async function waitFor(fn, what, ms = 15000) {
  const end = Date.now() + ms;
  let last;
  while (Date.now() < end) {
    try {
      const v = await fn();
      if (v) return v;
    } catch (e) {
      last = e;
    }

    await sleep(300);
  }

  throw new Error(`Timed out waiting for ${what}${last ? ` (${last.message})` : ""}`);
}

async function main() {
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--user-data-dir=${profile}`,
    "--remote-debugging-pipe",
    "--enable-unsafe-extension-debugging",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });

  try {
    const cdp = client(chrome);
    const version = await waitFor(() => cdp.send("Browser.getVersion"), "Chrome to start");
    console.log("Chrome:", version.product);

    /* load the extension, find its service worker */
    const { id: extId } = await cdp.send("Extensions.loadUnpacked", { path: EXT_DIR });
    const swTarget = await waitFor(async () => {
      const { targetInfos } = await cdp.send("Target.getTargets");
      return targetInfos.find((t) => t.type === "service_worker" && t.url === `chrome-extension://${extId}/background.js`);
    }, "the extension's service worker");
    const sw = await cdp.attach(swTarget.targetId);

    await waitFor(() => sw.evaluate(`typeof ARSettings === "object" && typeof startTab === "function"`), "the service worker's scripts");
    const loaded = await sw.evaluate(`({ settings: ARSettings.SETTINGS.length, langs: ARI18n.LANGS.length, version: chrome.runtime.getManifest().version })`);
    assert.strictEqual(loaded.version, require("../package.json").version);
    assert.ok(loaded.settings >= 19 && loaded.langs === 7);
    const pinned = await waitFor(async () => (await sw.evaluate(`chrome.storage.local.get("pinned")`)).pinned, "pins to be set on install");
    assert.deepStrictEqual(pinned, [], "a fresh install starts with the simple view");
    console.log("service worker ok:", JSON.stringify(loaded));

    const openPage = async (url) => {
      const { targetId } = await cdp.send("Target.createTarget", { url });
      return { targetId, page: await cdp.attach(targetId) };
    };

    /* settings page and popup render without errors */
    // What the popup's "Edit" link leaves for the settings page: open at the presets
    await sw.evaluate(`chrome.storage.session.set({ optionsFocus: { id: "presetsSection", at: Date.now() + 60000 } })`);
    for (const [file, check, ok] of [
      ["options.html",
        `({ controls: document.querySelectorAll("main [data-key]").length, back: !!document.getElementById("back"), langs: document.getElementById("lang").options.length, presets: document.querySelectorAll("#presetList input").length / 2, focused: Math.abs(document.getElementById("presetsSection").getBoundingClientRect().top) < 5 })`,
        (r) => r.controls >= 19 && r.back && r.langs === 8 && r.presets === 5 && r.focused],
      ["popup.html",
        `({ controls: document.querySelectorAll("#coreFields [data-key]").length, start: document.getElementById("toggle").textContent, logo: document.querySelector("header img").naturalWidth, presets: [...document.querySelectorAll("#presets .chip")].map((c) => c.textContent).join() })`,
        (r) => r.controls === 2 && r.start === "Start" && r.logo === 48 && r.presets === "5–10s,15–30s,30–60s,1–2 min,5 min"],
    ]) {
      const { targetId, page } = await openPage(`chrome-extension://${extId}/${file}`);
      const result = await waitFor(async () => {
        const r = await page.evaluate(check);
        return r.controls ? r : null;
      }, file + " to render");
      assert.ok(ok(result), `${file} looks wrong: ${JSON.stringify(result)}`);
      assert.deepStrictEqual(page.errors(), [], file + " logged errors");
      console.log(file, "ok:", JSON.stringify(result));
      await cdp.send("Target.closeTarget", { targetId });
    }

    /* refresh a real page */
    const tabIds = () => sw.evaluate(`chrome.tabs.query({}).then((tabs) => tabs.map((t) => t.id))`);
    const before = await tabIds();
    const { page } = await openPage(TEST_PAGE);
    await waitFor(() => page.evaluate(`document.readyState === "complete" && document.body.innerText.length > 20`),
      "the test page (is `npm run preview` running?)");
    const tabId = await waitFor(async () => (await tabIds()).find((id) => !before.includes(id)), "the test tab");

    await page.evaluate(`window.scrollTo(0, 600)`);
    const loadedAt = await page.evaluate(`document.getElementById("at").textContent`);
    const started = await sw.evaluate(`startTab(${tabId}, { min: 2, max: 2, toolbarBadge: "countdown", keepScroll: true, remember: true })`);
    assert.strictEqual(started.running, true);

    for (let i = 0; i < 8; i++) {
      await sleep(2000);
      const snap = await sw.evaluate(`withState((d) => d[${tabId}] || null, false).then((s) => s && ({ count: s.refreshCount, nextIn: s.nextAt ? s.nextAt - Date.now() : null }))`);
      const cs = await page.evaluate(`({ dead, hasTimer: !!timer, count: st && st.refreshCount, msLeft: nextAt - Date.now() })`, "content").catch((e) => e.message.slice(0, 40));
      console.log(`  t+${(i + 1) * 2}s  worker:`, JSON.stringify(snap), " page:", JSON.stringify(cs));
    }
    const st = await sw.evaluate(`withState((d) => d[${tabId}] || null, false)`);
    const tab = await sw.evaluate(`chrome.tabs.get(${tabId})`);
    // Chrome clears a tab's badge while the page reloads, so ask again if it is caught empty
    const badgeText = await waitFor(() => sw.evaluate(`chrome.action.getBadgeText({ tabId: ${tabId} })`), "the toolbar badge", 5000).catch(() => "");
    const onPage = await page.evaluate(`({ badge: !!document.querySelector("auto-refresh-badge"), scrollY: Math.round(window.scrollY), reloaded: document.getElementById("at").textContent !== ${JSON.stringify(loadedAt)} })`);
    const inner = await page.evaluate(`({ dead, hasTimer: !!timer, hidden: document.hidden, count: st && st.refreshCount, msLeft: nextAt - Date.now() })`, "content").catch((e) => "content script: " + e.message);
    console.log("content script:", JSON.stringify(inner), "| page errors:", JSON.stringify(page.errors()), "| worker errors:", JSON.stringify(sw.errors()));
    console.log("after 9s:", JSON.stringify({
      refreshCount: st?.refreshCount, nextAt: st?.nextAt, tabStatus: tab.status, autoDiscardable: tab.autoDiscardable, toolbarBadge: badgeText, ...onPage,
    }));

    assert.ok(st?.running && st.refreshCount >= 2, "the page should have been refreshed at least twice");
    assert.strictEqual(tab.autoDiscardable, false, "keep-awake should work without the tabs permission");
    assert.ok(onPage.badge, "the on-page badge should be shown");
    assert.ok(/^(\d+|…)$/.test(badgeText), "the toolbar badge should show a countdown");
    assert.ok(Math.abs(onPage.scrollY - 600) < 60, "scroll position should be restored");

    /* "Remember this page": the page is noted while it runs, and Stop forgets it */
    const rememberedPages = () => sw.evaluate(`chrome.storage.local.get("pages").then((r) => Object.keys(r.pages || {}))`);
    assert.strictEqual(st.page, TEST_PAGE, "the background should learn the page's address from its content script");
    assert.deepStrictEqual(await rememberedPages(), [TEST_PAGE]);

    await sw.evaluate(`stopTab(${tabId})`);
    assert.strictEqual((await sw.evaluate(`chrome.tabs.get(${tabId})`)).autoDiscardable, true, "the tab may sleep again after stopping");
    assert.deepStrictEqual(await rememberedPages(), [], "Stop forgets the page");

    /* a remembered page starts by itself when it is opened, as after a browser restart */
    const again = TEST_PAGE + "?again=1";
    await sw.evaluate(`chrome.storage.local.set({ pages: { ${JSON.stringify(again)}: { cfg: { min: 2, max: 2, remember: true }, at: Date.now() } } })`);
    const known = await tabIds();
    const { page: page2 } = await openPage(again + "#section");
    const tab2 = await waitFor(async () => (await tabIds()).find((id) => !known.includes(id)), "the second tab");
    const resumed = await waitFor(() => sw.evaluate(`withState((d) => d[${tab2}] || null, false)`), "the remembered page to start by itself");
    assert.ok(resumed.running && resumed.page === again && resumed.refreshCount === 0, "it starts without an extra refresh");
    const firstLoad = await page2.evaluate(`document.getElementById("at").textContent`);
    await waitFor(() => sw.evaluate(`withState((d) => d[${tab2}].refreshCount >= 2, false)`), "the remembered page to keep refreshing", 40000);
    assert.notStrictEqual(await page2.evaluate(`document.getElementById("at").textContent`), firstLoad);
    await waitFor(() => page2.evaluate(`!!document.querySelector("auto-refresh-badge")`), "the on-page badge on a resumed page");
    console.log("remembered page ok:", JSON.stringify({ startedBy: "opening the page", urlVisibleToTabsApi: !!(await sw.evaluate(`chrome.tabs.get(${tab2})`)).url }));
    await sw.evaluate(`stopTab(${tab2})`);
    assert.deepStrictEqual(await rememberedPages(), []);
    assert.deepStrictEqual(sw.errors(), [], "the service worker logged errors");

    console.log("real Chrome smoke test passed");
  } finally {
    chrome.kill();
    await sleep(1500);
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 400 });
    } catch (e) {
      console.warn("(could not remove the temporary profile at " + profile + ")");
    }
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  }
);
