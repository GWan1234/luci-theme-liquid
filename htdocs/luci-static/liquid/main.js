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

	if (document.readyState == 'loading')
		document.addEventListener('DOMContentLoaded', initSwitch);
	else
		initSwitch();
})();
