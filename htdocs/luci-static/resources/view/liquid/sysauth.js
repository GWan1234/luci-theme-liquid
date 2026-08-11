'use strict';
'require ui';
'require view';

/* Liquid theme login — fully static DOM.  The form is rendered directly in
   <div id="liquid-login"><div class="modal login"> by the ucode template;
   CSS centers it and adds the glass card.  No ui.showModal, no DOM moving —
   password managers (Bitwarden etc.) always see the complete form. */

return view.extend({
	render: function() {
		var card = document.getElementById('liquid-login');
		var form = card.querySelector('form'),
		    btn = card.querySelector('button');

		/* optional hostname prefix on title */
		var hostname = (document.body && document.body.getAttribute('data-hostname')) || '';
		var h4 = card.querySelector('h4');
		if (h4 && hostname)
			h4.textContent = hostname + ' · ' + _('Authorization Required');

		form.addEventListener('keypress', function(ev) {
			if (ev.key == 'Enter')
				btn.click();
		});

		btn.addEventListener('click', function(ev) {
			ev.preventDefault();
			card.querySelectorAll('.modal.login > *').forEach(function(node) { node.style.display = 'none'; });
			card.querySelector('.modal.login').appendChild(E('div', { 'class': 'spinning' }, _('Logging in…')));
			form.submit()
		});

		card.querySelector('input[type="password"]').focus();

		return '';
	},

	addFooter: function() {}
});
