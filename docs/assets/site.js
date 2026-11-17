/* Website behaviour (jQuery): mobile menu, cookie consent with opt-in analytics, contact form. */
$(function () {
  /* ---------- mobile menu ---------- */
  $("#navToggle").on("click", function () {
    var open = $("#nav").toggleClass("hidden").hasClass("hidden") === false;
    $("#nav").toggleClass("flex", open);
    $(this).attr("aria-expanded", String(open));
  });

  /* ---------- cookie consent: Microsoft Clarity's cookies wait for Accept (Google Analytics runs through Google Tag Manager in <head>) ---------- */
  var KEY = "cookie-consent";

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function loadAnalytics() {
    if (window.analyticsLoaded) return;
    window.analyticsLoaded = true;

    /* Microsoft Clarity is already running from <head> without cookies; Accept lets it use them */
    if (window.clarity) window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
  }

  if (getChoice() === "accepted") loadAnalytics();
  if (!getChoice()) $("#cookieBanner").addClass("show");

  $("#cookieAccept").on("click", function () {
    setChoice("accepted");
    loadAnalytics();
    $("#cookieBanner").removeClass("show");
  });

  $("#cookieReject").on("click", function () {
    setChoice("rejected");
    $("#cookieBanner").removeClass("show");
  });

  /* ---------- analytics events, sent to Google Analytics through the Google tag in <head> ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(name, params) { if (window.gtag) window.gtag("event", name, params || {}); }

  /* store links: add UTM tags so the Chrome Web Store / Add-ons reports show which website page sent the visitor */
  var STORES = { "chromewebstore.google.com": "chrome", "addons.mozilla.org": "firefox" };
  var pageSlug = location.pathname.replace(/^\/|\/$/g, "") || "home";
  $("a[href]").each(function () {
    var url;
    try { url = new URL(this.href); } catch (e) { return; }
    if (!STORES[url.hostname]) return;
    var spot = $(this).closest("header").length ? "header" : $(this).closest("footer").length ? "footer" : "content";
    url.searchParams.set("utm_source", "freeautorefresh.com");
    url.searchParams.set("utm_medium", "website");
    url.searchParams.set("utm_campaign", pageSlug.replace(/\//g, "-"));
    url.searchParams.set("utm_content", spot);
    this.href = url.toString();
  });

  $(document).on("click", "a[href]", function () {
    var url;
    try { url = new URL(this.href); } catch (e) { return; }
    var link = { page_path: location.pathname, link_text: $.trim($(this).text()).slice(0, 80) };
    if (STORES[url.hostname]) {
      track("install_click", $.extend(link, { store: STORES[url.hostname], link_location: url.searchParams.get("utm_content") }));
    } else if (/^(github\.com|t\.me)$/.test(url.hostname)) {
      track("community_click", $.extend(link, { destination: url.hostname }));
    }
  });

  var seen = {};
  $(window).on("scroll", function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max < 200) return;
    var pct = Math.round(($(window).scrollTop() / max) * 100);
    $.each([25, 50, 75, 100], function (i, mark) {
      if (pct >= mark && !seen[mark]) { seen[mark] = 1; track("scroll_depth", { percent: mark, page_path: location.pathname }); }
    });
  });

  /* ---------- feedback page: ?type=feature (etc.) preselects what it is about ---------- */
  var wanted = new URLSearchParams(location.search).get("type");
  if (wanted) $("#cKind").val(wanted);

  /* ---------- contact form: sent to /api/contact, which forwards it to the developer ---------- */
  $("#contactForm").on("submit", function (e) {
    e.preventDefault();
    var form = this;
    var note = $("#contactNote");
    var button = $(form).find("button[type=submit]");
    var say = function (key) { note.text(note.data(key)).prop("hidden", false); };
    var data = {
      name: form.name.value, email: form.email.value, message: form.message.value, website: form.website.value,
      topic: form.dataset.topic, detail: form.detail ? form.detail.value : ""
    };

    if ($.trim(data.message).length < 5) return say("empty");

    button.prop("disabled", true);
    fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(function (res) { return res.ok ? res.json() : { ok: false }; })
      .then(function (out) {
        if (!out.ok) return say("failed");
        track("form_submit", { form_topic: form.dataset.topic, page_path: location.pathname });
        form.reset();
        say("sent");
      })
      .catch(function () { say("failed"); })
      .then(function () { button.prop("disabled", false); });
  });
});
