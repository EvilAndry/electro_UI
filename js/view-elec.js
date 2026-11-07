/* Електрична принципова схема */
(function () {
  'use strict';
  const { E, T, sym } = SV;
  const D = window.SCHEMA;
  const byId = SV.byId;

  const PART_SUFFIX = { coil: 'A1–A2', aux1: '13–14', aux2: '23–24', contact: '15–18', nc: 'НЗ', no: 'НВ', main: '', bus2: '' };

  function layout() {
    const P = {};
    const at = (key, x, y, s, o) => (P[key] = Object.assign({ x, y, o: 'v', sym: s, hl: 20 }, o || {}));

    /* --- Аркуш 1: ввід та групи приводів --- */
    at('GRID', 120, 90, 'source');
    at('QF1', 120, 220, 'breaker', { poles: 3 });
    at('KV1', 120, 360, 'vrelay');
    at('QD1', 120, 500, 'rcd', { poles: 4 });
    at('X2', 270, 220, 'terminal');
    P['XB1'] = { bus: true, y: 640, x1: 60, x2: 2860 };
    P['XB1.bus2'] = { bus: true, y: 1500, x1: 60, x2: 2860 };
    at('KM1.main', 300, 740, 'contactor', { poles: 3 });
    D.groups.forEach((G, gi) => {
      const px = 540 + gi * 330;
      at(G.pa, px, 880, 'meter');
      G.lines.forEach((L, i) => {
        const x = px - 132 + i * 24;
        at(L.qf, x, 1020, 'breaker', { lab: 'rot' });
        at(L.m, x, 1160, 'motor', { lab: 'rot', end: true });
      });
    });

    /* --- Аркуш 2: розподіл --- */
    at('QF2', 140, 1600, 'breaker');
    at('QF3', 640, 1600, 'breaker');
    [['QF4', 360], ['QF5', 560], ['QF6', 660], ['QF7', 760], ['QF8', 860]].forEach(([id, x]) => at(id, x, 1740, 'breaker', { lab: 'rot' }));
    for (let k = 1; k <= 5; k++) at('D' + k, 260 + (k - 1) * 50, 1880, 'display', { lab: 'short' });
    at('PR1', 560, 1880, 'box', { w: 28, h: 20, t: 'PR', lab: 'short' });
    at('WT1', 660, 1880, 'box', { w: 28, h: 20, t: '⏚', lab: 'short' });
    at('SC1', 760, 1880, 'box', { w: 28, h: 20, t: 'SC', lab: 'short' });
    at('KM3.main', 860, 1880, 'contactor', { lab: 'short' });
    at('EL2', 860, 2020, 'lamp', { lab: 'short' });
    at('PC1', 660, 2040, 'box', { w: 64, h: 26, t: 'ПК', ports: {
      din: { x: 684, y: 2027, d: 'up' }, dout: { x: 640, y: 2053, d: 'down' } } });
    at('KM2.main', 1100, 1600, 'contactor', { poles: 2 });
    D.drivers.forEach((dv, i) => {
      const x = 1100 + i * 48;
      at(dv.a, x, 1780, 'box', { w: 22, h: 22, t: 'A', lab: 'rot2', ports: { ctl: { x: x + 13, y: 1788, d: 'down' } } });
      at(dv.y, x, 1930, 'solenoid', { lab: 'rot2', end: true });
    });
    for (let k = 1; k <= 4; k++) {
      const x = 1100 + ((k - 1) * 8 + 3.5) * 48;
      at('KR' + k, x, 2180, 'box', { w: 300, h: 26, t: 'KR' + k + ' · 8 каналів', lab: 'none',
        ports: { out: { x, y: 2167, d: 'up' }, in: { x, y: 2193, d: 'down' } } });
    }
    at('X4', 2560, 2330, 'terminal');
    at('UZ1', 2760, 2380, 'box', { w: 40, h: 26, t: '~/=' });

    /* --- Аркуш 3: кола керування (горизонтальні «щаблі») --- */
    const H = { o: 'h' };
    at('HL1', 800, 2480, 'lamp', H);
    at('SB3.nc', 300, 2580, 'estop', H);
    at('SB2', 450, 2580, 'btn_nc', H);
    at('SB1', 600, 2580, 'btn_no', H);
    at('KM1.coil', 1100, 2580, 'coil', H);
    at('KM1.aux1', 600, 2660, 'no', H);
    at('KM1.aux2', 300, 2760, 'no', H);
    at('KT1.coil', 1100, 2760, 'coil_t', H);
    at('HL2', 1100, 2840, 'lamp', H);
    at('KT2', 700, 2920, 'box', { o: 'h', w: 36, h: 22, t: 'KT2', hl: 26 });
    at('KM3.coil', 1100, 2920, 'coil', H);
    at('KT1.contact', 300, 3020, 'contact_t', H);
    at('KM2.coil', 1100, 3020, 'coil', H);
    at('AK1', 500, 3120, 'box', { o: 'h', w: 40, h: 24, t: 't°', hl: 26, ports: { sens: { x: 500, y: 3132, d: 'down' } } });
    at('BK1', 380, 3210, 'box', { o: 'h', w: 26, h: 16, t: 'BK', hl: 20 });
    at('X3', 800, 3120, 'terminal', H);
    at('M1', 1100, 3120, 'motor', H);
    at('SQ1', 300, 3280, 'limit', H);
    at('EL1', 1100, 3280, 'lamp', H);
    at('SB3.no', 300, 3380, 'estop_no', H);
    at('K1.coil', 1100, 3380, 'coil', H);
    at('K1.contact', 300, 3460, 'no', H);
    at('HL3', 1100, 3460, 'lamp', H);
    return P;
  }

  const RUNG_ENDS = ['HL1', 'KM1.coil', 'KT1.coil', 'HL2', 'KM3.coil', 'KM2.coil', 'M1', 'EL1', 'K1.coil', 'HL3'];

  function keyFor(id, part) {
    return part ? id + '.' + part : id;
  }
  function resolve(P, id, part) {
    if (part && P[id + '.' + part]) return id + '.' + part;
    if (P[id]) return id;
    if (P[id + '.main']) return id + '.main';
    return null;
  }
  function port(pos, isOut, name) {
    if (name && pos.ports && pos.ports[name]) { const q = pos.ports[name]; return { p: [q.x, q.y], d: q.d }; }
    const hl = pos.hl || 20;
    if (name === 'bot') return { p: [pos.x, pos.y + hl], d: 'down' };
    if (name === 'top') return { p: [pos.x, pos.y - hl], d: 'up' };
    if (pos.o === 'h') return isOut ? { p: [pos.x + hl, pos.y], d: 'right' } : { p: [pos.x - hl, pos.y], d: 'left' };
    return isOut ? { p: [pos.x, pos.y + hl], d: 'down' } : { p: [pos.x, pos.y - hl], d: 'up' };
  }

  function build(ctx) {
    const g = ctx.root;
    const P = layout();
    const deco = E('g', { class: 'deco' }, g);
    const wires = E('g', { class: 'wires' }, g);
    const parts = E('g', { class: 'parts' }, g);

    /* рамки аркушів */
    const sheet = (x, y, w, h, title) => {
      E('rect', { x, y, width: w, height: h, class: 'sheet' }, deco);
      T(deco, x + 16, y + 26, title, { class: 'sheet-t' });
    };
    sheet(20, 20, 2860, 1300, 'Аркуш 1 · Ввід, захист і групи приводів конвеєрів');
    sheet(20, 1370, 2860, 1050, 'Аркуш 2 · Обладнання оператора, драйвери відвідників');
    sheet(20, 2420, 1560, 1100, 'Аркуш 3 · Кола керування ~220 В (від QF2)');
    // штамп
    E('rect', { x: 1620, y: 3330, width: 1260, height: 190, class: 'sheet' }, deco);
    T(deco, 1640, 3370, D.meta.title, { class: 'sheet-t' });
    T(deco, 1640, 3405, 'Електрична принципова схема · ' + D.meta.version + ' · ' + D.meta.date, { class: 'lbl' });
    T(deco, 1640, 3435, 'Позначення умовні (за фото). Пунктирні підписи — припущення, потребують перевірки.', { class: 'lbl' });
    T(deco, 1640, 3465, 'Маркування кабелів підставляється автоматично з data.js (поле mark).', { class: 'lbl' });

    // рейки кола керування
    E('path', { d: 'M140 2450V3490', class: 'rail' }, deco);
    E('path', { d: 'M1500 2450V3490', class: 'rail' }, deco);
    T(deco, 150, 2446, 'L (QF2)', { class: 'lbl b' });
    T(deco, 1508, 2446, 'N', { class: 'lbl b' });
    RUNG_ENDS.forEach((k) => {
      const pos = P[k]; if (!pos) return;
      const pr = port(pos, true);
      E('path', { d: 'M' + pr.p[0] + ' ' + pr.p[1] + 'H1500', class: 'rung' }, deco);
    });
    // підписи груп
    D.groups.forEach((G, gi) => {
      const px = 540 + gi * 330;
      const zn = G.zones.map((z) => (byId[z] ? byId[z].name : z)).join(' + ');
      T(deco, px - 140, 1225, 'Група ' + G.n + ' · ' + G.phase, { class: 'lbl b' });
      T(deco, px - 140, 1243, '→ ' + zn, { class: 'lbl' });
      E('path', { d: 'M' + (px - 140) + ' 1205H' + (px + 140), class: 'brace' }, deco);
    });
    T(deco, 1220, 1430, 'Драйвери відвідників A1–A30 (живлення від KM2, команди від KR1–KR4)', { class: 'lbl b' });
    T(deco, 1220, 1960 + 26, 'Відвідники Y1–Y30 на сортувальних модулях (6 шт. на модуль)', { class: 'lbl' });
    T(deco, 250, 1430, 'Обладнання оператора (QF3 → QF4…QF8)', { class: 'lbl b' });

    /* елементи */
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
        if (part === 'bus2') {
          E('path', { d: 'M60 640V1500', class: 'bus thin' }, gg);
          E('path', { d: 'M60 640V1500', class: 'hit-line' }, gg);
        }
        T(gg, pos.x1 + 10, pos.y - 8, SV.label(id) + ' ' + (part === 'bus2' ? '(продовження) ' : '') + '· ' + e.name + ' · L1 L2 L3 N', { class: 'lbl b' });
        ctx.regEl(id, gg, { x: pos.x1, y: pos.y - 20, w: pos.x2 - pos.x1, h: 30 });
        return;
      }
      const s = sym(gg, pos.sym, pos, pos.o);
      void s;
      const hl = pos.hl || 20;
      let bb;
      if (pos.o === 'h') bb = { x: pos.x - hl, y: pos.y - 16, w: hl * 2, h: 32 };
      else if (pos.sym === 'box') bb = { x: pos.x - (pos.w || 30) / 2 - 3, y: pos.y - hl, w: (pos.w || 30) + 6, h: hl * 2 };
      else bb = { x: pos.x - 14, y: pos.y - hl, w: 28, h: hl * 2 };
      E('rect', { x: bb.x - pos.x, y: bb.y - pos.y, width: bb.w, height: bb.h, class: 'hit' }, gg);
      if (pos.ports && pos.ports.ctl) E('path', { d: 'M11 8H13', class: 'sym-l' }, gg);

      // підписи
      const lab = SV.label(id) + (part && PART_SUFFIX[part] ? ' ' + PART_SUFFIX[part] : '');
      const nm = e.name.length > 34 ? e.name.slice(0, 33) + '…' : e.name;
      if (pos.lab === 'rot') {
        T(gg, 0, 0, lab, { class: 'lbl b', transform: 'translate(13 ' + (pos.end ? 14 : 6) + ') rotate(90)' });
      } else if (pos.lab === 'rot2') {
        T(gg, 0, 0, lab, { class: 'lbl b', transform: 'translate(' + (pos.sym === 'box' ? -15 : -14) + ' 16) rotate(-90)' });
      } else if (pos.lab === 'short') {
        T(gg, 0, 34, lab, { class: 'lbl b', 'text-anchor': 'middle' });
      } else if (pos.lab === 'none') {
        // нічого
      } else if (pos.o === 'h') {
        T(gg, 0, -20, lab, { class: 'lbl b', 'text-anchor': 'middle' });
        T(gg, 0, 30, nm, { class: 'lbl', 'text-anchor': 'middle' });
      } else {
        T(gg, (pos.sym === 'box' ? (pos.w || 30) / 2 + 6 : 16), -3, lab, { class: 'lbl b' });
        T(gg, (pos.sym === 'box' ? (pos.w || 30) / 2 + 6 : 16), 10, nm, { class: 'lbl' });
        if (e.model) T(gg, (pos.sym === 'box' ? (pos.w || 30) / 2 + 6 : 16), 22, e.model.length > 36 ? e.model.slice(0, 35) + '…' : e.model, { class: 'lbl dim' });
      }
      ctx.regEl(id, gg, bb);
    });

    /* кабелі */
    D.cables.forEach((c) => {
      const ka = resolve(P, c.from, c.fp), kb = resolve(P, c.to, c.tp);
      if (!ka || !kb) return;
      const pa = P[ka], pb = P[kb];
      let A, B;
      if (!pa.bus) A = port(pa, true, c.fpp);
      if (!pb.bus) B = port(pb, false, c.tpp);
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

    return { bounds: { x: 0, y: 0, w: 2900, h: 3540 } };
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
