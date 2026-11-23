(() => {
  'use strict';

  const STORAGE_KEY = 'reset-restart-app-v1';
  const DAY_MS = 86400000;
  const CATEGORY_LABELS = {
    fruit: '水果',
    protein: '肉蛋 / 蛋白',
    drink: '饮品',
    snack: '零食 / 炸物',
    other: '其他'
  };
  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const DAILY_QUOTES = [
    '今天不需要完美，只需要不回头。',
    '你正在把选择权，一点点拿回来。',
    '最难的不是坚持，是重新开始后还愿意继续。',
    '每一次拒绝，都是在替未来的自己投票。',
    '别急着变好，先把今天过好。',
    '身体会记住你为它做的每一件小事。',
    '习惯会反复敲门，但你可以选择不开。',
    '你不是在忍，你是在选择。',
    '把注意力从欲望手里拿回来。',
    '今天稳住一次，明天就更容易一点。',
    '慢一点没关系，方向对就好。',
    '你不需要赢过所有人，只需要赢回自己。',
    '真正的自由，是不被旧习惯牵着走。',
    '让今天成为证据，而不是借口。',
    '你的坚持，正在变成新的默认设置。',
    '想放弃的时候，先撑过这三分钟。',
    '每一次好好吃饭，都是对身体的照顾。',
    '边界越清楚，生活越轻松。',
    '不碰，不是失去，是把位置留给更重要的东西。',
    '今天的克制，会变成明天的底气。',
    '你不是失败了，你只是还在路上。',
    '把小事做好，时间会给你答案。',
    '先照顾自己，再去照顾世界。',
    '今天能做的，就是把下一步走好。',
    '你正在成为那个说到做到的人。',
    '不用等有动力，先做对的事。',
    '继续，不是为了证明给谁看，是为了活得更像自己。',
    '偶尔想回到过去，不代表你必须回去。',
    '今天的选择，正在悄悄改变明天。',
    '所有的重启，都从这一刻开始。',
    '你不是在戒掉什么，你是在把生活拿回来。',
    '今天也请站在自己这一边。',
    '进步不一定轰轰烈烈，有时只是没有重蹈覆辙。',
    '你和更好的自己之间，只隔着今天这一次选择。',
    '把身体当成队友，而不是对手。',
  ];
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const MILESTONES = [
    { days: 1, label: '第一步已经迈出' },
    { days: 3, label: '身体开始适应' },
    { days: 7, label: '第一周完成' },
    { days: 14, label: '味觉与嗅觉改善' },
    { days: 30, label: '进入稳定期' },
    { days: 90, label: '新习惯正在形成' }
  ];

  let state = loadState();
  let currentTab = 'quit';
  let foodFilter = { zone: 'all' };
  let toastTimer = null;
  let sheetOpen = false;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function uid(prefix = 'id') {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function localDayNumber(date = new Date()) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function startOfToday() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function createDefaultState() {
    const now = new Date();
    const start = addDays(now, -12);
    start.setHours(21, 16, 0, 0);
    const checkins = [];
    for (let i = 6; i >= 1; i -= 1) {
      checkins.push(localDateKey(addDays(now, -i)));
    }

    return {
      version: 1,
      profile: { name: '' },
      habits: [
        {
          id: 'habit-smoke',
          name: '无烟生活',
          startAt: start.toISOString(),
          goalDays: 30,
          why: '想抽时，先离开座位 3 分钟',
          checkins,
          createdAt: now.toISOString()
        }
      ],
      foods: [
        { id: 'food-blueberry', zone: 'allowed', category: 'fruit', name: '蓝莓', note: '低糖 · 花青素' },
        { id: 'food-apple', zone: 'allowed', category: 'fruit', name: '苹果', note: '纤维 · 饱腹感' },
        { id: 'food-avocado', zone: 'allowed', category: 'fruit', name: '牛油果', note: '优质脂肪' },
        { id: 'food-salmon', zone: 'allowed', category: 'protein', name: '三文鱼', note: 'Omega-3' },
        { id: 'food-chicken', zone: 'allowed', category: 'protein', name: '鸡胸肉', note: '高蛋白' },
        { id: 'food-egg', zone: 'allowed', category: 'protein', name: '鸡蛋', note: '全营养' },
        { id: 'food-yogurt', zone: 'allowed', category: 'protein', name: '无糖酸奶', note: '益生菌' },
        { id: 'food-milk-tea', zone: 'forbidden', category: 'drink', name: '奶茶', note: '高糖 · 触发失控' },
        { id: 'food-fried-chicken', zone: 'forbidden', category: 'snack', name: '炸鸡', note: '油炸 · 高热量' },
        { id: 'food-alcohol', zone: 'forbidden', category: 'drink', name: '酒精', note: '影响睡眠与自控' },
        { id: 'food-sugary-drink', zone: 'forbidden', category: 'drink', name: '含糖饮料', note: '液体糖' },
        { id: 'food-processed-meat', zone: 'forbidden', category: 'snack', name: '加工肉', note: '高钠 · 少加工优先' },
        { id: 'food-night-snack', zone: 'forbidden', category: 'snack', name: '夜宵', note: '21:00 后不进食' }
      ],
      strictMode: true,
      quoteDate: localDateKey(),
      quoteOffset: 0,
      swaps: [
        { id: 'swap-sweet', trigger: '想喝甜的', replacement: '无糖气泡水 + 柠檬' },
        { id: 'swap-fried', trigger: '想吃炸的', replacement: '空气炸鸡胸 + 辣椒粉' },
        { id: 'swap-night', trigger: '想吃夜宵', replacement: '无糖酸奶 + 蓝莓' }
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  function normalizeState(input) {
    if (!input || typeof input !== 'object') return createDefaultState();
    const fallback = createDefaultState();
    const habits = Array.isArray(input.habits) ? input.habits.filter(Boolean).map((habit, index) => ({
      id: String(habit.id || uid('habit')),
      name: String(habit.name || `戒断 ${index + 1}`),
      startAt: isValidDate(habit.startAt) ? new Date(habit.startAt).toISOString() : new Date().toISOString(),
      goalDays: Math.max(1, Number(habit.goalDays) || 30),
      why: String(habit.why || ''),
      checkins: Array.isArray(habit.checkins) ? [...new Set(habit.checkins.filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(String(item))))] : [],
      createdAt: isValidDate(habit.createdAt) ? new Date(habit.createdAt).toISOString() : new Date().toISOString()
    })) : [];

    const foods = Array.isArray(input.foods) ? input.foods.filter(Boolean).map((food) => ({
      id: String(food.id || uid('food')),
      zone: food.zone === 'forbidden' ? 'forbidden' : 'allowed',
      category: CATEGORY_LABELS[food.category] ? food.category : 'other',
      name: String(food.name || '未命名食物'),
      note: String(food.note || '')
    })) : [];

    const swaps = Array.isArray(input.swaps) && input.swaps.length ? input.swaps.map((swap) => ({
      id: String(swap.id || uid('swap')),
      trigger: String(swap.trigger || ''),
      replacement: String(swap.replacement || '')
    })) : fallback.swaps;

    return {
      version: 1,
      profile: { name: String(input.profile?.name || '') },
      habits,
      foods,
      strictMode: input.strictMode !== false,
      quoteDate: /^\d{4}-\d{2}-\d{2}$/.test(String(input.quoteDate || '')) ? input.quoteDate : localDateKey(),
      quoteOffset: Math.max(0, Number(input.quoteOffset) || 0) % DAILY_QUOTES.length,
      swaps,
      createdAt: isValidDate(input.createdAt) ? new Date(input.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: isValidDate(input.updatedAt) ? new Date(input.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  function createEmptyState(keepProfile = true) {
    return {
      version: 1,
      profile: { name: keepProfile ? state.profile.name : '' },
      habits: [],
      foods: [],
      strictMode: true,
      quoteDate: localDateKey(),
      quoteOffset: 0,
      swaps: [
        { id: 'swap-sweet', trigger: '想喝甜的', replacement: '无糖气泡水 + 柠檬' },
        { id: 'swap-fried', trigger: '想吃炸的', replacement: '空气炸鸡胸 + 辣椒粉' },
        { id: 'swap-night', trigger: '想吃夜宵', replacement: '无糖酸奶 + 蓝莓' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function isValidDate(value) {
    return value && !Number.isNaN(new Date(value).getTime());
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn('Could not load saved state:', error);
      return createDefaultState();
    }
  }

  function saveState(message) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (message) showToast(message);
    } catch (error) {
      console.warn('Could not save state:', error);
      showToast('保存失败，请检查浏览器存储空间');
    }
  }

  function daysSince(startAt) {
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) return 0;
    return Math.max(0, localDayNumber(new Date()) - localDayNumber(start));
  }

  function elapsedParts(startAt) {
    const start = new Date(startAt);
    const total = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60
    };
  }

  function timerString(startAt) {
    const p = elapsedParts(startAt);
    return `${p.days} 天 ${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
  }

  function clockString(startAt) {
    const p = elapsedParts(startAt);
    return `${pad(p.hours)} 小时 ${pad(p.minutes)} 分 ${pad(p.seconds)} 秒`;
  }

  function checkedToday(habit) {
    return habit.checkins.includes(localDateKey());
  }

  function checkinStreak(habit) {
    if (!habit) return 0;
    const set = new Set(habit.checkins);
    let date = startOfToday();
    if (!set.has(localDateKey(date))) date = addDays(date, -1);
    let count = 0;
    while (set.has(localDateKey(date)) && count < 3650) {
      count += 1;
      date = addDays(date, -1);
    }
    return count;
  }

  function weekCheckins(habit) {
    const set = new Set(habit?.checkins || []);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(startOfToday(), index - 6);
      return {
        date,
        key: localDateKey(date),
        checked: set.has(localDateKey(date)),
        today: index === 6
      };
    });
  }

  function aggregateWeek(habits) {
    const dates = Array.from({ length: 7 }, (_, index) => addDays(startOfToday(), index - 6));
    return dates.map((date, index) => {
      const key = localDateKey(date);
      const count = habits.filter((habit) => habit.checkins.includes(key)).length;
      return {
        date,
        key,
        count,
        percent: habits.length ? Math.round((count / habits.length) * 100) : 0,
        today: index === 6
      };
    });
  }

  function renderDailyMotivation() {
    const target = $('#daily-motivation');
    if (!target) return;
    const today = localDateKey();
    if (state.quoteDate !== today) {
      state.quoteDate = today;
      state.quoteOffset = 0;
    }
    const primary = state.habits[0];
    const days = primary ? daysSince(primary.startAt) : 0;
    const quote = DAILY_QUOTES[(Math.abs(localDayNumber()) + state.quoteOffset) % DAILY_QUOTES.length];
    target.innerHTML = `
      <article class="motivation-card">
        <div class="motivation-top"><span>今日一句 / DAILY NOTE</span><small>${primary ? `DAY ${days} · 今天` : '新的一天'}</small></div>
        <div class="motivation-mark">“</div>
        <blockquote>${escapeHTML(quote)}</blockquote>
        <div class="motivation-foot">
          <span>${primary ? '把今天走好，就够了。' : '从想改变的那一刻开始。'}</span>
          <button type="button" data-action="next-quote">换一句 ↻</button>
        </div>
      </article>`;
  }

  function nextMilestone(days) {
    return MILESTONES.find((milestone) => milestone.days > days) || { days: Math.max(90, days + 30), label: '继续保持' };
  }

  function percent(value, total) {
    return Math.min(100, Math.max(0, Math.round((value / Math.max(1, total)) * 100)));
  }

  function formatStart(iso) {
    const date = new Date(iso);
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  }

  function toDateTimeLocal(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function renderQuitPage() {
    const habits = state.habits;
    const today = localDateKey();
    const totalCheckins = habits.reduce((sum, habit) => sum + habit.checkins.filter((item) => {
      const date = new Date(`${item}T00:00:00`);
      return localDayNumber(date) >= localDayNumber(addDays(new Date(), -6));
    }).length, 0);
    const longest = habits.reduce((max, habit) => Math.max(max, daysSince(habit.startAt)), 0);
    $('#quit-summary').innerHTML = `
      <div class="summary-cell"><strong>${habits.length}</strong><span>戒断项目</span></div>
      <div class="summary-cell"><strong>${totalCheckins}</strong><span>本周打卡</span></div>
      <div class="summary-cell"><strong>${longest}<small>天</small></strong><span>最长坚持</span></div>`;

    if (!habits.length) {
      $('#habit-list').innerHTML = '<div class="empty-list">还没有戒断项目。<br>先写下一个你现在最想停止的习惯。</div>';
    } else {
      $('#habit-list').innerHTML = habits.map((habit, index) => {
        const days = daysSince(habit.startAt);
        const goal = percent(days, habit.goalDays);
        const done = habit.checkins.includes(today);
        const dark = index === 0 ? 'active-dark' : '';
        return `
          <article class="habit-card ${dark}">
            <div class="habit-card-top">
              <div><h3>${escapeHTML(habit.name)}</h3><p>开始于 ${formatStart(habit.startAt)} · 目标 ${habit.goalDays} 天</p></div>
              <button class="icon-glass" type="button" data-action="edit-habit" data-id="${escapeHTML(habit.id)}" aria-label="编辑 ${escapeHTML(habit.name)}">···</button>
            </div>
            <div class="habit-card-body">
              <div>
                <div class="habit-big-days"><strong data-day-start="${escapeHTML(habit.startAt)}">${days}</strong><span>天</span></div>
                <div class="habit-timer" data-timer-full="${escapeHTML(habit.startAt)}">${timerString(habit.startAt)}</div>
              </div>
              <div class="habit-progress-ring" style="--progress:${goal}">
                <div class="habit-ring-copy"><strong>${goal}%</strong><span>目标 ${habit.goalDays} 天</span></div>
              </div>
            </div>
            ${habit.why ? `<div class="habit-why">${escapeHTML(habit.why)}</div>` : ''}
            <div class="habit-actions">
              <button class="habit-checkin ${done ? 'done' : ''}" type="button" data-action="checkin" data-id="${escapeHTML(habit.id)}">${done ? '今日已记录 ✓' : '完成今日记录'}</button>
              <button class="habit-edit" type="button" data-action="edit-habit" data-id="${escapeHTML(habit.id)}" aria-label="管理">⋯</button>
            </div>
          </article>`;
      }).join('');
    }

    const week = aggregateWeek(habits);
    const slots = habits.length * 7;
    const checks = week.reduce((sum, day) => sum + day.count, 0);
    const weekRate = slots ? Math.round((checks / slots) * 100) : 0;
    const first = week[0].date;
    const last = week[6].date;
    $('#week-range').textContent = `${first.getMonth() + 1}.${first.getDate()}—${last.getMonth() + 1}.${last.getDate()}`;

    if (!habits.length) {
      $('#week-stage-chart').innerHTML = '<div class="stats-empty">有戒断项目后，这里会显示本周每天完成的阶段统计。</div>';
      $('#habit-stats-table').innerHTML = '<div class="stats-empty">坚持统计表会按项目显示本周、累计、连续与阶段数据。</div>';
      return;
    }

    $('#week-stage-chart').innerHTML = `
      <article class="week-stage-card">
        <div class="week-stage-head">
          <div><small>WEEKLY COMPLETION</small><strong>${weekRate}<em>%</em></strong></div>
          <span class="week-stage-badge">${checks} / ${slots} 次打卡</span>
        </div>
        <div class="week-bars">
          ${week.map((day) => `
            <div class="week-bar-col ${day.percent === 100 ? 'full' : ''} ${day.today ? 'today' : ''}">
              <div class="week-bar-track"><div class="week-bar-fill" style="--bar:${Math.max(4, day.percent)}%"></div></div>
              <span>${WEEKDAYS[day.date.getDay()].replace('周', '')}</span>
            </div>`).join('')}
        </div>
        <div class="week-stage-foot"><span>本周阶段完成率</span><strong>${weekRate >= 80 ? '状态很稳，继续保持' : weekRate >= 50 ? '正在建立节奏' : '从今天补上一次记录'}</strong></div>
      </article>`;

    $('#habit-stats-table').innerHTML = `
      <article class="habit-stats-card">
        <div class="habit-stats-title"><span>坚持统计表</span><span>PERSISTENCE</span></div>
        <div class="habit-stats-scroll">
          <table class="habit-stats-table">
            <thead><tr><th>项目</th><th>本周</th><th>累计</th><th>连续</th><th>阶段</th></tr></thead>
            <tbody>
              ${habits.map((habit) => {
                const weekCount = week.reduce((sum, day) => sum + (habit.checkins.includes(day.key) ? 1 : 0), 0);
                const days = daysSince(habit.startAt);
                return `<tr>
                  <td>${escapeHTML(habit.name)}</td>
                  <td><strong>${weekCount}/7</strong></td>
                  <td>${habit.checkins.length}</td>
                  <td class="accent-data">${checkinStreak(habit)}天</td>
                  <td>${days}/${habit.goalDays}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </article>`;
    renderDailyMotivation();
  }

  function renderFoodPage() {
    const allowed = state.foods.filter((food) => food.zone === 'allowed');
    const forbidden = state.foods.filter((food) => food.zone === 'forbidden');
    const total = state.foods.length;
    const greenPercent = total ? Math.round((allowed.length / total) * 100) : 50;
    $('#food-summary').innerHTML = `
      <article class="food-orbit-card">
        <div class="food-orbit-chart" style="--green:${greenPercent}%">
          <div class="food-orbit-inner"><strong>${total}</strong><span>FOOD RULES</span></div>
        </div>
        <div class="food-orbit-copy">
          <small>YOUR FOOD MAP</small>
          <h3>${allowed.length} 个放心吃，<br>${forbidden.length} 个坚决不碰</h3>
          <p>绿色越多，选择越轻松。把边界画清楚，身体会更自由。</p>
          <div class="orbit-legend"><span><i class="green"></i>绿灯 ${allowed.length}</span><span><i class="red"></i>红灯 ${forbidden.length}</span></div>
        </div>
      </article>`;

    const strictToggle = $('#strict-toggle');
    strictToggle.checked = state.strictMode;
    $('.strict-banner small').textContent = state.strictMode ? '红灯规则会一直显示在首页' : '首页仍显示边界，但不再强调提醒';
    $('.strict-banner strong').textContent = state.strictMode ? '严格模式' : '普通模式';

    $$('#zone-filter button').forEach((button) => {
      const active = button.dataset.zoneFilter === foodFilter.zone;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });

    const zones = foodFilter.zone === 'all' ? ['allowed', 'forbidden'] : [foodFilter.zone];
    $('#food-list').innerHTML = zones.map((zone) => {
      const zoneFoods = state.foods.filter((food) => food.zone === zone);
      const forbiddenZone = zone === 'forbidden';
      const categories = Object.keys(CATEGORY_LABELS).filter((category) => zoneFoods.some((food) => food.category === category));
      const clusters = categories.map((category) => {
        const items = zoneFoods.filter((food) => food.category === category);
        return `
          <article class="food-cluster ${forbiddenZone ? 'forbidden' : ''}">
            <div class="food-cluster-head">
              <div><span class="food-cluster-label">${forbiddenZone ? 'RED ZONE' : 'GREEN ZONE'}</span><h4>${CATEGORY_LABELS[category]}</h4></div>
              <div class="cluster-actions">
                <span class="cluster-count">${items.length}</span>
                <button class="cluster-add" type="button" data-action="add-food" data-zone="${zone}" data-category="${category}" aria-label="添加到${CATEGORY_LABELS[category]}">＋</button>
              </div>
            </div>
            <div class="bubble-grid">
              ${items.map((food) => `
                <button class="food-bubble" type="button" data-action="edit-food" data-id="${escapeHTML(food.id)}" aria-label="编辑 ${escapeHTML(food.name)}">
                  <span class="bubble-kicker">${forbiddenZone ? 'NO' : 'YES'}</span>
                  <strong>${escapeHTML(food.name)}</strong>
                  <small>${escapeHTML(food.note || CATEGORY_LABELS[category])}</small>
                </button>`).join('')}
            </div>
          </article>`;
      }).join('');
      return `
        <section class="zone-section">
          <div class="zone-section-head">
            <div class="zone-section-title">
              <i class="${forbiddenZone ? 'red' : 'green'}"></i>
              <div><strong>${forbiddenZone ? '红灯区 · 坚决不碰' : '绿灯区 · 放心吃'}</strong><small>${forbiddenZone ? '明确边界，减少触发' : '优先选择，照顾身体'}</small></div>
            </div>
            <span class="zone-section-count">${zoneFoods.length} 项</span>
          </div>
          <div class="food-cluster-grid">
            ${clusters || `<div class="zone-empty">${forbiddenZone ? '还没有红灯规则。' : '还没有绿灯食物。'}<br>点下方按钮添加第一条。</div>`}
          </div>
        </section>`;
    }).join('');
  }


  function renderAll() {
    renderQuitPage();
    renderFoodPage();
    updateLiveTimers();
  }

  function updateLiveTimers() {
    $$('[data-timer]').forEach((element) => {
      const startAt = element.getAttribute('data-timer');
      if (startAt) element.textContent = clockString(startAt);
    });
    $$('[data-timer-full]').forEach((element) => {
      const startAt = element.getAttribute('data-timer-full');
      if (startAt) element.textContent = timerString(startAt);
    });
    $$('[data-day-start]').forEach((element) => {
      const startAt = element.getAttribute('data-day-start');
      if (startAt) element.textContent = String(daysSince(startAt));
    });
  }

  function setTab(tab, options = {}) {
    const allowedTabs = ['quit', 'food'];
    if (!allowedTabs.includes(tab)) tab = 'quit';
    currentTab = tab;
    $$('.page').forEach((page) => page.classList.toggle('is-active', page.dataset.page === tab));
    $$('.tab').forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const shell = $('#app-shell');
      if (shell && shell.scrollTop) shell.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function showToast(message) {
    $('#toast-text').textContent = message;
    const toast = $('#toast');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function openSheet(html) {
    $('#sheet-content').innerHTML = html;
    const backdrop = $('#sheet-backdrop');
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sheet-open');
    sheetOpen = true;
    setTimeout(() => {
      const firstInput = $('#sheet-content input, #sheet-content select, #sheet-content textarea');
      if (firstInput) firstInput.focus({ preventScroll: true });
    }, 340);
  }

  function closeSheet() {
    const backdrop = $('#sheet-backdrop');
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sheet-open');
    sheetOpen = false;
    setTimeout(() => {
      if (!sheetOpen) $('#sheet-content').innerHTML = '';
    }, 360);
  }

  function openHabitForm(id = null) {
    const habit = state.habits.find((item) => item.id === id);
    const editing = Boolean(habit);
    const startValue = toDateTimeLocal(habit?.startAt || new Date().toISOString());
    const selectedGoal = habit?.goalDays || 30;
    openSheet(`
      <div class="sheet-head">
        <div><h2 id="sheet-title">${editing ? '编辑戒断' : '新建戒断'}</h2><p>${editing ? '调整项目，或从今天重新开始。' : '把想停下来的事情写清楚，计时从你决定的这一刻开始。'}</p></div>
        <button class="sheet-close" type="button" data-close-sheet aria-label="关闭">×</button>
      </div>
      <form class="sheet-form" id="habit-form">
        <div class="form-grid">
          <div class="form-field full">
            <label for="habit-name">我要戒掉</label>
            <input id="habit-name" name="name" maxlength="24" required autocomplete="off" placeholder="例如：熬夜刷手机" value="${escapeHTML(habit?.name || '')}" />
          </div>
          <div class="form-field full">
            <label for="habit-start">开始时间</label>
            <input id="habit-start" name="startAt" type="datetime-local" required value="${escapeHTML(startValue)}" />
            <span class="field-hint">如果中途重新开始，把这里改成重新决定的那一刻。</span>
          </div>
          <div class="form-field">
            <label for="habit-goal">阶段目标</label>
            <select id="habit-goal" name="goalDays">
              ${[7, 14, 30, 90, 180].map((days) => `<option value="${days}" ${selectedGoal === days ? 'selected' : ''}>${days} 天</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label for="habit-why">一句话提醒</label>
            <input id="habit-why" name="why" maxlength="40" autocomplete="off" placeholder="想放弃时看这句话" value="${escapeHTML(habit?.why || '')}" />
          </div>
        </div>
        <div class="sheet-actions">
          <button class="button-secondary" type="button" data-close-sheet>取消</button>
          <button class="button-primary accent" type="submit">${editing ? '保存修改' : '开始戒断'} ↗</button>
        </div>
        ${editing ? `
          <div class="sheet-subactions">
            <button type="button" data-action="restart-habit" data-id="${escapeHTML(habit.id)}">今天重新开始</button>
            <button class="danger" type="button" data-action="delete-habit" data-id="${escapeHTML(habit.id)}">删除项目</button>
          </div>` : ''}
      </form>`);

    $('#habit-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get('name') || '').trim();
      const startAt = new Date(String(formData.get('startAt')));
      const goalDays = Math.max(1, Number(formData.get('goalDays')) || 30);
      const why = String(formData.get('why') || '').trim();
      if (!name || Number.isNaN(startAt.getTime())) {
        showToast('请把项目名称和开始时间填写完整');
        return;
      }
      if (editing) {
        habit.name = name;
        habit.startAt = startAt.toISOString();
        habit.goalDays = goalDays;
        habit.why = why;
      } else {
        state.habits.unshift({
          id: uid('habit'),
          name,
          startAt: startAt.toISOString(),
          goalDays,
          why,
          checkins: [],
          createdAt: new Date().toISOString()
        });
      }
      saveState(editing ? '戒断项目已更新' : '新的戒断已经开始');
      renderAll();
      closeSheet();
    });
  }

  function openFoodForm(id = null, presetZone = 'allowed', presetCategory = '') {
    const food = state.foods.find((item) => item.id === id);
    const editing = Boolean(food);
    const zone = food?.zone || (presetZone === 'forbidden' ? 'forbidden' : 'allowed');
    const category = food?.category || (CATEGORY_LABELS[presetCategory] ? presetCategory : (zone === 'allowed' ? 'fruit' : 'drink'));
    openSheet(`
      <div class="sheet-head">
        <div><h2 id="sheet-title">${editing ? '编辑食物规则' : '添加食物规则'}</h2><p>写清楚吃或不吃，下一次选择会更快。</p></div>
        <button class="sheet-close" type="button" data-close-sheet aria-label="关闭">×</button>
      </div>
      <form class="sheet-form" id="food-form">
        <div class="form-grid">
          <div class="form-field full">
            <label for="food-name">食物名称</label>
            <input id="food-name" name="name" maxlength="20" required autocomplete="off" placeholder="例如：苹果 / 奶茶" value="${escapeHTML(food?.name || '')}" />
          </div>
          <div class="form-field">
            <label for="food-zone">区域</label>
            <select id="food-zone" name="zone">
              <option value="allowed" ${zone === 'allowed' ? 'selected' : ''}>绿灯 · 放心吃</option>
              <option value="forbidden" ${zone === 'forbidden' ? 'selected' : ''}>红灯 · 坚决不碰</option>
            </select>
          </div>
          <div class="form-field">
            <label for="food-category">类型</label>
            <select id="food-category" name="category">
              ${Object.entries(CATEGORY_LABELS).map(([value, label]) => `<option value="${value}" ${category === value ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
          </div>
          <div class="form-field full">
            <label for="food-note">备注</label>
            <input id="food-note" name="note" maxlength="32" autocomplete="off" placeholder="例如：低糖 / 每天一拳 / 会触发失控" value="${escapeHTML(food?.note || '')}" />
          </div>
        </div>
        <div class="sheet-actions">
          <button class="button-secondary" type="button" data-close-sheet>取消</button>
          <button class="button-primary accent" type="submit">${editing ? '保存修改' : '加入清单'} ↗</button>
        </div>
        ${editing ? `<div class="sheet-subactions"><button class="danger" type="button" data-action="delete-food" data-id="${escapeHTML(food.id)}">删除这条规则</button></div>` : ''}
      </form>`);

    $('#food-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get('name') || '').trim();
      const nextZone = String(formData.get('zone')) === 'forbidden' ? 'forbidden' : 'allowed';
      const nextCategory = CATEGORY_LABELS[String(formData.get('category'))] ? String(formData.get('category')) : 'other';
      const note = String(formData.get('note') || '').trim();
      if (!name) {
        showToast('请填写食物名称');
        return;
      }
      if (editing) {
        food.name = name;
        food.zone = nextZone;
        food.category = nextCategory;
        food.note = note;
      } else {
        state.foods.unshift({
          id: uid('food'),
          name,
          zone: nextZone,
          category: nextCategory,
          note
        });
      }
      saveState(editing ? '食物规则已更新' : name + ' 已加入清单');
      renderAll();
      closeSheet();
    });
  }

  function deleteHabit(id) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    if (!window.confirm(`确定删除「${habit.name}」吗？相关计时和打卡记录会一起删除。`)) return;
    state.habits = state.habits.filter((item) => item.id !== id);
    saveState('戒断项目已删除');
    renderAll();
    closeSheet();
  }

  function restartHabit(id) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    if (!window.confirm(`要把「${habit.name}」的计时从今天重新开始吗？计时会归零，旧打卡会清空。`)) return;
    habit.startAt = new Date().toISOString();
    habit.checkins = [];
    saveState('已从今天重新开始');
    renderAll();
    closeSheet();
  }

  function deleteFood(id) {
    const food = state.foods.find((item) => item.id === id);
    if (!food) return;
    if (!window.confirm(`确定删除「${food.name}」这条规则吗？`)) return;
    state.foods = state.foods.filter((item) => item.id !== id);
    saveState('食物规则已删除');
    renderAll();
    closeSheet();
  }

  function checkinHabit(id) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    const today = localDateKey();
    if (habit.checkins.includes(today)) {
      showToast('今天已经记录过了');
      return;
    }
    habit.checkins.push(today);
    habit.checkins = [...new Set(habit.checkins)].sort();
    saveState('好，今天也把自己接住了。');
    renderAll();
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const tabButton = event.target.closest('[data-tab]');
      if (tabButton) {
        setTab(tabButton.dataset.tab);
        return;
      }

      const closeButton = event.target.closest('[data-close-sheet]');
      if (closeButton) {
        closeSheet();
        return;
      }

      const zoneFilter = event.target.closest('[data-zone-filter]');
      if (zoneFilter) {
        foodFilter.zone = zoneFilter.dataset.zoneFilter;
        renderFoodPage();
        return;
      }

      const actionTarget = event.target.closest('[data-action]');
      if (!actionTarget) return;
      const action = actionTarget.dataset.action;
      const id = actionTarget.dataset.id;

      if (action === 'add-habit') openHabitForm();
      if (action === 'edit-habit') openHabitForm(id);
      if (action === 'checkin') checkinHabit(id);
      if (action === 'delete-habit') deleteHabit(id);
      if (action === 'restart-habit') restartHabit(id);
      if (action === 'add-food') openFoodForm(null, actionTarget.dataset.zone || 'allowed', actionTarget.dataset.category || '');
      if (action === 'edit-food') openFoodForm(id);
      if (action === 'delete-food') deleteFood(id);
      if (action === 'next-quote') {
        state.quoteDate = localDateKey();
        state.quoteOffset = (state.quoteOffset + 1) % DAILY_QUOTES.length;
        saveState();
        renderDailyMotivation();
      }
    });

    $('#sheet-backdrop').addEventListener('click', (event) => {
      if (event.target === $('#sheet-backdrop')) closeSheet();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && sheetOpen) closeSheet();
    });

    $('#strict-toggle').addEventListener('change', (event) => {
      state.strictMode = event.target.checked;
      saveState(state.strictMode ? '严格模式已开启' : '严格模式已关闭');
      renderFoodPage();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) renderAll();
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  }

  function init() {
    bindEvents();
    renderAll();
    setTab('quit', { scroll: false });
    setInterval(updateLiveTimers, 1000);
    registerServiceWorker();
  }

  init();
})();
