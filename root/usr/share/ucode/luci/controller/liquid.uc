'use strict';
/* Liquid theme: save theme config (mode / accent / bing) directly.
   Called via XHR POST to /cgi-bin/luci/admin/system/liquid/save_config
   (like luci-app-pushbot's save_config), bypassing the uci rpc which is
   unreliable across LuCI versions. Writes /etc/config/liquid with fs
   (system()/uci CLI are not available in the ucode dispatcher sandbox). */

import * as fs from 'fs';

return {
	act_save_config: function() {
		http.prepare_content("application/json");

		let body;
		try { body = http.content(); } catch { body = null; }
		if (!body) {
			http.write_json({ ok: false, error: "no data" });
			return;
		}

		let data;
		try { data = json(body); } catch { data = null; }
		if (type(data) != 'object') {
			http.write_json({ ok: false, error: "invalid json" });
			return;
		}

		/* 白名单字段 + 值校验 */
		let writes = {};
		for (let k in data) {
			let v = sprintf("%s", data[k]);
			if (k == 'mode' && match(v, /^(light|dark|auto)$/))
				writes['mode'] = v;
			else if (k == 'accent' && match(v, /^(blue|magenta|amber|purple|lime)$/))
				writes['accent'] = v;
			else if (k == 'bing' && match(v, /^(0|1)$/))
				writes['bing'] = v;
		}

		let cfg_path = '/etc/config/liquid';
		let cfg = fs.readfile(cfg_path) ?? '';
		let lines = split(cfg, '\n');
		let out = [];
		if (!match(cfg, /config theme/))
			push(out, "config theme 'theme'");

		let inSection = false;
		for (let i = 0; i < length(lines); i++) {
			let line = lines[i];
			if (match(line, /^config/))
				inSection = true;
			let m = match(line, /^[ \t]*option[ \t]+([a-z_]+)[ \t]+/);
			if (inSection && m !== null && m[1] in writes) {
				push(out, sprintf("\toption %s '%s'", m[1], writes[m[1]]));
				delete writes[m[1]];
				continue;
			}
			push(out, line);
		}

		/* 追加尚未出现的 option */
		for (let k in writes)
			push(out, sprintf("\toption %s '%s'", k, writes[k]));

		fs.writefile(cfg_path, join('\n', out) + '\n');
		http.write_json({ ok: true, saved: true });
	}
};
