'use strict';
'require ui';
'require view';

/* Liquid theme lock screen view, based on luci-theme-bootstrap's
 * view/bootstrap/sysauth.js (Apache 2.0). Puts the login form into a
 * centered modal styled as a macOS-like lock screen. */

return view.extend({
	render: function() {
		var form = document.querySelector('form'),
		    btn = document.querySelector('button');

		var hostname = (document.body && document.body.getAttribute('data-hostname')) || '';
		var title = hostname
			? (hostname + ' · ' + _('Authorization Required'))
			: _('Authorization Required');

		/* 延迟渲染 modal：Android Edge 的 Bitwarden 扩展扫描时机
		   与 ui.showModal 移动 DOM 存在竞态——section 中的 form 被移走
		   的瞬间若被扫描到则字段不完整，导致填充错位（用户名→密码框）。
		   延迟 200ms 给密码管理器充足的初始扫描窗口。 */
		setTimeout(function() {
			var dlg = ui.showModal(
				title,
				[].slice.call(document.querySelectorAll('section > *')),
				'login'
			);

			form.addEventListener('keypress', function(ev) {
				if (ev.key == 'Enter')
					btn.click();
			});

			btn.addEventListener('click', function(ev) {
				ev.preventDefault();
				dlg.querySelectorAll('*').forEach(function(node) { node.style.display = 'none' });
				dlg.appendChild(E('div', { 'class': 'spinning' }, _('Logging in…')));

				form.submit()
			});

			document.querySelector('input[type="password"]').focus();
		}, 200);

		return '';
	},

	addFooter: function() {}
});
