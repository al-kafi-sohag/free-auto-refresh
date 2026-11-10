/* Website behaviour (jQuery): mobile menu, cookie consent with opt-in analytics, contact form placeholder. */
$(function () {
  /* ---------- mobile menu ---------- */
  $("#navToggle").on("click", function () {
    var open = $("#nav").toggleClass("hidden").hasClass("hidden") === false;
    $("#nav").toggleClass("flex", open);
    $(this).attr("aria-expanded", String(open));
  });

  /* ---------- cookie consent: Google Analytics loads only after Accept ---------- */
  var KEY = "cookie-consent";
  var gaId = $("body").data("ga");

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function loadAnalytics() {
    if (!gaId || window.analyticsLoaded) return;
    window.analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    $.getScript("https://www.googletagmanager.com/gtag/js?id=" + gaId);
    window.gtag("js", new Date());
    window.gtag("config", gaId);
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

  /* ---------- contact form: no backend yet ---------- */
  $("#contactForm").on("submit", function (e) {
    e.preventDefault();
    $("#contactNote").prop("hidden", false);
  });
});
