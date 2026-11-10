// Development only: full-page screenshots of the built website, taken with headless Chrome.
// Needs the preview server:  npm run preview
//   node dev/shots.js <outDir> <path>[@width] ...      e.g.  node dev/shots.js shots index.html features/index.html@390
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const [outDir, ...targets] = process.argv.slice(2);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "far-shots-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const chrome = spawn(CHROME, ["--headless=new", `--user-data-dir=${profile}`, "--remote-debugging-pipe", "--no-first-run", "--hide-scrollbars", "about:blank"],
    { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
  const pending = new Map();
  let id = 0, buf = "";
  chrome.stdio[4].setEncoding("utf8");
  chrome.stdio[4].on("data", (c) => {
    buf += c;
    let end;
    while ((end = buf.indexOf("\0")) !== -1) {
      const msg = JSON.parse(buf.slice(0, end));
      buf = buf.slice(end + 1);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || {}); pending.delete(msg.id); }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((res) => {
    pending.set(++id, res);
    chrome.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + "\0");
  });

  try {
    await sleep(1500);
    for (const t of targets) {
      const [page, w = "1280"] = t.split("@");
      const width = Number(w);
      const { targetId } = await send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 }, sessionId);
      await send("Page.enable", {}, sessionId);
      await send("Page.navigate", { url: `http://localhost:4173/docs/${page}` }, sessionId);
      await sleep(2500);
      await send("Runtime.evaluate", { expression: "document.getElementById('cookieBanner')?.classList.remove('show')" }, sessionId);
      const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 70, captureBeyondViewport: true }, sessionId);
      const file = path.join(outDir, `${page.replace(/[\/\\]/g, "_").replace(".html", "")}-${width}.jpg`);
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      console.log(file);
      await send("Target.closeTarget", { targetId });
    }
  } finally {
    chrome.kill();
    await sleep(800);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) {}
    process.exit(0);
  }
})();
