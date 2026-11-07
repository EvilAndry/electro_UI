/* SVG-хелпери, умовні позначення та маршрутизація кабелів */
window.SV = (function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const D = window.SCHEMA;
  const byId = {};
  D.elements.forEach((e) => (byId[e.id] = e));

  function E(tag, a, p) {
    const n = document.createElementNS(NS, tag);
    if (a) for (const k in a) if (a[k] !== undefined && a[k] !== null && a[k] !== false) n.setAttribute(k, a[k]);
    if (p) p.appendChild(n);
    return n;
  }
  function T(p, x, y, s, a) {
    const t = E('text', Object.assign({ x, y }, a || {}), p);
    t.textContent = s;
    return t;
  }
  const r1 = (v) => Math.round(v * 10) / 10;
  function dPath(pts) {
    return pts.map((q, i) => (i ? 'L' : 'M') + r1(q[0]) + ' ' + r1(q[1])).join('');
  }
  function dedupe(pts) {
    const out = [];
    pts.forEach((p) => {
      const l = out[out.length - 1];
      if (!l || Math.abs(l[0] - p[0]) > 0.01 || Math.abs(l[1] - p[1]) > 0.01) out.push(p);
    });
    // прибрати проміжні точки на одній прямій
    const res = [];
    out.forEach((p, i) => {
      if (i > 0 && i < out.length - 1) {
        const a = out[i - 1], b = out[i + 1];
        if ((Math.abs(a[0] - p[0]) < 0.01 && Math.abs(b[0] - p[0]) < 0.01) ||
            (Math.abs(a[1] - p[1]) < 0.01 && Math.abs(b[1] - p[1]) < 0.01)) return;
      }
      res.push(p);
    });
    return res;
  }
  function bbox(pts, pad) {
    pad = pad || 0;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach((p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  }
  function hash(s) {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function midLongest(pts) {
    let best = -1, bi = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
      if (l > best) { best = l; bi = i; }
    }
    const a = pts[bi], b = pts[bi + 1] || a;
    return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, vertical: Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) > 0.5 };
  }

  /* Підписи */
  function label(id) {
    const e = byId[id];
    return e ? e.mark || e.id : id;
  }
  function cableTag(c) {
    if (c.mark && (c.mark.num || c.mark.color)) return c.mark.num || c.id;
    return c.id;
  }
  function kindColor(c) {
    return (D.kinds[c.kind] || {}).color || '#6b7280';
  }
  function physColor(c) {
    if (c.phys) return c.phys;
    if (c.kind === 'pe') return D.phaseColors.PE;
    if (c.phase && D.phaseColors[c.phase]) return D.phaseColors[c.phase];
    if (c.kind === 'ctrl') return '#ef4444';
    if (c.kind === 'lv') return '#f59e0b';
    if (c.kind === 'data') return '#cbd5e1';
    return '#e5e7eb';
  }

  /* Маршрутизація по «дереву» кабельних трас.
     trunks: { id: { v:true, x } | { y } , parent }
     A/B:    { t: trunkId, c: координата вздовж траси, pre: [[x,y]...] — від порту до траси } */
  function treeRoute(TR, A, B, lane) {
    const chain = (t) => { const r = []; while (t) { r.push(t); t = TR[t].parent; } return r; };
    const ca = chain(A.t), cbn = chain(B.t);
    const lca = ca.find((t) => cbn.indexOf(t) >= 0);
    const on = (t, c) => (TR[t].v ? [TR[t].x + lane, c] : [c, TR[t].y + lane]);
    const corner = (t1, t2) => {
      const a = TR[t1], b = TR[t2];
      return a.v ? [a.x + lane, b.y + lane] : [b.x + lane, a.y + lane];
    };
    const pts = A.pre.slice();
    pts.push(on(A.t, A.c));
    for (let i = 0; ca[i] !== lca; i++) pts.push(corner(ca[i], ca[i + 1]));
    const ib = cbn.indexOf(lca);
    for (let i = ib; i > 0; i--) pts.push(corner(cbn[i], cbn[i - 1]));
    pts.push(on(B.t, B.c));
    B.pre.slice().reverse().forEach((p) => pts.push(p));
    return dedupe(pts);
  }

  /* Ортогональний маршрут між двома портами з напрямками */
  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function orthoRoute(p1, d1, p2, d2, stub) {
    stub = stub || 14;
    const v1 = DIRV[d1], v2 = DIRV[d2];
    const a1 = [p1[0] + v1[0] * stub, p1[1] + v1[1] * stub];
    const a2 = [p2[0] + v2[0] * stub, p2[1] + v2[1] * stub];
    const vert1 = d1 === 'up' || d1 === 'down';
    const vert2 = d2 === 'up' || d2 === 'down';
    let mid;
    if (vert1 && vert2) mid = [[a2[0], a1[1]]];
    else if (!vert1 && !vert2) mid = [[a1[0], a2[1]]];
    else if (vert1 && !vert2) mid = [[a1[0], a2[1]]];
    else mid = [[a2[0], a1[1]]];
    // пряма лінія, якщо порти співвісні
    if (vert1 && vert2 && Math.abs(p1[0] - p2[0]) < 0.5) return [p1, p2];
    if (!vert1 && !vert2 && Math.abs(p1[1] - p2[1]) < 0.5) return [p1, p2];
    return dedupe([p1, a1].concat(mid, [a2, p2]));
  }

  /* ----------------------- Умовні позначення (ДСТУ / IEC) -------------------
     Малюються вертикально в (0,0), виводи на (0,-20) та (0,20). */
  const pth = (g, d, a) => E('path', Object.assign({ d }, a || {}), g);
  function ticks(g, n) {
    if (!n || n < 2) return;
    for (let i = 0; i < n; i++) { const y = 11 + i * 3.2; pth(g, 'M-4 ' + (y + 2) + 'L4 ' + (y - 2)); }
  }
  const SYM = {
    breaker(g, o) { pth(g, 'M0 -20V-8M-3 -11l6 6M3 -11l-6 6M0 8L-9 -7M0 8V20'); ticks(g, o.poles); },
    rcd(g, o) { SYM.breaker(g, o); E('ellipse', { cx: 0, cy: 3, rx: 13, ry: 4 }, g); T(g, 14, -2, 'IΔ', { class: 'sym-t' }); },
    contactor(g, o) { pth(g, 'M0 -20V-8M-4 -8a4 4 0 0 1 8 0M0 8L-9 -7M0 8V20'); ticks(g, o.poles); },
    no(g) { pth(g, 'M0 -20V-8M0 8L-9 -7M0 8V20'); },
    nc(g) { pth(g, 'M0 -20V-8H7M0 8L9 -11M0 8V20'); },
    btn_no(g) { SYM.no(g); pth(g, 'M-5 0H-15', { 'stroke-dasharray': '2 2' }); pth(g, 'M-15 -5V5'); },
    btn_nc(g) { SYM.nc(g); pth(g, 'M5 -2H-13', { 'stroke-dasharray': '2 2' }); pth(g, 'M-13 -7V3'); },
    estop(g) { SYM.nc(g); pth(g, 'M5 -2H-11', { 'stroke-dasharray': '2 2' }); pth(g, 'M-11 -8a6 6 0 0 0 0 12z', { class: 'fill-r' }); },
    estop_no(g) { SYM.no(g); pth(g, 'M-5 0H-11', { 'stroke-dasharray': '2 2' }); pth(g, 'M-11 -6a6 6 0 0 0 0 12z', { class: 'fill-r' }); },
    contact_t(g) { SYM.no(g); pth(g, 'M-5 0H-14M-14 -5a5 5 0 0 0 0 10'); },
    coil(g) { pth(g, 'M0 -20V-8M0 8V20'); E('rect', { x: -11, y: -8, width: 22, height: 16 }, g); },
    coil_t(g) { SYM.coil(g); E('rect', { x: -11, y: -8, width: 7, height: 16, class: 'fill-k' }, g); },
    lamp(g) { pth(g, 'M0 -20V-9M0 9V20'); E('circle', { r: 9 }, g); pth(g, 'M-6.4 -6.4L6.4 6.4M6.4 -6.4L-6.4 6.4'); },
    motor(g) { pth(g, 'M0 -20V-10M0 10V20'); E('circle', { r: 10 }, g); T(g, 0, 4, 'M', { class: 'sym-c' }); },
    meter(g) { pth(g, 'M0 -20V-9M0 9V20'); E('circle', { r: 9 }, g); T(g, 0, 4, 'A', { class: 'sym-c' }); },
    vrelay(g) { pth(g, 'M0 -20V-12M0 12V20'); E('rect', { x: -14, y: -12, width: 28, height: 24 }, g); T(g, 0, 1, 'U', { class: 'sym-c' }); T(g, 0, 9, '< >', { class: 'sym-t', 'text-anchor': 'middle' }); },
    source(g) { pth(g, 'M0 12V20'); E('circle', { r: 12 }, g); T(g, 0, 4, '3~', { class: 'sym-c' }); },
    terminal(g) { pth(g, 'M0 -20V-4M0 4V20'); E('circle', { r: 4, class: 'fill-w' }, g); },
    solenoid(g) { pth(g, 'M0 -20V-8M0 8V20'); E('rect', { x: -9, y: -8, width: 18, height: 16 }, g); pth(g, 'M-9 8L9 -8'); },
    limit(g) { SYM.no(g); pth(g, 'M-5 0H-12'); pth(g, 'M-12 -4L-17 0L-12 4Z'); },
    box(g, o) {
      const w = o.w || 30, h = o.h || 22, hl = o.hl || 20;
      pth(g, 'M0 ' + -hl + 'V' + -h / 2 + 'M0 ' + h / 2 + 'V' + hl);
      E('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 2 }, g);
      if (o.t) T(g, 0, 3.5, o.t, { class: 'sym-c sm' });
    },
    boxh(g, o) { // горизонтальний блок з виводами ліворуч/праворуч
      const w = o.w || 30, h = o.h || 22, hl = o.hl || 20;
      pth(g, 'M' + -hl + ' 0H' + -w / 2 + 'M' + w / 2 + ' 0H' + hl);
      E('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 2 }, g);
      if (o.t) T(g, 0, 3.5, o.t, { class: 'sym-c sm' });
    },
    display(g) { pth(g, 'M0 -20V-9M0 9V20'); E('rect', { x: -13, y: -9, width: 26, height: 18, rx: 2 }, g); E('rect', { x: -10, y: -6, width: 20, height: 10, class: 'fill-k2' }, g); },
  };
  const BOXY = { box: 1, display: 1 };
  /* Малює символ type в групі g; orient 'h' — горизонтально */
  function sym(g, type, o, orient) {
    o = o || {};
    const s = E('g', { class: 'sym' }, g);
    if (orient === 'h') {
      if (type === 'box') { SYM.boxh(s, o); return s; }
      const r = E('g', { transform: 'rotate(-90)' }, s);
      (SYM[type] || SYM.box)(r, o);
      return s;
    }
    (SYM[type] || SYM.box)(s, o);
    return s;
  }

  return { NS, E, T, dPath, dedupe, bbox, hash, midLongest, label, cableTag, kindColor, physColor, treeRoute, orthoRoute, sym, BOXY, byId };
})();

window.VIEWS = window.VIEWS || {};
