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
		try { return localStorage.getItem(MODE_KEY) || 'auto'; } catch (e) { return 'auto'; }
	}

	function setMode(mode) {
		try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
		applyMode(mode);
		updateSwitch();
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
		try { return localStorage.getItem('liquid-accent') || 'blue'; } catch (e) { return 'blue'; }
	}

	function setAccent(id) {
		try { localStorage.setItem('liquid-accent', id); } catch (e) {}
		document.documentElement.setAttribute('data-accent', id);
		updateColorSwitch();
	}

	function updateColorSwitch() {
		var accent = getAccent();
		[].forEach.call(document.querySelectorAll('.liquid-color-btn'), function (b) {
			b.classList.toggle('active', b.getAttribute('data-accent') == accent);
		});
	}

	function initColorSwitch() {
		if (document.getElementById('liquid-color-switch'))
			return;

		var wrap = document.createElement('span');
		wrap.id = 'liquid-color-switch';
		wrap.className = 'liquid-color-switch';
		wrap.title = 'Accent color';

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
				var mo = new MutationObserver(sync);
				mo.observe(dd, { attributes: true, subtree: true, attributeFilter: ['class', 'display'] });
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
	   这样 tooltip 不会被相邻卡片遮挡。移出后放回原容器。 */
	function portalTooltips() {
		/* 只对会被相邻卡片遮挡的场景（ifacebox / zonebadge 卡片内）做 portal；
		   设备页等行内 tooltip 走 CSS hover，避免 portal 与 CSS hover
		   叠加造成悬停闪烁 */
		document.querySelectorAll('.ifacebox .cbi-tooltip-container, .zonebadge .cbi-tooltip-container').forEach(function (c) {
			if (c.classList.contains('liquid-tip-init'))
				return;
			c.classList.add('liquid-tip-init');
			var tip = c.querySelector('.cbi-tooltip');
			if (!tip)
				return;
			var origParent = tip.parentNode;
			c.addEventListener('mouseenter', function () {
				var r = c.getBoundingClientRect();
				tip.style.position = 'fixed';
				tip.style.left = r.left + 'px';
				tip.style.top = (r.bottom + 6) + 'px';
				tip.style.zIndex = '99999';
				tip.style.opacity = '1';
				tip.style.visibility = 'visible';
				tip.style.pointerEvents = 'none';
				tip.classList.add('liquid-tip-ported');
				document.body.appendChild(tip);
			});
			c.addEventListener('mouseleave', function () {
				if (tip.parentNode !== origParent)
					origParent.appendChild(tip);
				tip.classList.remove('liquid-tip-ported');
				tip.style.position = '';
				tip.style.left = '';
				tip.style.top = '';
				tip.style.zIndex = '';
				/* 强制隐藏：收回后原 .ifacebox .cbi-tooltip 隐藏规则可能
				   因元素不在卡片内而不匹配，导致 tooltip 不收回 */
				tip.style.opacity = '0';
				tip.style.visibility = 'hidden';
				tip.style.pointerEvents = '';
			});
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
