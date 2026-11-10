/* Shared settings renderer for the popup and the settings page.
   Builds controls from the registry in settings.js, with texts from i18n.js.

   ctx: {
     cfg        current settings object (read for initial values)
     pinned     array of pinned setting keys
     showPins   show a pin button next to each advanced setting
     idPrefix   keeps element ids unique when a setting is rendered in two places
     onChange(key, value)
     onPin(key)
   }                                                                              */
(() => {
  const S = globalThis.ARSettings;
  const I = globalThis.ARI18n;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const ICONS = {
    pin: ["M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4", "M9 15l-4.5 4.5", "M14.5 4l5.5 5.5"],
    chevron: ["M6 9l6 6l6 -6"],
    info: ["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0", "M12 9h.01", "M11 12h1v4h1"],
  };

  function icon(name, size = 14) {
    const svg = document.createElementNS(SVG_NS, "svg");
    const attrs = {
      viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor",
      "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true",
    };
    for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);
    for (const d of ICONS[name]) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    }

    return svg;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  const labelOf = (def) => I.t(`s.${def.key}.label`);

  function pinButton(def, ctx) {
    if (!ctx.showPins || !def.group) return null;
    const on = ctx.pinned.includes(def.key);
    const btn = el("button", "pin");
    btn.type = "button";
    btn.title = I.t(on ? "pin.remove" : "pin.add");
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", `${btn.title}: ${labelOf(def)}`);
    btn.append(icon("pin"));
    btn.addEventListener("click", (e) => {
      e.preventDefault(); // it may sit inside a <label>
      ctx.onPin(def.key);
    });
    return btn;
  }

  /* ---------- tooltip for the (i) icons ---------- */
  // One shared bubble, placed next to whichever icon is hovered or focused and kept inside
  // the window (the popup is only 350px wide).
  let tipEl = null;

  function showTip(anchor, text) {
    if (!tipEl) {
      tipEl = el("div", "tip hidden");
      tipEl.setAttribute("role", "tooltip");
      document.body.append(tipEl);
    }

    tipEl.textContent = text;
    tipEl.style.visibility = "hidden";
    tipEl.classList.remove("hidden");

    const gap = 6, edge = 8;
    const a = anchor.getBoundingClientRect();
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const left = Math.max(edge, Math.min(a.left + a.width / 2 - w / 2, vw - w - edge));
    const below = a.bottom + gap;
    const above = a.top - gap - h;
    const top = below + h > vh - edge && above >= edge ? above : below;

    tipEl.style.left = `${left}px`;
    tipEl.style.top = `${top}px`;
    tipEl.style.visibility = "visible";
  }

  function hideTip() {
    if (tipEl) tipEl.classList.add("hidden");
  }

  // The (i) icon next to a setting. Hovering it (or focusing it with the keyboard) shows a
  // plain-language explanation; clicking does nothing.
  //
  // It is deliberately a <span>, not a <button>: inside a toggle's <label>, a button would
  // become the control the label activates, so clicking the switch would "click" the icon.
  function info(def) {
    const key = `s.${def.key}.info`;
    if (!I.has(key)) return null;

    const text = I.t(key);
    const node = el("span", "info");
    node.tabIndex = 0;
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", `${labelOf(def)}: ${text}`);
    node.append(icon("info", 15));

    node.addEventListener("mouseenter", () => showTip(node, text));
    node.addEventListener("mouseleave", hideTip);
    node.addEventListener("focus", () => showTip(node, text));
    node.addEventListener("blur", hideTip);
    // Inside a toggle's <label>: don't let a click on the icon flip the switch
    node.addEventListener("click", (e) => e.preventDefault());
    return node;
  }

  // Label + (i) on the left, pin on the right
  function labelRow(def, ctx, id) {
    const row = el("div", "label-row");
    const left = el("span", "label-wrap");
    const label = el("label", "label", labelOf(def));
    label.htmlFor = id;
    left.append(label);
    const tip = info(def);
    if (tip) left.append(tip);
    row.append(left);
    const pin = pinButton(def, ctx);
    if (pin) row.append(pin);
    return row;
  }

  function numberField(def, ctx) {
    const id = `${ctx.idPrefix}-${def.key}`;
    const wrap = el("div", "field-cell");
    const input = el("input", "field");
    input.id = id;
    input.type = "number";
    input.dataset.key = def.key;
    if (def.min != null) input.min = def.min;
    input.step = def.step ?? 1;
    if (I.has(`s.${def.key}.placeholder`)) input.placeholder = I.t(`s.${def.key}.placeholder`);
    input.value = ctx.cfg[def.key];
    input.addEventListener("input", () => {
      ctx.onChange(def.key, def.type === "int" ? parseInt(input.value, 10) : parseFloat(input.value));
    });
    wrap.append(labelRow(def, ctx, id), input);
    return wrap;
  }

  function selectField(def, ctx) {
    const id = `${ctx.idPrefix}-${def.key}`;
    const wrap = el("div");
    const select = el("select", "field");
    select.id = id;
    select.dataset.key = def.key;
    for (const value of def.options) select.append(new Option(I.t(`s.${def.key}.opt.${value}`), value));
    select.value = ctx.cfg[def.key];
    wrap.append(labelRow(def, ctx, id), select);

    // Optional text input that belongs to this select (e.g. the text to watch for)
    const extra = def.companion && S.byKey[def.companion];
    let text = null;
    if (extra) {
      text = el("input", "field mt-1.5");
      text.type = "text";
      text.dataset.key = extra.key;
      text.setAttribute("aria-label", labelOf(def));
      text.value = ctx.cfg[extra.key];
      text.addEventListener("input", () => ctx.onChange(extra.key, text.value.trim()));
      wrap.append(text);
    }

    const sync = () => {
      if (!text) return;
      text.classList.toggle("hidden", select.value === extra.hideWhen);
      const specific = `s.${extra.key}.placeholder.${select.value}`;
      text.placeholder = I.t(I.has(specific) ? specific : `s.${extra.key}.placeholder`);
    };

    select.addEventListener("change", () => {
      sync();
      ctx.onChange(def.key, select.value);
    });
    sync();
    return wrap;
  }

  function toggleRow(def, ctx) {
    const id = `${ctx.idPrefix}-${def.key}`;
    const row = el("label", "toggle");
    // Tie the label to the checkbox explicitly. Without this a <label> activates its FIRST
    // control, which would be the pin button rather than the switch.
    row.htmlFor = id;

    const text = el("span", "toggle-text");
    const title = el("span", "toggle-title");
    title.append(el("span", null, labelOf(def)));
    const tip = info(def);
    if (tip) title.append(tip);
    text.append(title);
    if (I.has(`s.${def.key}.desc`)) text.append(el("span", "toggle-desc", I.t(`s.${def.key}.desc`)));

    const input = el("input", "sr-only sw-input");
    input.id = id;
    input.type = "checkbox";
    input.dataset.key = def.key;
    input.checked = !!ctx.cfg[def.key];
    input.addEventListener("change", () => ctx.onChange(def.key, input.checked));

    row.append(text);
    const pin = pinButton(def, ctx);
    if (pin) row.append(pin);
    row.append(input, el("span", "switch"));
    return row;
  }

  const kindOf = (def) => (def.type === "number" || def.type === "int" ? "number" : def.type);

  // Lays out settings in the order given. Neighbours of the same kind share a block:
  // number fields sit two per row, toggles share one panel, selects take a full row each.
  function renderList(container, defs, ctx) {
    hideTip(); // the icon it pointed at is about to be replaced
    container.replaceChildren();
    let block = null, blockKind = null;

    for (const def of defs.filter((d) => !d.partOf)) {
      const kind = kindOf(def);
      if (kind === "select") {
        container.append(selectField(def, ctx));
        blockKind = null;
        continue;
      }

      if (kind !== blockKind) {
        block = kind === "number"
          ? el("div", "field-grid")
          : el("div", "panel divide-y divide-zinc-100 px-3 py-2 dark:divide-zinc-800");
        blockKind = kind;
        container.append(block);
      }

      block.append(kind === "number" ? numberField(def, ctx) : toggleRow(def, ctx));
    }
  }

  function renderPinned(container, ctx) {
    const defs = ctx.pinned.map((key) => S.byKey[key]).filter(Boolean);
    renderList(container, defs, ctx);
  }

  // open: true = every group expanded, or a Set of group ids that is kept in sync as groups are toggled
  function renderGroups(container, ctx, open) {
    container.replaceChildren();
    for (const group of S.GROUPS) {
      const defs = S.SETTINGS.filter((d) => d.group === group.id);
      if (!defs.length) continue;

      const details = el("details", "acc");
      details.open = open === true || open.has(group.id);
      if (open !== true) {
        details.addEventListener("toggle", () => {
          if (details.open) open.add(group.id);
          else open.delete(group.id);
        });
      }

      const summary = el("summary");
      summary.append(el("span", null, I.t(`g.${group.id}`)));
      const meta = el("span", "acc-meta");
      const pinnedCount = defs.filter((d) => ctx.pinned.includes(d.key)).length;
      meta.append(el("span", null, pinnedCount ? I.t("pin.count", { n: pinnedCount }) : ""), icon("chevron", 16));
      summary.append(meta);

      const body = el("div", "acc-body");
      renderList(body, defs, ctx);
      details.append(summary, body);
      container.append(details);
    }
  }

  globalThis.ARUI = { icon, renderList, renderPinned, renderGroups };
})();
