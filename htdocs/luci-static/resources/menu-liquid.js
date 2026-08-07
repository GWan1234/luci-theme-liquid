'use strict';
'require baseclass';
'require ui';

/* Liquid theme menu renderer, based on luci-theme-openwrt-2020's
 * menu-openwrt2020.js (Apache 2.0). Renders the left sidebar into
 * #mainmenu, the mode menu into #modemenu and sub page tabs into
 * #tabmenu. */

return baseclass.extend({
	__init__() {
		ui.menu.load().then((tree) => this.render(tree));
	},

	render(tree) {
		let node = tree;
		let url = '';

		this.renderModeMenu(node);

		if (L.env.dispatchpath.length >= 3) {
			for (var i = 0; i < 3 && node; i++) {
				node = node.children[L.env.dispatchpath[i]];
				url = url + (url ? '/' : '') + L.env.dispatchpath[i];
			}

			if (node)
				this.renderTabMenu(node, url);
		}

		document.querySelector('#menubar > .navigation')
			.addEventListener('click', ui.createHandlerFn(this, 'handleSidebarToggle'));

		this.initMenuIndicator();
	},

	/* hover 追踪：一个玻璃滑块平滑跟随鼠标在一级菜单项间移动 */
	initMenuIndicator() {
		const menu = document.querySelector('#mainmenu');

		if (!menu)
			return;

		const indicator = E('div', { 'class': 'liquid-menu-indicator' });
		menu.appendChild(indicator);

		const items = menu.querySelectorAll('ul.mainmenu.l1 > li');

		menu.addEventListener('mouseleave', function () {
			menu.classList.remove('liquid-menu-hovering');
		});

		menu.addEventListener('scroll', function () {
			menu.classList.remove('liquid-menu-hovering');
		});

		items.forEach(function (li) {
			li.addEventListener('mouseenter', function () {
				const a = li.querySelector(':scope > a');
				const menuRect = menu.getBoundingClientRect();
				const aRect = a.getBoundingClientRect();

				indicator.style.transform =
					'translateY(%dpx)'.format(aRect.top - menuRect.top + menu.scrollTop);
				indicator.style.height = '%dpx'.format(aRect.height);
				menu.classList.add('liquid-menu-hovering');
			});
		});
	},

	handleMenuExpand(ev) {
		const a = ev.target;
		const ul1 = a.parentNode.parentNode;
		const ul2 = a.nextElementSibling;

		document.querySelectorAll('ul.mainmenu.l1 > li.active').forEach(li => {
			if (li !== a.parentNode)
				li.classList.remove('active');
		});

		if (!ul2)
			return;

		if (ul2.parentNode.offsetLeft + ul2.offsetWidth <= ul1.offsetLeft + ul1.offsetWidth)
			ul2.classList.add('align-left');

		ul1.classList.add('active');
		a.parentNode.classList.add('active');
		a.blur();

		ev.preventDefault();
		ev.stopPropagation();
	},

	renderMainMenu(tree, url, level) {
		const l = (level || 0) + 1;
		const ul = E('ul', { 'class': 'mainmenu l%d'.format(l) });
		const children = ui.menu.getChildren(tree);

		if (children.length == 0 || l > 2)
			return E([]);

		children.forEach(child => {
			/* 当前所在一级菜单仅高亮（selected），子菜单一律默认收起，点击才展开 */
			const isActive = (L.env.dispatchpath[l] == child.name);
			const activeClass = 'mainmenu-item-%s%s'.format(
				child.name, isActive ? ' selected' : '');

			ul.appendChild(E('li', { 'class': activeClass }, [
				E('a', {
					'href': L.url(url, child.name),
					'click': (l == 1) ? ui.createHandlerFn(this, 'handleMenuExpand') : ''
				}, [
					_(child.title)
				]),
				this.renderMainMenu(child, url + '/' + child.name, l)
			]));
		});

		if (l == 1)
			document.querySelector('#mainmenu').appendChild(E('div', [ ul ]));

		return ul;
	},

	renderModeMenu(tree) {
		const menu = document.querySelector('#modemenu');
		const children = ui.menu.getChildren(tree);

		children.forEach((child, index) => {
			const isActive = L.env.requestpath.length
				? child.name === L.env.requestpath[0]
				: index === 0;

			if (index > 0)
				menu.appendChild(E([], ['\u00a0|\u00a0']));

			menu.appendChild(E('div', { 'class': isActive ? 'active' : '' }, [
				E('a', { href: L.url(child.name) }, [
					_(child.title)
				])
			]));

			if (isActive)
				this.renderMainMenu(child, child.name);
		});

		if (menu.children.length > 1)
			menu.style.display = '';
	},

	renderTabMenu(tree, url, level) {
		const container = document.querySelector('#tabmenu');
		const l = (level || 0) + 1;
		const ul = E('ul', { 'class': 'cbi-tabmenu' });
		const children = ui.menu.getChildren(tree);
		let activeNode = null;

		if (children.length == 0)
			return E([]);

		children.forEach(child => {
			const isActive = (L.env.dispatchpath[l + 2] == child.name);
			const activeClass = isActive ? ' cbi-tab' : '';
			const className = 'tabmenu-item-%s %s'.format(child.name, activeClass);

			ul.appendChild(E('li', { 'class': className }, [
				E('a', { 'href': L.url(url, child.name) }, [
					_(child.title)
				])
			]));

			if (isActive)
				activeNode = child;
		});

		container.appendChild(ul);
		container.style.display = '';

		if (activeNode)
			container.appendChild(this.renderTabMenu(activeNode, url + '/' + activeNode.name, l));

		return ul;
	},

	handleSidebarToggle(ev) {
		const btn = ev.currentTarget;
		const bar = document.querySelector('#mainmenu');

		if (btn.classList.contains('active')) {
			btn.classList.remove('active');
			bar.classList.remove('active');
		}
		else {
			btn.classList.add('active');
			bar.classList.add('active');
		}
	}
});
