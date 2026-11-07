/* Ядро: стан, підсвічування між видами, масштабування, панель інформації */
(function () {
  'use strict';
  const D = window.SCHEMA, V = window.VIEWS;
  const { E, T } = SV;
  const byId = SV.byId, cabById = {}, children = {}, touch = {};
  D.cables.forEach((c) => {
    cabById[c.id] = c;
    (touch[c.from] = touch[c.from] || []).push(c);
    if (c.to !== c.from) (touch[c.to] = touch[c.to] || []).push(c);
  });
  D.elements.forEach((e) => { if (e.parent) (children[e.parent] = children[e.parent] || []).push(e.id); });
  D.cables.forEach((c) => { if (!byId[c.from] || !byId[c.to]) console.warn('Кабель посилається на невідомий елемент:', c.id); });

  const ORDER = ['elec', 'logic', 'cab', 'sorter'];
  const $ = (s, r) => (r || document).querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sorter.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sorter.' + k, JSON.stringify(v)); } catch (e) { /* немає сховища */ } },
  };

  const state = {
    sel: null, hover: null,
    trace: store.get('trace', false),
    tags: store.get('tags', false),
    focus: store.get('focus', true),
    layout: store.get('layout', 2),
    panes: [],
  };
  const narrow = () => window.matchMedia('(max-width: 900px)').matches;

  /* ------------------------------ режими лінії ------------------------------ */
  const LV = { pause: 0, stop: 1, run: 2 };
  function elActive(e, m) {
    if (!e || e.virtual) return false;
    if (e.only) return e.only.indexOf(m) >= 0;
    return !!e.mode && LV[e.mode] <= LV[m];
  }
  function cabActive(c, m) {
    if (c.only) return c.only.indexOf(m) >= 0;
    if (c.mode) return LV[c.mode] <= LV[m];
    return elActive(byId[c.from], m) && elActive(byId[c.to], m);
  }

  /* ------------------------------ підсвічування ------------------------------ */
  function compute(sel) {
    if (!sel) return null;
    const r = { els: new Set(), cabs: new Set(), prim: new Set(), primCab: new Set() };
    const addCab = (c) => { r.cabs.add(c.id); r.els.add(c.from); r.els.add(c.to); };
    if (sel.t === 'c') {
      const c = cabById[sel.id]; if (!c) return null;
      addCab(c); r.primCab.add(c.id);
      return r;
    }
    if (sel.t === 'm') {
      D.elements.forEach((e) => { if (elActive(e, sel.id)) r.els.add(e.id); });
      D.cables.forEach((c) => { if (cabActive(c, sel.id)) r.cabs.add(c.id); });
      const m = D.modes.find((x) => x.id === sel.id);
      if (m) r.prim.add(m.lamp);
      return r;
    }
    if (sel.t === 'l') {
      sel.cabs.forEach((id) => { if (cabById[id]) { addCab(cabById[id]); r.primCab.add(id); } });
      r.els.add(sel.a); r.els.add(sel.b);
      return r;
    }
    const stack = [sel.id];
    while (stack.length) {
      const id = stack.pop();
      if (r.prim.has(id)) continue;
      r.prim.add(id);
      (children[id] || []).forEach((k) => stack.push(k));
    }
    r.prim.forEach((id) => { r.els.add(id); (touch[id] || []).forEach(addCab); });
    if (state.trace) {
      const walk = (dirUp) => {
        const q = [...r.prim], seen = new Set(q);
        while (q.length) {
          const id = q.pop();
          (touch[id] || []).forEach((c) => {
            const near = dirUp ? c.to : c.from, far = dirUp ? c.from : c.to;
            if (near !== id || far === id) return;
            addCab(c);
            if (!seen.has(far)) { seen.add(far); q.push(far); }
          });
        }
      };
      walk(true); walk(false);
    }
    return r;
  }

  function applyPane(p, H) {
    const svg = p.svg;
    svg.querySelectorAll('.hl,.sel,.hl-proxy').forEach((n) => n.classList.remove('hl', 'sel', 'hl-proxy'));
    svg.classList.toggle('has-hl', !!H);
    p.reg.exits.forEach((x) => x.update([]));
    if (!H) return;
    const reg = p.reg;
    H.els.forEach((id) => {
      const list = reg.els[id];
      if (list) { list.forEach((o) => { o.node.classList.add('hl'); if (H.prim.has(id)) o.node.classList.add('sel'); }); return; }
      let up = byId[id] && byId[id].parent;
      while (up && !reg.els[up]) up = byId[up] && byId[up].parent;
      if (up && up !== 'SORTER' && !H.els.has(up)) reg.els[up].forEach((o) => o.node.classList.add('hl-proxy'));
    });
    H.cabs.forEach((id) => (reg.cabs[id] || []).forEach((o) => { o.node.classList.add('hl'); if (H.primCab.has(id)) o.node.classList.add('sel'); }));
    reg.links.forEach((L) => {
      const on = L.cabs.some((c) => H.cabs.has(c)) && (H.els.has(L.a) || H.els.has(L.b) || byId[L.a].virtual || byId[L.b].virtual);
      if (!on) return;
      L.node.classList.add('hl');
      [L.a, L.b].forEach((id) => { if (byId[id].virtual && reg.els[id]) reg.els[id].forEach((o) => o.node.classList.add('hl')); });
    });
    reg.exits.forEach((x) => {
      const on = [...x.cabs].filter((c) => H.cabs.has(c));
      x.node.classList.toggle('hl', on.length > 0);
      x.update(on);
    });
  }

  function refresh() {
    const H = compute(state.hover || state.sel);
    state.panes.forEach((p) => applyPane(p, H));
  }

  /* --------------------------------- види ---------------------------------- */
  function makeCtx(p) {
    const reg = { els: {}, cabs: {}, links: [], exits: [] };
    p.reg = reg;
    const ctx = {
      root: p.root,
      regEl(id, node, bb) { node.classList.add('elx'); node.setAttribute('data-el', id); (reg.els[id] = reg.els[id] || []).push({ node, bb }); },
      regCab(id, node, bb) { node.setAttribute('data-cab', id); (reg.cabs[id] = reg.cabs[id] || []).push({ node, bb }); },
      regLink(node, cabs, a, b, bb) { node.setAttribute('data-lnk', reg.links.length); reg.links.push({ node, cabs, a, b, bb }); },
      addBox(id, bb) { const l = reg.cabs[id]; if (l && l[0]) l.push({ node: l[0].node, bb }); },
      regExit(node, cabs, update, bb) { reg.exits.push({ node, cabs, update, bb }); },
      cable(parent, c, pts, o) {
        o = o || {};
        const g = o.noReg ? parent : E('g', { class: 'cbl k-' + c.kind + (o.phys ? ' phys' : '') }, parent);
        const d = SV.dPath(pts);
        E('path', { d, class: 'c-hit' }, g);
        if (o.casing) E('path', { d, class: 'c-case' }, g);
        E('path', { d, class: 'c-core', stroke: o.color }, g);
        if (o.phys && c.kind === 'pe') E('path', { d, class: 'c-core c-pe2' }, g);
        if (o.tag) {
          const m = SV.midLongest(pts);
          const tg = E('g', { class: 'c-tag' + (o.tag === 'hl' ? ' hl-only' : ''), transform: 'translate(' + m.x + ' ' + m.y + ')' + (m.vertical ? ' rotate(-90)' : '') }, g);
          const txt = SV.cableTag(c);
          const w = txt.length * 5.6 + (c.mark && c.mark.color ? 16 : 8);
          E('rect', { x: -w / 2, y: -6.5, width: w, height: 13, rx: 3, class: 'c-tagbg' }, tg);
          if (c.mark && c.mark.color) E('circle', { cx: -w / 2 + 7, cy: 0, r: 3.6, fill: c.mark.color, class: 'c-sw' }, tg);
          T(tg, (c.mark && c.mark.color ? 4 : 0), 3.3, txt, { class: 'c-tagt', 'text-anchor': 'middle' });
        }
        if (!o.noReg) ctx.regCab(c.id, g, SV.bbox(pts, 4));
        return g;
      },
    };
    return ctx;
  }

  function setView(p, v) {
    if (p.view) p.saved[p.view] = Object.assign({}, p.vb);
    p.view = v;
    p.svg.innerHTML = '';
    p.svg.setAttribute('class', 'view ' + (V[v].paper ? 'paper' : 'dark') + ' v-' + v + (state.tags ? ' show-tags' : ''));
    p.root = E('g', { class: 'root' }, p.svg);
    const res = V[v].build(makeCtx(p));
    p.bounds = res.bounds;
    p.el.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    $('.legend', p.el).innerHTML = V[v].legend ? V[v].legend() : '';
    $('.pane-title', p.el).textContent = V[v].title;
    p.touched = !!p.saved[v];
    if (p.saved[v]) setVB(p, p.saved[v]); else fit(p);
    applyPane(p, compute(state.hover || state.sel));
    saveViews();
  }

  /* ------------------------------ масштабування ----------------------------- */
  function clientSize(p) {
    const r = p.svg.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height), r };
  }
  function setVB(p, vb) {
    const { w, h } = clientSize(p);
    const ratio = h / w;
    const cxv = vb.x + vb.w / 2, cyv = vb.y + vb.h / 2;
    let nw = vb.w, nh = vb.w * ratio;
    if (Math.abs(nh - vb.h) > 0.5 && vb.h > nh) { nh = vb.h; nw = nh / ratio; }
    // обмеження масштабу
    const maxW = Math.max(p.bounds.w, p.bounds.h / ratio) * 2.5, minW = 60;
    if (nw > maxW) { nw = maxW; nh = nw * ratio; }
    if (nw < minW) { nw = minW; nh = nw * ratio; }
    p.vb = { x: cxv - nw / 2, y: cyv - nh / 2, w: nw, h: nh };
    p.lastW = w;
    p.svg.setAttribute('viewBox', p.vb.x + ' ' + p.vb.y + ' ' + p.vb.w + ' ' + p.vb.h);
    p.svg.style.setProperty('--z', (nw / w).toFixed(3));
  }
  function fitBox(p, b, padFrac) {
    const { w, h } = clientSize(p);
    const pad = padFrac == null ? 0.04 : padFrac;
    const bw = b.w * (1 + pad * 2), bh = b.h * (1 + pad * 2);
    const sc = Math.max(bw / w, bh / h);
    return { x: b.x + b.w / 2 - (w * sc) / 2, y: b.y + b.h / 2 - (h * sc) / 2, w: w * sc, h: h * sc };
  }
  function fit(p) { setVB(p, fitBox(p, p.bounds, 0.02)); }
  function zoomAt(p, f, cx, cy) {
    const { r } = clientSize(p);
    const vb = p.vb;
    const px = vb.x + ((cx - r.left) / r.width) * vb.w, py = vb.y + ((cy - r.top) / r.height) * vb.h;
    const nw = vb.w * f, nh = vb.h * f;
    setVB(p, { x: px - (px - vb.x) * f, y: py - (py - vb.y) * f, w: nw, h: nh });
  }
  function animateTo(p, target) {
    const from = Object.assign({}, p.vb), t0 = performance.now(), dur = 380;
    cancelAnimationFrame(p.anim);
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      setVB(p, { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e });
      if (k < 1) p.anim = requestAnimationFrame(step);
    };
    p.anim = requestAnimationFrame(step);
  }
  function hlBox(p, primOnly) {
    const H = compute(state.sel);
    if (!H) return null;
    const boxes = [];
    const add = (o) => o.bb && boxes.push(o.bb);
    const reg = p.reg;
    const ids = primOnly ? H.prim : H.els;
    ids.forEach((id) => (reg.els[id] || []).forEach(add));
    if (!boxes.length) p.svg.querySelectorAll('.hl-proxy').forEach((n) => { const id = n.getAttribute('data-el'); (reg.els[id] || []).forEach(add); });
    if (!primOnly || !boxes.length) {
      H.cabs.forEach((id) => (reg.cabs[id] || []).forEach(add));
      reg.links.forEach((L) => { if (L.node.classList.contains('hl')) add(L); });
      reg.exits.forEach((x) => { if (x.node.classList.contains('hl')) add(x); });
    }
    if (!boxes.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    boxes.forEach((b) => { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function focusPane(p, onlyIfNeeded) {
    if (!p.el.offsetParent) return;
    const b = hlBox(p, false);
    if (!b) return;
    const minW = Math.min(p.bounds.w, Math.max(320, p.bounds.w * 0.06));
    const bb = b.w < minW ? { x: b.x + b.w / 2 - minW / 2, y: b.y, w: minW, h: b.h } : b;
    if (onlyIfNeeded) {
      const v = p.vb;
      const inside = b.x >= v.x && b.y >= v.y && b.x + b.w <= v.x + v.w && b.y + b.h <= v.y + v.h;
      const tiny = Math.max(b.w / v.w, b.h / v.h) < 0.15;
      if (inside && !tiny) return;
    }
    p.touched = true;
    animateTo(p, fitBox(p, bb, 0.12));
  }

  /* ------------------------------ події панелі ------------------------------ */
  function targetOf(t) {
    const n = t && t.closest ? t.closest('[data-el],[data-cab],[data-lnk]') : null;
    if (!n) return null;
    if (n.hasAttribute('data-el')) {
      const id = n.getAttribute('data-el');
      return { t: 'e', id };
    }
    if (n.hasAttribute('data-cab')) return { t: 'c', id: n.getAttribute('data-cab') };
    return null;
  }
  function targetOfLink(p, t) {
    const n = t && t.closest ? t.closest('[data-lnk]') : null;
    if (!n) return null;
    const L = p.reg.links[+n.getAttribute('data-lnk')];
    return L ? { t: 'l', cabs: L.cabs, a: L.a, b: L.b, id: L.a + '→' + L.b } : null;
  }
  const same = (a, b) => a && b && a.t === b.t && a.id === b.id;

  function bindPane(p) {
    const svg = p.svg;
    const ptrs = new Map();
    let moved = false, downT = null, start = null, pinch = null;
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      zoomAt(p, Math.exp(dy * 0.0016), e.clientX, e.clientY);
    }, { passive: false });
    svg.addEventListener('pointerdown', (e) => {
      if (e.button && e.button !== 0) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { svg.setPointerCapture(e.pointerId); } catch (er) { /* */ }
      cancelAnimationFrame(p.anim);
      if (ptrs.size === 1) { moved = false; downT = e.target; start = { x: e.clientX, y: e.clientY, vb: Object.assign({}, p.vb) }; }
      else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, vb: Object.assign({}, p.vb) };
        moved = true;
      }
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) {
        if (e.pointerType === 'mouse') hoverOver(p, e);
        return;
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const { r } = clientSize(p);
      if (ptrs.size === 1 && start) {
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!moved && Math.hypot(dx, dy) > 6) { moved = true; svg.classList.add('panning'); hideTip(); }
        if (moved) { const k = start.vb.w / r.width; setVB(p, { x: start.vb.x - dx * k, y: start.vb.y - dy * k, w: start.vb.w, h: start.vb.h }); }
      } else if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const f = pinch.d / d;
        const v0 = pinch.vb;
        const sx = v0.x + ((pinch.mx - r.left) / r.width) * v0.w, sy = v0.y + ((pinch.my - r.top) / r.height) * v0.h;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nw = v0.w * f, nh = v0.h * f;
        setVB(p, { x: sx - ((mx - r.left) / r.width) * nw, y: sy - ((my - r.top) / r.height) * nh, w: nw, h: nh });
      }
    });
    const end = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size === 0) {
        svg.classList.remove('panning');
        if (!moved && e.type === 'pointerup') tap(p, downT, e);
        start = null; pinch = null;
      } else if (ptrs.size === 1) {
        const q = [...ptrs.values()][0];
        start = { x: q.x, y: q.y, vb: Object.assign({}, p.vb) }; pinch = null;
      }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !ptrs.size) { setHover(null); hideTip(); } });
    svg.addEventListener('dblclick', (e) => { e.preventDefault(); zoomAt(p, 0.6, e.clientX, e.clientY); });

    p.el.querySelector('.tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (b) setView(p, b.dataset.v);
    });
    p.el.querySelector('.zb').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const { r } = clientSize(p);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (b.dataset.z === 'in') zoomAt(p, 0.7, cx, cy);
      if (b.dataset.z === 'out') zoomAt(p, 1 / 0.7, cx, cy);
      if (b.dataset.z === 'fit') animateTo(p, fitBox(p, p.bounds, 0.02));
      if (b.dataset.z === 'focus') focusPane(p, false);
    });
    new ResizeObserver(() => {
      const w = p.svg.clientWidth, h = p.svg.clientHeight;
      if (!p.vb || !w || !h) return;
      if (!p.touched) { fit(p); return; }
      // зберегти масштаб (одиниць на піксель) і центр
      const k = p.lastW ? p.vb.w / p.lastW : p.vb.w / w;
      const cxv = p.vb.x + p.vb.w / 2, cyv = p.vb.y + p.vb.h / 2;
      setVB(p, { x: cxv - (k * w) / 2, y: cyv - (k * h) / 2, w: k * w, h: k * h });
    }).observe(svg);
    ['wheel', 'pointerdown'].forEach((ev) => svg.addEventListener(ev, () => (p.touched = true)));
    p.el.querySelector('.zb').addEventListener('click', () => (p.touched = true));
  }

  function hoverOver(p, e) {
    const t = targetOf(e.target) || targetOfLink(p, e.target);
    if (!same(t, state.hover) || (t && t.t === 'l' && (!state.hover || state.hover.id !== t.id))) setHover(t);
    if (t) showTip(t, e.clientX, e.clientY); else hideTip();
  }
  function setHover(t) {
    if (!t && !state.hover) return;
    state.hover = t;
    refresh();
  }
  function tap(p, target, e) {
    const t = targetOf(target) || targetOfLink(p, target);
    if (!t) { select(null); return; }
    if (same(t, state.sel)) { select(null); return; }
    select(t, p);
    if (e.pointerType !== 'mouse') hideTip();
  }

  function select(t, fromPane) {
    state.sel = t;
    state.hover = null;
    refresh();
    renderInfo();
    writeHash();
    if (t && t.t !== 'm' && state.focus) state.panes.forEach((q) => { if (q !== fromPane) focusPane(q, true); });
    if (t && narrow()) openSheet(true);
  }

  /* ---------------------------------- підказка --------------------------------- */
  const tip = $('#tip');
  function showTip(t, x, y) {
    let html;
    if (t.t === 'e') { const e = byId[t.id]; html = '<b>' + esc(SV.label(t.id)) + '</b> ' + esc(e.name) + (e.model ? '<br><small>' + esc(e.model) + '</small>' : ''); }
    else if (t.t === 'c') { const c = cabById[t.id]; html = '<b>' + esc(SV.cableTag(c)) + '</b> ' + esc(SV.label(c.from)) + ' → ' + esc(SV.label(c.to)) + '<br><small>' + esc(D.kinds[c.kind].name) + (c.cond ? ' · ' + esc(c.cond) : '') + '</small>'; }
    else html = '<b>' + esc(SV.label(t.a)) + ' → ' + esc(SV.label(t.b)) + '</b><br><small>кабелі: ' + esc(t.cabs.join(', ')) + '</small>';
    tip.innerHTML = html;
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 8, x + 14) + 'px';
    tip.style.top = Math.min(window.innerHeight - h - 8, y + 16) + 'px';
  }
  function hideTip() { tip.hidden = true; }

  /* ------------------------------ панель інформації ---------------------------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const info = $('#info');
  const elLink = (id) => '<a href="#" data-goto-e="' + esc(id) + '"><b>' + esc(SV.label(id)) + '</b></a>';
  const cabLink = (c) => '<a href="#" class="ctag" data-goto-c="' + esc(c.id) + '"><i style="background:' + SV.physColor(c) + '"></i>' + esc(SV.cableTag(c)) + '</a>';
  function pathOf(id) {
    const out = []; let cur = byId[id] && byId[id].parent;
    while (cur) { out.unshift(cur); cur = byId[cur] && byId[cur].parent; }
    return out;
  }
  function renderInfo() {
    const s = state.sel;
    let h = '';
    const modeBtns = '<div class="modes">' + D.modes.map((m) => '<button data-mode="' + m.id + '" class="' + (s && s.t === 'm' && s.id === m.id ? 'on' : '') + '"><i style="background:' + m.color + '"></i>' + esc(m.name) + '</button>').join('') + '</div>';
    if (s && s.t === 'm') {
      const m = D.modes.find((x) => x.id === s.id);
      const H = compute(s);
      h += '<div class="ih"><span class="big"><i class="lampdot" style="background:' + m.color + '"></i>' + esc(m.name) + '</span><button class="x" data-clear title="Зняти виділення">×</button></div>';
      h += '<h3>Режим лінії</h3>' + modeBtns;
      h += '<p>' + esc(m.text) + '</p><p class="muted">' + esc(m.next) + '</p>';
      const on = [...H.els].filter((id) => byId[id] && byId[id].type !== 'system');
      h += '<h3>Під напругою (' + on.length + ')</h3><div class="chips">' + on.map((id) => '<a href="#" data-goto-e="' + esc(id) + '">' + esc(SV.label(id)) + '</a>').join('') + '</div>';
      info.querySelector('.info-body').innerHTML = h;
      return;
    }
    if (!s) {
      h += '<div class="ih"><h2>Режими лінії</h2></div>' + modeBtns +
        '<p class="muted small">Натисніть режим, щоб підсвітити все, що в ньому під напругою.</p>';
      h += '<div class="ih"><h2>Як користуватися</h2></div>';
      h += '<ul class="howto"><li><b>Наведіть</b> або <b>торкніться</b> елемента чи кабелю на будь-якій схемі — його зв’язки підсвітяться на всіх видах.</li>' +
        '<li>Повторний клік або клік по порожньому місцю — зняти виділення.</li>' +
        '<li>Колесо миші / два пальці — масштаб; перетягування — зсув; ⤢ — показати все; ◎ — до виділеного.</li>' +
        '<li><b>Ланцюг</b> — підсвітити весь шлях живлення: від мережі до споживача.</li>' +
        '<li><b>Маркування</b> — постійно показувати номери кабелів на фізичних схемах.</li>' +
        '<li>Режим <b>2</b> — дві схеми поруч.</li></ul>';
      h += '<div class="note"><b>Чернетка.</b> Схема складена за фотографіями. Частина функцій та з’єднань — припущення (позначені пунктиром). Дані редагуються у <code>js/data.js</code>.</div>';
      const nE = D.elements.filter((e) => !e.virtual && e.type !== 'system').length;
      h += '<div class="stats"><div><b>' + nE + '</b><span>елементів</span></div><div><b>' + D.cables.length + '</b><span>кабелів</span></div><div><b>' + D.elements.filter((e) => e.assumed).length + '</b><span>припущень</span></div></div>';
      h += '<h3>Плавні пуски та протяжки</h3><div class="chips">' + D.groups.map((G) => '<a href="#" data-goto-e="' + G.pa + '">ПП' + G.n + ' · протяжки ' + G.lines[0].k + '–' + G.lines[G.lines.length - 1].k + '</a>').join('') + '</div>';
      h += '<h3>Зони сортувальника</h3><div class="chips">' + ['Z1', 'Z2', 'Z3', 'MOD1', 'MOD2', 'MOD3', 'MOD4', 'MOD5', 'ZOUT', 'WS', 'CAB'].map((z) => '<a href="#" data-goto-e="' + z + '">' + esc(byId[z].name) + '</a>').join('') + '</div>';
    } else if (s.t === 'e') {
      const e = byId[s.id];
      h += '<div class="ih"><span class="big">' + esc(SV.label(e.id)) + '</span>' + (e.assumed ? '<span class="badge warn">припущення</span>' : '') + '<button class="x" data-clear title="Зняти виділення">×</button></div>';
      h += '<h2>' + esc(e.name) + '</h2>';
      h += '<dl>';
      if (e.model) h += '<dt>Модель</dt><dd>' + esc(e.model) + '</dd>';
      h += '<dt>Розташування</dt><dd>' + esc(D.locations[e.loc] || '—') + '</dd>';
      const pth = pathOf(e.id).filter((x) => x !== 'SORTER');
      if (pth.length) h += '<dt>Належить</dt><dd>' + pth.map(elLink).join(' › ') + '</dd>';
      h += '<dt>Маркування</dt><dd>' + (e.mark ? esc(e.mark) : '<span class="muted">ще не промарковано (id: ' + esc(e.id) + ')</span>') + '</dd>';
      if (e.desc) h += '<dt>Опис</dt><dd>' + esc(e.desc) + '</dd>';
      h += '</dl>';
      const kids = children[e.id] || [];
      if (kids.length) {
        h += '<h3>Складові (' + kids.length + ')</h3><div class="chips">' + kids.slice(0, 80).map((k) => '<a href="#" data-goto-e="' + esc(k) + '">' + esc(SV.label(k)) + '</a>').join('') + (kids.length > 80 ? ' …' : '') + '</div>';
      }
      const cs = [...new Set(touch[e.id] || [])];
      if (cs.length) {
        h += '<h3>З’єднання (' + cs.length + ')</h3><table class="conn"><tbody>';
        cs.forEach((c) => {
          const out = c.from === e.id;
          const other = out ? c.to : c.from;
          h += '<tr><td>' + cabLink(c) + '</td><td class="dir">' + (c.from === c.to ? '↺' : out ? '→' : '←') + '</td><td>' + elLink(other) + ' <small>' + esc(byId[other].name) + '</small><br><small class="muted">' + esc(D.kinds[c.kind].name) + (c.cond ? ' · ' + esc(c.cond) : '') + '</small></td></tr>';
        });
        h += '</tbody></table>';
      } else if (!kids.length) h += '<p class="muted">Немає з’єднань у даних.</p>';
    } else if (s.t === 'c') {
      const c = cabById[s.id];
      h += '<div class="ih"><span class="big">' + cabLink(c) + '</span><button class="x" data-clear title="Зняти виділення">×</button></div>';
      h += '<h2>' + elLink(c.from) + ' → ' + elLink(c.to) + '</h2>';
      h += '<dl><dt>Від</dt><dd>' + elLink(c.from) + ' ' + esc(byId[c.from].name) + (c.fp ? ' <small>(' + esc(c.fp) + ')</small>' : '') + '</dd>';
      h += '<dt>До</dt><dd>' + elLink(c.to) + ' ' + esc(byId[c.to].name) + (c.tp ? ' <small>(' + esc(c.tp) + ')</small>' : '') + '</dd>';
      h += '<dt>Тип</dt><dd><i class="sw" style="background:' + SV.kindColor(c) + '"></i>' + esc(D.kinds[c.kind].name) + '</dd>';
      if (c.cond) h += '<dt>Жили</dt><dd>' + esc(c.cond) + '</dd>';
      if (c.phase) h += '<dt>Фаза</dt><dd>' + esc(c.phase) + '</dd>';
      h += '<dt>Колір у шафі</dt><dd><i class="sw" style="background:' + SV.physColor(c) + '"></i>' + esc(SV.physColor(c)) + '</dd>';
      h += '<dt>Маркування</dt><dd>' + (c.mark ? (c.mark.color ? '<i class="sw" style="background:' + esc(c.mark.color) + '"></i>' : '') + esc(c.mark.num || '') : '<span class="muted">ще не промарковано (id: ' + esc(c.id) + ')</span>') + '</dd>';
      if (c.exit) h += '<dt>Вихід із шафи</dt><dd>' + (c.exit === 'hose' ? 'гофра праворуч' : 'кабельний ввід знизу') + '</dd>';
      if (c.desc) h += '<dt>Опис</dt><dd>' + esc(c.desc) + '</dd>';
      h += '</dl>';
    } else if (s.t === 'l') {
      h += '<div class="ih"><span class="big">' + elLink(s.a) + ' → ' + elLink(s.b) + '</span><button class="x" data-clear title="Зняти виділення">×</button></div>';
      h += '<h2>Логічний зв’язок</h2><h3>Реалізують кабелі</h3><div class="chips">' + s.cabs.map((id) => cabById[id] ? cabLink(cabById[id]) : esc(id)).join('') + '</div>';
    }
    info.querySelector('.info-body').innerHTML = h;
  }
  info.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goto-e],[data-goto-c],[data-clear],[data-mode]');
    if (!a) return;
    e.preventDefault();
    if (a.hasAttribute('data-clear')) return select(null);
    if (a.hasAttribute('data-mode')) {
      const t = { t: 'm', id: a.getAttribute('data-mode') };
      return select(same(t, state.sel) ? null : t);
    }
    if (a.hasAttribute('data-goto-e')) select({ t: 'e', id: a.getAttribute('data-goto-e') });
    else select({ t: 'c', id: a.getAttribute('data-goto-c') });
  });
  info.addEventListener('mouseover', (e) => {
    const a = e.target.closest('[data-goto-e],[data-goto-c]');
    if (!a) { if (state.hover) setHover(null); return; }
    const t = a.hasAttribute('data-goto-e') ? { t: 'e', id: a.getAttribute('data-goto-e') } : { t: 'c', id: a.getAttribute('data-goto-c') };
    if (!same(t, state.hover)) setHover(t);
  });
  info.addEventListener('mouseleave', () => setHover(null));
  function openSheet(on) { document.body.classList.toggle('sheet-open', on); }
  $('.sheet-handle', info).addEventListener('click', () => openSheet(!document.body.classList.contains('sheet-open')));

  /* ---------------------------------- пошук ---------------------------------- */
  const q = $('#q'), qres = $('#qres');
  const searchable = D.elements.filter((e) => !e.virtual && e.type !== 'system').map((e) => ({ t: 'e', id: e.id, s: (e.id + ' ' + (e.mark || '') + ' ' + e.name + ' ' + (e.model || '') + ' ' + (e.caption || '')).toLowerCase(), label: SV.label(e.id), name: e.name }))
    .concat(D.cables.map((c) => ({ t: 'c', id: c.id, s: (c.id + ' ' + (c.mark ? c.mark.num : '') + ' кабель ' + c.from + ' ' + c.to).toLowerCase(), label: SV.cableTag(c), name: 'кабель ' + SV.label(c.from) + ' → ' + SV.label(c.to) })));
  let qsel = 0, qlist = [];
  function doSearch() {
    const v = q.value.trim().toLowerCase();
    if (!v) { qres.hidden = true; return; }
    const parts = v.split(/\s+/);
    qlist = searchable.filter((x) => parts.every((p) => x.s.indexOf(p) >= 0))
      .sort((a, b) => (a.label.toLowerCase().indexOf(v) === 0 ? -1 : 0) - (b.label.toLowerCase().indexOf(v) === 0 ? -1 : 0))
      .slice(0, 40);
    qsel = 0;
    qres.innerHTML = qlist.length ? qlist.map((x, i) => '<div class="qi' + (i === 0 ? ' on' : '') + '" data-i="' + i + '"><b>' + esc(x.label) + '</b> <span>' + esc(x.name) + '</span></div>').join('') : '<div class="qi muted">Нічого не знайдено</div>';
    qres.hidden = false;
  }
  q.addEventListener('input', doSearch);
  q.addEventListener('keydown', (e) => {
    if (qres.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      qsel = Math.max(0, Math.min(qlist.length - 1, qsel + (e.key === 'ArrowDown' ? 1 : -1)));
      qres.querySelectorAll('.qi').forEach((n, i) => n.classList.toggle('on', i === qsel));
    } else if (e.key === 'Enter' && qlist[qsel]) { pick(qlist[qsel]); }
    else if (e.key === 'Escape') { qres.hidden = true; q.blur(); }
  });
  qres.addEventListener('mousedown', (e) => {
    const n = e.target.closest('[data-i]'); if (!n) return;
    e.preventDefault(); pick(qlist[+n.dataset.i]);
  });
  q.addEventListener('blur', () => setTimeout(() => (qres.hidden = true), 150));
  function pick(x) { qres.hidden = true; q.value = ''; q.blur(); select({ t: x.t, id: x.id }); }

  /* ---------------------------------- опції ---------------------------------- */
  const optTrace = $('#optTrace'), optTags = $('#optTags'), optFocus = $('#optFocus');
  optTrace.checked = state.trace; optTags.checked = state.tags; optFocus.checked = state.focus;
  optTrace.addEventListener('change', () => { state.trace = optTrace.checked; store.set('trace', state.trace); refresh(); });
  optTags.addEventListener('change', () => { state.tags = optTags.checked; store.set('tags', state.tags); state.panes.forEach((p) => p.svg.classList.toggle('show-tags', state.tags)); });
  optFocus.addEventListener('change', () => { state.focus = optFocus.checked; store.set('focus', state.focus); });
  const seg = $('#layoutSeg');
  function setLayout(n) {
    state.layout = n; store.set('layout', n);
    const two = n === 2 && !narrow();
    document.getElementById('main').classList.toggle('two', two);
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.l === n));
    requestAnimationFrame(() => state.panes.forEach((p) => { if (p.svg.clientWidth) { if (!p.fitted) { fit(p); p.fitted = true; } else setVB(p, p.vb); } }));
  }
  seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setLayout(+b.dataset.l); });
  $('#btnInfo').addEventListener('click', () => {
    if (narrow()) openSheet(!document.body.classList.contains('sheet-open'));
    else document.body.classList.toggle('info-hidden');
    state.panes.forEach((p) => requestAnimationFrame(() => p.vb && setVB(p, p.vb)));
  });
  document.addEventListener('keydown', (e) => {
    if (e.target === q) return;
    if (e.key === 'Escape') select(null);
    if (e.key === '/') { e.preventDefault(); q.focus(); }
  });

  /* ---------------------------------- URL ------------------------------------ */
  function saveViews() { store.set('views', state.panes.map((p) => p.view)); writeHash(); }
  function writeHash() {
    const s = state.sel;
    const parts = [];
    if (s && (s.t === 'e' || s.t === 'c' || s.t === 'm')) parts.push(({ e: 'el=', c: 'cab=', m: 'mode=' })[s.t] + encodeURIComponent(s.id));
    parts.push('v=' + state.panes.map((p) => p.view).filter(Boolean).join(','));
    const h = '#' + parts.join('&');
    if (location.hash !== h) history.replaceState(null, '', h);
  }
  function readHash() {
    const o = {};
    location.hash.replace(/^#/, '').split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) o[k] = decodeURIComponent(v || ''); });
    return o;
  }

  /* ---------------------------------- старт ---------------------------------- */
  function init() {
    const H = readHash();
    const views = (H.v ? H.v.split(',') : store.get('views', ['cab', 'elec'])).filter((v) => V[v]);
    const defaults = ['cab', 'elec'];
    const host = $('#panes');
    [0, 1].forEach((i) => {
      const el = document.createElement('div');
      el.className = 'pane p' + i;
      el.innerHTML = '<div class="pane-bar"><div class="tabs">' + ORDER.map((v) => '<button data-v="' + v + '" title="' + esc(V[v].title) + '">' + esc(V[v].short) + '</button>').join('') + '</div>' +
        '<div class="zb"><button data-z="in" title="Збільшити">+</button><button data-z="out" title="Зменшити">−</button><button data-z="fit" title="Показати все">⤢</button><button data-z="focus" title="До виділеного">◎</button></div></div>' +
        '<div class="pane-body"><svg class="view" xmlns="http://www.w3.org/2000/svg"></svg><div class="pane-title"></div><div class="legend"></div></div>';
      host.appendChild(el);
      const p = { el, svg: el.querySelector('svg'), saved: {}, vb: null, bounds: { x: 0, y: 0, w: 100, h: 100 } };
      state.panes.push(p);
      bindPane(p);
    });
    setLayout(state.layout);
    state.panes.forEach((p, i) => setView(p, views[i] || defaults[i]));
    state.panes.forEach((p) => { if (p.svg.clientWidth) { fit(p); p.fitted = true; } });
    if (H.el && byId[H.el]) select({ t: 'e', id: H.el });
    else if (H.cab && cabById[H.cab]) select({ t: 'c', id: H.cab });
    else if (H.mode && D.modes.some((m) => m.id === H.mode)) select({ t: 'm', id: H.mode });
    else renderInfo();
    window.matchMedia('(max-width: 900px)').addEventListener('change', () => setLayout(state.layout));
  }
  init();
})();
