/* Blog behaviour: topic filter + search on the index, and the highlighted table of contents on posts. */
(function () {
  var cards = [].slice.call(document.querySelectorAll(".bl-card[data-cat]"));
  var chips = [].slice.call(document.querySelectorAll(".bl-chip"));
  var search = document.getElementById("blSearch");
  var empty = document.getElementById("blEmpty");
  var feat = document.getElementById("blFeatured");

  if (cards.length) {
    var cat = "all";
    var apply = function () {
      var q = search ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (cat === "all" || c.dataset.cat === cat) && (!q || c.dataset.text.indexOf(q) > -1);
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (feat) feat.hidden = cat !== "all" || !!q;
      if (empty) empty.style.display = shown ? "none" : "block";
    };
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        cat = chip.dataset.cat;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
  }

  var links = [].slice.call(document.querySelectorAll(".bl-toc a"));
  if (links.length && "IntersectionObserver" in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          map[e.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-90px 0px -65% 0px" });
    Object.keys(map).forEach(function (id) {
      var h = document.getElementById(id);
      if (h) obs.observe(h);
    });
  }
})();
