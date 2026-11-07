/* Фізична схема: весь сортувальник (вигляд збоку, спрощено) */
(function () {
  'use strict';
  const { E, T } = SV;
  const D = window.SCHEMA;
  const byId = SV.byId;
  const K = 2; // масштаб базових координат
  const s = (v) => v * K;

  const MODX = (k) => 882 + (k - 1) * 76.6;
  const MODW = 76.6;

  const TR = {
    TRAY: { y: s(262) },
    POST: { v: true, x: s(876), parent: 'TRAY' },
    FRAME: { y: s(72), parent: 'POST' },
  };

  function build(ctx) {
    const g = ctx.root;
    const st = E('g', { class: 'static' }, g);
    const zonesG = E('g', { class: 'parts' }, g);
    const wires = E('g', { class: 'wires' }, g);
    const parts = E('g', { class: 'parts' }, g);
    const R = (p, x, y, w, h, cls, a) => E('rect', Object.assign({ x: s(x), y: s(y), width: s(w), height: s(h), class: cls }, a || {}), p);
    const poly = (p, pts, cls) => E('polygon', { points: pts.map((q) => s(q[0]) + ',' + s(q[1])).join(' '), class: cls }, p);
    const logo = (p, x, y, sz) => E('path', { d: 'M' + s(x) + ' ' + s(y) + 'v' + s(sz * 0.55) + 'a' + s(sz * 0.32) + ' ' + s(sz * 0.32) + ' 0 0 0 ' + s(sz * 0.64) + ' 0v-' + s(sz * 0.55), class: 'logo' }, p);

    T(st, s(20), s(18), 'Сортувальник — загальний вигляд збоку (спрощено, не в масштабі)', { class: 'cap' });

    /* основа */
    R(st, 5, 233, 1745, 9, 'base');
    for (let x = 20; x < 1740; x += 58) R(st, x, 242, 4, 10, 'base-leg');
    E('path', { d: 'M' + s(5) + ' ' + s(262) + 'H' + s(1750), class: 'tray' }, st);
    T(st, s(1750), s(258), 'кабельна траса (умовно)', { class: 'plbl light', 'text-anchor': 'end' });

    const reg = {}; // елементи, що є на цьому виді
    const node = (id, layer, bb, drawFn) => {
      const e = byId[id]; if (!e) return;
      const gg = E('g', {}, layer);
      if (e.assumed) gg.classList.add('assumed');
      drawFn(gg);
      E('rect', { x: s(bb.x) - 2, y: s(bb.y) - 2, width: s(bb.w) + 4, height: s(bb.h) + 4, rx: 4, class: 'hit' }, gg);
      ctx.regEl(id, gg, { x: s(bb.x), y: s(bb.y), w: s(bb.w), h: s(bb.h) });
      reg[id] = bb;
    };

    /* зони */
    node('Z1', zonesG, { x: 75, y: 126, w: 161, h: 109 }, (p) => {
      poly(p, [[75, 235], [140, 126], [236, 126], [236, 235]], 'mach');
      logo(p, 150, 158, 46);
      T(p, s(150), s(228), 'Z1 · ' + byId.Z1.name, { class: 'zlbl' });
    });
    node('Z2', zonesG, { x: 236, y: 128, w: 344, h: 107 }, (p) => {
      R(p, 236, 128, 344, 107, 'mach');
      R(p, 236, 212, 344, 20, 'mach-plate');
      T(p, s(248), s(150), 'Z2 · ' + byId.Z2.name, { class: 'zlbl' });
    });
    node('Z3', zonesG, { x: 580, y: 128, w: 300, h: 107 }, (p) => {
      R(p, 580, 128, 300, 107, 'mach');
      T(p, s(756), s(150), 'Z3', { class: 'zlbl' });
      T(p, s(756), s(162), 'сканування / розгін', { class: 'zlbl sm' });
    });
    for (let k = 1; k <= 5; k++) {
      const x0 = MODX(k);
      node('MOD' + k, zonesG, { x: x0, y: 128, w: MODW, h: 107 }, (p) => {
        R(p, x0, 128, MODW, 22, 'mach');
        poly(p, [[x0 + 5, 153], [x0 + MODW - 5, 153], [x0 + MODW - 10, 232], [x0 + 10, 232]], 'bin');
        poly(p, [[x0 + 5, 153], [x0 + MODW - 5, 153], [x0 + MODW - 12, 170], [x0 + 12, 170]], 'bin-top');
        T(p, s(x0 + MODW / 2), s(210), 'МОД ' + k, { class: 'zlbl c', 'text-anchor': 'middle' });
      });
    }
    node('ZOUT', zonesG, { x: 1265, y: 104, w: 355, h: 131 }, (p) => {
      R(p, 1265, 128, 60, 107, 'mach');
      R(p, 1320, 104, 300, 131, 'fence');
      E('path', { d: 'M' + s(1330) + ' ' + s(140) + 'C' + s(1440) + ' ' + s(140) + ',' + s(1470) + ' ' + s(220) + ',' + s(1580) + ' ' + s(220) + 'V' + s(232) + 'H' + s(1330) + 'Z', class: 'chute' }, p);
      T(p, s(1340), s(122), 'ZOUT · ' + byId.ZOUT.name, { class: 'zlbl' });
    });
    node('WS', zonesG, { x: 1632, y: 120, w: 112, h: 115 }, (p) => {
      R(p, 1632, 120, 112, 115, 'ws', { rx: 6 });
      R(p, 1640, 182, 96, 5, 'table');
      R(p, 1644, 187, 4, 45, 'table'); R(p, 1728, 187, 4, 45, 'table');
      T(p, s(1688), s(134), 'Робоче місце', { class: 'zlbl c', 'text-anchor': 'middle' });
      T(p, s(1688), s(143), '(умовно)', { class: 'zlbl sm c', 'text-anchor': 'middle' });
    });

    /* рама з табло */
    R(st, 879, 62, 388, 6, 'frame');
    [879, 1033, 1262].forEach((x) => R(st, x, 62, 5, 72, 'frame'));

    /* окремі елементи */
    node('SC1', parts, { x: 600, y: 40, w: 38, h: 195 }, (p) => {
      R(p, 603, 48, 32, 187, 'mach2');
      R(p, 600, 40, 38, 10, 'cap-grey');
      T(p, s(619), s(36), 'Рама сканера', { class: 'zlbl b c', 'text-anchor': 'middle' });
    });
    const small = (id, x, y, w, h, cls, txt) => node(id, parts, { x, y, w, h }, (p) => {
      R(p, x, y, w, h, cls, { rx: 1.5 });
      if (txt) T(p, s(x + w / 2), s(y + h / 2) + 4, txt, { class: 'zlbl sm c', 'text-anchor': 'middle' });
    });
    small('SCN1', 607, 52, 24, 7, 'pc', 'SCN');
    small('HMI1', 607, 64, 24, 30, 'screen', '');
    small('CB1', 607, 100, 24, 12, 'board', '');
    small('UZ2', 606, 118, 8, 10, 'psu-s', '');
    small('UZ3', 615, 118, 8, 10, 'psu-s', '');
    small('UZ4', 624, 118, 8, 10, 'psu-s', '');
    small('X5', 613, 134, 12, 6, 'socket', '');
    node('SB5', parts, { x: 638, y: 92, w: 12, h: 12 }, (p) => {
      R(p, 638, 92, 12, 12, 'estop-box', { rx: 1.5 });
      E('circle', { cx: s(644), cy: s(98), r: s(3.4), class: 'estop-btn' }, p);
    });
    node('SB6', parts, { x: 400, y: 112, w: 12, h: 12 }, (p) => {
      R(p, 400, 112, 12, 12, 'estop-box', { rx: 1.5 });
      E('circle', { cx: s(406), cy: s(118), r: s(3.4), class: 'estop-btn' }, p);
      T(p, s(406), s(108), 'аварійні лінії', { class: 'zlbl sm c', 'text-anchor': 'middle' });
    });
    node('SQ2', parts, { x: 100, y: 196, w: 8, h: 8 }, (p) => { R(p, 100, 196, 8, 8, 'limit-sw', { rx: 1 }); });
    node('SQ3', parts, { x: 112, y: 176, w: 8, h: 8 }, (p) => { R(p, 112, 176, 8, 8, 'limit-sw', { rx: 1 }); });
    T(st, s(96), s(170), 'кінцевики', { class: 'zlbl sm' });
    node('NET1', parts, { x: 676, y: 44, w: 64, h: 11 }, (p) => {
      R(p, 676, 44, 64, 11, 'pc', { rx: 1.5 });
      T(p, s(708), s(51.5), 'LAN', { class: 'zlbl sm c', 'text-anchor': 'middle' });
    });
    node('CAB', parts, { x: 668, y: 56, w: 80, h: 179 }, (p) => {
      R(p, 668, 56, 80, 179, 'cabinet');
      logo(p, 680, 74, 24);
      R(p, 712, 74, 10, 4, 'dot-r'); R(p, 726, 74, 8, 4, 'dot-k');
      [[700, 108, 'g'], [710, 108, 'g'], [700, 118, 'g'], [710, 118, 'r'], [700, 128, 'r'], [710, 128, 'r']].forEach(([x, y, c]) => E('circle', { cx: s(x), cy: s(y), r: s(2.2), class: 'dot-' + c }, p));
      T(p, s(708), s(52), 'Шафа', { class: 'zlbl b c', 'text-anchor': 'middle' });
    });
    for (let k = 1; k <= 5; k++) {
      const x0 = MODX(k) + 22;
      node('D' + k, parts, { x: x0, y: 38, w: 32, h: 20 }, (p) => {
        E('path', { d: 'M' + s(x0 + 8) + ' ' + s(58) + 'V' + s(62) + 'M' + s(x0 + 24) + ' ' + s(58) + 'V' + s(62), class: 'rod' }, p);
        R(p, x0, 38, 32, 20, 'display');
        logo(p, x0 + 4, 42, 10);
        T(p, s(x0 + 16), s(35), 'D' + k, { class: 'zlbl b c', 'text-anchor': 'middle' });
      });
    }
    node('EL2', parts, { x: 1028, y: 68, w: 14, h: 18 }, (p) => {
      E('path', { d: 'M' + s(1035) + ' ' + s(68) + 'V' + s(78), class: 'rod' }, p);
      E('path', { d: 'M' + s(1028) + ' ' + s(86) + 'L' + s(1031) + ' ' + s(78) + 'H' + s(1039) + 'L' + s(1042) + ' ' + s(86) + 'Z', class: 'lampshade' }, p);
      T(p, s(1046), s(84), 'EL2', { class: 'zlbl b' });
    });
    node('PC1', parts, { x: 1650, y: 196, w: 20, h: 34 }, (p) => {
      R(p, 1650, 196, 20, 34, 'pc', { rx: 2 });
      T(p, s(1660), s(214), 'ПК', { class: 'zlbl sm c', 'text-anchor': 'middle' });
    });
    node('PR1', parts, { x: 1700, y: 168, w: 26, h: 14 }, (p) => {
      R(p, 1700, 168, 26, 14, 'printer', { rx: 2 });
      T(p, s(1713), s(178), 'PR1', { class: 'zlbl sm c', 'text-anchor': 'middle' });
    });
    node('WT1', parts, { x: 1700, y: 214, w: 22, h: 8 }, (p) => {
      R(p, 1700, 214, 22, 8, 'socket', { rx: 2 });
    });
    node('GRID', parts, { x: 630, y: 290, w: 60, h: 30 }, (p) => {
      R(p, 630, 290, 60, 30, 'gridbox', { rx: 4 });
      T(p, s(660), s(309), '⚡ мережа', { class: 'zlbl b c', 'text-anchor': 'middle' });
    });

    /* лінія кареток: верхня робоча гілка й нижня зворотна */
    const LX0 = D.line.x0 - 20, LX1 = D.line.x1 + 20;
    E('path', { d: 'M' + s(LX0) + ' ' + s(122) + 'H' + s(LX1), class: 'carriage-top' }, st);
    E('path', { d: 'M' + s(LX1) + ' ' + s(222) + 'H' + s(LX0), class: 'carriage-ret' }, st);
    E('path', { d: 'M' + s(LX1) + ' ' + s(122) + 'a' + s(50) + ' ' + s(50) + ' 0 0 1 0 ' + s(100) + 'M' + s(LX0) + ' ' + s(222) + 'a' + s(50) + ' ' + s(50) + ' 0 0 1 0 ' + s(-100), class: 'carriage-ret' }, st);
    [300, 760, 1150].forEach((x) => E('path', { d: 'M' + s(x) + ' ' + s(117) + 'l' + s(10) + ' ' + s(5) + 'l' + s(-10) + ' ' + s(5), class: 'flow' }, st));
    [1000, 500].forEach((x) => E('path', { d: 'M' + s(x) + ' ' + s(217) + 'l' + s(-10) + ' ' + s(5) + 'l' + s(10) + ' ' + s(5), class: 'flow' }, st));
    T(st, s(LX0 + 10), s(116), 'каретки → (протяжки лише на верхній гілці)', { class: 'zlbl sm' });
    T(st, s(LX0 + 10), s(232), '← зворотна гілка під лінією', { class: 'zlbl sm' });

    /* протяжки */
    const motorPos = {};
    D.groups.forEach((G) => G.lines.forEach((Ln) => {
      const x = Ln.x, y = 122;
      motorPos[Ln.m] = [x, y];
      node(Ln.m, parts, { x: x - 5, y: y - 5, w: 10, h: 12 }, (p) => {
        E('circle', { cx: s(x), cy: s(y), r: s(4), class: 'motor' }, p);
        E('rect', { x: s(x - 2.2), y: s(y + 3), width: s(4.4), height: s(4), class: 'motor-box' }, p);
      });
    }));
    D.groups.forEach((G) => {
      const xs = G.lines.map((l) => l.x);
      E('path', { d: 'M' + s(xs[0] - 4) + ' ' + s(108) + 'H' + s(xs[xs.length - 1] + 4), class: 'grp-brace' }, st);
      T(st, s((xs[0] + xs[xs.length - 1]) / 2), s(105), 'ПП' + G.n, { class: 'zlbl sm c', 'text-anchor': 'middle' });
    });
    /* відвідники */
    const yPos = {};
    D.drivers.forEach((dv, i) => {
      const k = Math.floor(i / 6) + 1, j = i % 6;
      const x = MODX(k) + 9 + j * 11.6;
      yPos[dv.y] = [x, 146];
      node(dv.y, parts, { x: x - 2.5, y: 128, w: 5, h: 22 }, (p) => {
        E('path', { d: 'M' + s(x) + ' ' + s(130) + 'L' + s(x + 4) + ' ' + s(148), class: 'diverter' }, p);
      });
    });

    /* порт підключення елемента на цьому виді */
    function attach(id, cid) {
      const j = ((SV.hash(cid) % 11) - 5) * 3.2;
      if (motorPos[id]) { const [x, y] = motorPos[id]; return { t: 'TRAY', c: s(x), pre: [[s(x), s(y + 7)]] }; }
      if (id === 'NET1') return { t: 'TRAY', c: s(752), pre: [[s(740), s(50)], [s(752), s(50)]] };
      if (yPos[id]) { const [x, y] = yPos[id]; return { t: 'TRAY', c: s(x + 2), pre: [[s(x + 2), s(y + 2)]] }; }
      if (/^D\d$/.test(id)) { const b = reg[id]; const x = b.x + b.w / 2 + j * 0.3; return { t: 'FRAME', c: s(x), pre: [[s(x), s(58)]] }; }
      if (id === 'EL2') return { t: 'FRAME', c: s(1035), pre: [[s(1035), s(70)]] };
      if (id === 'CAB') { const x = 708 + j; return { t: 'TRAY', c: s(x), pre: [[s(x), s(235)]] }; }
      if (id === 'GRID') return { t: 'TRAY', c: s(660), pre: [[s(660), s(290)]] };
      const b = reg[id];
      const x = b.x + b.w / 2 + j * 0.15;
      return { t: 'TRAY', c: s(x), pre: [[s(x), s(b.y + b.h)]] };
    }
    const resolve = (id) => {
      let cur = id;
      while (cur && !reg[cur]) cur = byId[cur] && byId[cur].parent;
      return cur;
    };
    D.cables.forEach((c) => {
      const a = resolve(c.from), b = resolve(c.to);
      if (!a || !b || a === b) return;
      if (a === 'SORTER' || b === 'SORTER') return;
      const A = attach(a, c.id), B = attach(b, c.id);
      const lane = ((SV.hash(c.id) % 9) - 4) * 2.4;
      const pts = SV.treeRoute(TR, A, B, lane);
      ctx.cable(wires, c, pts, { color: SV.physColor(c), casing: true, tag: 'hl', phys: true });
    });

    return { bounds: { x: 0, y: 0, w: s(1760), h: s(330) } };
  }

  window.VIEWS.sorter = {
    title: 'Фізична схема — сортувальник',
    short: 'Сортувальник',
    paper: false,
    build,
    legend() {
      return '<span><i class="dot motor"></i>привод</span><span><i class="bar div"></i>відвідник</span><span><i style="background:#1d5fd1"></i>контейнер</span><span><i class="dash"></i>припущення</span><span>Елементи шафи показуються як «Шафа»</span>';
    },
  };
})();
