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
	function saveConfig(opt, val) {
		if (!document.body ||
		    document.body.classList.contains('liquid-login'))
			return;
		/* 用主题自己的 ucode controller 保存（仿 luci-app-pushbot）：
		   XHR POST 到 /cgi-bin/luci/admin/system/liquid/save_config，
		   后端直接写 /etc/config/liquid，绕开跨版本不可靠的 uci rpc */
		try {
			var base = (window.L && L.env && L.env.admin_path)
				? L.env.admin_path : '/cgi-bin/luci/admin/';
			var data = {};
			data[opt] = val;
			var xhr = new XMLHttpRequest();
			xhr.open('POST', base + 'system/liquid/save_config');
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send(JSON.stringify(data));
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
		saveConfig('mode', mode);
	}

	function isDark(mode) {
		return (mode == 'dark') || ((mode == 'auto') && mql && mql.matches);
	}

	function applyMode(mode) {
		var root = document.documentElement;
		root.setAttribute('data-darkmode', isDark(mode) ? 'true' : 'false');
		root.setAttribute('data-liquid-mode', mode);
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
		updateColorSwitch();
		saveConfig('accent', id);
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
		saveConfig('bing', v);
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

		var menubar = document.querySelector('#mainmenu');

		if (menubar) {
			/* 菜单栏顶部（水平居中） */
			menubar.insertBefore(wrap, menubar.firstChild);
		}
		else {
			/* lock screen / pages without a menubar */
			wrap.classList.add('liquid-color-switch-fixed');
			document.body.appendChild(wrap);
		}

		updateColorSwitch();
	}

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
			wrap.classList.add('liquid-mode-switch-fixed');
			document.body.appendChild(wrap);
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

	/* 下拉框自动避让：按钮靠近视口底部（或被页脚遮挡）时向上弹出，
	   下方空间足够则照常向下 */
	function adjustDropdownDirection() {
		document.querySelectorAll('.cbi-dropdown[open] > ul.dropdown').forEach(function (ul) {
			var dd = ul.closest('.cbi-dropdown');
			if (!dd)
				return;
			var r = dd.getBoundingClientRect();
			var vh = window.innerHeight;
			var listH = ul.offsetHeight || 220;
			if (r.bottom + listH + 12 > vh) {
				ul.style.top = 'auto';
				ul.style.bottom = 'calc(100% + 4px)';
			} else {
				ul.style.top = 'calc(100% + 4px)';
				ul.style.bottom = 'auto';
			}
		});
	}

	/* cbi-dropdown：选择后确保 li[display] 跟随选中项（当前值显示兜底） */
	function syncDropdownValues() {
		document.querySelectorAll('.cbi-dropdown').forEach(function (dd) {
			if (dd.classList.contains('liquid-dd-init'))
				return;
			dd.classList.add('liquid-dd-init');

			function sync() {
				var ul = dd.querySelector('ul');
				if (!ul)
					return;
				var sel = ul.querySelector('li[selected]');
				var cur = ul.querySelector('li[display]');
				if (sel && cur !== sel) {
					if (cur)
						cur.removeAttribute('display');
					sel.setAttribute('display', '0');
				}
			}

			sync();
			if (window.MutationObserver) {
				var mo = new MutationObserver(function () {
					sync();
					adjustDropdownDirection();
				});
				mo.observe(dd, { attributes: true, subtree: true, attributeFilter: ['class', 'display', 'open'] });
			}

			/* 兜底：点击选项后（ui.js toggleItem/closeDropdown 之后），
			   若关闭流程因任何原因中断（如 preview 缺失使 closeDropdown 抛错、
			   open 属性残留），强制把下拉重置为闭合态并让选中值显示在框里。 */
			dd.addEventListener('click', function (e) {
				var li = e.target.closest ? e.target.closest('li') : null;
				if (!li || !li.parentNode || !li.parentNode.classList.contains('dropdown'))
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

	if (document.readyState == 'loading')
		document.addEventListener('DOMContentLoaded', function () {
			initSwitch();
			initColorSwitch();
			syncMenuTop();
			initTabSliders();
			syncDropdownValues();
			portalTooltips();
			injectLoginLogo();
			setTimeout(syncMenuTop, 300);
			setTimeout(initTabSliders, 300);
			setTimeout(syncDropdownValues, 300);
		});
	else {
		initSwitch();
		initColorSwitch();
		syncMenuTop();
		initTabSliders();
		syncDropdownValues();
		portalTooltips();
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

	/* 页面内容动态变化（view 切换、cbi 渲染等）时初始化新出现的 tab 菜单 */
	if (window.MutationObserver) {
		var tabObserver = new MutationObserver(function () {
			initTabSliders();
			syncDropdownValues();
			portalTooltips();
			injectLoginLogo();
		});
		document.addEventListener('DOMContentLoaded', function () {
			tabObserver.observe(document.body, { childList: true, subtree: true });
		});
	}

	document.addEventListener('click', function (e) {
		var nav = document.querySelector('#menubar .navigation');
		if (nav && nav.contains(e.target))
			scheduleMenuTop();
	});

	window.addEventListener('resize', syncMenuTop);
})();
