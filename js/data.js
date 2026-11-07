/* =============================================================================
   ДАНІ СХЕМИ — єдине джерело для всіх чотирьох видів
   (електрична, логічна, фізична «шафа», фізична «сортувальник»).

   Як редагувати:
   • Елемент:  { id, name, model, type, loc, parent, desc, assumed, mark }
       id      — службовий ідентифікатор (не змінюйте без потреби — на нього
                 посилаються кабелі та розкладки видів);
       mark    — реальне маркування на обладнанні (коли з'явиться), напр. '-QF1'.
                 Якщо задано, на схемах показується mark замість id;
       loc     — 'cab' (монтажна панель шафи), 'door' (двері шафи),
                 'sorter' (на сортувальнику), 'ext' (зовнішнє);
       parent  — до чого належить (шафа, зона сортувальника);
       assumed — true, якщо елемент/функція є припущенням (малюється пунктиром).
   • Кабель:  { id, from, to, fp, tp, kind, cond, phase, phys, mark, exit, logic }
       from/to — id елементів (напрям: від джерела до споживача);
       fp/tp   — частина елемента (котушка 'coil', контакт 'aux1' …) — лише для
                 електричної схеми;
       kind    — тип (див. kinds нижче);
       phys    — фактичний колір проводу/оболонки у шафі (CSS-колір);
       mark    — маркування кабелю, коли з'явиться: { num: '12', color: 'red' }
                 або { num: '12' }. Показується на всіх схемах замість id;
       exit    — для кабелів, що виходять із шафи: 'gland' (знизу) або 'hose'
                 (гофра праворуч);
       logic   — false: не малювати автоматично на логічній схемі
                 (для таких кабелів задано logicLinks вручну).

   УВАГА: це ЧЕРНЕТКА, складена за фотографіями. Призначення частини
   апаратів і трасування кабелів — припущення; перевірте та виправте тут.
   ============================================================================= */
window.SCHEMA = (function () {
  'use strict';

  const elements = [];
  const cables = [];
  const logicLinks = [];
  const el = (o) => (elements.push(o), o);
  const cb = (o) => (cables.push(o), o);
  const ll = (a, b, cabs, label) => logicLinks.push({ a, b, cabs, label: label || '' });
  const pad = (n) => String(n).padStart(2, '0');

  /* Типи кабелів: назва та колір на схемах (електрична / логічна) */
  const kinds = {
    power3: { name: 'Силовий 3~ 380 В', color: '#c2410c' },
    power1: { name: 'Силовий ~ 220 В', color: '#d97706' },
    pe: { name: 'Захисне заземлення PE', color: '#15803d' },
    ctrl: { name: 'Керування ~ 220 В', color: '#7c3aed' },
    lv: { name: 'Низьковольтний = 24 В', color: '#0e7490' },
    data: { name: 'Дані / сигнал', color: '#2563eb' },
  };

  /* Кольори фаз (фізична схема) */
  const phaseColors = { L1: '#8b5a2b', L2: '#2b2b2b', L3: '#9ca3af', N: '#3b82f6', PE: '#84cc16' };

  const locations = {
    cab: 'Шафа — монтажна панель',
    door: 'Шафа — двері',
    sorter: 'Сортувальник',
    ext: 'Зовнішнє',
  };

  /* ---------------------------------------------------------------------------
     1. СИСТЕМА ТА ЗОНИ СОРТУВАЛЬНИКА
     --------------------------------------------------------------------------- */
  el({ id: 'SORTER', name: 'Сортувальник', type: 'system', loc: 'sorter' });
  el({ id: 'CAB', name: 'Шафа керування', type: 'cabinet', loc: 'sorter', parent: 'SORTER',
    desc: 'Електрична шафа, що стоїть у лінії між зоною сканування та сортувальними модулями.' });
  el({ id: 'Z1', name: 'Похилий конвеєр завантаження', type: 'zone', loc: 'sorter', parent: 'SORTER' });
  el({ id: 'Z2', name: 'Конвеєр подачі', type: 'zone', loc: 'sorter', parent: 'SORTER' });
  el({ id: 'Z3', name: 'Зона сканування та розгону', type: 'zone', loc: 'sorter', parent: 'SORTER' });
  for (let k = 1; k <= 5; k++) {
    el({ id: 'MOD' + k, name: 'Сортувальний модуль ' + k, type: 'zone', loc: 'sorter', parent: 'SORTER',
      desc: 'Секція з відвідниками, табло над нею та контейнером (синій).' });
  }
  el({ id: 'ZOUT', name: 'Вихідна зона (з огорожею)', type: 'zone', loc: 'sorter', parent: 'SORTER',
    desc: 'Кінцева ділянка з огорожею та жолобом. Живлення в чернетці не задане — уточнити.' });
  el({ id: 'WS', name: 'Робоче місце оператора', type: 'zone', loc: 'sorter', parent: 'SORTER', assumed: true,
    desc: 'Розташування умовне: на фото не видно.' });

  el({ id: 'GRID', name: 'Мережа живлення', model: '3~ 380/220 В, 50 Гц, TN-S', type: 'source', loc: 'ext', parent: 'SORTER',
    desc: 'Ввідний кабель 5-жильний (L1, L2, L3, N, PE).' });

  /* ---------------------------------------------------------------------------
     2. ШАФА — верхній ряд (ввід)
     --------------------------------------------------------------------------- */
  const C = (o) => el(Object.assign({ parent: 'CAB', loc: 'cab' }, o));

  C({ id: 'QF1', name: 'Вводний автомат', model: 'IEK ВА47-29 C50, 3P', type: 'breaker',
    desc: 'Захист вводу від перевантаження та короткого замикання.' });
  C({ id: 'KV1', name: 'Реле контролю напруги 3ф', model: 'DigiTOP VP-3F40A, 40 А', type: 'vrelay',
    desc: 'Прохідне реле: відключає навантаження, коли напруга будь-якої фази виходить за уставки. Індикація L1 / L2 / L3 (на фото 220 В).' });
  C({ id: 'QD1', name: 'ПЗВ (УЗО) 4P', model: 'Hager CFA463D, 63 А, 30 мА, тип A', type: 'rcd',
    desc: 'Захист від струмів витоку.' });
  C({ id: 'KM1', name: 'Головний контактор приводів', model: 'Hager ESC363, 63 А, 3 НВ', type: 'contactor',
    desc: 'Подає живлення на групи приводів Г1–Г7. Котушка — у колі керування (Пуск / Стоп / Аварійний стоп).' });
  C({ id: 'AK1', name: 'Терморегулятор шафи', model: 'DigiTOP TK-3', type: 'thermostat',
    desc: 'Вмикає вентилятор M1 при перевищенні уставки температури (на фото 30.2 °C).' });
  C({ id: 'X1', name: 'Клемник кіл керування', model: 'гвинтові клеми', type: 'terminal',
    desc: 'Праворуч від ТК-3. Призначення клем уточнити.' });

  /* 3. ШАФА — другий ряд (розподіл, керування, обладнання оператора) */
  C({ id: 'XB1', name: 'Шина розподільча', model: 'VC-411, 4P, 125 А', type: 'bus',
    desc: 'Розподіл L1, L2, L3, N після ПЗВ.' });
  C({ id: 'X2', name: 'Клеми N / PE', model: 'клеми проходні + PE (жовто-зелена)', type: 'terminal' });
  C({ id: 'KT1', name: 'Реле часу 1', model: 'ETI CRM-91H', type: 'timer', assumed: true,
    desc: 'Функція у чернетці: затримка ввімкнення живлення драйверів (KM2) після пуску.' });
  C({ id: 'KT2', name: 'Реле часу 2', model: 'ETI CRM-91H', type: 'timer', assumed: true,
    desc: 'Функція у чернетці: керування освітленням сортувальника (KM3).' });
  C({ id: 'KM2', name: 'Контактор живлення драйверів', model: 'Hager ESC325, 25 А', type: 'contactor', assumed: true });
  C({ id: 'KM3', name: 'Контактор освітлення', model: 'Hager ESC125, 25 А, 1 НВ', type: 'contactor', assumed: true });
  C({ id: 'K1', name: 'Проміжне реле «Аварія»', model: 'інтерфейсне реле (уточнити)', type: 'relay', assumed: true });
  C({ id: 'QF2', name: 'Автомат кіл керування', model: 'Hager, 1P (на фото підпис «12»)', type: 'breaker', assumed: true,
    desc: 'На шафі підписаний «12». Призначення у чернетці — живлення кіл керування.' });
  C({ id: 'QF3', name: 'Автомат обладнання оператора', model: 'Hager MCN120, C20, 1P', type: 'breaker' });
  C({ id: 'QF4', name: 'Автомат «Монітори»', model: 'IEK ВА47-29 C16, 1P', type: 'breaker', caption: 'Монітори',
    desc: 'Підпис на шафі: «Монітори». У чернетці живить табло над модулями.' });
  C({ id: 'QF5', name: 'Автомат «Принтера»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Принтера' });
  C({ id: 'QF6', name: 'Автомат «Роб. стіл»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Роб. стіл' });
  C({ id: 'QF7', name: 'Автомат «Сканера»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Сканера' });
  C({ id: 'QF8', name: 'Автомат «Світло»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Світло' });

  /* 4. ШАФА — інше обладнання */
  C({ id: 'M1', name: 'Вентилятор шафи', model: 'осьовий ~220 В', type: 'fan' });
  C({ id: 'BK1', name: 'Датчик температури', model: 'датчик ТК-3', type: 'sensor', assumed: true,
    desc: 'Розташування умовне.' });
  C({ id: 'X3', name: 'З’єднувальні клеми', model: 'WAGO (червоні важелі)', type: 'terminal',
    desc: 'Ліва стінка, біля вентилятора.' });
  C({ id: 'X4', name: 'Клемник сигналів', model: 'клеми проходні', type: 'terminal',
    desc: 'Ліва стінка, середина. Сигнали між шафою та ПК.' });
  C({ id: 'EL1', name: 'Освітлення шафи', model: 'LED-лінійка', type: 'lamp' });
  C({ id: 'SQ1', name: 'Кінцевий вимикач дверей', model: 'синій, угорі праворуч', type: 'limit', assumed: true });
  C({ id: 'UZ1', name: 'Блок живлення 24 В', model: 'уточнити', type: 'psu', assumed: true,
    desc: 'На фото не видно; потрібен для релейних модулів — уточнити наявність і місце.' });

  /* 5. ДВЕРІ ШАФИ (кнопки / лампи видно на загальному вигляді) */
  const DR = (o) => el(Object.assign({ parent: 'CAB', loc: 'door', assumed: true }, o));
  DR({ id: 'HL1', name: 'Лампа «Мережа»', model: 'зелена', type: 'lamp', color: 'green' });
  DR({ id: 'HL2', name: 'Лампа «Робота»', model: 'зелена', type: 'lamp', color: 'green' });
  DR({ id: 'HL3', name: 'Лампа «Аварія»', model: 'червона', type: 'lamp', color: 'red' });
  DR({ id: 'SB1', name: 'Кнопка «Пуск»', model: 'зелена, НВ', type: 'button', color: 'green' });
  DR({ id: 'SB2', name: 'Кнопка «Стоп»', model: 'червона, НЗ', type: 'button', color: 'red' });
  DR({ id: 'SB3', name: 'Аварійний стоп', model: 'грибок, НЗ + НВ', type: 'estop', color: 'red' });

  /* ---------------------------------------------------------------------------
     6. ГРУПИ ПРИВОДІВ: 7 рядів = цифровий вимірювач + 12 однополюсних автоматів.
        Кожен автомат живить привод у відповідній зоні (припущення).
     --------------------------------------------------------------------------- */
  const BREAKERS_PER_GROUP = 12;
  const GROUP_DEF = [
    { n: 1, phase: 'L1', zones: [['Z1', 4], ['Z2', 8]] },
    { n: 2, phase: 'L2', zones: [['Z3', 12]] },
    { n: 3, phase: 'L3', zones: [['MOD1', 12]] },
    { n: 4, phase: 'L1', zones: [['MOD2', 12]] },
    { n: 5, phase: 'L2', zones: [['MOD3', 12]] },
    { n: 6, phase: 'L3', zones: [['MOD4', 12]] },
    { n: 7, phase: 'L1', zones: [['MOD5', 12]] },
  ];
  const groups = GROUP_DEF.map((G) => {
    const pa = 'PA' + G.n;
    C({ id: pa, name: 'Вимірювач струму групи ' + G.n, model: 'цифровий амперметр (уточнити)', type: 'meter', group: G.n,
      desc: 'Ряд ' + (G.n + 2) + ' шафи. Фаза ' + G.phase + ' (припущення).' });
    cb({ id: 'WP' + G.n, from: 'KM1', to: pa, kind: 'power1', phase: G.phase, cond: G.phase + ', N', desc: 'Живлення групи ' + G.n });
    const zoneList = [];
    G.zones.forEach(([z, cnt]) => { for (let i = 0; i < cnt; i++) zoneList.push(z); });
    const lines = [];
    for (let n = 1; n <= BREAKERS_PER_GROUP; n++) {
      const qf = 'QF' + G.n + pad(n);
      const m = 'M' + G.n + pad(n);
      const zone = zoneList[n - 1] || G.zones[G.zones.length - 1][0];
      C({ id: qf, name: 'Автомат Г' + G.n + ', лінія ' + n, model: 'IEK ВА47-29, 1P (номінал уточнити)', type: 'breaker', group: G.n });
      el({ id: m, name: 'Привод ' + G.n + '.' + n, model: 'привод конвеєра (уточнити)', type: 'motor', loc: 'sorter', parent: zone,
        assumed: true, group: G.n });
      cb({ id: 'WB' + G.n + pad(n), from: pa, to: qf, kind: 'power1', phase: G.phase, cond: G.phase, desc: 'Гребінчаста шина групи ' + G.n });
      cb({ id: 'WM' + G.n + pad(n), from: qf, to: m, kind: 'power1', phase: G.phase, cond: G.phase + ', N, PE', phys: '#e5e7eb',
        exit: 'gland', desc: 'Кабель живлення приводу' });
      lines.push({ qf, m, zone });
    }
    return { n: G.n, phase: G.phase, pa, lines, zones: G.zones.map((z) => z[0]) };
  });

  /* ---------------------------------------------------------------------------
     7. ВІДВІДНИКИ: 30 плат-драйверів праворуч (3 стовпці × 10),
        4 релейні модулі внизу шафи, 30 актуаторів на модулях (6 на модуль).
     --------------------------------------------------------------------------- */
  for (let k = 1; k <= 4; k++) {
    C({ id: 'KR' + k, name: 'Релейний модуль ' + k + ' (8 кан.)', model: 'плата реле, червоні клеми', type: 'relayboard',
      desc: 'Нижня частина шафи. Канали ' + ((k - 1) * 8 + 1) + '–' + Math.min(k * 8, 30) + ' керування драйверами.' });
  }
  const drivers = [];
  for (let i = 1; i <= 30; i++) {
    const mod = Math.ceil(i / 6);
    const kr = 'KR' + Math.ceil(i / 8);
    C({ id: 'A' + i, name: 'Драйвер відвідника ' + i, model: 'плата-драйвер (уточнити)', type: 'driver',
      desc: 'Модуль ' + mod + ', відвідник ' + (((i - 1) % 6) + 1) + '.' });
    el({ id: 'Y' + i, name: 'Відвідник ' + i, model: 'актуатор (уточнити)', type: 'solenoid', loc: 'sorter', parent: 'MOD' + mod, assumed: true });
    cb({ id: 'WA' + i, from: 'KM2', to: 'A' + i, kind: 'power1', phase: 'L2', cond: 'L2, N', desc: 'Живлення драйвера' });
    cb({ id: 'WK' + i, from: kr, to: 'A' + i, tpp: 'ctl', kind: 'lv', phys: '#f59e0b', cond: 'сигнал', desc: 'Команда на драйвер' });
    cb({ id: 'WY' + i, from: 'A' + i, to: 'Y' + i, kind: 'lv', phys: '#fb923c', cond: '2 жили', exit: 'hose', desc: 'До актуатора відвідника' });
    drivers.push({ a: 'A' + i, y: 'Y' + i, kr, mod: 'MOD' + mod });
  }

  /* ---------------------------------------------------------------------------
     8. ОБЛАДНАННЯ СОРТУВАЛЬНИКА (поза шафою)
     --------------------------------------------------------------------------- */
  el({ id: 'SC1', name: 'Сканер (колона сканування)', model: 'колона з екраном', type: 'scanner', loc: 'sorter', parent: 'Z3' });
  for (let k = 1; k <= 5; k++) {
    el({ id: 'D' + k, name: 'Табло / монітор модуля ' + k, model: 'монітор над модулем', type: 'display', loc: 'sorter', parent: 'MOD' + k });
  }
  el({ id: 'EL2', name: 'Освітлення сортувальних модулів', model: 'світильник на рамі', type: 'lamp', loc: 'sorter', parent: 'SORTER', assumed: true });
  el({ id: 'PC1', name: 'ПК керування сортуванням', model: 'уточнити', type: 'pc', loc: 'sorter', parent: 'WS', assumed: true });
  el({ id: 'PR1', name: 'Принтер етикеток', model: 'уточнити', type: 'printer', loc: 'sorter', parent: 'WS', assumed: true });
  el({ id: 'WT1', name: 'Розетки робочого столу', model: 'блок розеток', type: 'socket', loc: 'sorter', parent: 'WS', assumed: true });

  /* Логічні вузли (тільки на логічній схемі) */
  el({ id: 'G_OR1', name: 'АБО: Пуск або самоутримання', type: 'gate', sym: '≥1', virtual: true });
  el({ id: 'G_AND1', name: 'І: дозвіл роботи KM1', type: 'gate', sym: '&', virtual: true });

  /* ---------------------------------------------------------------------------
     9. КАБЕЛІ — силові кола
     --------------------------------------------------------------------------- */
  const WHITE = '#e5e7eb';
  cb({ id: 'W1', from: 'GRID', to: 'QF1', kind: 'power3', cond: 'L1, L2, L3, N, PE', phys: WHITE, desc: 'Ввідний кабель' });
  cb({ id: 'W2', from: 'QF1', to: 'KV1', kind: 'power3', cond: 'L1, L2, L3', phys: WHITE });
  cb({ id: 'W3', from: 'KV1', to: 'QD1', kind: 'power3', cond: 'L1, L2, L3, N', phys: WHITE });
  cb({ id: 'W4', from: 'QD1', to: 'XB1', kind: 'power3', cond: 'L1, L2, L3, N', phys: WHITE });
  cb({ id: 'W5', from: 'GRID', to: 'X2', kind: 'pe', cond: 'PE', logic: false, desc: 'Захисний провідник вводу' });
  cb({ id: 'W7', from: 'XB1', to: 'KM1', tp: 'main', kind: 'power3', cond: 'L1, L2, L3', phys: WHITE });
  cb({ id: 'W8', from: 'XB1', fp: 'bus2', to: 'QF3', kind: 'power1', phase: 'L3', cond: 'L3, N' });
  ['QF4', 'QF5', 'QF6', 'QF7', 'QF8'].forEach((q, i) => {
    cb({ id: 'W' + (9 + i), from: 'QF3', to: q, kind: 'power1', phase: 'L3', cond: 'L3', desc: 'Перемичка' });
  });
  for (let k = 1; k <= 5; k++) {
    cb({ id: 'WD' + k, from: 'QF4', to: 'D' + k, kind: 'power1', phase: 'L3', cond: 'L3, N, PE', phys: WHITE, exit: 'gland' });
  }
  cb({ id: 'W15', from: 'QF5', to: 'PR1', kind: 'power1', phase: 'L3', cond: 'L3, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W16', from: 'QF6', to: 'WT1', kind: 'power1', phase: 'L3', cond: 'L3, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W17', from: 'QF7', to: 'SC1', kind: 'power1', phase: 'L3', cond: 'L3, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W18', from: 'QF8', to: 'KM3', tp: 'main', kind: 'power1', phase: 'L3', cond: 'L3' });
  cb({ id: 'W19', from: 'KM3', fp: 'main', to: 'EL2', kind: 'power1', phase: 'L3', cond: 'L3, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W46', from: 'XB1', fp: 'bus2', to: 'KM2', tp: 'main', kind: 'power1', phase: 'L2', cond: 'L2, N' });
  cb({ id: 'W48', from: 'WT1', to: 'PC1', kind: 'power1', cond: 'вилка ~220 В', phys: '#111827' });

  /* 10. КАБЕЛІ — кола керування (~220 В від QF2) */
  const R = '#ef4444';
  cb({ id: 'W20', from: 'XB1', fp: 'bus2', to: 'QF2', kind: 'power1', phase: 'L1', cond: 'L1, N' });
  const K = (o) => cb(Object.assign({ kind: 'ctrl', phys: R, logic: false, cond: '1 жила' }, o));
  K({ id: 'W21', from: 'QF2', to: 'HL1' });
  K({ id: 'W22', from: 'QF2', to: 'SB3', tp: 'nc' });
  K({ id: 'W23', from: 'SB3', fp: 'nc', to: 'SB2' });
  K({ id: 'W24', from: 'SB2', to: 'SB1' });
  K({ id: 'W25', from: 'SB2', to: 'KM1', tp: 'aux1', desc: 'Шунт самоутримання' });
  K({ id: 'W26', from: 'SB1', to: 'KM1', tp: 'coil' });
  K({ id: 'W27', from: 'KM1', fp: 'aux1', to: 'KM1', tp: 'coil' });
  K({ id: 'W28', from: 'QF2', to: 'KM1', tp: 'aux2' });
  K({ id: 'W29', from: 'KM1', fp: 'aux2', to: 'KT1', tp: 'coil' });
  K({ id: 'W30', from: 'KM1', fp: 'aux2', to: 'HL2' });
  K({ id: 'W31', from: 'KM1', fp: 'aux2', to: 'KT2' });
  K({ id: 'W32', from: 'QF2', to: 'KT1', tp: 'contact' });
  K({ id: 'W33', from: 'KT1', fp: 'contact', to: 'KM2', tp: 'coil' });
  K({ id: 'W34', from: 'KT2', to: 'KM3', tp: 'coil' });
  K({ id: 'W35', from: 'QF2', to: 'AK1' });
  K({ id: 'W36', from: 'BK1', to: 'AK1', tpp: 'sens', kind: 'data', phys: '#e5e7eb', cond: 'датчик' });
  K({ id: 'W37', from: 'AK1', to: 'X3' });
  K({ id: 'W53', from: 'X3', to: 'M1', phys: WHITE, cond: 'L, N' });
  K({ id: 'W38', from: 'QF2', to: 'SQ1' });
  K({ id: 'W39', from: 'SQ1', to: 'EL1' });
  K({ id: 'W40', from: 'QF2', to: 'SB3', tp: 'no' });
  K({ id: 'W41', from: 'SB3', fp: 'no', to: 'K1', tp: 'coil' });
  K({ id: 'W42', from: 'QF2', to: 'K1', tp: 'contact' });
  K({ id: 'W43', from: 'K1', fp: 'contact', to: 'HL3' });
  K({ id: 'W44', from: 'K1', fp: 'contact', to: 'X4', kind: 'data', phys: '#e5e7eb', eref: true });
  K({ id: 'W45', from: 'X4', to: 'PC1', kind: 'data', phys: '#e5e7eb', exit: 'gland', eref: true, cond: 'сигнал «Аварія»' });
  K({ id: 'W47', from: 'QF2', to: 'UZ1', eref: true, cond: 'L, N' });

  /* 11. КАБЕЛІ — низьковольтні та дані */
  for (let k = 1; k <= 4; k++) {
    cb({ id: 'WU' + k, from: 'UZ1', to: 'KR' + k, kind: 'lv', phys: '#ef4444', cond: '+24 В, 0 В' });
    cb({ id: 'WX' + k, from: 'X4', to: 'KR' + k, kind: 'data', phys: '#e5e7eb', logic: false, cond: 'шина керування' });
  }
  cb({ id: 'W49', from: 'PC1', to: 'X4', kind: 'data', phys: '#e5e7eb', exit: 'gland', eref: true, logic: false, cond: 'USB / інтерфейс (уточнити)' });
  cb({ id: 'W50', from: 'SC1', to: 'PC1', tpp: 'din', kind: 'data', cond: 'Ethernet / USB' });
  cb({ id: 'W51', from: 'PC1', fpp: 'dout', to: 'PR1', tpp: 'bot', kind: 'data', cond: 'USB' });
  for (let k = 1; k <= 5; k++) {
    cb({ id: 'WV' + k, from: 'PC1', fpp: 'dout', to: 'D' + k, tpp: 'bot', kind: 'data', cond: 'відео / мережа' });
  }

  /* ---------------------------------------------------------------------------
     12. ЛОГІЧНІ ЗВ'ЯЗКИ, що не збігаються 1:1 з кабелями
     --------------------------------------------------------------------------- */
  ll('QF2', 'HL1', ['W21'], 'є живлення');
  ll('QF2', 'SB3', ['W22', 'W40'], '');
  ll('SB3', 'G_AND1', ['W22', 'W23'], 'не натиснуто');
  ll('SB2', 'G_AND1', ['W23', 'W24', 'W25'], 'не натиснуто');
  ll('KV1', 'G_AND1', ['W3', 'W20'], 'U в нормі');
  ll('SB1', 'G_OR1', ['W24', 'W26'], 'Пуск');
  ll('KM1', 'G_OR1', ['W25', 'W27'], 'самоутримання');
  ll('G_OR1', 'G_AND1', ['W26', 'W27'], '');
  ll('G_AND1', 'KM1', ['W26', 'W27'], 'котушка');
  ll('KM1', 'KT1', ['W28', 'W29'], 'увімкнено');
  ll('KT1', 'KM2', ['W32', 'W33'], 'через t₁');
  ll('KM1', 'KT2', ['W31'], '');
  ll('KT2', 'KM3', ['W34'], 't₂');
  ll('KM1', 'HL2', ['W30'], '');
  ll('QF2', 'AK1', ['W35'], '');
  ll('BK1', 'AK1', ['W36'], 'T');
  ll('AK1', 'M1', ['W37', 'W53'], 'T > Tуст');
  ll('QF2', 'SQ1', ['W38'], '');
  ll('SQ1', 'EL1', ['W39'], 'двері відчинені');
  ll('SB3', 'K1', ['W40', 'W41'], 'натиснуто');
  ll('K1', 'HL3', ['W42', 'W43'], '');
  ll('K1', 'PC1', ['W44', 'W45'], 'сигнал аварії');
  ll('QF2', 'UZ1', ['W47'], '');
  for (let k = 1; k <= 4; k++) ll('PC1', 'KR' + k, ['W49', 'WX' + k], 'команди');

  return {
    meta: { title: 'Сортувальник — інтерактивні схеми', version: 'чернетка 0.1', date: '2026-11-06' },
    kinds, phaseColors, locations, elements, cables, logicLinks, groups, drivers,
  };
})();
