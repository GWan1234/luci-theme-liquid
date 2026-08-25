'use strict';

/* Liquid glass theme — light / dark / auto mode switch.
 *
 * The switch is injected right before the native LuCI refresh / poll
 * indicator area (#indicators) in the top bar. On the lock screen
 * (sysauth, which has no top bar) it is rendered as a fixed button in
 * the top right corner instead.
 *
 * Modes are persisted in localStorage under "liquid-theme-mode" and the
 * effective dark state is reflected on <html data-darkmode="true|false">.
 */

(function () {
	if (typeof L == 'undefined' || typeof L.media != 'function')
		return;

	var MODE_KEY = 'liquid-theme-mode';

	/* 主题配置写入 uci /etc/config/liquid（换客户端仍保留）：
	   - 用 LuCI 官方 uci 实例（uci.load + uci.set + uci.save），
	     跨 luci 版本最兼容（L.bind 手拼 RPC 在其他固件上不可靠）；
	     uci.save 直接写盘，不经过 ui.changes → 无待应用项、
	     不弹"保存更改"询问，改动立即生效
	   - 锁屏（登录页，未认证）不允许修改配置：只做本地预览
	     （localStorage），登录后刷新才真正持久化 */
	/* 一次 POST 全部 option（对象 {option: value}），后端一次写盘，
	   避免多次请求并发时后写覆盖先写（accent 与 accent_custom 一起存） */
	function saveConfig(opts) {
		if (!document.body ||
		    document.body.classList.contains('liquid-login'))
			return;
		/* 用主题自己的 ucode controller 保存（仿 luci-app-pushbot）：
		   XHR POST 到 /cgi-bin/luci/admin/system/liquid/save_config，
		   后端直接写 /etc/config/liquid，绕开跨版本不可靠的 uci rpc */
		try {
			var base = (window.L && L.env && L.env.admin_path)
				? L.env.admin_path : '/cgi-bin/luci/admin/';
			var xhr = new XMLHttpRequest();
			xhr.open('POST', base + 'system/liquid/save_config');
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send(JSON.stringify(opts));
		} catch (e) {}
	}
	var mql = (typeof window.matchMedia == 'function')
		? window.matchMedia('(prefers-color-scheme: dark)')
		: null;

	var MODES = [
		{ id: 'light', icon: 'sun.svg',       title: 'Light mode' },
		{ id: 'dark',  icon: 'moon.svg',      title: 'Dark mode'  },
		{ id: 'auto',  icon: 'auto.svg',      title: 'Follow system' }
	];

	var ACCENTS = [
		{ id: 'blue',    color: '#2f7fe0', title: 'Blue'       },
		{ id: 'magenta', color: '#d63384', title: 'Magenta'     },
		{ id: 'amber',   color: '#e8940f', title: 'Amber'       },
		{ id: 'purple',  color: '#8e44ad', title: 'Tulip purple' },
		{ id: 'lime',    color: '#7fb52a', title: 'Yellow-green' }
	];

	var DEFAULT_ACCENT = '#2f7fe0';

	/* 自定义主题色工具：hex 校验/规范化 + 由单个主色派生全套 accent 变量 */
	function normalizeHex(v) {
		v = String(v || '').trim().replace(/^#/, '');
		if (/^[0-9a-fA-F]{3}$/.test(v))
			v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
		return /^[0-9a-fA-F]{6}$/.test(v) ? '#' + v.toLowerCase() : null;
	}

	function hexToRgb(hex) {
		var n = parseInt(hex.slice(1), 16);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
	}

	function shade(rgb, pct) {
		var c = function (v) {
			v = Math.round(pct > 0 ? v + (255 - v) * pct : v * (1 + pct));
			return Math.max(0, Math.min(255, v));
		};
		return 'rgb(' + c(rgb.r) + ',' + c(rgb.g) + ',' + c(rgb.b) + ')';
	}

	function rgba(rgb, a) {
		return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
	}

	/* 在 <html> 上生成自定义色全套变量（亮/暗两套） */
	function applyCustomAccent(hex) {
		hex = normalizeHex(hex) || DEFAULT_ACCENT;
		var rgb = hexToRgb(hex);
		var root = document.documentElement;
		root.style.setProperty('--accent-custom', hex);
		root.style.setProperty('--accent-custom-medium', shade(rgb, -0.15));
		root.style.setProperty('--accent-custom-low', shade(rgb, -0.32));
		root.style.setProperty('--accent-custom-glow', rgba(rgb, 0.38));
		root.style.setProperty('--accent-custom-grad', 'linear-gradient(135deg, ' + shade(rgb, 0.25) + ' 0%, ' + hex + ' 48%, ' + shade(rgb, -0.4) + ' 100%)');
		root.style.setProperty('--accent-custom-glass', 'linear-gradient(135deg, ' + rgba(rgb, 0.3) + ', rgba(255,255,255,0.62))');
		root.style.setProperty('--accent-custom-glass-soft', 'linear-gradient(135deg, ' + rgba(rgb, 0.24) + ', rgba(255,255,255,0.72))');
		root.style.setProperty('--accent-custom-dark-high', shade(rgb, 0.3));
		root.style.setProperty('--accent-custom-dark-medium', shade(rgb, 0.12));
		root.style.setProperty('--accent-custom-dark-low', hex);
		root.style.setProperty('--accent-custom-dark-glow', rgba(rgb, 0.42));
		root.style.setProperty('--accent-custom-dark-grad', 'linear-gradient(135deg, ' + shade(rgb, 0.5) + ' 0%, ' + shade(rgb, 0.3) + ' 48%, ' + shade(rgb, 0.12) + ' 100%)');
		root.style.setProperty('--accent-custom-dark-glass', 'linear-gradient(135deg, ' + rgba(rgb, 0.28) + ', rgba(46,58,84,0.45))');
		root.style.setProperty('--accent-custom-dark-glass-soft', 'linear-gradient(135deg, ' + rgba(rgb, 0.22) + ', rgba(46,58,84,0.4))');
	}

	function getMode() {
		var d = document.body ? document.body.getAttribute('data-liquid-mode') : null;
		if (d)
			return d;
		try { return localStorage.getItem(MODE_KEY) || 'auto'; } catch (e) { return 'auto'; }
	}

	function setMode(mode) {
		try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
		if (document.body)
			document.body.setAttribute('data-liquid-mode', mode);
		applyMode(mode);
		updateSwitch();
		saveConfig({ mode: mode });
	}

	function isDark(mode) {
		return (mode == 'dark') || ((mode == 'auto') && mql && mql.matches);
	}

	function applyMode(mode) {
		var root = document.documentElement;
		root.setAttribute('data-darkmode', isDark(mode) ? 'true' : 'false');
		root.setAttribute('data-liquid-mode', mode);
	}

	/* 明暗模式守护：OpenClash 等第三方脚本会覆写 <html data-darkmode>
	   （其 ocApplyRootTheme 按背景亮度判定后直接 setAttribute，且默认
	   oc-theme=auto），导致一进入 OpenClash 页面主题就被强制切成暗黑。
	   这里用 MutationObserver 监视该属性，任何与主题有效模式不符的外部
	   写入都被立即还原，并顺带同步 meta[name=color-scheme]——主题的
	   明暗由主题自身决定，不受第三方反控制。 */
	var _liquidGuardSelf = false;
	function guardDarkmode() {
		var root = document.documentElement;
		if (root.getAttribute('data-liquid-guard'))
			return;
		root.setAttribute('data-liquid-guard', '1');
		if (typeof MutationObserver == 'undefined')
			return;
		/* 还原逻辑：把 data-darkmode / color-scheme 拉回主题有效模式 */
		function enforce() {
			var want = isDark(getMode()) ? 'true' : 'false';
			if (root.getAttribute('data-darkmode') !== want) {
				_liquidGuardSelf = true;
				root.setAttribute('data-darkmode', want);
				_liquidGuardSelf = false;
			}
			var m = document.querySelector('meta[name="color-scheme"]');
			if (m && m.content !== (want == 'true' ? 'dark' : 'light'))
				m.content = (want == 'true' ? 'dark' : 'light');
			syncThemeColor();
		}
		var obs = new MutationObserver(function () {
			if (_liquidGuardSelf)
				return;
			enforce();
		});
		obs.observe(root, { attributes: true, attributeFilter: ['data-darkmode'] });
		/* 关键：安装监视器时立即校正一次当前状态。OpenClash 的 common.js
		   常在 main.js（footer 加载）之前执行，auto 模式下按 body 背景
		   亮度误判成 dark 并已写入 data-darkmode；若只监视后续变化，
		   从 main.js 加载到 OpenClash 下次重算之间页面会一直保持暗黑，
		   形成"进 OpenClash 先闪暗再纠正"的窗口。footer 脚本在首帧绘制
		   前执行，此刻校正可在用户看到任何暗色之前完成还原。 */
		enforce();
	}

	/* 浏览器工具栏配色（meta theme-color）：取底部 foot 玻璃横幅（p.luci）
	   的真实渲染色，移动端浏览器工具栏才能与页面上下玻璃栏融为一体。
	   foot = --glass-bg-strong 半透明玻璃叠在 body 底色 --background-color-medium
	   上；theme-color 要不透明值，用 1x1 canvas 做真实叠加合成（canvas
	   原生解析 CSS 色值并完成 alpha 混合），随明暗/配色变量自动跟随，
	   不硬编码色值。顶栏 #menubar 与 foot 同为 --glass-bg-strong，
	   故该色同时贴合顶部地址栏区域。 */
	function syncThemeColor() {
		var meta = document.querySelector('meta[name="theme-color"]');
		if (!meta)
			return;
		try {
			var cs = getComputedStyle(document.documentElement);
			var bg = (cs.getPropertyValue('--background-color-medium') || '').trim();
			var glass = (cs.getPropertyValue('--glass-bg-strong') || '').trim();
			if (!bg || !glass)
				return;
			var c = document.createElement('canvas');
			c.width = 1;
			c.height = 1;
			var ctx = c.getContext('2d');
			if (!ctx)
				return;
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, 1, 1);
			ctx.fillStyle = glass;
			ctx.fillRect(0, 0, 1, 1);
			var d = ctx.getImageData(0, 0, 1, 1).data;
			var hex = '#';
			for (var i = 0; i < 3; i++)
				hex += ('0' + d[i].toString(16)).slice(-2);
			if (meta.content !== hex)
				meta.content = hex;
		} catch (e) {}
	}

	function updateSwitch() {
		var mode = getMode();
		[].forEach.call(document.querySelectorAll('.liquid-mode-btn'), function (b) {
			b.classList.toggle('active', b.getAttribute('data-mode') == mode);
		});
	}

	/* ---- accent color switch ---- */

	function getAccent() {
		var d = document.body ? document.body.getAttribute('data-liquid-accent') : null;
		if (d)
			return d;
		try { return localStorage.getItem('liquid-accent') || 'blue'; } catch (e) { return 'blue'; }
	}

	function setAccent(id) {
		try { localStorage.setItem('liquid-accent', id); } catch (e) {}
		if (document.body)
			document.body.setAttribute('data-liquid-accent', id);
		document.documentElement.setAttribute('data-accent', id);
		if (id == 'custom')
			applyCustomAccent(getAccentCustom());
		updateColorSwitch();
		if (id != 'custom')
			saveConfig({ accent: id });
	}

	function getAccentCustom() {
		var d = document.body ? document.body.getAttribute('data-liquid-accent-custom') : null;
		if (d)
			return d;
		try { return localStorage.getItem('liquid-accent-custom') || DEFAULT_ACCENT; } catch (e) { return DEFAULT_ACCENT; }
	}

	/* 设置自定义主题色：非法值退回默认蓝，但仍启用自定义模式 */
	function setCustomAccent(hex) {
		hex = normalizeHex(hex) || DEFAULT_ACCENT;
		try { localStorage.setItem('liquid-accent-custom', hex); } catch (e) {}
		if (document.body)
			document.body.setAttribute('data-liquid-accent-custom', hex);
		setAccent('custom');
		saveConfig({ accent: 'custom', accent_custom: hex });
	}

	function getBing() {
		var d = document.body ? document.body.getAttribute('data-liquid-bing') : null;
		if (d)
			return d;
		try { return localStorage.getItem('liquid-bing') || '0'; } catch (e) { return '0'; }
	}

	function setBing(on) {
		var v = on ? '1' : '0';
		try { localStorage.setItem('liquid-bing', v); } catch (e) {}
		if (document.body) {
			document.body.setAttribute('data-liquid-bing', v);
			/* 页面渲染时模板已确保当日壁纸缓存就绪，打开即视为可用，即时生效 */
			document.body.setAttribute('data-liquid-bing-ok', v);
		}
		updateColorSwitch();
		saveConfig({ bing: v });
	}

	function updateColorSwitch() {
		var accent = getAccent();
		[].forEach.call(document.querySelectorAll('.liquid-color-btn'), function (b) {
			b.classList.toggle('active', b.getAttribute('data-accent') == accent);
		});
		[].forEach.call(document.querySelectorAll('.liquid-bing-btn'), function (b) {
			b.classList.toggle('active', getBing() == '1');
		});
	}

	function initColorSwitch() {
		if (document.getElementById('liquid-color-switch'))
			return;

		var wrap = document.createElement('span');
		wrap.id = 'liquid-color-switch';
		wrap.className = 'liquid-color-switch';
		wrap.title = 'Accent color';

		/* Bing 每日壁纸开关（五色之前）：点亮启用在线壁纸 */
		var bingBtn = document.createElement('button');
		bingBtn.type = 'button';
		bingBtn.className = 'liquid-color-btn liquid-bing-btn';
		bingBtn.title = 'Bing 每日壁纸';
		bingBtn.setAttribute('aria-label', 'Bing daily wallpaper');
		bingBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#008373"/><text x="12" y="17.5" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff" text-anchor="middle">b</text></svg>';
		bingBtn.addEventListener('click', function () {
			setBing(getBing() != '1');
		});
		wrap.appendChild(bingBtn);

		ACCENTS.forEach(function (c) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'liquid-color-btn liquid-accent-' + c.id;
			btn.title = c.title;
			btn.setAttribute('data-accent', c.id);
			btn.setAttribute('aria-label', c.title);
			btn.style.background = c.color;
			btn.addEventListener('click', function () { setAccent(c.id); });
			wrap.appendChild(btn);
		});

		/* 自定义主题色（5 色之后）：彩虹圆点，点击下拉输入框输入颜色编码 */
		var customBtn = document.createElement('button');
		customBtn.type = 'button';
		customBtn.className = 'liquid-color-btn liquid-custom-btn';
		customBtn.title = 'Custom color';
		customBtn.setAttribute('data-accent', 'custom');
		customBtn.setAttribute('aria-label', 'Custom color');
		wrap.appendChild(customBtn);

		/* 菜单搜索按钮（Bing 之后）：点击下推抽屉式搜索框，实时过滤
		   菜单项（支持中英文标题），再点或点外部收回 */
		var searchBtn = document.createElement('button');
		searchBtn.type = 'button';
		searchBtn.className = 'liquid-color-btn liquid-search-btn';
		searchBtn.title = 'Search menu';
		searchBtn.setAttribute('aria-label', 'Search menu');
		searchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
		searchBtn.addEventListener('click', function (e) {
			e.stopPropagation();
			toggleMenuSearch(e.currentTarget);
		});
		wrap.appendChild(searchBtn);

		var pop = document.createElement('div');
		pop.id = 'liquid-custom-pop';
		pop.className = 'liquid-custom-pop';
		pop.style.display = 'none';
		var input = document.createElement('input');
		input.type = 'text';
		input.className = 'liquid-custom-input';
		input.placeholder = '#RRGGBB';
		input.maxLength = 7;
		input.setAttribute('spellcheck', 'false');
		pop.appendChild(input);
		wrap.appendChild(pop);

		function toggleCustomPop() {
			var show = pop.style.display == 'none';
			pop.style.display = show ? 'block' : 'none';
			if (show) {
				input.value = getAccentCustom();
				setTimeout(function () { input.focus(); input.select(); }, 0);
			}
		}

		/* 离开输入框（blur）即保存；非法值退回默认蓝 */
		function commitCustom() {
			var hex = normalizeHex(input.value);
			if (!hex)
				hex = DEFAULT_ACCENT;
			setCustomAccent(hex);
		}

		customBtn.addEventListener('click', function (e) {
			e.stopPropagation();
			toggleCustomPop();
		});
		input.addEventListener('keydown', function (e) {
			if (e.key == 'Enter') {
				commitCustom();
				pop.style.display = 'none';
			}
			else if (e.key == 'Escape') {
				pop.style.display = 'none';
			}
		});
		input.addEventListener('blur', function () { commitCustom(); });
		document.addEventListener('click', function (e) {
			if (!wrap.contains(e.target))
				pop.style.display = 'none';
		});

		var menubar = document.querySelector('#mainmenu');

		if (menubar) {
			/* 菜单栏顶部（水平居中） */
			menubar.insertBefore(wrap, menubar.firstChild);
		}
		else {
			/* lock screen / pages without a menubar */
			var capsules = document.getElementById('liquid-login-capsules');
			if (capsules) {
				/* 登录页：插入胶囊容器，不加 fixed 定位 */
				capsules.appendChild(wrap);
			}
			else {
				wrap.classList.add('liquid-color-switch-fixed');
				document.body.appendChild(wrap);
			}
		}

		updateColorSwitch();
	}

	/* ── 菜单搜索（抽屉式下推）────────────────────────────
	   搜索按钮点击：在 #mainmenu 顶部下推一个圆角矩形搜索框，
	   下面的菜单整体被往下推（抽屉式，非悬浮）。输入时实时过滤
	   菜单项（匹配显示文本 + 英文原题 data-title）。再次点按钮
	   或点击菜单外区域收回。 */
	var menuSearchOpen = false;
	var menuSearchBox = null;
	var menuSearchInput = null;

	function buildMenuSearchBox() {
		menuSearchBox = document.createElement('div');
		menuSearchBox.id = 'liquid-menu-search';
		menuSearchBox.className = 'liquid-menu-search';

		var icon = document.createElement('span');
		icon.className = 'liquid-menu-search-icon';
		icon.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

		menuSearchInput = document.createElement('input');
		menuSearchInput.type = 'text';
		menuSearchInput.className = 'liquid-menu-search-input';
		menuSearchInput.placeholder = '搜索 / Search';
		menuSearchInput.setAttribute('spellcheck', 'false');
		menuSearchInput.addEventListener('input', function () {
			filterMenuItems();
			updateClearBtn();
		});

		var clearBtn = document.createElement('button');
		clearBtn.type = 'button';
		clearBtn.className = 'liquid-menu-search-clear';
		clearBtn.innerHTML = '&times;';
		clearBtn.title = 'Clear';
		clearBtn.addEventListener('click', function () {
			menuSearchInput.value = '';
			filterMenuItems();
			updateClearBtn();
			menuSearchInput.focus();
		});

		function updateClearBtn() {
			clearBtn.style.display = menuSearchInput.value ? 'inline-flex' : 'none';
		}
		updateClearBtn();

		menuSearchBox.appendChild(icon);
		menuSearchBox.appendChild(menuSearchInput);
		menuSearchBox.appendChild(clearBtn);

		var menu = document.getElementById('mainmenu');
		if (menu) {
			/* 插在颜色胶囊之后（本功能区不动，搜索框从其下方推出） */
			var sw = menu.querySelector('.liquid-color-switch');
			if (sw && sw.nextSibling)
				menu.insertBefore(menuSearchBox, sw.nextSibling);
			else
				menu.insertBefore(menuSearchBox, menu.firstChild);
		}
		else
			document.body.appendChild(menuSearchBox);

		return menuSearchBox;
	}

	function filterMenuItems() {
		var q = (menuSearchInput.value || '').trim().toLowerCase();
		var menu = document.getElementById('mainmenu');
		if (!menu)
			return;

		/* 收集所有菜单项（一级/二级，含中英文标题） */
		var items = [];
		menu.querySelectorAll('ul.mainmenu li').forEach(function (li) {
			var a = li.querySelector(':scope > a');
			if (!a)
				return;
			var isL1 = li.parentElement && li.parentElement.classList.contains('l1');
			items.push({
				li: li,
				text: (a.textContent || '').trim().toLowerCase(),
				en: ((a.getAttribute('data-title') || '')).toLowerCase(),
				isL1: isL1
			});
		});

		/* 清空：恢复全部显示 + 还原展开状态（只留当前页所在菜单） */
		if (!q) {
			items.forEach(function (it) {
				it.li.classList.remove('liquid-menu-hidden');
			});
			menu.querySelectorAll('ul.mainmenu.l1 > li').forEach(function (li) {
				if (!li.classList.contains('selected'))
					li.classList.remove('active');
			});
			return;
		}

		/* 匹配判断 */
		items.forEach(function (it) {
			it.match = (it.text.indexOf(q) != -1 || it.en.indexOf(q) != -1);
		});

		/* 按一级菜单分组处理：
		   一级匹配 → 展开并显示其全部二级项；
		   二级匹配 → 展开所属一级，显示匹配的二级项；
		   均不匹配 → 整组隐藏 */
		menu.querySelectorAll('ul.mainmenu.l1 > li').forEach(function (li) {
			var l1 = null, l2s = [];
			items.forEach(function (it) {
				if (it.li === li)
					l1 = it;
				else if (!it.isL1 && li.contains(it.li))
					l2s.push(it);
			});
			var l1Match = l1 && l1.match;
			var hasL2Match = l2s.some(function (it) { return it.match; });

			if (l1Match || hasL2Match) {
				li.classList.remove('liquid-menu-hidden');
				li.classList.add('active'); /* 展开二级菜单 */
				l2s.forEach(function (it) {
					if (l1Match || it.match)
						it.li.classList.remove('liquid-menu-hidden');
					else
						it.li.classList.add('liquid-menu-hidden');
				});
			}
			else {
				li.classList.add('liquid-menu-hidden');
			}
		});
	}

	function toggleMenuSearch(btn) {
		if (menuSearchOpen) {
			closeMenuSearch();
			return;
		}

		if (!menuSearchBox)
			buildMenuSearchBox();

		menuSearchBox.classList.add('open');
		menuSearchOpen = true;
		var menu = document.getElementById('mainmenu');
		if (menu)
			menu.classList.add('liquid-search-open');
		/* 搜索按钮与其他圆点一致的 active 高亮（用事件源按钮，可靠） */
		if (btn)
			btn.classList.add('active');
		else {
			var b = document.querySelector('.liquid-search-btn');
			if (b)
				b.classList.add('active');
		}
		setTimeout(function () { menuSearchInput.focus(); }, 50);
	}

	function closeMenuSearch() {
		if (!menuSearchOpen)
			return;
		menuSearchOpen = false;
		if (menuSearchBox)
			menuSearchBox.classList.remove('open'); /* height/opacity transition 平滑收回 */
		var menu = document.getElementById('mainmenu');
		if (menu)
			menu.classList.remove('liquid-search-open');
		/* 搜索按钮还原 */
		var btn = document.querySelector('.liquid-search-btn');
		if (btn)
			btn.classList.remove('active');
		/* 清空过滤，恢复全部菜单 */
		if (menuSearchInput) {
			menuSearchInput.value = '';
			filterMenuItems();
		}
		/* 还原菜单展开状态：只保留当前页所在的一级菜单展开 */
		if (menu) {
			menu.querySelectorAll('ul.mainmenu.l1 > li').forEach(function (li) {
				if (!li.classList.contains('selected'))
					li.classList.remove('active');
			});
		}
	}

	/* 点击菜单外区域收回（document 捕获阶段，排除搜索框/按钮自身） */
	document.addEventListener('click', function (e) {
		if (!menuSearchOpen)
			return;
		if (menuSearchBox && menuSearchBox.contains(e.target))
			return;
		if (e.target.closest && e.target.closest('.liquid-search-btn'))
			return;
		closeMenuSearch();
	}, true);

	function initSwitch() {
		if (document.getElementById('liquid-mode-switch'))
			return;

		var wrap = document.createElement('span');
		wrap.id = 'liquid-mode-switch';
		wrap.className = 'liquid-mode-switch';

		MODES.forEach(function (m) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'liquid-mode-btn liquid-mode-' + m.id;
			btn.title = m.title;
			btn.setAttribute('data-mode', m.id);
			btn.setAttribute('aria-label', m.title);

			var img = document.createElement('img');
			img.src = L.media('svg/' + m.icon);
			img.alt = '';
			img.draggable = false;

			btn.appendChild(img);
			btn.addEventListener('click', function () { setMode(m.id); });
			wrap.appendChild(btn);
		});

		var indicators = document.getElementById('indicators');

		if (indicators && indicators.parentNode) {
			/* 顶栏原位置（刷新指示区左侧） */
			indicators.parentNode.insertBefore(wrap, indicators);
		}
		else {
			/* lock screen / pages without a menubar */
			var capsules = document.getElementById('liquid-login-capsules');
			if (capsules) {
				/* 登录页：插入胶囊容器，不加 fixed 定位 */
				capsules.appendChild(wrap);
			}
			else {
				wrap.classList.add('liquid-mode-switch-fixed');
				document.body.appendChild(wrap);
			}
		}

		updateSwitch();
	}

	/* keep auto mode in sync with OS theme changes */
	if (mql && typeof mql.addEventListener == 'function') {
		mql.addEventListener('change', function () {
			if (getMode() == 'auto')
				applyMode('auto');
		});
	}
	else if (mql && typeof mql.addListener == 'function') {
		mql.addListener(function () {
			if (getMode() == 'auto')
				applyMode('auto');
		});
	}

	/* 修复 zh-cn 复数翻译缺失：多个网络时 "Part of networks:" 显示英文原文，
	   统一成中文 */
	if (typeof N_ == 'function') {
		var origN = N_;
		N_ = function (count, one, other) {
			if (one == 'Part of network:' && other == 'Part of networks:')
				return '网络的一部分：';
			return origN(count, one, other);
		};
	}

	/* 内容区 tab 菜单追踪滑块（跟随 hover/选中项平滑滑动） */
	function initTabSliders() {
		document.querySelectorAll('ul.cbi-tabmenu').forEach(function (ul) {
			if (ul.classList.contains('liquid-tab-slider-init'))
				return;

			ul.classList.add('liquid-tab-slider-init');

			var ind = document.createElement('span');
			ind.className = 'liquid-tab-indicator';
			ul.appendChild(ind);

			function moveTo(el) {
				if (!el || !ul.contains(el)) {
					ind.style.opacity = '0';
					return;
				}
				var r = el.getBoundingClientRect();
				var ur = ul.getBoundingClientRect();
				ind.style.width = r.width + 'px';
				ind.style.height = r.height + 'px';
				ind.style.transform = 'translate(' + (r.left - ur.left) + 'px, ' + (r.top - ur.top) + 'px)';
				ind.style.opacity = '1';
			}

			moveTo(ul.querySelector('li.cbi-tab'));

			ul.addEventListener('mouseover', function (e) {
				var li = e.target.closest ? e.target.closest('li') : null;
				if (li && ul.contains(li))
					moveTo(li);
			});
			ul.addEventListener('mouseleave', function () {
				moveTo(ul.querySelector('li.cbi-tab'));
			});

			if (window.MutationObserver) {
				var mo = new MutationObserver(function () {
					moveTo(ul.querySelector('li.cbi-tab'));
				});
				mo.observe(ul, { attributes: true, subtree: true, attributeFilter: ['class'] });
			}
		});
	}

	/* 下拉宽度自适应：取选项中最长文本宽度 + 余量，总宽上限 240px
	   （"保存并应用"组合按钮除外，保持 auto）。原生 select 同步。 */
	function fitDropdownWidths() {
		document.querySelectorAll('.cbi-dropdown:not(.cbi-button-apply)').forEach(function (dd) {
			if (dd.classList.contains('liquid-dd-fit'))
				return;
			/* 打开中的下拉跳过测量：LuCI 正在克隆 preview/聚焦输入，
			   此时改 li/img 样式会干扰打开与自定义输入流程 */
			if (dd.hasAttribute('open') || dd.classList.contains('open'))
				return;
			dd.classList.add('liquid-dd-fit');
			var ul = dd.querySelector('ul');
			if (!ul)
				return;
			var maxW = 0;
			[].forEach.call(ul.querySelectorAll('li'), function (li) {
				if (li.classList.contains('hide-close') || li.classList.contains('hide-open'))
					return;
				/* 隐藏 li 无法直接测宽：临时 absolute+hidden 测量。
				   图标（img）未加载时宽度为 0 会漏算：临时给 24px 估算 */
				var imgs = li.querySelectorAll('img');
				var saved = [];
				[].forEach.call(imgs, function (img, i) {
					saved[i] = img.style.width;
					img.style.width = '24px';
					img.style.flexShrink = '0';
				});
				var st = li.style;
				st.display = 'block';
				st.position = 'absolute';
				st.visibility = 'hidden';
				st.whiteSpace = 'nowrap';
				var w = li.scrollWidth || 0;
				st.display = '';
				st.position = '';
				st.visibility = '';
				st.whiteSpace = '';
				[].forEach.call(imgs, function (img, i) {
					img.style.width = saved[i];
					img.style.flexShrink = '';
				});
				if (w > maxW)
					maxW = w;
			});

			/* 初始加载（读 uci 已选中项）：当前值行 li[display] 是闭合时
			   唯一可见的项，实测其渲染宽（含图标），保证胶囊不短于已选项 */
			[].forEach.call(ul.querySelectorAll('li[display]'), function (li) {
				var imgs = li.querySelectorAll('img');
				var saved = [];
				[].forEach.call(imgs, function (img, i) {
					saved[i] = img.style.width;
					img.style.width = '24px';
					img.style.flexShrink = '0';
				});
				var st = li.style;
				st.position = 'absolute';
				st.visibility = 'hidden';
				st.whiteSpace = 'nowrap';
				var w = li.scrollWidth || 0;
				st.position = '';
				st.visibility = '';
				st.whiteSpace = '';
				[].forEach.call(imgs, function (img, i) {
					img.style.width = saved[i];
					img.style.flexShrink = '';
				});
				if (w > maxW)
					maxW = w;
			});
			if (maxW > 0) {
				var w = Math.min(Math.max(maxW + 40, 60), 240);
				dd.style.width = w + 'px';
				dd.dataset.liquidW = w;   /* 记录，关闭后恢复（luci 会清） */
			}
		});

		document.querySelectorAll('.cbi-select').forEach(function (sel) {
			if (sel.classList.contains('liquid-dd-fit'))
				return;
			sel.classList.add('liquid-dd-fit');
			var s = sel.querySelector('select');
			if (!s)
				return;
			var maxW = 0;
			[].forEach.call(s.options, function (o) {
				var w = (o.text || '').length * 7.5;
				if (w > maxW)
					maxW = w;
			});
			if (maxW > 0)
				sel.style.width = Math.min(Math.max(maxW + 60, 60), 240) + 'px';
		});
	}

	/* 下拉框避让：按"屏幕上下可用空间"全局计算（而非卡片内相对位置）：
	   哪一侧剩余空间更多就朝哪侧弹出；并给列表设动态 max-height，
	   使其始终完整落在屏幕内（超出部分出滚动条，不再被屏幕边缘裁掉） */
	function adjustDropdownDirection() {
		document.querySelectorAll('.cbi-dropdown').forEach(function (dd) {
			var ul = dd.querySelector('ul.dropdown') || dd.querySelector('ul:not(.preview)');
			if (!ul)
				return;
			/* 打开判定：优先 dd 的 open 状态；部分第三方渲染（如
			   OpenClash）不设 open 属性，改判 ul 是否带 dropdown class */
			var open = dd.classList.contains('open') || dd.hasAttribute('open')
			        || ul.classList.contains('dropdown');

			if (!open) {
				/* 关闭：清理 luci 开合流程残留的 inline 定位（触屏分支的
				   left/right 会把闭合胶囊横向拉长）并恢复 fit 宽度
				   （luci closeDropdown 会清 dd.style.width） */
				ul.style.left = '';
				ul.style.right = '';
				ul.style.top = '';
				ul.style.bottom = '';
				ul.style.maxHeight = '';
				releaseCardBlur();
				if (dd.dataset.liquidW)
					dd.style.width = dd.dataset.liquidW + 'px';
				return;
			}

			/* 打开时暂时解除卡片链的 backdrop-filter：玻璃卡片形成
			   stacking context + containing block，内部 z-index 9999
			   出不去、fixed/absolute 被限制在卡片内（下拉被遮挡的根因）。
			   移除后下拉 z-index 可盖住后续卡片；关闭时 releaseCardBlur
			   恢复玻璃。 */
			holdCardBlur(dd);

			/* 清掉 luci 触屏分支残留的 left/right inline 定位：否则选项
			   列表可能被压成短短一横条/错位（F12 触发 resize 重算才恢复） */
			ul.style.left = '';
			ul.style.right = '';

			/* 打开时校准宽度：选项实际渲染宽（含图标，无论 img/背景），
			   修正初始 fit 对图标漏算导致的"图标被截" */
			var maxW = 0;
			ul.querySelectorAll('li').forEach(function (li) {
				var w = li.offsetWidth || 0;
				if (w > maxW)
					maxW = w;
			});
			if (maxW > 0) {
				var nw = Math.min(Math.max(maxW + 40, 60), 240);
				dd.style.width = nw + 'px';
				dd.dataset.liquidW = nw;
			}

			var r = dd.getBoundingClientRect();
			var vh = window.innerHeight;
			var downSpace = vh - r.bottom;   /* 按钮底 → 屏幕底 */
			var upSpace = r.top;             /* 屏幕顶 → 按钮顶 */
			var maxH;

			/* 先量出内容完整高度（临时去掉 max-height 限制） */
			ul.style.maxHeight = '';
			var fullH = ul.offsetHeight || 220;

			if (downSpace >= upSpace) {
				/* 下方空间更多：向下弹出，上限 = 下方可用空间 */
				ul.style.top = 'calc(100% + 4px)';
				ul.style.bottom = 'auto';
				maxH = Math.max(60, downSpace - 8);
			} else {
				/* 上方空间更多：向上弹出，上限 = 上方可用空间 */
				ul.style.top = 'auto';
				ul.style.bottom = 'calc(100% + 4px)';
				maxH = Math.max(60, upSpace - 8);
			}

			if (fullH > maxH)
				ul.style.maxHeight = maxH + 'px';
			else
				ul.style.maxHeight = '';
		});
	}

	/* ── 卡片 backdrop-filter 临时解除（下拉不被遮挡的关键）──
	   玻璃卡片 backdrop-filter 创建 stacking context + containing
	   block：内部下拉 z-index 9999 出不去、被后续卡片盖住。打开下拉
	   时给带 backdrop-filter 的祖先加 .liquid-dd-bf-off（CSS 置
	   backdrop-filter:none），关闭时移除。 */
	var _bfChain = [];
	function holdCardBlur(dd) {
		releaseCardBlur();
		var el = dd.parentElement;
		while (el && el !== document.body) {
			if (getComputedStyle(el).backdropFilter !== 'none' ||
			    getComputedStyle(el).webkitBackdropFilter !== 'none') {
				el.classList.add('liquid-dd-bf-off');
				_bfChain.push(el);
			}
			el = el.parentElement;
		}
	}
	function releaseCardBlur() {
		_bfChain.forEach(function (el) {
			el.classList.remove('liquid-dd-bf-off');
		});
		_bfChain = [];
	}

	/* cbi-dropdown：选择后确保 li[display] 跟随选中项（当前值显示兜底） */
	function syncDropdownValues() {
		document.querySelectorAll('.cbi-dropdown').forEach(function (dd) {
			if (dd.classList.contains('liquid-dd-init'))
				return;
			dd.classList.add('liquid-dd-init');

			function sync() {
				var ul = dd.querySelector('ul') || dd._liquidUl;
				if (!ul)
					return;

				/* 复选框与 selected 状态同步（luci 偶发只改其一） */
				ul.querySelectorAll('li').forEach(function (li) {
					var cb = li.querySelector('input[type="checkbox"]');
					if (cb)
						cb.checked = li.hasAttribute('selected');
				});

				var open = dd.classList.contains('open') || dd.hasAttribute('open');
				if (open)
					return;   /* 打开（多选打勾）时胶囊不变，避免频繁渲染 */

				if (dd.hasAttribute('multiple')) {
					/* 关闭后：把全部选中项设为 display 徽章（解除 luci 默认
					   只显示前几个的限制），竖向展示在胶囊内 */
					var n = 0;
					ul.querySelectorAll('li[display]').forEach(function (l) {
						if (!l.hasAttribute('selected'))
							l.removeAttribute('display');
					});
					ul.querySelectorAll('li[selected]').forEach(function (l) {
						if (!l.hasAttribute('display'))
							l.setAttribute('display', n);
						n++;
					});
					return;
				}

				var sel = ul.querySelector('li[selected]');
				var cur = ul.querySelector('li[display]');
				if (sel && cur !== sel) {
					if (cur)
						cur.removeAttribute('display');
					sel.setAttribute('display', '0');
				}
			}

			sync();
			/* luci 每次选值/取消都会派发 cbi-dropdown-change：同步勾选框与
			   selected 状态（点击即生效，不依赖 observer 时序） */
			dd.addEventListener('cbi-dropdown-change', function () {
				var u = dd.querySelector('ul') || dd._liquidUl;
				if (!u)
					return;
				u.querySelectorAll('li').forEach(function (li) {
					var cb = li.querySelector('input[type="checkbox"]');
					if (cb)
						cb.checked = li.hasAttribute('selected');
				});
			});
			if (window.MutationObserver) {
				var mo = new MutationObserver(function () {
					sync();
					adjustDropdownDirection();
				});
				mo.observe(dd, { attributes: true, subtree: true, attributeFilter: ['class', 'display', 'open', 'selected'] });
			}

			/* 兜底：点击选项后（ui.js toggleItem/closeDropdown 之后），
			   若关闭流程因任何原因中断（如 preview 缺失使 closeDropdown 抛错、
			   open 属性残留），强制把下拉重置为闭合态并让选中值显示在框里。 */
			dd.addEventListener('click', function (e) {
				/* 多选：luci 保持打开以便连续勾选，兜底不强制关闭；
				   但立即同步勾选框（当前事件循环结束、luci 处理完后） */
				if (dd.hasAttribute('multiple')) {
					setTimeout(function () {
						var u = dd.querySelector('ul') || dd._liquidUl;
						if (!u)
							return;
						u.querySelectorAll('li').forEach(function (li) {
							var cb = li.querySelector('input[type="checkbox"]');
							if (cb)
								cb.checked = li.hasAttribute('selected');
						});
					}, 0);
					return;
				}
				var li = e.target.closest ? e.target.closest('li') : null;
				if (!li || !li.parentNode || !li.parentNode.classList.contains('dropdown'))
					return;
				/* 点击"自定义"输入行（unselectable / 含 create 输入框）时
				   不能强制关闭——那是输入框，需要滞留让用户输入 */
				if (li.hasAttribute('unselectable') || li.querySelector('.create-item-input'))
					return;
				setTimeout(function () {
					var ul = dd.querySelector('ul.dropdown');
					if (!ul)
						return;  /* ui.js 已正常关闭 */
					var pv = dd.querySelector('ul.preview');
					if (pv && pv.parentNode === dd)
						dd.removeChild(pv);
					ul.classList.remove('dropdown');
					ul.style.top = ul.style.bottom = ul.style.maxHeight = '';
					dd.removeAttribute('open');
					var sel = ul.querySelector('li[selected]');
					if (!sel)
						return;  /* 点击未生效（toggleItem 没跑），不动现状 */
					ul.querySelectorAll('li[display]').forEach(function (l) {
						if (l !== sel)
							l.removeAttribute('display');
					});
					if (!sel.hasAttribute('display'))
						sel.setAttribute('display', '0');
				}, 0);
			});
		});
	}

	/* 悬浮内容框（.cbi-tooltip）：hover 时把 tooltip 临时移到 body 顶层
	   （fixed 定位），彻底脱离卡片 backdrop-filter 的 stacking context，
	   这样 tooltip 不会被相邻卡片遮挡。移出后放回原容器。
	   互斥保底：新的 hover 弹出时，先隐藏页面上所有其他 portal tooltip，
	   避免 mouseleave 偶尔不触发导致的残留停留。 */
	function portalTooltips() {
		document.querySelectorAll('.cbi-tooltip-container').forEach(function (c) {
			if (c.classList.contains('liquid-tip-init'))
				return;
			c.classList.add('liquid-tip-init');
			var tip = c.querySelector('.cbi-tooltip');
			if (!tip)
				return;
			var origParent = tip.parentNode;

			function hide() {
				if (tip.parentNode !== origParent)
					origParent.appendChild(tip);
				tip.classList.remove('liquid-tip-ported');
				tip.style.position = '';
				tip.style.left = '';
				tip.style.top = '';
				tip.style.zIndex = '';
				tip.style.opacity = '0';
				tip.style.visibility = 'hidden';
				tip.style.pointerEvents = '';
			}

			function show() {
				/* 互斥保底：先隐藏页面上所有其他已显示的 portal tooltip */
				document.querySelectorAll('.liquid-tip-ported').forEach(function (other) {
					if (other !== tip) {
						other.style.opacity = '0';
						other.style.visibility = 'hidden';
						other.classList.remove('liquid-tip-ported');
					}
				});
				var r = c.getBoundingClientRect();
				document.body.appendChild(tip);
				tip.style.position = 'fixed';
				tip.style.opacity = '0';
				tip.style.visibility = 'visible';
				tip.style.pointerEvents = 'none';
				/* 自动避让：量出悬浮框尺寸，超出屏幕时翻转/收进视口，
				   保证完整显示（同一帧内完成，无闪烁） */
				var tw = tip.offsetWidth, th = tip.offsetHeight;
				var vw = window.innerWidth, vh = window.innerHeight;
				var left = r.left, top = r.bottom + 6;
				if (left + tw > vw - 8)
					left = Math.max(8, vw - tw - 8);
				if (top + th > vh - 8)
					top = r.top - th - 6;
				if (top < 8) top = 8;
				if (left < 8) left = 8;
				tip.style.left = left + 'px';
				tip.style.top = top + 'px';
				tip.style.zIndex = '99999';
				tip.style.opacity = '1';
				tip.style.visibility = 'visible';
				tip.classList.add('liquid-tip-ported');
			}

			c.addEventListener('mouseenter', show);
			c.addEventListener('mouseleave', hide);
		});
	}

	/* 第三方插件的 fixed 弹窗（easytier .version-modal：刷新版本/重启服务
	   确认框）：弹窗自身 position:fixed + inset:0 + flex 居中，本应相对
	   视口居中，但插在玻璃卡片内时，卡片的 backdrop-filter 会成为 fixed
	   的包含块，弹窗变成相对整张卡片居中——卡片很高时弹窗落在当前屏幕
	   之外（移动端要下划才能看到）。移到 body 下即恢复视口居中。
	   与 portalTooltips 同思路；easytier 用 getElementById + classList
	   切换 .show 显隐，移动节点不影响其逻辑。弹窗依赖的 --card-bg 等
	   变量定义在 :root，移出卡片不失效 */
	function portalFixedModals() {
		document.querySelectorAll('.version-modal').forEach(function (m) {
			if (m.parentNode !== document.body)
				document.body.appendChild(m);
		});
	}

	/* 文档级滚动配套（r22）：LuCI SPA 切页（菜单/面包屑/标签链接 → XHR
	   换 #view 内容）不重置文档滚动位置，新页面会停在旧深度；安卓对
	   "初始滚动非零"的页面要先把滚到顶再下滑才肯收缩地址栏。这里在
	   点击站内导航链接后监听 #view 直接子节点变化（= 切页渲染完成；
	   深层的自动刷新/控件更新不触发，避免误回顶），一旦换页立即把
	   文档滚回顶部——每个页面都从顶开始，首次下滑即可收缩工具栏。
	   整页跳转时观察器随页面销毁，无副作用；5 秒兜底自动撤防 */
	function initNavScrollTop() {
		if (typeof MutationObserver == 'undefined')
			return;
		var mo = null, timer = 0;
		function disarm() {
			if (timer) { clearTimeout(timer); timer = 0; }
			if (mo) { mo.disconnect(); mo = null; }
		}
		document.addEventListener('click', function (ev) {
			if (ev.button !== 0)
				return;
			var a = (ev.target && ev.target.closest) ? ev.target.closest('a[href]') : null;
			if (!a)
				return;
			var href = a.getAttribute('href') || '';
			/* 只处理站内导航：排除纯锚点、外部链接、javascript 伪协议 */
			if (!href || href.charAt(0) == '#' ||
			    /^(?:[a-z][a-z0-9+.-]*)?\/\//i.test(href) ||
			    href.toLowerCase().indexOf('javascript:') === 0)
				return;
			var view = document.getElementById('view');
			if (!view)
				return;
			disarm();
			mo = new MutationObserver(function () {
				disarm();
				window.scrollTo(0, 0);
			});
			mo.observe(view, { childList: true });
			timer = setTimeout(disarm, 5000);
		}, true);
	}

	/* 登录页 logo：luci 的 modal.login 是 JS 渲染的，注入内联 SVG
	   （跟随主题色 + 玻璃水滴感），替换原 CSS 背景图 */
	function injectLoginLogo() {
		var m = document.querySelector('body.liquid-login #modal_overlay > .modal.login');
		if (!m || m.querySelector('.liquid-logo'))
			return;
		var w = document.createElement('div');
		w.innerHTML = '<svg class="liquid-logo" viewBox="0 0 64 68" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="liquid-lg-login" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--primary-color-high)" stop-opacity="0.85"/><stop offset="0.5" stop-color="var(--primary-color-high)" stop-opacity="0.4"/><stop offset="1" stop-color="var(--primary-color-low)" stop-opacity="0.92"/></linearGradient></defs><path d="M32 3 C46 20 57 30 57 42 a25 25 0 0 1 -50 0 C7 30 18 20 32 3 Z" fill="url(#liquid-lg-login)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/><ellipse cx="23" cy="39" rx="9.5" ry="6" fill="#ffffff" opacity="0.6"/></svg>';
		m.insertBefore(w.firstChild, m.firstChild);
	}

	/* 窗口尺寸变化时重新计算已打开下拉框的方向 */
	window.addEventListener('resize', function () {
		setTimeout(adjustDropdownDirection, 60);
	});

	/* 移动端菜单 top 跟随顶栏实际高度（防顶栏被撑高后菜单盖住它） */
	function syncMenuTop() {
		var bar = document.getElementById('menubar');
		var menu = document.getElementById('mainmenu');

		if (!bar || !menu)
			return;

		if (window.matchMedia && window.matchMedia('(max-width: 854px)').matches)
			menu.style.top = (bar.offsetHeight + 1) + 'px';
		else
			menu.style.top = '';
	}

	/* #indicators 由 ui.js 动态渲染，顶栏高度在 DOMContentLoaded 时可能未定型：
	   延迟二次校准 + 汉堡点击时校准 */
	function scheduleMenuTop() {
		setTimeout(syncMenuTop, 0);
	}

	applyCustomAccent(getAccentCustom());
	guardDarkmode();
	syncThemeColor();

	if (document.readyState == 'loading')
		document.addEventListener('DOMContentLoaded', function () {
			initSwitch();
			initColorSwitch();
			initSelectCombos();
			syncMenuTop();
			initTabSliders();
			syncDropdownValues();
			fitDropdownWidths();
			portalTooltips();
			portalFixedModals();
			initNavScrollTop();
			injectLoginLogo();
			setTimeout(syncMenuTop, 300);
			setTimeout(initTabSliders, 300);
			setTimeout(syncDropdownValues, 300);
		});
	else {
		initSwitch();
		initColorSwitch();
		initSelectCombos();
		syncMenuTop();
		initTabSliders();
		syncDropdownValues();
		fitDropdownWidths();
		portalTooltips();
		portalFixedModals();
		initNavScrollTop();
		injectLoginLogo();
		setTimeout(syncMenuTop, 300);
		setTimeout(initTabSliders, 300);
		setTimeout(syncDropdownValues, 300);
	}

	/* 定时清除所有内联 opacity（非 0/1 的残留值，luci 的离线/hover
	   样式会残留在接口徽章图标/文字、删除按钮、'取消配置'按钮等元素上，
	   让已连接内容呈半透、被误判为未连接）。统一压回不透明。 */
	setInterval(function () {
		document.querySelectorAll('[style*="opacity"]').forEach(function (el) {
			var o = el.style.opacity;
			if (o && o !== '1' && o !== '0')
				el.style.opacity = '';
		});
	}, 600);

	/* 单选原生 select → LuCI ui.Combobox（自绘玻璃下拉，弹出面板可
	   完全定制、性能可接受）。范围：所有单选下拉；排除多选、disabled、
	   隐藏、.cbi-select 内部（已有分割按钮结构）、data-choices（LuCI
	   自行升级）、size>1（多行列表）；保存并应用是 div.cbi-button-apply
	   非 select，天然排除。替换保留 name，change 转发给原 select 让
	   LuCI 依赖联动/校验继续工作。 */
	function initSelectCombos() {
		if (typeof L == 'undefined' || typeof L.require != 'function')
			return;
		/* 触屏设备跳过替换：LuCI 移动端分支打开下拉时会把页面滚动到
		   视口中央，下拉靠近页面顶部时直接闪回顶部，无法使用；移动端
		   保留原生 select，用系统滚动选择器 */
		if ('ontouchstart' in window)
			return;
		var todo = [];
		[].forEach.call(document.querySelectorAll('select:not([multiple])'), function (sel) {
			if (sel.__liquidCombo || sel.disabled || sel.hasAttribute('data-choices') || sel.size > 1)
				return;
			if (sel.closest('.cbi-select'))
				return;
			/* 只替换标准 CBI 表单下拉（.cbi-value-field 内），
			   排除 LuCI 自定义 widget（如无线设置的 mode/band/channel/htmode
			   select）——它们的联动逻辑（toggleWifiMode → querySelector('.mode')
			   → formvalue）依赖原始 select DOM 节点，替换后 querySelector
			   失败导致整个无线设置页 JavaScript 报错。 */
			if (!sel.closest('.cbi-value-field'))
				return;
			if (sel.offsetParent === null && getComputedStyle(sel).display === 'none')
				return;
			todo.push(sel);
		});
		if (!todo.length)
			return;
		L.require('ui').then(function (ui) {
			todo.forEach(function (sel) {
				try {
					var vals = [], labels = [], i, choices = {};
					for (i = 0; i < sel.options.length; i++) {
						vals.push(sel.options[i].value);
						labels.push(sel.options[i].textContent);
					}
					for (i = 0; i < vals.length; i++)
						choices[vals[i]] = labels[i];
					var cb = new ui.Combobox(sel.value, choices, {
						name: sel.getAttribute('name') || sel.id,
						sort: false,
						create: false,
						optional: false
					});
					var node = cb.render();
					node.classList.add('liquid-combo-pilot');
					node.addEventListener('cbi-dropdown-change', function () {
						try {
							sel.value = cb.getValue();
							sel.dispatchEvent(new Event('change', { bubbles: true }));
						} catch (e) {}
					});
					sel.parentNode.replaceChild(node, sel);
					sel.__liquidCombo = true;
					/* Combobox 强制 create:true，但原生 select 没有自定义
					   选项：移除多余的自定义输入行 */
					[].forEach.call(node.querySelectorAll('li[data-value="-"]'), function (li) {
						if (li.parentNode)
							li.parentNode.removeChild(li);
					});
				} catch (e) {}
			});
			fixComboPillClick();
		});
	}

	/* 点击内容区（当前值行）也能稳定展开：LuCI 的 handleClick 虽支持整块
	   点击，但内容区 click 会冒泡到 window 的 closeAllDropdowns，导致
	   打开即关闭（闪烁）。拦截内容区 click，改为以胶囊本身为目标重新
	   触发，走 handleClick 的打开路径（其内部 stopPropagation，不再
	   冒泡到 window）。打开状态下的点击不拦截，LuCI 正常处理关闭。 */
	function fixComboPillClick() {
		document.querySelectorAll('.cbi-dropdown.liquid-combo-pilot > ul > li[display]').forEach(function (li) {
			if (li.__liquidPillClick)
				return;
			li.__liquidPillClick = true;
			li.addEventListener('click', function (ev) {
				var sb = li.closest('.cbi-dropdown');
				if (!sb || sb.hasAttribute('open'))
					return;
				ev.stopPropagation();
				ev.preventDefault();
				sb.click();
			});
		});
	}

	/* 页面内容动态变化（view 切换、cbi 渲染等）时初始化新出现的 tab 菜单 */
	if (window.MutationObserver) {
		var tabObserver = new MutationObserver(function () {
			initTabSliders();
			syncDropdownValues();
			fitDropdownWidths();
			portalTooltips();
			injectLoginLogo();
			initSelectCombos();
			fixComboPillClick();
		});
		document.addEventListener('DOMContentLoaded', function () {
			tabObserver.observe(document.body, { childList: true, subtree: true });
		});
	}

	document.addEventListener('click', function (e) {
		var nav = document.querySelector('#menubar .navigation');
		if (nav && nav.contains(e.target)) {
			scheduleMenuTop();
			return;
		}
		/* 移动端：点击菜单（抽屉）外的任意区域 → 闭合侧边栏。
		   菜单内点击（子菜单展开等）不干预，菜单按钮交给原生 toggle */
		var menu = document.getElementById('mainmenu');
		if (menu && menu.classList.contains('active') && !menu.contains(e.target)) {
			menu.classList.remove('active');
			if (nav)
				nav.classList.remove('active');
		}
	});

	window.addEventListener('resize', syncMenuTop);

	/* 页面资源加载完成（图标 naturalWidth 就绪）后重测下拉宽度，
	   修正带图标选项的宽度估算 */
	window.addEventListener('load', function () {
		document.querySelectorAll('.cbi-dropdown.liquid-dd-fit').forEach(function (dd) {
			dd.classList.remove('liquid-dd-fit');
		});
		fitDropdownWidths();
	});

	/* 全局兜底：任何下拉 open 属性变化（含动态 modal 里尚未经
	   syncDropdownValues 初始化的 dd）都重算定位 —— 修复某些终端
	   下拉只剩一横条（luci 残留 inline 定位 / maxHeight 1px） */
	if (window.MutationObserver) {
		var globalDdObserver = new MutationObserver(function (muts) {
			var need = false;
			muts.forEach(function (m) {
				if (m.type === 'attributes' && m.attributeName === 'open')
					need = true;
			});
			if (!need)
				return;
			adjustDropdownDirection();
			/* luci 触屏分支用 rAF 动画（约 100ms）滚动定位，会在微任务
			   之后再次覆盖 inline 样式 —— 延迟再清理一次，覆盖它
			   （Windows 触屏/Edge 上尤甚） */
			setTimeout(adjustDropdownDirection, 200);
		});
		globalDdObserver.observe(document.documentElement, {
			attributes: true,
			subtree: true,
			attributeFilter: ['open']
		});
	}

	/* ── Overview page memory/storage bars: render used/total text inside
	   the taller progress bar. LuCI's status include renders
	   <div class="cbi-progressbar" title="used / total (pc%)"><div style="width:N%"></div></div>
	   — we inject a centered label from the title attribute and keep it
	   in sync when LuCI re-renders (poll updates). ── */
	function syncBarLabels() {
		document.querySelectorAll('.cbi-section .cbi-progressbar').forEach(function (bar) {
			var label = bar.querySelector('span.liquid-bar-label');
			if (!label) {
				label = document.createElement('span');
				label.className = 'liquid-bar-label';
				bar.appendChild(label);
			}
			/* keep in sync with LuCI's poll updates (title attribute) */
			var txt = bar.title || '';
			if (label.textContent !== txt)
				label.textContent = txt;
		});
	}

	/* overview renders its includes after the view instantiates; poll
	   both the DOM (async view load) and the title updates */
	if (window.MutationObserver) {
		var barObserver = new MutationObserver(function (muts) {
			var need = false;
			muts.forEach(function (m) {
				if (m.type === 'childList' && m.addedNodes && m.addedNodes.length)
					need = true;
				if (m.type === 'attributes' && m.attributeName === 'title')
					need = true;
			});
			if (need)
				syncBarLabels();
		});
		barObserver.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['title']
		});
	}
	setTimeout(syncBarLabels, 500);
	setTimeout(syncBarLabels, 1500);

	/* ── 矮弹窗居中器（限定范围：仅应用提示/待应用等矮弹窗）──
	   安卓浏览器布局视口(innerHeight) 含地址栏区域，与真实可视区
	   不一致（如 811 vs 695），且地址栏展开/收起时动态变化，纯 CSS
	   无法感知 —— 这是 visualViewport API 存在的原因。
	   用法：仅当弹窗内容高度 < 可视区（矮弹窗，居中是刚需）时用
	   visualViewport 像素级居中；超高弹窗（表单类如添加 DHCP）
	   绝不锁定，保持文档流 + overlay 滚动，不影响桌面端功能。 */
	function centerModals() {
		var vv = window.visualViewport;
		var overlay = document.getElementById('modal_overlay');
		var modal = overlay ? overlay.firstElementChild : null;
		if (!modal || document.body.classList.contains('liquid-login'))
			return;
		var vh = vv ? vv.height : window.innerHeight;
		var mh = modal.offsetHeight || 0;
		if (!mh)
			return;
		/* 超高弹窗：不锁定，恢复文档流（margin 顶部对齐 + overlay 滚动） */
		if (mh >= vh - 24) {
			modal.style.position = '';
			modal.style.top = '';
			modal.style.left = '';
			modal.style.margin = '';
			modal.style.transform = '';
			return;
		}
		/* 矮弹窗：visualViewport 像素级精确居中 */
		var vw = vv ? vv.width : window.innerWidth;
		var vx = vv ? vv.offsetLeft : 0;
		var vy = vv ? vv.offsetTop : 0;
		var mw = modal.offsetWidth || 0;
		modal.style.position = 'fixed';
		modal.style.top = Math.round(vy + (vh - mh) / 2) + 'px';
		modal.style.left = Math.round(vx + (vw - mw) / 2) + 'px';
		modal.style.margin = '0';
		modal.style.transform = 'none';
	}

	/* 监听弹窗出现/内容变化（应用提示每秒重建；表单弹窗内容逐步渲染） */
	var modalTimer = null;
	function watchModals() {
		if (document.body.classList.contains('modal-overlay-active')) {
			if (!modalTimer) {
				centerModals();
				modalTimer = setInterval(centerModals, 200);
			}
		} else if (modalTimer) {
			clearInterval(modalTimer);
			modalTimer = null;
		}
	}
	new MutationObserver(watchModals).observe(document.body, {
		attributes: true,
		attributeFilter: ['class']
	});
	window.addEventListener('resize', centerModals);
	if (window.visualViewport)
		window.visualViewport.addEventListener('resize', centerModals);

	/* ── 多实例 section 子卡片（Dropbear 实例等）──────────
	   同一 .cbi-section 内有多个平级 .cbi-section-node 时，给每个
	   节点加 liquid-multi-node（CSS 渲染为独立子卡片+间隔），
	   同时给外层 section 加 liquid-multi-sec（删除按钮收边等）。
	   MutationObserver 覆盖动态增删实例（点击"添加实例"）。 */
	function styleMultiSections() {
		document.querySelectorAll('.cbi-section').forEach(function (sec) {
			var nodes = sec.querySelectorAll(':scope > .cbi-section-node');
			if (nodes.length > 1) {
				nodes.forEach(function (n) {
					n.classList.add('liquid-multi-node');
				});
				sec.classList.add('liquid-multi-sec');
			}
			else {
				sec.classList.remove('liquid-multi-sec');
			}
		});
	}
	styleMultiSections();
	if (window.MutationObserver) {
		var msObs = new MutationObserver(function () {
			styleMultiSections();
		});
		msObs.observe(document.body, { childList: true, subtree: true });
	}
})();
