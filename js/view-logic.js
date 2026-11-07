/* Логічна (функціональна) схема: блоки, логічні вузли, потоки енергії та сигналів */
(function () {
  'use strict';
  const { E, T } = SV;
  const D = window.SCHEMA;
  const byId = SV.byId;

  const BW = 168, BH = 50;
  const ry = (r) => 70 + r * 84;

  const FUNC = {
    GRID: 'джерело 3~380 В',
    QF1: 'I > Iн → відкл.',
    KV1: '192 В < U < 260 В',
    QD1: 'IΔ > 30 мА → відкл.',
    KM1: 'вмик. від K1 (Робота)',
    XB1: 'L1 L2 L3 N → ПП1–7',
    QF2: 'живлення керування',
    SB4: 'NC, на шафі', SB5: 'NC, рама сканера', SB6: 'NC, на лінії', SA1: 'ключ у роб. положенні', SQ2: 'NC, розворот', SQ3: 'NC, розворот',
    SB1: 'NO, імпульс «Пуск»',
    KM2: 'самоутримання → Лінія стоп',
    KT1: 't₁: блоки живлення',
    KT2: 't₂ ≥ t₁ + 10 с: плати',
    SB2: 'NO, «Лінія старт»',
    SB3: 'NC, «Стоп»',
    KM3: 'самоутримання → Робота',
    K1: 'вмикає котушку KM1',
    HL1: 'зелена «Робота»', HL2: 'жовта «Пауза»', HL3: 'червона «Лінія стоп»',
    BK1: 'вимір T', AK1: 'T > Tуст → вент.', M1: 'охолодження шафи',
    SQ1: 'двері відчинені', EL1: 'світло в шафі',
    UZ1: '~230 → =24 В', QF3: 'однофазна група', NET1: 'мережа', PC1: 'сервер / ПК',
    SC1: 'рама сканера', UZ2: '~/=', UZ3: '~/=', UZ4: '~/=', CB1: 'центральна плата', HMI1: 'Speed · Uptime', SCN1: 'зчитування',
    PR1: 'друк етикеток', WT1: 'розетки столу', EL2: 'світло лінії',
  };

  function build(ctx) {
    const g = ctx.root;
    const deco = E('g', { class: 'deco' }, g);
    const links = E('g', { class: 'links' }, g);
    const nodes = E('g', { class: 'parts' }, g);
    const BOX = {};

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

    const lane = (x, y, w, h, title) => {
      E('rect', { x, y, width: w, height: h, rx: 10, class: 'lane' }, deco);
      T(deco, x + 14, y + 22, title, { class: 'lane-t' });
    };
    lane(20, 28, 2140, 104, 'Ввід і захист (працює завжди)');
    lane(20, 144, 2140, 1000, 'Керування: Пауза → Лінія стоп → Робота');
    lane(20, 1156, 2140, 700, 'Однофазне навантаження (Лінія стоп) · плати / відвідники — припущення');
    lane(2180, 28, 620, 1828, 'Трифазне навантаження (Робота)');

    /* ввід */
    box('GRID', 40, ry(0)); box('QF1', 250, ry(0)); box('KV1', 460, ry(0)); box('QD1', 670, ry(0));
    box('KM1', 1760, ry(0)); box('XB1', 1970, ry(0), { w: 160 });

    /* коло аварійної зупинки та Пуск */
    box('QF2', 40, ry(4.5));
    ['SB4', 'SB5', 'SB6', 'SA1', 'SQ2', 'SQ3'].forEach((id, i) => box(id, 250, ry(2) + i * 76, { h: 46 }));
    box('SB1', 250, ry(8.2));
    box('G_OR1', 480, ry(8.2) - 6, { w: 64, h: 62 });
    box('G_AND1', 640, ry(2), { w: 64, h: ry(8.2) + 56 - ry(2) });
    box('KM2', 780, ry(5));
    box('KT1', 1000, ry(3.6));
    box('KT2', 1000, ry(6.4));
    box('UZ1', 1210, ry(2.2));
    /* Лінія старт */
    box('SB3', 1210, ry(5.2));
    box('SB2', 1000, ry(8.6));
    box('G_OR2', 1240, ry(8.6) - 6, { w: 64, h: 62 });
    box('G_AND2', 1420, ry(5), { w: 64, h: ry(8.6) + 56 - ry(5) });
    box('KM3', 1530, ry(6.6));
    box('K1', 1530, ry(4.4));
    /* індикація */
    box('HL3', 1760, ry(8.4));
    box('HL2', 1210, ry(10.2));
    box('HL1', 1970, ry(2.2));
    /* клімат */
    box('BK1', 40, ry(10.4), { h: 44 }); box('AK1', 250, ry(10.4), { h: 44 }); box('M1', 460, ry(10.4), { h: 44 });
    box('SQ1', 670, ry(10.4), { h: 44 }); box('EL1', 880, ry(10.4), { h: 44 });

    /* однофазне навантаження */
    const oy = 1200;
    box('QF3', 40, oy + 160);
    ['QF4', 'QF5', 'QF6', 'QF7', 'QF8'].forEach((q, i) => box(q, 250, oy + i * 70, { h: 46 }));
    for (let k = 1; k <= 5; k++) box('D' + k, 480, oy + (k - 1) * 22, { cell: true, w: 128, h: 19, sub: 'табло' });
    box('PR1', 670, oy + 70, { h: 46 });
    box('WT1', 480, oy + 140, { h: 46 });
    box('PC1', 670, oy + 140, { h: 46 });
    box('SC1', 480, oy + 210, { h: 46 });
    ['UZ2', 'UZ3', 'UZ4'].forEach((u, i) => box(u, 670, oy + 220 + i * 60, { w: 120, h: 44 }));
    box('CB1', 880, oy + 220, { h: 46 });
    box('HMI1', 1090, oy + 280, { h: 46 });
    box('SCN1', 880, oy + 340, { h: 46 });
    box('EL2', 480, oy + 280, { h: 46 });
    box('NET1', 480, oy + 420, { h: 46 });
    /* плати / відвідники */
    const A0 = oy, AH = 20;
    D.drivers.forEach((dv, i) => {
      box(dv.a, 1640, A0 + i * AH, { cell: true, w: 120, h: AH - 3, sub: 'плата' });
      box(dv.y, 1800, A0 + i * AH, { cell: true, w: 110, h: AH - 3, sub: dv.mod.replace('MOD', 'мод.') });
    });
    for (let k = 1; k <= 4; k++) {
      const first = (k - 1) * 8, last = Math.min(k * 8, 30) - 1;
      const y = A0 + first * AH, h = (last - first + 1) * AH - 3;
      box('KR' + k, 1420, y + h / 2 - 25, { f: 'канали ' + (first + 1) + '–' + (last + 1) });
    }
    /* трифазне */
    D.groups.forEach((G, gi) => {
      const y0 = 80 + gi * 250;
      box(G.pa, 2200, y0 + 2 * 44 - 25, { w: 150, f: 'плавний пуск' });
      G.lines.forEach((L, i) => {
        box(L.qf, 2390, y0 + i * 44, { cell: true, w: 120, h: 36, sub: '3P' });
        box(L.m, 2550, y0 + i * 44, { cell: true, w: 230, h: 36, sub: '№' + L.k + ' · ' + (byId[L.zone] ? byId[L.zone].name.split(' ')[0] : L.zone) + (/\d/.test(L.zone) ? ' ' + L.zone.replace(/\D/g, '') : '') });
      });
    });

    /* зв'язки */
    const all = [];
    D.cables.forEach((c) => {
      if (c.logic === false) return;
      if (!BOX[c.from] || !BOX[c.to]) return;
      all.push({ a: c.from, b: c.to, cabs: [c.id], kind: c.kind, label: '' });
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
        const sx = A.x + A.w / 2, sy = A.y + A.h, tx = B.x + B.w / 2, ty = B.y + B.h;
        const dip = Math.max(sy, ty) + 50;
        d = 'M' + sx + ' ' + sy + 'C' + sx + ' ' + dip + ',' + tx + ' ' + dip + ',' + tx + ' ' + ty;
        ex = tx; ey = ty; ang = -90; mx = (sx + tx) / 2; my = dip - 12;
      }
      const lg = E('g', { class: 'lnk k-' + L.kind }, links);
      E('path', { d, class: 'l-hit' }, lg);
      E('path', { d, class: 'l-core', stroke: color }, lg);
      E('path', { d: 'M-8 -4L0 0L-8 4Z', class: 'l-arrow', fill: color, transform: 'translate(' + ex + ' ' + ey + ') rotate(' + ang + ')' }, lg);
      if (L.label) T(lg, mx, my - 4, L.label, { class: 'lbl l-lab', 'text-anchor': 'middle' });
      const x0 = Math.min(A.x, B.x), y0 = Math.min(A.y, B.y);
      ctx.regLink(lg, L.cabs, L.a, L.b, { x: x0, y: y0, w: Math.max(A.x + A.w, B.x + B.w) - x0, h: Math.max(A.y + A.h, B.y + B.h) - y0 });
    });

    return { bounds: { x: 0, y: 0, w: 2820, h: 1880 } };
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
