'use strict';
'require ui';
'require view';

/* Liquid theme login — static DOM, no DOM-moving modal.
   The form is rendered directly in <div id="modal_overlay"><div class="modal login">,
   styled by cascade.css.  No hidden/opacity hacks, no ui.showModal DOM migration.
   Bitwarden sees the complete form from the start. */

return view.extend({
	render: function() {
		var overlay = document.getElementById('modal_overlay');
		var form = overlay.querySelector('form');
		var btn = overlay.querySelector('button');

		/* optional hostname prefix on title */
		var hostname = (document.body && document.body.getAttribute('data-hostname')) || '';
		var h4 = overlay.querySelector('h4');
		if (h4 && hostname)
			h4.textContent = hostname + ' · ' + _('Authorization Required');

		form.addEventListener('keypress', function(ev) {
			if (ev.key == 'Enter')
				btn.click();
		});

		btn.addEventListener('click', function(ev) {
			ev.preventDefault();
			var modal = overlay.querySelector('.modal.login');
			modal.querySelectorAll(':scope > *').forEach(function(node) { node.style.display = 'none'; });
			modal.appendChild(E('div', { 'class': 'spinning' }, _('Logging in…')));
			form.submit();
		});

		overlay.querySelector('input[type="password"]').focus();

		return '';
	},

	addFooter: function() {}
});
