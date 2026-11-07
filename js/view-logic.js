/* Логічна (функціональна) схема: блоки, логічні вузли, потоки енергії та сигналів */
(function () {
  'use strict';
  const { E, T } = SV;
  const D = window.SCHEMA;
  const byId = SV.byId;

  const BW = 168, BH = 50;
  const cx = (c) => 40 + c * 210;
  const ry = (r) => 70 + r * 84;

  const FUNC = {
    GRID: 'джерело 3~380 В',
    QF1: 'I > Iн → відкл.',
    KV1: 'Umin < U < Umax',
    QD1: 'IΔ > 30 мА → відкл.',
    XB1: 'розподіл L1 L2 L3 N',
    KM1: 'вмик. = (Пуск ∨ сам.) ∧ дозвіл',
    QF2: 'живлення керування',
    HL1: 'індикація «Мережа»',
    SB1: 'імпульс «Пуск»',
    SB2: '«Стоп» (НЗ)',
    SB3: 'аварійний стоп',
    KT1: 'затримка ввімк. t₁',
    KT2: 'таймер t₂',
    KM2: 'живлення драйверів',
    KM3: 'вмикання світла',
    HL2: 'індикація «Робота»',
    HL3: 'індикація «Аварія»',
    K1: 'аварія → ПК, HL3',
    BK1: 'вимір T',
    AK1: 'T > Tуст → вент.',
    M1: 'охолодження шафи',
    SQ1: 'двері відчинені',
    EL1: 'світло в шафі',
    UZ1: '~220 → =24 В',
    QF3: 'група оператора',
    PC1: 'розрахунок сортування',
    SC1: 'зчитування коду',
    PR1: 'друк етикеток',
    WT1: 'розетки столу',
    EL2: 'світло модулів',
  };

  function build(ctx) {
    const g = ctx.root;
    const deco = E('g', { class: 'deco' }, g);
    const links = E('g', { class: 'links' }, g);
    const nodes = E('g', { class: 'parts' }, g);
    const BOX = {}; // id -> {x,y,w,h}

    const box = (id, x, y, o) => {
      o = o || {};
      const e = byId[id]; if (!e) return;
      const w = o.w || BW, h = o.h || BH;
      BOX[id] = { x, y, w, h };
      const gg = E('g', { transform: 'translate(' + x + ' ' + y + ')' }, nodes);
      if (e.assumed) gg.classList.add('assumed');
      if (e.type === 'gate') {
        E('rect', { x: 0, y: 0, width: w, height: h, rx: 2, class: 'lg-gate' }, gg);
        T(gg, w / 2, h / 2 + 7, e.sym, { class: 'lg-gsym', 'text-anchor': 'middle' });
      } else if (o.cell) {
        E('rect', { x: 0, y: 0, width: w, height: h, rx: 2, class: 'lg-cell' }, gg);
        T(gg, 5, h - 4, SV.label(id), { class: 'lbl b' });
        if (o.sub) T(gg, w - 5, h - 4, o.sub, { class: 'lbl dim', 'text-anchor': 'end' });
      } else {
        E('rect', { x: 0, y: 0, width: w, height: h, rx: 6, class: 'lg-box t-' + e.type }, gg);
        T(gg, 10, 19, SV.label(id), { class: 'lg-id' });
        const nm = e.name.length > 24 ? e.name.slice(0, 23) + '…' : e.name;
        T(gg, 10 + Math.max(34, SV.label(id).length * 8.2), 19, nm, { class: 'lbl' });
        const f = o.f || FUNC[id];
        if (f) T(gg, 10, 38, f, { class: 'lg-f' });
      }
      E('rect', { x: -2, y: -2, width: w + 4, height: h + 4, rx: 7, class: 'hit' }, gg);
      ctx.regEl(id, gg, { x, y, w, h });
    };
    const P = (id, c, r, o) => box(id, cx(c), ry(r), o);

    /* смуги */
    const lane = (y, h, title, x, w) => {
      E('rect', { x: x || 20, y, width: w || 1660, height: h, rx: 10, class: 'lane' }, deco);
      T(deco, (x || 20) + 14, y + 22, title, { class: 'lane-t' });
    };
    lane(28, 120, 'Ввід і захист');
    lane(160, 760, 'Керування');
    lane(932, 640, 'Обладнання оператора · керування відвідниками');
    lane(28, 1544, 'Приводи конвеєрів', 1700, 1080);

    /* ввід */
    P('GRID', 0, 0); P('QF1', 1, 0); P('KV1', 2, 0); P('QD1', 3, 0); P('XB1', 4, 0); P('KM1', 5, 0);
    /* керування */
    P('QF2', 1, 3); P('HL1', 2, 2);
    P('SB3', 2, 3); P('SB2', 2, 4); P('SB1', 2, 5);
    box('G_OR1', cx(3) + 50, ry(5) - 6, { w: 64, h: 62 });
    box('G_AND1', cx(4) + 50, ry(3) + 30, { w: 64, h: 86 });
    P('KT1', 5, 3); P('KM2', 6, 3);
    P('KT2', 5, 4); P('HL2', 5, 2);
    P('K1', 3, 7); P('HL3', 4, 7);
    P('BK1', 1, 8); P('AK1', 2, 8); P('M1', 3, 8);
    P('SQ1', 4, 8); P('EL1', 5, 8);
    P('UZ1', 6, 6);
    /* оператор */
    P('QF3', 0, 12);
    ['QF4', 'QF5', 'QF6', 'QF7', 'QF8'].forEach((q, i) => P(q, 1, 11 + i * 0.9, { h: 44 }));
    for (let k = 1; k <= 5; k++) box('D' + k, cx(2) + 20, ry(10.85) + (k - 1) * 26, { cell: true, w: 128, h: 22, sub: 'табло' });
    P('PR1', 3, 11.8); P('WT1', 2, 12.9); P('PC1', 3, 12.9); P('SC1', 2, 13.9);
    P('KM3', 3, 14.6, { h: 44 }); P('EL2', 4, 14.6, { h: 44 });
    /* відвідники */
    const A0 = 980, AH = 18;
    D.drivers.forEach((dv, i) => {
      box(dv.a, cx(6), A0 + i * AH, { cell: true, w: 120, h: AH - 3, sub: 'драйвер' });
      box(dv.y, cx(6) + 160, A0 + i * AH, { cell: true, w: 110, h: AH - 3, sub: dv.mod.replace('MOD', 'мод.') });
    });
    for (let k = 1; k <= 4; k++) {
      const first = (k - 1) * 8, last = Math.min(k * 8, 30) - 1;
      const y = A0 + first * AH, h = (last - first + 1) * AH - 3;
      box('KR' + k, cx(5), y + h / 2 - 25, { f: 'канали ' + (first + 1) + '–' + (last + 1) });
    }
    /* приводи */
    const GX = 1730;
    D.groups.forEach((G, gi) => {
      const y0 = 70 + gi * 214;
      box(G.pa, GX, y0 + 6 * 16 - 25, { w: 150, f: 'вимір I групи · ' + G.phase });
      G.lines.forEach((L, i) => {
        box(L.qf, GX + 190, y0 + i * 16, { cell: true, w: 120, h: 13, sub: 'автомат' });
        box(L.m, GX + 350, y0 + i * 16, { cell: true, w: 120, h: 13, sub: 'привод' });
      });
    });
    // зони — праворуч від своїх приводів
    const zoneRows = {};
    D.groups.forEach((G, gi) => G.lines.forEach((L, i) => {
      const y = 70 + gi * 214 + i * 16;
      const z = zoneRows[L.zone] || (zoneRows[L.zone] = { y0: y, y1: y });
      z.y0 = Math.min(z.y0, y); z.y1 = Math.max(z.y1, y + 13);
    }));
    Object.keys(zoneRows).forEach((z) => {
      const r = zoneRows[z];
      box(z, GX + 510, r.y0, { w: 230, h: Math.max(26, r.y1 - r.y0), f: ' ' });
    });
    box('ZOUT', GX + 510, 70 + 7 * 214 - 8, { w: 230, h: 46, f: 'живлення не задане' });

    /* зв'язки */
    const all = [];
    const cabSkip = new Set();
    D.cables.forEach((c) => {
      if (c.logic === false) return;
      if (!BOX[c.from] || !BOX[c.to]) return;
      all.push({ a: c.from, b: c.to, cabs: [c.id], kind: c.kind, label: '' });
      cabSkip.add(c.id);
    });
    D.logicLinks.forEach((L) => {
      if (!BOX[L.a] || !BOX[L.b]) return;
      const c0 = L.cabs.map((id) => D.cables.find((c) => c.id === id)).filter(Boolean)[0];
      all.push({ a: L.a, b: L.b, cabs: L.cabs, kind: c0 ? c0.kind : 'ctrl', label: L.label });
    });

    all.forEach((L) => {
      const A = BOX[L.a], B = BOX[L.b];
      const color = (D.kinds[L.kind] || {}).color || '#64748b';
      let d, ex, ey, ang, mx, my;
      const ax = A.x + A.w, ay = A.y + A.h / 2;
      const bx = B.x, by = B.y + B.h / 2;
      if (bx >= ax - 4) {
        const k = Math.max(30, (bx - ax) * 0.5);
        d = 'M' + ax + ' ' + ay + 'C' + (ax + k) + ' ' + ay + ',' + (bx - k) + ' ' + by + ',' + bx + ' ' + by;
        ex = bx; ey = by; ang = 0; mx = (ax + bx) / 2; my = (ay + by) / 2;
      } else {
        // зворотний зв'язок — знизу
        const sx = A.x + A.w / 2, sy = A.y + A.h, tx = B.x + B.w / 2, ty = B.y + B.h;
        const dip = Math.max(sy, ty) + 60;
        d = 'M' + sx + ' ' + sy + 'C' + sx + ' ' + dip + ',' + tx + ' ' + dip + ',' + tx + ' ' + ty;
        ex = tx; ey = ty; ang = -90; mx = (sx + tx) / 2; my = dip - 14;
      }
      const lg = E('g', { class: 'lnk k-' + L.kind }, links);
      E('path', { d, class: 'l-hit' }, lg);
      E('path', { d, class: 'l-core', stroke: color }, lg);
      E('path', { d: 'M-8 -4L0 0L-8 4Z', class: 'l-arrow', fill: color, transform: 'translate(' + ex + ' ' + ey + ') rotate(' + ang + ')' }, lg);
      if (L.label) T(lg, mx, my - 4, L.label, { class: 'lbl l-lab', 'text-anchor': 'middle' });
      const bb = { x: Math.min(A.x, B.x), y: Math.min(A.y, B.y), w: Math.abs((B.x + B.w) - A.x) + A.w, h: Math.abs(B.y - A.y) + Math.max(A.h, B.h) };
      ctx.regLink(lg, L.cabs, L.a, L.b, bb);
    });

    return { bounds: { x: 0, y: 0, w: 2800, h: 1600 } };
  }

  window.VIEWS.logic = {
    title: 'Логічна схема',
    short: 'Логічна',
    paper: true,
    build,
    legend() {
      return Object.keys(D.kinds).map((k) => '<span><i style="background:' + D.kinds[k].color + '"></i>' + D.kinds[k].name + '</span>').join('') +
        '<span><b class="gate">&amp;</b> І</span><span><b class="gate">≥1</b> АБО</span>';
    },
  };
})();
