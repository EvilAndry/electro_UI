/* =============================================================================
   ДАНІ СХЕМИ — єдине джерело для всіх чотирьох видів
   (електрична, логічна, фізична «шафа», фізична «сортувальник»).

   Як редагувати:
   • Елемент:  { id, name, model, type, loc, parent, desc, assumed, mark, mode, only }
       id      — службовий ідентифікатор (на нього посилаються кабелі та розкладки
                 видів — не змінюйте без потреби);
       mark    — реальне маркування на обладнанні, напр. '-QF1'. Якщо задано,
                 на схемах показується mark замість id;
       loc     — 'cab' (монтажна панель шафи), 'door' (двері шафи),
                 'sorter' (на лінії), 'ext' (зовнішнє);
       parent  — до чого належить (шафа, зона лінії, рама сканера);
       assumed — true, якщо елемент або його функція — припущення (пунктир);
       mode    — з якого режиму елемент під напругою: 'pause' | 'stop' | 'run';
       only    — лише в цих режимах (напр. лампа «Пауза»: ['pause']).
   • Кабель:  { id, from, to, fp, tp, fpp, tpp, kind, cond, phase, phys, mark,
                exit, logic, eref, mode, only }
       from/to — id елементів (напрям: від джерела до споживача);
       fp/tp   — частина елемента на електричній схемі (котушка 'coil',
                 контакт 'no' …); fpp/tpp — конкретний вивід;
       kind    — тип (див. kinds);
       phys    — фактичний колір проводу/оболонки на фізичних схемах;
       mark    — маркування кабелю: { num: '12', color: 'red' } або { num: '12' };
       exit    — вихід із шафи: 'gland' (знизу) або 'hose' (гофра праворуч);
       logic   — false: не малювати автоматично на логічній схемі;
       eref    — на електричній схемі показати як посилання «→ куди» замість лінії.

   Джерела: фото шафи та лінії, опис логіки від експлуатації, розділ «Поломки»
   у Notion. Те, що не підтверджено, позначено assumed: true.
   ============================================================================= */
window.SCHEMA = (function () {
  'use strict';

  const elements = [];
  const cables = [];
  const logicLinks = [];
  const el = (o) => (elements.push(o), o);
  const cb = (o) => (cables.push(o), o);
  const ll = (a, b, cabs, label) => logicLinks.push({ a, b, cabs, label: label || '' });

  const kinds = {
    power3: { name: 'Силовий 3~ 380 В', color: '#c2410c' },
    power1: { name: 'Силовий ~ 230 В', color: '#d97706' },
    pe: { name: 'Захисне заземлення PE', color: '#15803d' },
    ctrl: { name: 'Керування ~ 230 В', color: '#7c3aed' },
    lv: { name: 'Низьковольтний = 24 В', color: '#0e7490' },
    data: { name: 'Дані / сигнал', color: '#2563eb' },
  };
  const phaseColors = { L1: '#8b5a2b', L2: '#2b2b2b', L3: '#9ca3af', N: '#3b82f6', PE: '#84cc16' };
  const locations = { cab: 'Шафа — монтажна панель', door: 'Шафа — двері', sorter: 'Лінія', ext: 'Зовнішнє' };

  /* Режими лінії (опис від експлуатації) */
  const modes = [
    { id: 'pause', name: 'Пауза', lamp: 'HL2', color: '#f59e0b',
      text: 'Жовта лампа. Лінія знеструмлена: працюють лише реле напруги та терморегулятор (і коло керування до кнопки «Пуск»). Сюди лінія переходить після натискання будь-якої аварійної кнопки — персонал робить це регулярно, це не аварія.',
      next: 'Пуск (NO): самоутримання двоканального реле KM2 → реле часу KT1 (блоки живлення) і KT2 (плати, ≥10 с пізніше). Загалом 5–15 с.' },
    { id: 'stop', name: 'Лінія стоп', lamp: 'HL3', color: '#ef4444',
      text: 'Червона лампа. Працює однофазне навантаження: блоки живлення, плати, мережеве обладнання, обладнання оператора. Йде калібрування вузлів, підключення до сервера, обмін даними. Трифазне навантаження (протяжки) вимкнене.',
      next: 'Лінія старт (NO): самоутримання контактора KM3 → K1 → котушка KM1 (63 А) → плавні пуски → протяжки. «Стоп» (NC) повертає сюди, аварійна кнопка — у Паузу.' },
    { id: 'run', name: 'Робота', lamp: 'HL1', color: '#22c55e',
      text: 'Зелена лампа та підсвітка кнопки «Пуск». Увімкнено все, зокрема трифазне навантаження: 7 плавних пусків × 5 протяжок.',
      next: '«Стоп» → Лінія стоп (однофазне працює далі). Аварійна кнопка, ключ або кінцевик розвороту → Пауза.' },
  ];

  /* ---------------------------------------------------------------------------
     1. СИСТЕМА ТА ЗОНИ ЛІНІЇ
     --------------------------------------------------------------------------- */
  el({ id: 'SORTER', name: 'Сортувальна лінія', type: 'system', loc: 'sorter' });
  el({ id: 'CAB', name: 'Шафа керування', type: 'cabinet', loc: 'sorter', parent: 'SORTER',
    desc: 'Електрична шафа в лінії між рамою сканера та сортувальними модулями. Зверху — мережева стійка.' });
  el({ id: 'Z1', name: 'Похилий підйом (передній розворот)', type: 'zone', loc: 'sorter', parent: 'SORTER',
    desc: 'Каретки, що повернулись під лінією, піднімаються тут нагору. На розвороті стоять кінцеві вимикачі.' });
  el({ id: 'Z2', name: 'Ділянка завантаження', type: 'zone', loc: 'sorter', parent: 'SORTER' });
  el({ id: 'Z3', name: 'Зона сканування', type: 'zone', loc: 'sorter', parent: 'SORTER' });
  for (let k = 1; k <= 5; k++) {
    el({ id: 'MOD' + k, name: 'Сортувальний модуль ' + k, type: 'zone', loc: 'sorter', parent: 'SORTER',
      desc: 'Секція з відвідниками, табло над нею та контейнером (синій).' });
  }
  el({ id: 'ZOUT', name: 'Кінцевий розворот і вихід (з огорожею)', type: 'zone', loc: 'sorter', parent: 'SORTER',
    desc: 'Тут каретки розвертаються під лінію та повертаються на початок.' });
  el({ id: 'WS', name: 'Робоче місце оператора', type: 'zone', loc: 'sorter', parent: 'SORTER', assumed: true,
    desc: 'Розташування умовне: на фото не видно.' });

  el({ id: 'GRID', name: 'Мережа живлення', model: '3~ 380/230 В, 50 Гц', type: 'source', loc: 'ext', parent: 'SORTER', mode: 'pause',
    desc: 'Фази приходять на QF1, нуль — напряму на реле напруги KV1.' });

  /* ---------------------------------------------------------------------------
     2. ШАФА — ряд 1: ввід, контроль напруги, ПЗВ, головний контактор
     --------------------------------------------------------------------------- */
  const C = (o) => el(Object.assign({ parent: 'CAB', loc: 'cab' }, o));
  C({ id: 'QF1', name: 'Вводний автомат', model: 'IEK ВА47-29 C50, 3P', type: 'breaker', mode: 'pause',
    desc: '3 фази приходять зверху, виходять на реле напруги KV1.' });
  C({ id: 'KV1', name: 'Реле напруги 3ф', model: 'DigiTOP VP-3F40A (на інших лініях ZUBR)', type: 'vrelay', mode: 'pause',
    desc: 'Пороги 192 / 260 В, асиметрія 30 В, контроль чергування фаз. Знімає живлення з усього після себе. Працює в усіх режимах. Нуль приходить сюди напряму з вводу.' });
  C({ id: 'QD1', name: 'Диф-автомат 4P', model: 'Hager CFA463D, 63 А, 30 мА, тип A', type: 'rcd', mode: 'pause',
    desc: 'Захист від витоку. Три фази й нуль від KV1. Спрацювання після Пуску — шукати в однофазних споживачах, після Лінія старт — у трифазних.' });
  C({ id: 'KM1', name: 'Головний трифазний контактор', model: 'Hager ESC363, 63 А, 3 НВ', type: 'contactor', mode: 'run',
    desc: 'Вмикається після «Лінія старт». Від нього живиться шина XB1 і все трифазне навантаження.' });
  C({ id: 'AK1', name: 'Реле температури', model: 'DigiTOP TK-3', type: 'thermostat', mode: 'pause',
    desc: 'Працює в усіх режимах. Вмикає вентилятор M1 при перевищенні уставки (на фото 30.2 °C).' });
  C({ id: 'X1', name: 'Клемник', model: 'гвинтові клеми', type: 'terminal', mode: 'pause', assumed: true,
    desc: 'Праворуч від TK-3. Призначення уточнити.' });

  /* 3. ШАФА — ряд 2: шина, однофазний розподіл, логіка запуску, автомати оператора */
  C({ id: 'XB1', name: 'Шина розподільча 3ф', model: 'VC-411, 4P, 125 А', type: 'bus', mode: 'run',
    desc: 'Отримує живлення від KM1, розподіляє 3 фази на плавні пуски PA1–PA7.' });
  C({ id: 'X2', name: 'Клеми однофазного розподілу N / PE', model: 'клеми + PE', type: 'terminal', mode: 'pause', assumed: true,
    desc: 'Однофазне живлення після диф-автомата. Точна точка відбору фази — уточнити.' });
  C({ id: 'KT1', name: 'Реле часу 1 — блоки живлення', model: 'ETI CRM-91H', type: 'timer', mode: 'stop',
    desc: 'Запускається другим каналом KM2. Спрацьовує першим і вмикає блоки живлення.' });
  C({ id: 'KT2', name: 'Реле часу 2 — плати, дозвіл старту', model: 'ETI CRM-91H', type: 'timer', mode: 'stop',
    desc: 'Спрацьовує щонайменше на 10 с пізніше за KT1. Вмикає плати, гасить жовту лампу, запалює червону та дає дозвіл кнопці «Лінія старт».' });
  C({ id: 'KM2', name: 'Двоканальне реле «Пуск»', model: 'Hager ESC325, 25 А, 2 НВ', type: 'contactor', mode: 'stop',
    desc: 'Стає на самоутримання від кнопки Пуск. Канал 1 — утримання через коло аварійної зупинки, канал 2 — запуск KT1 і KT2.' });
  C({ id: 'KM3', name: 'Контактор «Лінія старт»', model: 'Hager ESC125, 25 А, 1 НВ', type: 'contactor', mode: 'run', assumed: true,
    desc: 'Самоутримання від кнопки «Лінія старт» через кнопку «Стоп» (NC) та дозвіл KT2. Вмикає головний контактор KM1. Розподіл контактів між KM3 і K1 — припущення.' });
  C({ id: 'K1', name: 'Проміжне реле', model: 'інтерфейсне реле (уточнити)', type: 'relay', mode: 'run', assumed: true,
    desc: 'У чернетці — дублює KM3 і вмикає котушку KM1. Уточнити.' });
  C({ id: 'QF2', name: 'Автомат кола керування', model: 'Hager, 1P (на фото підпис «12»)', type: 'breaker', mode: 'pause', assumed: true,
    desc: 'Живлення кнопок, ламп, котушок реле та контакторів.' });
  C({ id: 'QF3', name: 'Автомат однофазної групи', model: 'Hager MCN120, C20, 1P', type: 'breaker', mode: 'stop', assumed: true,
    desc: 'Живить автомати обладнання QF4–QF8 і мережеве обладнання. Чи вмикається через KT1 — уточнити.' });
  C({ id: 'QF4', name: 'Автомат «Монітори»', model: 'IEK ВА47-29 C16, 1P', type: 'breaker', caption: 'Монітори', mode: 'stop' });
  C({ id: 'QF5', name: 'Автомат «Принтера»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Принтера', mode: 'stop' });
  C({ id: 'QF6', name: 'Автомат «Роб. стіл»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Роб. стіл', mode: 'stop' });
  C({ id: 'QF7', name: 'Автомат «Сканера»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Сканера', mode: 'stop' });
  C({ id: 'QF8', name: 'Автомат «Світло»', model: 'IEK ВА47-29 C10, 1P', type: 'breaker', caption: 'Світло', mode: 'stop' });

  /* 4. ШАФА — інше */
  C({ id: 'M1', name: 'Вентилятор шафи', model: 'осьовий ~230 В', type: 'fan', mode: 'pause' });
  C({ id: 'BK1', name: 'Датчик температури', model: 'датчик TK-3', type: 'sensor', mode: 'pause', assumed: true });
  C({ id: 'X3', name: 'З’єднувальні клеми', model: 'WAGO (червоні важелі)', type: 'terminal', mode: 'pause' });
  C({ id: 'X4', name: 'Клемник сигналів', model: 'клеми проходні', type: 'terminal', mode: 'stop', assumed: true });
  C({ id: 'EL1', name: 'Освітлення шафи', model: 'LED-лінійка', type: 'lamp', mode: 'pause' });
  C({ id: 'SQ1', name: 'Кінцевий вимикач дверей', model: 'синій, угорі праворуч', type: 'limit', mode: 'pause', assumed: true });
  C({ id: 'UZ1', name: 'Блок живлення 24 В (шафа)', model: 'уточнити', type: 'psu', mode: 'stop', assumed: true,
    desc: 'Вмикається реле часу KT1. Живить драйвери та релейні модулі. Наявність і місце — уточнити.' });
  C({ id: 'NET1', name: 'Мережевий комутатор', model: 'стійка над шафою', type: 'switch', mode: 'stop',
    desc: 'Мережеве обладнання в настінній стійці на даху шафи. Працює в режимі «Лінія стоп».' });

  /* 5. ДВЕРІ ШАФИ (зовнішня сторона) */
  const DR = (o) => el(Object.assign({ parent: 'CAB', loc: 'door' }, o));
  DR({ id: 'SA1', name: 'Перемикач з ключем', model: 'ключ, NC у колі аварійної зупинки', type: 'key', mode: 'pause',
    desc: 'Входить у послідовне коло аварійної зупинки. Не в робочому положенні — лінія лишається в Паузі.' });
  DR({ id: 'HL1', name: 'Лампа «Робота»', model: 'зелена', type: 'lamp', color: 'green', mode: 'run', only: ['run'] });
  DR({ id: 'HL2', name: 'Лампа «Пауза»', model: 'жовта', type: 'lamp', color: 'yellow', mode: 'pause', only: ['pause'] });
  DR({ id: 'HL3', name: 'Лампа «Лінія стоп»', model: 'червона', type: 'lamp', color: 'red', mode: 'stop', only: ['stop'] });
  DR({ id: 'SB1', name: 'Кнопка «Пуск»', model: 'зелена з підсвіткою, NO', type: 'button', color: 'green', mode: 'pause',
    desc: 'Переводить лінію з Паузи в Лінія стоп. Підсвітка горить зеленим у режимі Робота.' });
  DR({ id: 'SB2', name: 'Кнопка «Лінія старт»', model: 'зелена, NO', type: 'button', color: 'green', mode: 'stop',
    desc: 'Вмикає трифазне навантаження. Не спрацює, поки KT2 не завершив відлік.' });
  DR({ id: 'SB3', name: 'Кнопка «Стоп»', model: 'червона, NC', type: 'button', color: 'red', mode: 'stop',
    desc: 'Вимикає трифазне навантаження, однофазне працює далі.' });
  DR({ id: 'SB7', name: 'Синя кнопка', model: 'синя (функція невідома)', type: 'button', color: 'blue', assumed: true,
    desc: 'Є на дверях, у колах не задана — уточнити призначення.' });
  DR({ id: 'SB4', name: 'Аварійна кнопка на шафі', model: 'грибок, NC', type: 'estop', mode: 'pause',
    desc: 'Входить у послідовне коло аварійної зупинки. Вимикає все навантаження (Пауза).' });

  /* 6. АВАРІЙНЕ КОЛО НА ЛІНІЇ */
  el({ id: 'SB6', name: 'Аварійні кнопки лінії', model: 'грибки, NC, послідовно (кількість уточнити)', type: 'estop', loc: 'sorter', parent: 'SORTER', mode: 'pause', assumed: true });
  el({ id: 'SQ2', name: 'Кінцевий вимикач розвороту 1', model: 'важільний, NC', type: 'limit', loc: 'sorter', parent: 'Z1', mode: 'pause',
    desc: 'Передній розворот. Спрацьовує, якщо зміщені захисти або застрягла посилка. При переході в зону Open клацає.' });
  el({ id: 'SQ3', name: 'Кінцевий вимикач розвороту 2', model: 'важільний, NC', type: 'limit', loc: 'sorter', parent: 'Z1', mode: 'pause' });

  /* 7. РАМА СКАНЕРА (ліворуч від шафи) */
  el({ id: 'SC1', name: 'Рама сканера', model: 'колона з дисплеєм та електронікою', type: 'frame', loc: 'sorter', parent: 'Z3',
    desc: 'У колоні: сенсорний дисплей, центральна плата, три блоки живлення, клеми WAGO. Збоку — аварійна кнопка.' });
  const F = (o) => el(Object.assign({ parent: 'SC1', loc: 'sorter', mode: 'stop' }, o));
  F({ id: 'HMI1', name: 'Сенсорний дисплей', model: 'показує Speed / Productivity / Uptime', type: 'display' });
  F({ id: 'CB1', name: 'Центральна плата', model: 'зелена плата з клемами, DB9, USB', type: 'board',
    desc: 'Вмикається після KT2. Якщо живиться, але не стартує — дивитись налаштування та прошивку.' });
  F({ id: 'UZ2', name: 'Блок живлення 1 (рама)', model: 'імпульсний БЖ', type: 'psu' });
  F({ id: 'UZ3', name: 'Блок живлення 2 (рама)', model: 'імпульсний БЖ', type: 'psu' });
  F({ id: 'UZ4', name: 'Блок живлення 3 (рама)', model: 'імпульсний БЖ', type: 'psu' });
  F({ id: 'X5', name: 'Клеми WAGO (рама)', model: 'WAGO', type: 'terminal' });
  F({ id: 'SCN1', name: 'Сканер / камери', model: 'уточнити', type: 'scanner', assumed: true });
  F({ id: 'SB5', name: 'Аварійна кнопка на рамі сканера', model: 'грибок у жовтому корпусі, NC', type: 'estop', mode: 'pause' });

  /* ---------------------------------------------------------------------------
     8. ТРИФАЗНЕ НАВАНТАЖЕННЯ: 7 плавних пусків × 5 автоматів 3P × 5 протяжок.
        Протяжки стоять лише зверху лінії, по порядку. Ролик на валу мотор-
        редуктора + притискний ролик затискають кіль каретки й штовхають її.
     --------------------------------------------------------------------------- */
  const SOFT = 7, PER = 5;
  const LINE_X0 = 130, LINE_X1 = 1290; // координати верхньої гілки на виді «Лінія»
  const ZONE_X = [['Z1', 75, 236], ['Z2', 236, 580], ['Z3', 580, 880], ['MOD1', 880, 957], ['MOD2', 957, 1033], ['MOD3', 1033, 1110],
    ['MOD4', 1110, 1187], ['MOD5', 1187, 1265], ['ZOUT', 1265, 1700]];
  const zoneAt = (x) => (ZONE_X.find((z) => x >= z[1] && x < z[2]) || ZONE_X[0])[0];
  const groups = [];
  for (let g = 1; g <= SOFT; g++) {
    const pa = 'PA' + g;
    C({ id: pa, name: 'Плавний пуск ' + g, model: 'пристрій плавного пуску (модель уточнити)', type: 'softstart', mode: 'run', group: g,
      desc: 'Ряд ' + (g + 2) + ' шафи. Вхід: 3 фази + N від XB1. Вихід: 3 фази на 5 автоматів, ввімкнених паралельно.' });
    cb({ id: 'WP' + g, from: 'XB1', to: pa, kind: 'power3', cond: 'L1, L2, L3, N', phys: '#e5e7eb', desc: 'Живлення плавного пуску ' + g });
    const lines = [];
    for (let n = 1; n <= PER; n++) {
      const k = (g - 1) * PER + n;
      const x = LINE_X0 + ((k - 0.5) / (SOFT * PER)) * (LINE_X1 - LINE_X0);
      const qf = 'QF' + g + '0' + n;
      const m = 'M' + g + '0' + n;
      const zone = zoneAt(x);
      C({ id: qf, name: 'Автомат протяжки ' + g + '.' + n, model: 'IEK ВА47-29, 3P (номінал уточнити)', type: 'breaker', poles: 3, mode: 'run', group: g });
      el({ id: m, name: 'Протяжка ' + k + ' (група ' + g + '.' + n + ')', model: 'мотор-редуктор (черв’ячний, синій) + ведучий і притискний ролики',
        type: 'motor', loc: 'sorter', parent: zone, mode: 'run', group: g, lineX: x, order: k,
        desc: 'Протяжка №' + k + ' по ходу лінії. Затискає кіль каретки між роликами й штовхає ланцюг кареток.' });
      cb({ id: 'WB' + g + '0' + n, from: pa, to: qf, kind: 'power3', cond: 'L1, L2, L3', phys: '#9ca3af', desc: 'Від плавного пуску до автомата протяжки' });
      cb({ id: 'WM' + g + '0' + n, from: qf, to: m, kind: 'power3', cond: 'L1, L2, L3, PE', phys: '#e5e7eb', exit: 'gland', desc: 'Кабель двигуна протяжки' });
      lines.push({ qf, m, zone, x, k });
    }
    groups.push({ n: g, pa, lines });
  }

  /* ---------------------------------------------------------------------------
     9. ВІДВІДНИКИ (ще не описано експлуатацією — лишається припущенням)
        30 плат праворуч у шафі (3 стовпці × 10), 4 релейні модулі внизу.
     --------------------------------------------------------------------------- */
  for (let k = 1; k <= 4; k++) {
    C({ id: 'KR' + k, name: 'Релейний модуль ' + k + ' (8 кан.)', model: 'плата реле, червоні клеми', type: 'relayboard', mode: 'stop', assumed: true,
      desc: 'Нижня частина шафи. Призначення — уточнити.' });
  }
  const drivers = [];
  for (let i = 1; i <= 30; i++) {
    const mod = Math.ceil(i / 6), kr = 'KR' + Math.ceil(i / 8);
    C({ id: 'A' + i, name: 'Плата ' + i + ' (праворуч у шафі)', model: 'плата з різнокольоровими проводами (уточнити)', type: 'driver', mode: 'stop', assumed: true,
      desc: 'У чернетці — драйвер відвідника модуля ' + mod + '. Призначення — уточнити.' });
    el({ id: 'Y' + i, name: 'Відвідник ' + i, model: 'актуатор (уточнити)', type: 'solenoid', loc: 'sorter', parent: 'MOD' + mod, mode: 'stop', assumed: true });
    cb({ id: 'WA' + i, from: 'UZ1', to: 'A' + i, kind: 'lv', phys: '#ef4444', cond: '+24 В, 0 В' });
    cb({ id: 'WK' + i, from: kr, to: 'A' + i, tpp: 'ctl', kind: 'lv', phys: '#f59e0b', cond: 'сигнал' });
    cb({ id: 'WY' + i, from: 'A' + i, to: 'Y' + i, kind: 'lv', phys: '#fb923c', cond: '2 жили', exit: 'hose' });
    drivers.push({ a: 'A' + i, y: 'Y' + i, kr, mod: 'MOD' + mod });
  }

  /* 10. ОБЛАДНАННЯ ЛІНІЇ ТА ОПЕРАТОРА */
  for (let k = 1; k <= 5; k++) el({ id: 'D' + k, name: 'Табло модуля ' + k, model: 'монітор над модулем', type: 'display', loc: 'sorter', parent: 'MOD' + k, mode: 'stop' });
  el({ id: 'EL2', name: 'Освітлення лінії', model: 'світильник на рамі', type: 'lamp', loc: 'sorter', parent: 'SORTER', mode: 'stop', assumed: true });
  el({ id: 'PC1', name: 'ПК / сервер', model: 'уточнити', type: 'pc', loc: 'sorter', parent: 'WS', mode: 'stop', assumed: true });
  el({ id: 'PR1', name: 'Принтер етикеток', model: 'уточнити', type: 'printer', loc: 'sorter', parent: 'WS', mode: 'stop', assumed: true });
  el({ id: 'WT1', name: 'Розетки робочого столу', model: 'блок розеток', type: 'socket', loc: 'sorter', parent: 'WS', mode: 'stop', assumed: true });

  /* Логічні вузли (лише на логічній схемі) */
  el({ id: 'G_AND1', name: 'І: коло аварійної зупинки ціле і є команда', type: 'gate', sym: '&', virtual: true });
  el({ id: 'G_OR1', name: 'АБО: Пуск або самоутримання KM2', type: 'gate', sym: '≥1', virtual: true });
  el({ id: 'G_AND2', name: 'І: дозвіл KT2, не «Стоп», є команда', type: 'gate', sym: '&', virtual: true });
  el({ id: 'G_OR2', name: 'АБО: Лінія старт або самоутримання KM3', type: 'gate', sym: '≥1', virtual: true });

  /* ---------------------------------------------------------------------------
     11. КАБЕЛІ — силові
     --------------------------------------------------------------------------- */
  const WHITE = '#e5e7eb';
  cb({ id: 'W1', from: 'GRID', to: 'QF1', kind: 'power3', cond: 'L1, L2, L3', phys: WHITE, desc: 'Ввід: фази' });
  cb({ id: 'W1N', from: 'GRID', fpp: 'n', to: 'KV1', tpp: 'n', kind: 'power1', phase: 'N', cond: 'N', desc: 'Нуль вводу — напряму на реле напруги' });
  cb({ id: 'W5', from: 'GRID', to: 'X2', kind: 'pe', cond: 'PE', logic: false, eref: true, desc: 'Захисний провідник вводу' });
  cb({ id: 'W2', from: 'QF1', to: 'KV1', kind: 'power3', cond: 'L1, L2, L3', phys: WHITE });
  cb({ id: 'W3', from: 'KV1', to: 'QD1', kind: 'power3', cond: 'L1, L2, L3, N', phys: WHITE });
  cb({ id: 'W4', from: 'QD1', to: 'KM1', tp: 'main', kind: 'power3', cond: 'L1, L2, L3, N', phys: WHITE, mode: 'pause' });
  cb({ id: 'W6', from: 'KM1', fp: 'main', to: 'XB1', kind: 'power3', cond: 'L1, L2, L3, N', phys: WHITE });
  cb({ id: 'W7', from: 'QD1', fpp: 'r', to: 'X2', kind: 'power1', phase: 'L1', cond: 'L, N', eref: true, logic: false, assumed: true, desc: 'Однофазне живлення після диф-автомата (точка відбору — уточнити)' });
  cb({ id: 'W20', from: 'X2', to: 'QF2', kind: 'power1', phase: 'L1', cond: 'L, N', logic: false });
  cb({ id: 'W8', from: 'KT1', fp: 'no', to: 'QF3', kind: 'power1', phase: 'L1', cond: 'L', eref: true, logic: false, desc: 'Однофазна група вмикається реле часу KT1 (припущення)' });
  ['QF4', 'QF5', 'QF6', 'QF7', 'QF8'].forEach((q, i) => cb({ id: 'W' + (9 + i), from: 'QF3', to: q, kind: 'power1', phase: 'L1', cond: 'L', desc: 'Перемичка' }));
  for (let k = 1; k <= 5; k++) cb({ id: 'WD' + k, from: 'QF4', to: 'D' + k, kind: 'power1', phase: 'L1', cond: 'L, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W15', from: 'QF5', to: 'PR1', kind: 'power1', phase: 'L1', cond: 'L, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W16', from: 'QF6', to: 'WT1', kind: 'power1', phase: 'L1', cond: 'L, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W17', from: 'QF7', to: 'X5', kind: 'power1', phase: 'L1', cond: 'L, N, PE', phys: WHITE, exit: 'gland', logic: false, desc: 'Живлення рами сканера' });
  cb({ id: 'W18', from: 'QF8', to: 'EL2', kind: 'power1', phase: 'L1', cond: 'L, N, PE', phys: WHITE, exit: 'gland' });
  cb({ id: 'W19', from: 'QF3', to: 'NET1', kind: 'power1', phase: 'L1', cond: 'L, N, PE', phys: WHITE, assumed: true, desc: 'Живлення мережевої стійки (уточнити)' });
  cb({ id: 'W48', from: 'WT1', to: 'PC1', kind: 'power1', cond: 'вилка ~230 В', phys: '#111827' });
  cb({ id: 'W47', from: 'KT1', fp: 'no', fpp: 'p2', to: 'UZ1', kind: 'power1', phase: 'L1', cond: 'L, N', eref: true, logic: false });
  /* рама сканера */
  ['UZ2', 'UZ3', 'UZ4'].forEach((u, i) => cb({ id: 'W6' + (1 + i), from: 'X5', to: u, kind: 'power1', phase: 'L1', cond: 'L, N', phys: WHITE, logic: false }));
  cb({ id: 'W64', from: 'UZ2', to: 'CB1', kind: 'lv', cond: '+24 В', phys: '#ef4444' });
  cb({ id: 'W65', from: 'UZ3', to: 'HMI1', kind: 'lv', cond: '+V', phys: '#ef4444' });
  cb({ id: 'W66', from: 'UZ4', to: 'SCN1', kind: 'lv', cond: '+V', phys: '#ef4444', assumed: true });
  cb({ id: 'W67', from: 'CB1', fpp: 'right', to: 'HMI1', tpp: 'left', kind: 'data', cond: 'відео / USB', phys: '#1f2937' });
  cb({ id: 'W50', from: 'SCN1', fpp: 'bot', to: 'CB1', tpp: 'bot', kind: 'data', cond: 'дані сканера', phys: '#a855f7', assumed: true });
  cb({ id: 'W68', from: 'NET1', to: 'CB1', eref: true, kind: 'data', cond: 'Ethernet', phys: '#a855f7', exit: 'gland' });
  cb({ id: 'W69', from: 'NET1', to: 'PC1', tpp: 'din', kind: 'data', cond: 'Ethernet', phys: '#a855f7', exit: 'gland' });

  /* 12. КОЛА КЕРУВАННЯ ~230 В (від QF2) */
  const R = '#ef4444';
  const K = (o) => cb(Object.assign({ kind: 'ctrl', phys: R, logic: false, cond: '1 жила' }, o));
  // Послідовне коло аварійної зупинки → Пуск / самоутримання → котушка KM2
  K({ id: 'W21', from: 'QF2', to: 'SB4' });
  K({ id: 'W22', from: 'SB4', to: 'SB5', exit: 'gland', desc: 'Шлейф аварійного кола на лінію' });
  K({ id: 'W23', from: 'SB5', to: 'SB6', exit: 'gland' });
  K({ id: 'W24', from: 'SB6', to: 'SA1', exit: 'gland' });
  K({ id: 'W25', from: 'SA1', to: 'SQ2', exit: 'gland' });
  K({ id: 'W26', from: 'SQ2', to: 'SQ3', exit: 'gland' });
  K({ id: 'W27', from: 'SQ3', to: 'SB1', exit: 'gland', desc: 'Повернення аварійного кола в шафу' });
  K({ id: 'W28', from: 'SQ3', to: 'KM2', tp: 'ch1', exit: 'gland', desc: 'Шунт самоутримання' });
  K({ id: 'W29', from: 'SB1', to: 'KM2', tp: 'coil' });
  K({ id: 'W30', from: 'KM2', fp: 'ch1', to: 'KM2', tp: 'coil', desc: 'Самоутримання (канал 1)' });
  // Канал 2 → реле часу
  K({ id: 'W31', from: 'QF2', to: 'KM2', tp: 'ch2' });
  K({ id: 'W32', from: 'KM2', fp: 'ch2', to: 'KT1', tp: 'coil' });
  K({ id: 'W33', from: 'KM2', fp: 'ch2', to: 'KT2', tp: 'coil' });
  K({ id: 'W34', from: 'QF2', to: 'KT1', tp: 'no' });
  K({ id: 'W35', from: 'QF2', to: 'KT2', tp: 'no' });
  K({ id: 'W36', from: 'QF2', to: 'KT2', tp: 'nc', only: ['pause'] });
  // Лінія старт
  K({ id: 'W37', from: 'KT2', fp: 'no', to: 'SB3', desc: 'Дозвіл старту від KT2' });
  K({ id: 'W38', from: 'SB3', to: 'SB2' });
  K({ id: 'W39', from: 'SB3', to: 'KM3', tp: 'aux', desc: 'Шунт самоутримання' });
  K({ id: 'W40', from: 'SB2', to: 'KM3', tp: 'coil' });
  K({ id: 'W41', from: 'KM3', fp: 'aux', to: 'KM3', tp: 'coil', desc: 'Самоутримання KM3' });
  K({ id: 'W42', from: 'SB2', to: 'K1', tp: 'coil', assumed: true });
  K({ id: 'W43', from: 'QF2', to: 'K1', tp: 'contact' });
  K({ id: 'W44', from: 'K1', fp: 'contact', to: 'KM1', tp: 'coil', desc: 'Котушка головного контактора' });
  // Індикація
  K({ id: 'W45', from: 'KT2', fp: 'no', to: 'KM3', tp: 'nc' });
  K({ id: 'W46', from: 'KM3', fp: 'nc', to: 'HL3', only: ['stop'] });
  K({ id: 'W52', from: 'KT2', fp: 'nc', to: 'HL2', only: ['pause'] });
  K({ id: 'W53', from: 'QF2', to: 'KM1', tp: 'aux' });
  K({ id: 'W55', from: 'KM1', fp: 'aux', to: 'HL1' });
  K({ id: 'W56', from: 'KM1', fp: 'aux', to: 'SB1', tp: 'led', desc: 'Підсвітка кнопки Пуск' });
  // Клімат і світло шафи
  K({ id: 'W57', from: 'QF2', to: 'AK1' });
  K({ id: 'W58', from: 'BK1', to: 'AK1', tpp: 'sens', kind: 'data', phys: WHITE, cond: 'датчик' });
  K({ id: 'W59', from: 'AK1', to: 'X3' });
  K({ id: 'W70', from: 'X3', to: 'M1', phys: WHITE, cond: 'L, N' });
  K({ id: 'W71', from: 'QF2', to: 'SQ1' });
  K({ id: 'W72', from: 'SQ1', to: 'EL1' });

  /* 13. НИЗЬКОВОЛЬТНІ ТА ДАНІ (відвідники — припущення) */
  for (let k = 1; k <= 4; k++) {
    cb({ id: 'WU' + k, from: 'UZ1', to: 'KR' + k, kind: 'lv', phys: '#ef4444', cond: '+24 В, 0 В', eref: true });
    cb({ id: 'WX' + k, from: 'X4', to: 'KR' + k, kind: 'data', phys: WHITE, logic: false, cond: 'шина керування' });
  }
  cb({ id: 'W49', from: 'PC1', fpp: 'dout', to: 'X4', kind: 'data', phys: WHITE, exit: 'gland', eref: true, logic: false, cond: 'інтерфейс (уточнити)' });
  cb({ id: 'W51', from: 'PC1', fpp: 'dout', to: 'PR1', tpp: 'bot', kind: 'data', cond: 'USB' });
  for (let k = 1; k <= 5; k++) cb({ id: 'WV' + k, from: 'PC1', fpp: 'dout', to: 'D' + k, tpp: 'bot', kind: 'data', cond: 'відео / мережа', assumed: true });

  /* ---------------------------------------------------------------------------
     14. ЛОГІЧНІ ЗВ'ЯЗКИ (керування)
     --------------------------------------------------------------------------- */
  ll('QF2', 'SB4', ['W21'], '');
  ll('SB4', 'G_AND1', ['W21', 'W22'], 'NC');
  ll('SB5', 'G_AND1', ['W22', 'W23'], 'NC');
  ll('SB6', 'G_AND1', ['W23', 'W24'], 'NC');
  ll('SA1', 'G_AND1', ['W24', 'W25'], 'ключ');
  ll('SQ2', 'G_AND1', ['W25', 'W26'], 'NC');
  ll('SQ3', 'G_AND1', ['W26', 'W27', 'W28'], 'NC');
  ll('SB1', 'G_OR1', ['W27', 'W29'], 'Пуск');
  ll('KM2', 'G_OR1', ['W28', 'W30'], 'самоутр.');
  ll('G_OR1', 'G_AND1', ['W29', 'W30'], '');
  ll('G_AND1', 'KM2', ['W29', 'W30'], 'котушка');
  ll('KM2', 'KT1', ['W31', 'W32'], 'канал 2');
  ll('KM2', 'KT2', ['W31', 'W33'], 'канал 2');
  ll('KT1', 'UZ1', ['W34', 'W47'], 'блоки живлення');
  ll('KT1', 'QF3', ['W34', 'W8'], '');
  ll('KT2', 'G_AND2', ['W35', 'W37'], 'дозвіл ≥10 с');
  ll('SB3', 'G_AND2', ['W37', 'W38', 'W39'], 'NC');
  ll('SB2', 'G_OR2', ['W38', 'W40'], 'Лінія старт');
  ll('KM3', 'G_OR2', ['W39', 'W41'], 'самоутр.');
  ll('G_OR2', 'G_AND2', ['W40', 'W41'], '');
  ll('G_AND2', 'KM3', ['W40', 'W41'], 'котушка');
  ll('G_AND2', 'K1', ['W42'], '');
  ll('K1', 'KM1', ['W43', 'W44'], 'котушка KM1');
  ll('KT2', 'HL3', ['W35', 'W45', 'W46'], 'KT2 ∧ ¬KM3');
  ll('KM3', 'HL3', ['W45', 'W46'], 'НЗ гасить');
  ll('KT2', 'HL2', ['W36', 'W52'], '¬KT2 (НЗ)');
  ll('KM1', 'HL1', ['W53', 'W55'], '');
  ll('KM1', 'SB1', ['W56'], 'підсвітка');
  ll('QF2', 'AK1', ['W57'], '');
  ll('BK1', 'AK1', ['W58'], 'T');
  ll('AK1', 'M1', ['W59', 'W70'], 'T > Tуст');
  ll('QF2', 'SQ1', ['W71'], '');
  ll('SQ1', 'EL1', ['W72'], 'двері відчинені');
  ll('QD1', 'QF2', ['W7', 'W20'], '1ф');
  ll('QF7', 'SC1', ['W17'], '');
  ['UZ2', 'UZ3', 'UZ4'].forEach((u, i) => ll('SC1', u, ['W17', 'W6' + (1 + i)], ''));
  for (let k = 1; k <= 4; k++) ll('PC1', 'KR' + k, ['W49', 'WX' + k], 'команди');

  return {
    meta: { title: 'Сортувальна лінія — інтерактивні схеми', version: 'чернетка 0.2', date: '2026-11-07' },
    kinds, phaseColors, locations, modes, elements, cables, logicLinks, groups, drivers, zoneX: ZONE_X, line: { x0: LINE_X0, x1: LINE_X1 },
  };
})();
