'use strict';
/* Liquid theme: save theme config (mode / accent / bing) directly.
   Called via XHR POST to /cgi-bin/luci/admin/system/liquid/save_config
   (like luci-app-pushbot's save_config), bypassing the uci rpc which is
   unreliable across LuCI versions. Writes /etc/config/liquid with fs
   (system()/uci CLI are not available in the ucode dispatcher sandbox). */

import * as fs from 'fs';
import { popen } from 'fs';

return {
	act_version: function() {
		let ver = "";
		/* mtime 校验 + /tmp 缓存（与 header/footer 模板同一套机制），避免每次 fork */
		let db_file = '/lib/apk/db/installed';
		let db_mtime = 0;
		let st = fs.stat(db_file);
		if (st && st.type == 'file') {
			db_mtime = st.mtime;
		} else {
			db_file = '/usr/lib/opkg/status';
			st = fs.stat(db_file);
			if (st && st.type == 'file')
				db_mtime = st.mtime;
		}
		if (db_mtime > 0) {
			let cm = match(fs.readfile('/tmp/liquid-version.cache') ?? '', /^(\d+) (.*)$/);
			if (cm !== null && sprintf('%d', db_mtime) == cm[1])
				ver = cm[2];
		}
		if (ver == "") {
			/* apk (OpenWrt 24.10+): /lib/apk/db/installed */
			let f = popen("awk '/^P:luci-theme-liquid$/{f=1;next} f&&/^V:/{print substr($0,3);exit}' " + db_file + " 2>/dev/null", "r");
			if (f) { ver = replace(f.read("all"), /\s+/, ""); f.close(); }
			/* opkg (legacy): /usr/lib/opkg/status */
			if (ver == "") {
				f = popen("awk '/^Package: luci-theme-liquid$/{f=1;next} f&&/^Version:/{print $2;exit}' /usr/lib/opkg/status 2>/dev/null", "r");
				if (f) { ver = replace(f.read("all"), /\s+/, ""); f.close(); }
			}
			if (ver != "" && db_mtime > 0)
				fs.writefile('/tmp/liquid-version.cache', sprintf('%d %s', db_mtime, ver));
		}
		http.prepare_content("application/json");
		http.write_json({ version: ver });
	},

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
			else if (k == 'accent' && match(v, /^(blue|magenta|amber|purple|lime|custom)$/))
				writes['accent'] = v;
			else if (k == 'accent_custom' && match(v, /^#[0-9a-fA-F]{6}$/))
				writes['accent_custom'] = v;
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
