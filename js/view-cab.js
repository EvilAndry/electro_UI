/* Фізична схема: шафа керування (за фото, спрощено) */
(function () {
  'use strict';
  const { E, T } = SV;
  const D = window.SCHEMA;
  const byId = SV.byId;
  const cabById = {};
  D.cables.forEach((c) => (cabById[c.id] = c));

  /* Кабельні траси (дерево; корінь — ліва вертикальна гофра/короб L) */
  const DUCT_Y = { d1: 392, d2: 534 };
  for (let k = 1; k <= 7; k++) DUCT_Y['d' + (k + 2)] = 560 + (k - 1) * 130 + 84 + 22;
  const TR = {
    L: { v: true, x: 232 },
    TOP: { y: 235, parent: 'L' },
    D: { v: true, x: 952, parent: 'TOP' },
    B: { y: 1500, parent: 'L' },
    R: { v: true, x: 642, parent: 'B' },
    T: { y: 400, parent: 'R' },
    H: { v: true, x: 845, parent: 'T' },
  };
  Object.keys(DUCT_Y).forEach((k) => (TR[k] = { y: DUCT_Y[k], parent: 'L' }));
  const ROWDUCT = { R1: ['TOP', 'd1'], R2: ['d1', 'd2'] };
  for (let k = 1; k <= 7; k++) ROWDUCT['G' + k] = ['d' + (k + 1), 'd' + (k + 2)];

  function layout() {
    const L = {};
    const put = (id, x, y, w, h, look, row, extra) => (L[id] = Object.assign({ x, y, w, h, look, row }, extra || {}));
    const u = 16;
    let x = 305;
    put('QF1', x, 270, 3 * u, 100, 'iek', 'R1', { poles: 3 }); x += 3 * u;
    put('KV1', x, 270, 6 * u, 100, 'kv', 'R1'); x += 6 * u;
    put('QD1', x, 270, 4 * u, 100, 'rcd', 'R1'); x += 4 * u;
    put('KM1', x, 270, 3 * u, 100, 'hager', 'R1', { txt: 'ESC363' }); x += 3 * u;
    put('AK1', x, 270, 2 * u, 100, 'tk3', 'R1'); x += 2 * u;
    put('X1', x + 2, 282, 30, 76, 'term', 'R1');

    x = 305;
    put('XB1', x, 425, 80, 85, 'bus', 'R2'); x += 84;
    put('X2', x, 432, 24, 72, 'termpe', 'R2'); x += 26;
    put('KT1', x, 425, 16, 85, 'eti', 'R2'); x += 17;
    put('KT2', x, 425, 16, 85, 'eti', 'R2'); x += 19;
    put('KM2', x, 425, 30, 85, 'hager', 'R2', { txt: 'ESC325' }); x += 31;
    put('KM3', x, 425, 16, 85, 'hager', 'R2'); x += 17;
    put('K1', x, 440, 12, 60, 'relay', 'R2'); x += 14;
    put('QF2', x, 425, 18, 85, 'mcn', 'R2', { txt: '12' }); x += 19;
    put('QF3', x, 425, 18, 85, 'mcn', 'R2'); x += 19;
    ['QF4', 'QF5', 'QF6', 'QF7', 'QF8'].forEach((q) => { put(q, x, 425, 16, 85, 'iek', 'R2'); x += 16.5; });

    D.groups.forEach((G, gi) => {
      const y = 560 + gi * 130;
      put(G.pa, 322, y, 48, 84, 'meter', 'G' + G.n);
      G.lines.forEach((Ln, i) => put(Ln.qf, 374 + i * 50, y, 48, 84, 'iek', 'G' + G.n, { poles: 3, rating: 'C?' }));
    });
    D.drivers.forEach((dv, i) => {
      const col = Math.floor(i / 10), row = i % 10;
      put(dv.a, 648 + col * 67, 410 + row * 108, 40, 92, 'driver', 'RP');
    });
    for (let k = 1; k <= 4; k++) put('KR' + k, 305, 1530 + (k - 1) * 44, 270, 38, 'relayboard', 'B');
    put('UZ1', 588, 1530, 46, 166, 'psu', 'B2');
    put('M1', 70, 262, 54, 150, 'fan', 'LW');
    put('X3', 92, 528, 112, 56, 'wago', 'LW');
    put('X4', 140, 1165, 96, 80, 'termblk', 'LW');
    put('EL1', 66, 138, 600, 14, 'led', 'TOP');
    put('SQ1', 520, 156, 78, 30, 'limit', 'TOP');
    put('BK1', 604, 196, 12, 30, 'sensor', 'TOP');
    // двері — за фото фасаду: ключ; лампи Робота / Пауза / Лінія стоп; Пуск з підсвіткою; синя, Лінія старт, Стоп; аварійна
    put('SA1', 1173, 300, 34, 34, 'keysw', 'DOOR');
    put('HL1', 1103, 372, 34, 34, 'lamp', 'DOOR', { col: '#22c55e' });
    put('HL2', 1173, 372, 34, 34, 'lamp', 'DOOR', { col: '#f59e0b' });
    put('HL3', 1243, 372, 34, 34, 'lamp', 'DOOR', { col: '#ef4444' });
    put('SB1', 1173, 444, 34, 34, 'btn', 'DOOR', { col: '#22c55e', glow: true });
    put('SB7', 1103, 516, 34, 34, 'btn', 'DOOR', { col: '#2563eb' });
    put('SB2', 1173, 516, 34, 34, 'btn', 'DOOR', { col: '#16a34a' });
    put('SB3', 1243, 516, 34, 34, 'btn', 'DOOR', { col: '#dc2626' });
    put('SB4', 1166, 610, 48, 48, 'estop', 'DOOR');
    put('NET1', 300, -150, 300, 40, 'switch', 'RACK');
    put('GRID', 150, 1965, 110, 40, 'entry', 'EXT_IN');
    return L;
  }

  function attach(L, id, isOut, cid) {
    const o = L[id];
    const j = ((SV.hash(cid) % 5) - 2) / 5 * o.w * 0.55;
    const cx = o.x + o.w / 2 + j;
    const row = o.row;
    if (ROWDUCT[row]) {
      const [above, below] = ROWDUCT[row];
      return isOut ? { t: below, c: cx, pre: [[cx, o.y + o.h]] } : { t: above, c: cx, pre: [[cx, o.y]] };
    }
    const bx = o.x + o.w / 2;
    switch (row) {
      case 'RP':
        if (isOut && cabById[cid].exit === 'hose') return { t: 'H', c: o.y - 7, pre: [[bx, o.y], [bx, o.y - 7]] };
        return { t: 'R', c: o.y + o.h + 7, pre: [[bx, o.y + o.h], [bx, o.y + o.h + 7]] };
      case 'B': { const yy = o.y + o.h / 2 + j * 0.05; return { t: 'L', c: yy, pre: [[o.x, yy]] }; }
      case 'B2': return { t: 'B', c: bx, pre: [[bx, o.y]] };
      case 'LW': { const yy = o.y + o.h / 2; return { t: 'L', c: yy, pre: [[o.x + o.w, yy]] }; }
      case 'TOP': return { t: 'TOP', c: cx, pre: [[cx, o.y + o.h]] };
      case 'DOOR': { const yy = o.y + o.h / 2; return { t: 'D', c: yy, pre: [[o.x, yy]] }; }
      case 'EXT_IN': return { t: 'L', c: 1925, pre: [[205, 1965], [205, 1925]] };
      case 'RACK': { const xx = 330 + Math.abs(j); return { t: 'TOP', c: xx, pre: [[xx, o.y + o.h]] }; }
    }
    return { t: 'L', c: o.y, pre: [[o.x, o.y]] };
  }
  const EXITS = {
    gland: { t: 'L', c: 1912, pre: [[330, 1965], [330, 1912]] },
    hose: { t: 'H', c: 1000, pre: [[905, 1046], [905, 1000]] },
  };

  /* ------------------------------ малювання ------------------------------ */
  function duct(p, x, y, w, h, vert) {
    E('rect', { x, y, width: w, height: h, class: 'duct' }, p);
    if (vert) {
      E('path', { d: 'M' + (x + 3) + ' ' + y + 'V' + (y + h) + 'M' + (x + w - 3) + ' ' + y + 'V' + (y + h), class: 'duct-teeth' }, p);
    } else {
      E('path', { d: 'M' + x + ' ' + (y + 3) + 'H' + (x + w) + 'M' + x + ' ' + (y + h - 3) + 'H' + (x + w), class: 'duct-teeth h' }, p);
    }
  }

  function look(g, o, e) {
    const { x, y, w, h } = o;
    const R = (xx, yy, ww, hh, cls, a) => E('rect', Object.assign({ x: xx, y: yy, width: ww, height: hh, class: cls }, a || {}), g);
    const screws = (n) => {
      for (let i = 0; i < n; i++) {
        const sx = x + (w / n) * (i + 0.5);
        E('circle', { cx: sx, cy: y + 9, r: Math.min(4, w / n / 2.6), class: 'screw' }, g);
        E('circle', { cx: sx, cy: y + h - 9, r: Math.min(4, w / n / 2.6), class: 'screw' }, g);
      }
    };
    const vlabel = (txt, yy, cls) => T(g, 0, 0, txt, { class: 'plbl ' + (cls || ''), transform: 'translate(' + (x + w / 2 + 2.5) + ' ' + yy + ') rotate(-90)' });
    switch (o.look) {
      case 'iek': {
        R(x + 0.5, y, w - 1, h, 'm-white');
        const p = o.poles || 1;
        screws(p);
        R(x + 2, y + h * 0.42, w - 4, h * 0.2, 'm-yellow');
        if (p > 1) T(g, x + w / 2, y + 30, o.rating || 'C50', { class: 'plbl', 'text-anchor': 'middle' });
        else R(x + w / 2 - 2, y + 24, 4, 3, 'm-redwin');
        if (p === 1) vlabel(e.caption || SV.label(e.id), y + h - 17, 'tiny');
        else T(g, x + w / 2, y + h - 18, SV.label(e.id), { class: 'plbl b', 'text-anchor': 'middle' });
        break;
      }
      case 'mcn':
        R(x + 0.5, y, w - 1, h, 'm-grey'); screws(1);
        R(x + 3, y + h * 0.38, w - 6, h * 0.26, 'm-toggle');
        if (o.txt) T(g, x + w / 2, y + 26, o.txt, { class: 'plbl b', 'text-anchor': 'middle' });
        vlabel(SV.label(e.id), y + h - 14, 'tiny');
        break;
      case 'kv': {
        R(x, y, w, h, 'm-white'); screws(4);
        for (let i = 0; i < 3; i++) {
          R(x + 6 + i * 24, y + 36, 21, 16, 'm-led');
          T(g, x + 16.5 + i * 24, y + 48.5, '220', { class: 'led-t', 'text-anchor': 'middle' });
          T(g, x + 16.5 + i * 24, y + 32, 'L' + (i + 1), { class: 'plbl', 'text-anchor': 'middle' });
        }
        T(g, x + 8, y + 68, 'DigiTOP VP-3F40A', { class: 'plbl tiny' });
        T(g, x + 8, y + h - 20, SV.label(e.id), { class: 'plbl b' });
        break;
      }
      case 'rcd':
        R(x, y, w, h, 'm-hager'); screws(4);
        R(x + 4, y + 22, w - 8, 4, 'm-blue');
        R(x + 6, y + 38, 12, 26, 'm-toggle');
        R(x + 30, y + 32, 10, 6, 'm-blue');
        T(g, x + 22, y + h - 20, SV.label(e.id), { class: 'plbl b' });
        break;
      case 'hager':
        R(x + 0.5, y, w - 1, h, 'm-hager'); screws(Math.max(1, Math.round(w / 16)));
        R(x + 3, y + h * 0.3, w - 6, h * 0.36, 'm-win');
        if (w >= 30 && o.txt) T(g, x + 4, y + h * 0.27, o.txt, { class: 'plbl tiny' });
        if (w >= 30) T(g, x + w / 2, y + h - 18, SV.label(e.id), { class: 'plbl b', 'text-anchor': 'middle' });
        else vlabel(SV.label(e.id), y + h - 14, 'tiny');
        break;
      case 'tk3':
        R(x, y, w, h, 'm-white'); screws(2);
        R(x + 3, y + 30, w - 6, 15, 'm-led');
        T(g, x + w / 2, y + 41.5, '30.2', { class: 'led-t', 'text-anchor': 'middle' });
        E('circle', { cx: x + 9, cy: y + 62, r: 4, class: 'm-btn' }, g);
        E('circle', { cx: x + 23, cy: y + 62, r: 4, class: 'm-btn' }, g);
        T(g, x + w / 2, y + h - 16, SV.label(e.id), { class: 'plbl b', 'text-anchor': 'middle' });
        break;
      case 'term':
      case 'termpe':
      case 'termblk': {
        R(x, y, w, h, 'm-term');
        const n = Math.max(2, Math.round((o.look === 'termblk' ? h : w) / 7));
        for (let i = 0; i < n; i++) {
          if (o.look === 'termblk') R(x + 2, y + 2 + i * (h - 4) / n, w - 4, (h - 4) / n - 1.5, i % 3 === 0 ? 'm-wireo' : 'm-wireb');
          else R(x + 1 + i * (w - 2) / n, y + 2, (w - 2) / n - 1, h - 4, (o.look === 'termpe' && i === n - 1) ? 'm-pe' : 'm-termc');
        }
        T(g, x + w / 2, y + h + 10, SV.label(e.id), { class: 'plbl b', 'text-anchor': 'middle' });
        break;
      }
      case 'bus':
        R(x, y, w, h, 'm-bus', { rx: 3 });
        for (let i = 0; i < 4; i++) R(x + 4, y + 10 + i * 18, w - 8, 10, 'm-busbar');
        T(g, x + w / 2, y + h - 2, 'VC-411', { class: 'plbl tiny', 'text-anchor': 'middle' });
        T(g, x + w / 2, y - 3, SV.label(e.id), { class: 'plbl b', 'text-anchor': 'middle' });
        break;
      case 'eti':
        R(x + 0.5, y, w - 1, h, 'm-grey'); screws(1);
        [30, 44, 58].forEach((yy) => E('circle', { cx: x + w / 2, cy: y + yy, r: 4, class: 'm-knob' }, g));
        E('circle', { cx: x + w / 2 - 3, cy: y + 20, r: 1.8, class: 'm-ledg' }, g);
        vlabel(SV.label(e.id), y + h - 12, 'tiny');
        break;
      case 'relay':
        R(x, y, w, h, 'm-white'); R(x + 2, y + 10, w - 4, 20, 'm-redwin');
        vlabel(SV.label(e.id), y + h - 6, 'tiny');
        break;
      case 'meter':
        R(x, y, w, h, 'm-grey'); screws(3);
        R(x + 5, y + 26, w - 10, 16, 'm-lcd');
        T(g, x + w / 2, y + 38, '8888', { class: 'lcd-t', 'text-anchor': 'middle' });
        E('circle', { cx: x + w - 10, cy: y + 52, r: 3.5, class: 'm-knob' }, g);
        T(g, x + 6, y + h - 16, SV.label(e.id), { class: 'plbl b' });
        break;
      case 'driver':
        R(x, y, w, h, 'm-pcb', { rx: 2 });
        R(x + 4, y + 6, w - 8, 10, 'm-termr');
        ['#ef4444', '#3b82f6', '#facc15', '#f97316'].forEach((c, i) => {
          E('path', { d: 'M' + (x + 8 + i * 8) + ' ' + (y + 16) + 'q ' + (i % 2 ? 6 : -6) + ' 22 ' + (i % 2 ? -2 : 4) + ' 46', class: 'stub', stroke: c }, g);
        });
        T(g, x + w / 2, y + h - 6, SV.label(e.id), { class: 'plbl b light', 'text-anchor': 'middle' });
        break;
      case 'relayboard':
        R(x, y, w, h, 'm-pcb', { rx: 2 });
        for (let i = 0; i < 8; i++) {
          R(x + 30 + i * 29, y + 4, 18, 13, 'm-relay');
          R(x + 30 + i * 29, y + 21, 18, 12, 'm-termr');
        }
        T(g, x + 4, y + 23, SV.label(e.id), { class: 'plbl b light' });
        break;
      case 'psu':
        R(x, y, w, h, 'm-psu', { rx: 2 });
        T(g, 0, 0, SV.label(e.id) + ' (умовно)', { class: 'plbl b light', transform: 'translate(' + (x + w / 2 + 3) + ' ' + (y + h - 10) + ') rotate(-90)' });
        break;
      case 'fan':
        R(x, y, w, h, 'm-fan', { rx: 4 });
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2 - 5, class: 'm-fanc' }, g);
        for (let i = 0; i < 4; i++) {
          E('path', { d: 'M' + (x + w / 2) + ' ' + (y + h / 2) + 'l ' + (Math.cos(i * 1.57) * 18) + ' ' + (Math.sin(i * 1.57) * 18), class: 'm-fanb' }, g);
        }
        T(g, x + w / 2, y + h + 12, SV.label(e.id), { class: 'plbl b light', 'text-anchor': 'middle' });
        break;
      case 'wago':
        R(x, y, w, h, 'm-term', { rx: 3 });
        for (let i = 0; i < 6; i++) R(x + 8 + i * 16, y + 8, 11, 22, 'm-wagor');
        T(g, x + 6, y + h - 6, SV.label(e.id), { class: 'plbl b' });
        break;
      case 'led':
        R(x, y, w, h, 'm-led-strip', { rx: 4 });
        T(g, x + 8, y - 4, SV.label(e.id), { class: 'plbl b light' });
        break;
      case 'limit':
        R(x, y, w, h, 'm-blue', { rx: 3 });
        R(x + w - 20, y + h, 8, 10, 'm-grey');
        T(g, x + 6, y + 19, SV.label(e.id), { class: 'plbl b light' });
        break;
      case 'sensor':
        R(x, y, w, h, 'm-sensor', { rx: 4 });
        T(g, x - 3, y + 12, SV.label(e.id), { class: 'plbl b light', 'text-anchor': 'end' });
        break;
      case 'lamp':
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2, class: 'm-bezel' }, g);
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2 - 5, fill: o.col, class: 'm-lamp' }, g);
        T(g, x + w / 2, y - 5, SV.label(e.id), { class: 'plbl b light', 'text-anchor': 'middle' });
        break;
      case 'btn':
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2, class: 'm-bezel' }, g);
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2 - 6, fill: o.col, class: 'm-lamp' + (o.glow ? ' glow' : '') }, g);
        T(g, x + w / 2, y + h + 12, SV.label(e.id), { class: 'plbl b light', 'text-anchor': 'middle' });
        break;
      case 'keysw':
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2, class: 'm-bezel' }, g);
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2 - 6, class: 'm-knob' }, g);
        R(x + w / 2 - 2, y + 7, 4, h - 14, 'm-btn');
        T(g, x + w + 6, y + h / 2 + 4, SV.label(e.id), { class: 'plbl b light' });
        break;
      case 'switch':
        R(x, y, w, h, 'm-switch', { rx: 3 });
        for (let i = 0; i < 16; i++) R(x + 40 + i * 14, y + 12, 10, 9, 'm-port');
        T(g, x + 6, y + h - 8, SV.label(e.id), { class: 'plbl b light' });
        break;
      case 'estop':
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2, class: 'm-estop-ring' }, g);
        E('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2 - 9, class: 'm-estop' }, g);
        T(g, x + w + 6, y + h / 2 + 4, SV.label(e.id), { class: 'plbl b light' });
        break;
      case 'entry':
        R(x, y, w, h, 'm-entry', { rx: 6 });
        T(g, x + w / 2, y + 17, '⚡ Ввід', { class: 'plbl b light', 'text-anchor': 'middle' });
        T(g, x + w / 2, y + 31, '3~380 В', { class: 'plbl light', 'text-anchor': 'middle' });
        break;
      default:
        R(x, y, w, h, 'm-grey');
    }
  }

  function build(ctx) {
    const g = ctx.root;
    const L = layout();
    const st = E('g', { class: 'static' }, g);

    /* корпус */
    E('rect', { x: 20, y: 20, width: 880, height: 1920, rx: 10, class: 'cab-shell' }, st);
    E('rect', { x: 52, y: 52, width: 816, height: 1830, rx: 4, class: 'cab-inner' }, st);
    E('rect', { x: 52, y: 1882, width: 816, height: 52, class: 'cab-plinth' }, st);
    E('rect', { x: 150, y: 225, width: 495, height: 1300, class: 'cab-plate' }, st);
    E('rect', { x: 66, y: 200, width: 75, height: 1660, class: 'cab-wall' }, st);
    [645, 712, 779].forEach((x) => {
      E('rect', { x, y: 395, width: 46, height: 1130, class: 'post' }, st);
      E('path', { d: 'M' + (x + 4) + ' 400V1520', class: 'post-holes' }, st);
    });
    /* DIN-рейки */
    [[290, 320], [440, 468]].concat(D.groups.map((G, i) => [560 + i * 130 + 42, 0])).forEach(([y]) => E('rect', { x: 300, y: y - 4, width: 340, height: 8, class: 'din' }, st));
    /* короби */
    duct(st, 165, 240, 135, 1230, true);
    duct(st, 300, 380, 340, 24);
    duct(st, 300, 522, 340, 24);
    for (let k = 3; k <= 9; k++) duct(st, 300, DUCT_Y['d' + k] - 12, 340, 24);
    duct(st, 300, 1488, 340, 24);
    /* гофра праворуч */
    E('path', { d: 'M845 396V960Q845 1010 900 1030', class: 'hose' }, st);
    E('path', { d: 'M232 1470V1930', class: 'loose' }, st);
    T(st, 460, 44, 'Шафа керування — монтажна панель (двері відчинені)', { class: 'cap', 'text-anchor': 'middle' });

    /* двері */
    E('rect', { x: 990, y: 20, width: 400, height: 1920, rx: 10, class: 'cab-shell' }, st);
    E('rect', { x: 1012, y: 44, width: 356, height: 1872, rx: 6, class: 'door-in' }, st);
    E('rect', { x: 1060, y: 270, width: 260, height: 420, rx: 8, class: 'door-panel' }, st);
    T(st, 1190, 44 + 30, 'Двері (органи керування на фасаді)', { class: 'cap', 'text-anchor': 'middle' });
    [['Ключ', 296], ['Робота · Пауза · Лінія стоп', 368], ['Пуск (підсвітка)', 440], ['? · Лінія старт · Стоп', 512], ['Аварійна зупинка', 606]].forEach(([t, y]) => T(st, 1190, y - 6, t, { class: 'plbl tiny light', 'text-anchor': 'middle', opacity: 0.7 }));
    T(st, 1190, 720, 'Розміщення — за фото фасаду; написи на табличках', { class: 'plbl light', 'text-anchor': 'middle' });
    T(st, 1190, 734, 'нечитабельні, синя кнопка — уточнити', { class: 'plbl light', 'text-anchor': 'middle' });
    /* мережева стійка на даху */
    E('rect', { x: 150, y: -230, width: 500, height: 230, rx: 6, class: 'cab-shell' }, st);
    E('rect', { x: 172, y: -208, width: 456, height: 186, rx: 4, class: 'rack-glass' }, st);
    T(st, 400, -240, 'Мережева стійка на даху шафи', { class: 'cap', 'text-anchor': 'middle' });
    for (let i = 0; i < 9; i++) E('path', { d: 'M' + (330 + i * 30) + ' -110 C ' + (330 + i * 30) + ' -170, ' + (360 + i * 25) + ' -200, ' + (420 + i * 20) + ' -205', class: 'patch' }, st);
    [200, 960, 1720].forEach((y) => E('rect', { x: 980, y, width: 14, height: 60, rx: 3, class: 'hinge' }, st));

    /* кабелі (під апаратами) */
    const wires = E('g', { class: 'wires' }, g);
    const parts = E('g', { class: 'parts' }, g);
    const exitCabs = { gland: [], hose: [] };

    D.cables.forEach((c) => {
      const inA = !!L[c.from], inB = !!L[c.to];
      if (!inA && !inB) return;
      let A, B;
      if (inA) A = attach(L, c.from, true, c.id);
      if (inB) B = attach(L, c.to, false, c.id);
      const ex = c.exit === 'hose' ? 'hose' : 'gland';
      if (!inA) { A = EXITS[ex]; exitCabs[ex].push({ c, other: c.from }); }
      if (!inB) { B = EXITS[ex]; exitCabs[ex].push({ c, other: c.to }); }
      const lane = ((SV.hash(c.id) % 9) - 4) * 2.2;
      const pts = SV.treeRoute(TR, A, B, lane);
      ctx.cable(wires, c, pts, { color: SV.physColor(c), casing: true, tag: 'hl', phys: true });
    });

    /* апарати */
    Object.keys(L).forEach((id) => {
      const e = byId[id]; if (!e) return;
      const o = L[id];
      const gg = E('g', {}, parts);
      if (e.assumed) gg.classList.add('assumed');
      look(gg, o, e);
      E('rect', { x: o.x - 2, y: o.y - 2, width: o.w + 4, height: o.h + 4, rx: 3, class: 'hit' }, gg);
      ctx.regEl(id, gg, { x: o.x, y: o.y, w: o.w, h: o.h });
    });

    /* виходи з шафи */
    const exitBox = (key, x, y, w, h, title) => {
      const gg = E('g', { class: 'exit' }, parts);
      E('rect', { x, y, width: w, height: h, rx: 6, class: 'm-exit' }, gg);
      T(gg, x + 8, y + 16, title, { class: 'plbl b light' });
      const list = T(gg, x + 8, y + 31, exitCabs[key].length + ' кабелів', { class: 'plbl light exit-list' });
      const ids = new Set(exitCabs[key].map((q) => q.c.id));
      ctx.regExit(gg, ids, (on) => {
        if (!on.length) { list.textContent = exitCabs[key].length + ' кабелів'; return; }
        const names = exitCabs[key].filter((q) => on.indexOf(q.c.id) >= 0).map((q) => SV.label(q.other));
        const uniq = [...new Set(names)];
        list.textContent = '→ ' + uniq.slice(0, 4).join(', ') + (uniq.length > 4 ? ' … (+' + (uniq.length - 4) + ')' : '');
      }, { x, y, w, h });
    };
    exitBox('gland', 285, 1965, 230, 40, '⇩ Кабельний ввід → сортувальник');
    exitBox('hose', 860, 1046, 190, 40, '↘ Гофра → відвідники');

    return { bounds: { x: 0, y: -260, w: 1410, h: 2290 } };
  }

  window.VIEWS.cab = {
    title: 'Фізична схема — шафа',
    short: 'Шафа',
    paper: false,
    build,
    legend() {
      const P = D.phaseColors;
      return '<span><i style="background:' + P.L1 + '"></i>L1</span><span><i style="background:' + P.L2 + ';outline:1px solid #888"></i>L2</span><span><i style="background:' + P.L3 + '"></i>L3</span>' +
        '<span><i style="background:#e5e7eb"></i>кабель (біла оболонка)</span><span><i style="background:#ef4444"></i>керування</span><span><i style="background:#f59e0b"></i>24 В / сигнали</span><span><i class="dash"></i>припущення</span>';
    },
  };
})();
