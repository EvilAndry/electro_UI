/* Електрична принципова схема */
(function () {
  'use strict';
  const { E, T, sym } = SV;
  const D = window.SCHEMA;
  const byId = SV.byId;

  const PART_SUFFIX = { coil: 'A1–A2', aux: '13–14', ch1: 'канал 1', ch2: 'канал 2', no: '15–18', nc: '15–16', contact: '11–14', led: 'підсвітка', main: '', bus2: '' };

  function layout() {
    const P = {};
    const at = (key, x, y, s, o) => (P[key] = Object.assign({ x, y, o: 'v', sym: s, hl: 20 }, o || {}));

    /* --- Аркуш 1: ввід, KM1, плавні пуски, протяжки --- */
    at('GRID', 120, 90, 'source', { ports: { n: { x: 104, y: 98, d: 'left' } } });
    at('QF1', 120, 220, 'breaker', { poles: 3 });
    at('KV1', 120, 360, 'vrelay', { ports: { n: { x: 106, y: 352, d: 'left' } } });
    at('QD1', 120, 500, 'rcd', { poles: 4, ports: { r: { x: 134, y: 512, d: 'right' } } });
    at('KM1.main', 120, 640, 'contactor', { poles: 3 });
    P['XB1'] = { bus: true, y: 760, x1: 60, x2: 2860 };
    D.groups.forEach((G, gi) => {
      const px = 540 + gi * 330;
      at(G.pa, px, 880, 'box', { w: 40, h: 26, t: 'УПП' });
      G.lines.forEach((L, i) => {
        const x = px - 100 + i * 50;
        at(L.qf, x, 1020, 'breaker', { poles: 3, lab: 'rot' });
        at(L.m, x, 1160, 'motor', { lab: 'rot', end: true });
      });
    });

    /* --- Аркуш 2: однофазний розподіл --- */
    P['X2'] = { bus: true, y: 1500, x1: 60, x2: 1100 };
    at('QF2', 140, 1600, 'breaker');
    at('QF3', 640, 1600, 'breaker');
    [['QF4', 360], ['QF5', 560], ['QF6', 660], ['QF7', 760], ['QF8', 960]].forEach(([id, x]) => at(id, x, 1740, 'breaker', { lab: 'rot' }));
    at('NET1', 1060, 1740, 'box', { w: 40, h: 22, t: 'LAN', lab: 'short' });
    for (let k = 1; k <= 5; k++) at('D' + k, 260 + (k - 1) * 50, 1880, 'display', { lab: 'short' });
    at('PR1', 560, 1880, 'box', { w: 28, h: 20, t: 'PR', lab: 'short' });
    at('WT1', 660, 1880, 'box', { w: 28, h: 20, t: '⏚', lab: 'short' });
    at('X5', 760, 1880, 'terminal', { lab: 'short' });
    at('EL2', 960, 1880, 'lamp', { lab: 'short' });
    at('PC1', 600, 2060, 'box', { w: 64, h: 26, t: 'ПК', ports: {
      din: { x: 624, y: 2047, d: 'up' }, dout: { x: 580, y: 2073, d: 'down' } } });
    at('UZ2', 720, 2020, 'box', { w: 30, h: 22, t: '~/=', lab: 'short' });
    at('UZ3', 800, 2020, 'box', { w: 30, h: 22, t: '~/=', lab: 'short' });
    at('UZ4', 880, 2020, 'box', { w: 30, h: 22, t: '~/=', lab: 'short' });
    at('CB1', 720, 2180, 'box', { w: 44, h: 26, t: 'ПЛАТА', lab: 'short' });
    at('HMI1', 800, 2180, 'box', { w: 34, h: 26, t: 'HMI', lab: 'short' });
    at('SCN1', 880, 2180, 'box', { w: 34, h: 26, t: 'SCN', lab: 'short' });

    at('UZ1', 1200, 1600, 'box', { w: 40, h: 26, t: '~/= 24' });
    D.drivers.forEach((dv, i) => {
      const x = 1300 + i * 48;
      at(dv.a, x, 1780, 'box', { w: 22, h: 22, t: 'A', lab: 'rot2', ports: { ctl: { x: x + 13, y: 1788, d: 'down' } } });
      at(dv.y, x, 1930, 'solenoid', { lab: 'rot2', end: true });
    });
    for (let k = 1; k <= 4; k++) {
      const x = 1300 + ((k - 1) * 8 + 3.5) * 48;
      at('KR' + k, x, 2180, 'box', { w: 300, h: 26, t: 'KR' + k + ' · 8 каналів', lab: 'none',
        ports: { out: { x, y: 2167, d: 'up' }, in: { x, y: 2193, d: 'down' } } });
    }
    at('X4', 2760, 2330, 'terminal');

    /* --- Аркуш 3: кола керування --- */
    const H = { o: 'h' };
    // щабель 1: коло аварійної зупинки → Пуск / самоутримання → KM2
    at('SB4', 260, 2520, 'estop', H);
    at('SB5', 380, 2520, 'estop', H);
    at('SB6', 500, 2520, 'estop', H);
    at('SA1', 620, 2520, 'key', H);
    at('SQ2', 740, 2520, 'limit_nc', H);
    at('SQ3', 860, 2520, 'limit_nc', H);
    at('SB1', 1000, 2520, 'btn_no', H);
    at('KM2.ch1', 1000, 2590, 'no', H);
    at('KM2.coil', 1320, 2520, 'coil', H);
    // щабель 2: канал 2 → реле часу
    at('KM2.ch2', 300, 2680, 'no', H);
    at('KT1.coil', 1320, 2680, 'coil_t', H);
    at('KT2.coil', 1320, 2750, 'coil_t', H);
    // щабель 3: KT1 → блоки живлення, група QF3
    at('KT1.no', 300, 2840, 'contact_t', { o: 'h', ports: { p2: { x: 312, y: 2848, d: 'down' } } });
    // щабель 4: дозвіл KT2 → Стоп → Лінія старт / самоутримання → KM3, K1
    at('KT2.no', 300, 2940, 'contact_t', H);
    at('SB3', 520, 2940, 'btn_nc', H);
    at('SB2', 720, 2940, 'btn_no', H);
    at('KM3.aux', 720, 3010, 'no', H);
    at('KM3.coil', 1320, 2940, 'coil', H);
    at('K1.coil', 1320, 3080, 'coil', H);
    // щабель 5: K1 → KM1
    at('K1.contact', 300, 3170, 'no', H);
    at('KM1.coil', 1320, 3170, 'coil', H);
    // індикація
    at('KM3.nc', 520, 3260, 'nc', H);
    at('HL3', 1320, 3260, 'lamp', H);
    at('KT2.nc', 300, 3340, 'nc_t', H);
    at('HL2', 1320, 3340, 'lamp', H);
    at('KM1.aux', 300, 3420, 'no', H);
    at('HL1', 1320, 3420, 'lamp', H);
    at('SB1.led', 1320, 3490, 'lamp', H);
    // клімат і світло шафи
    at('AK1', 500, 3590, 'box', { o: 'h', w: 40, h: 24, t: 't°', hl: 26, ports: { sens: { x: 500, y: 3602, d: 'down' } } });
    at('BK1', 380, 3680, 'box', { o: 'h', w: 26, h: 16, t: 'BK', hl: 20 });
    at('X3', 800, 3590, 'terminal', H);
    at('M1', 1320, 3590, 'motor', H);
    at('SQ1', 300, 3760, 'limit', H);
    at('EL1', 1320, 3760, 'lamp', H);
    at('SB7', 1000, 3860, 'btn_no', { o: 'h', lab: 'h' });
    return P;
  }

  const RUNG_ENDS = ['KM2.coil', 'KT1.coil', 'KT2.coil', 'KM3.coil', 'K1.coil', 'KM1.coil', 'HL3', 'HL2', 'HL1', 'SB1.led', 'M1', 'EL1'];

  function resolve(P, id, part) {
    if (part && P[id + '.' + part]) return id + '.' + part;
    if (P[id]) return id;
    if (P[id + '.main']) return id + '.main';
    return null;
  }
  function port(pos, isOut, name) {
    if (name && pos.ports && pos.ports[name]) { const q = pos.ports[name]; return { p: [q.x, q.y], d: q.d }; }
    const hl = pos.hl || 20;
    const hw = pos.sym === 'box' ? (pos.w || 30) / 2 : 14;
    if (name === 'bot') return { p: [pos.x, pos.y + hl], d: 'down' };
    if (name === 'top') return { p: [pos.x, pos.y - hl], d: 'up' };
    if (name === 'right') return { p: [pos.x + hw, pos.y], d: 'right' };
    if (name === 'left') return { p: [pos.x - hw, pos.y], d: 'left' };
    if (pos.o === 'h') return isOut ? { p: [pos.x + hl, pos.y], d: 'right' } : { p: [pos.x - hl, pos.y], d: 'left' };
    return isOut ? { p: [pos.x, pos.y + hl], d: 'down' } : { p: [pos.x, pos.y - hl], d: 'up' };
  }

  function build(ctx) {
    const g = ctx.root;
    const P = layout();
    const deco = E('g', { class: 'deco' }, g);
    const wires = E('g', { class: 'wires' }, g);
    const parts = E('g', { class: 'parts' }, g);

    const sheet = (x, y, w, h, title) => {
      E('rect', { x, y, width: w, height: h, class: 'sheet' }, deco);
      T(deco, x + 16, y + 26, title, { class: 'sheet-t' });
    };
    sheet(20, 20, 2860, 1300, 'Аркуш 1 · Ввід, захист, головний контактор, плавні пуски та протяжки');
    sheet(20, 1370, 2860, 1050, 'Аркуш 2 · Однофазне навантаження: обладнання оператора, рама сканера, плати (припущення)');
    sheet(20, 2440, 1560, 1480, 'Аркуш 3 · Кола керування ~230 В: Пауза → Лінія стоп → Робота');
    E('rect', { x: 1620, y: 3680, width: 1260, height: 240, class: 'sheet' }, deco);
    T(deco, 1640, 3720, D.meta.title, { class: 'sheet-t' });
    T(deco, 1640, 3755, 'Електрична принципова схема · ' + D.meta.version + ' · ' + D.meta.date, { class: 'lbl' });
    T(deco, 1640, 3785, 'Елементи з пунктирною рамкою — припущення, потребують перевірки.', { class: 'lbl' });
    T(deco, 1640, 3815, 'Маркування кабелів підставляється з data.js (поле mark).', { class: 'lbl' });

    /* пояснення режимів */
    const ny = 2480;
    E('rect', { x: 1620, y: ny, width: 1260, height: 1170, class: 'sheet' }, deco);
    T(deco, 1640, ny + 30, 'Режими лінії', { class: 'sheet-t' });
    let yy = ny + 60;
    D.modes.forEach((m) => {
      E('circle', { cx: 1650, cy: yy - 4, r: 8, fill: m.color }, deco);
      T(deco, 1666, yy, m.name + ' (' + m.lamp + ')', { class: 'lbl b big' });
      yy += 22;
      wrap(m.text, 150).forEach((ln) => { T(deco, 1666, yy, ln, { class: 'lbl big' }); yy += 18; });
      wrap('→ ' + m.next, 150).forEach((ln) => { T(deco, 1666, yy, ln, { class: 'lbl big dim' }); yy += 18; });
      yy += 26;
    });

    E('path', { d: 'M140 2470V3800', class: 'rail' }, deco);
    E('path', { d: 'M1500 2470V3800', class: 'rail' }, deco);
    T(deco, 150, 2466, 'L (QF2)', { class: 'lbl b' });
    T(deco, 1508, 2466, 'N', { class: 'lbl b' });
    RUNG_ENDS.forEach((k) => {
      const pos = P[k]; if (!pos) return;
      const pr = port(pos, true);
      E('path', { d: 'M' + pr.p[0] + ' ' + pr.p[1] + 'H1500', class: 'rung' }, deco);
    });
    [[2490, 'Коло аварійної зупинки (NC, послідовно) → Пуск → самоутримання KM2'], [2650, 'Канал 2 KM2 → реле часу'],
      [2910, 'Дозвіл KT2 → Стоп → Лінія старт → самоутримання KM3'], [3235, 'Індикація режимів'], [3560, 'Клімат і світло шафи']].forEach(([y, t]) => T(deco, 160, y, t, { class: 'lbl dim' }));

    D.groups.forEach((G, gi) => {
      const px = 540 + gi * 330;
      const ks = G.lines.map((l) => l.k);
      T(deco, px - 120, 1225, 'Плавний пуск ' + G.n + ' → протяжки ' + ks[0] + '–' + ks[ks.length - 1], { class: 'lbl b' });
      E('path', { d: 'M' + (px - 120) + ' 1205H' + (px + 120), class: 'brace' }, deco);
    });
    T(deco, 1300, 1430, 'Плати A1–A30 та релейні модулі KR1–KR4 — призначення ще не описано (припущення: драйвери відвідників)', { class: 'lbl b' });
    T(deco, 250, 1430, 'QF3 → автомати обладнання QF4…QF8, мережева стійка', { class: 'lbl b' });
    T(deco, 700, 2240, 'Рама сканера', { class: 'lbl b' });

    Object.keys(P).forEach((key) => {
      const pos = P[key];
      const [id, part] = key.split('.');
      const e = byId[id];
      if (!e) return;
      const gg = E('g', { transform: pos.bus ? null : 'translate(' + pos.x + ' ' + pos.y + ')' }, parts);
      if (e.assumed) gg.classList.add('assumed');
      if (pos.bus) {
        E('path', { d: 'M' + pos.x1 + ' ' + pos.y + 'H' + pos.x2, class: 'bus' }, gg);
        E('path', { d: 'M' + pos.x1 + ' ' + pos.y + 'H' + pos.x2, class: 'hit-line' }, gg);
        T(gg, pos.x1 + 10, pos.y - 8, SV.label(id) + ' · ' + e.name + (id === 'XB1' ? ' · L1 L2 L3 N' : ' · L N PE'), { class: 'lbl b' });
        ctx.regEl(id, gg, { x: pos.x1, y: pos.y - 20, w: pos.x2 - pos.x1, h: 30 });
        return;
      }
      sym(gg, pos.sym, pos, pos.o);
      const hl = pos.hl || 20;
      let bb;
      if (pos.o === 'h') bb = { x: pos.x - hl, y: pos.y - 16, w: hl * 2, h: 32 };
      else if (pos.sym === 'box') bb = { x: pos.x - (pos.w || 30) / 2 - 3, y: pos.y - hl, w: (pos.w || 30) + 6, h: hl * 2 };
      else bb = { x: pos.x - 14, y: pos.y - hl, w: 28, h: hl * 2 };
      E('rect', { x: bb.x - pos.x, y: bb.y - pos.y, width: bb.w, height: bb.h, class: 'hit' }, gg);
      if (pos.ports && pos.ports.ctl) E('path', { d: 'M11 8H13', class: 'sym-l' }, gg);

      const lab = SV.label(id) + (part && PART_SUFFIX[part] ? ' ' + PART_SUFFIX[part] : '');
      const nm = e.name.length > 34 ? e.name.slice(0, 33) + '…' : e.name;
      if (pos.lab === 'rot') T(gg, 0, 0, lab, { class: 'lbl b', transform: 'translate(13 ' + (pos.end ? 14 : 6) + ') rotate(90)' });
      else if (pos.lab === 'rot2') T(gg, 0, 0, lab, { class: 'lbl b', transform: 'translate(' + (pos.sym === 'box' ? -15 : -14) + ' 16) rotate(-90)' });
      else if (pos.lab === 'short') T(gg, 0, pos.sym === 'box' ? -(pos.h || 22) / 2 - 4 : 34, lab, { class: 'lbl b', 'text-anchor': 'middle', dx: pos.sym === 'box' ? 0 : 0 });
      else if (pos.lab === 'none') { /* */ }
      else if (pos.o === 'h') {
        T(gg, 0, -20, lab, { class: 'lbl b', 'text-anchor': 'middle' });
        T(gg, 0, 30, nm, { class: 'lbl', 'text-anchor': 'middle' });
      } else {
        const tx = pos.sym === 'box' ? (pos.w || 30) / 2 + 6 : 16;
        T(gg, tx, -3, lab, { class: 'lbl b' });
        T(gg, tx, 10, nm, { class: 'lbl' });
        if (e.model) T(gg, tx, 22, e.model.length > 36 ? e.model.slice(0, 35) + '…' : e.model, { class: 'lbl dim' });
      }
      ctx.regEl(id, gg, bb);
    });

    D.cables.forEach((c) => {
      const ka = resolve(P, c.from, c.fp), kb = resolve(P, c.to, c.tp);
      if (!ka || !kb) return;
      const pa = P[ka], pb = P[kb];
      let A, B;
      if (!pa.bus) A = port(pa, true, c.fpp);
      if (!pb.bus) B = port(pb, false, c.tpp);
      if (pa.bus && pb.bus) return;
      if (pa.bus) A = { p: [B.p[0], pa.y], d: 'down' };
      if (pb.bus) B = { p: [A.p[0], pb.y], d: 'up' };
      const color = SV.kindColor(c);
      if (c.eref) {
        const stub = (pr, txt) => {
          const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[pr.d];
          const q = [pr.p[0] + v[0] * 34, pr.p[1] + v[1] * 34];
          return { pts: [pr.p, q], q, txt };
        };
        const s1 = stub(A, '→ ' + SV.label(c.to));
        const s2 = stub(B, '← ' + SV.label(c.from));
        const gC = ctx.cable(wires, c, s1.pts, { color, tag: false });
        ctx.cable(gC, c, s2.pts, { color, tag: false, noReg: true });
        ctx.addBox(c.id, SV.bbox(s2.pts, 6));
        [s1, s2].forEach((s) => {
          const tg = E('g', { class: 'ref', transform: 'translate(' + s.q[0] + ' ' + s.q[1] + ')' }, gC);
          E('path', { d: 'M-3 -3L3 0L-3 3', class: 'ref-a' }, tg);
          T(tg, 6, 4, s.txt + ' (' + SV.cableTag(c) + ')', { class: 'lbl b ref-t' });
        });
        return;
      }
      const pts = SV.orthoRoute(A.p, A.d, B.p, B.d, 14);
      ctx.cable(wires, c, pts, { color, tag: true, paper: true });
    });

    return { bounds: { x: 0, y: 0, w: 2900, h: 3940 } };
  }

  function wrap(s, n) {
    const out = []; let cur = '';
    s.split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  window.VIEWS.elec = {
    title: 'Електрична принципова схема',
    short: 'Електрична',
    paper: true,
    build,
    legend() {
      return Object.keys(D.kinds).map((k) => '<span><i style="background:' + D.kinds[k].color + '"></i>' + D.kinds[k].name + '</span>').join('');
    },
  };
})();
