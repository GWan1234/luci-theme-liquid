include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-liquid
PKG_VERSION:=0.9
PKG_RELEASE:=8

PKG_MAINTAINER:=然后七年 <z@7ze.top>
PKG_LICENSE:=Apache-2.0

# OpenWrt 23.05 的 luci.mk 版本规则只取 PKG_VERSION（忽略 PKG_RELEASE），
# 导致 GitHub Action 编译出的 ipk 没有 r 小版本（0.4 vs 0.4-r1）。
# 用 override VERSION 强制统一为 PKG_VERSION-rPKG_RELEASE。注意：必须
# 写在 include luci.mk 之前——luci.mk 末尾会立即 eval BuildPackage，
# 其 ipk 命名/control 里的 $(VERSION) 在那一刻固化，写后面就晚了。
# luci.mk 的 VERSION:= 是普通赋值（被 override 压住），且本值在新版
# luci.mk 与 i18n 子包（PKG_PO_VERSION）下与默认一致，不影响 apk/新版。
override VERSION:=$(if $(PKG_RELEASE),$(PKG_VERSION)-r$(PKG_RELEASE),$(PKG_VERSION))

LUCI_TITLE:=Liquid glass theme for LuCI (>= 23)
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+luci-base

# 汉化/子包版本与主包保持同步
PKG_PO_VERSION:=$(PKG_VERSION)-r$(PKG_RELEASE)

# csstidy 会破坏 @media 块（只保留首条规则，其余泄漏到块外无条件生效），
# 导致移动端断点样式全部失效；本主题关闭 CSS 压缩，样式原样打包。
CONFIG_LUCI_CSSTIDY:=

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Zed 自签公钥（与 luci-app-pushbot 同一把）：仅在不存在时写入。
	# 不打包为包内文件——pushbot 已拥有 /etc/apk/keys/zed-openwrt-apk.pem，
	# 双包共存时 apk 会报 "trying to overwrite ... owned by luci-app-pushbot"
	# 归属冲突；改为安装时条件写入：装过 pushbot 的设备已有 → 跳过（零冲突），
	# 仅装本主题的用户装完即获得信任，后续 OTA 免 --allow-untrusted。
	[ -f /etc/apk/keys/zed-openwrt-apk.pem ] || {
		mkdir -p /etc/apk/keys
		printf '%s\n' \
			'-----BEGIN PUBLIC KEY-----' \
			'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE16+nzzY9Lx5wvzZoWs/18vZxsNZD' \
			'jv+CqECJLUj+fA7J228Iu13DVUO8CK9jQyLHtqkw0f4/X2bKLlLiz281zQ==' \
			'-----END PUBLIC KEY-----' > /etc/apk/keys/zed-openwrt-apk.pem
	}

	# 23.05 opkg 不执行 uci-defaults，必须在 postinst 中设置主题配置。
	# 确保 mediaurlbase 指向 liquid，否则 fallback 到 null。
	if [ "$$(uci -q get luci.main.mediaurlbase)" != "/luci-static/liquid" ]; then
		uci set luci.main.mediaurlbase=/luci-static/liquid
		uci commit luci
	fi

	rm -f /tmp/luci-indexcache.*
	rm -rf /tmp/luci-modulecache/
	/etc/init.d/rpcd reload 2>/dev/null
	exit 0
}
exit 0
endef

define Package/$(PKG_NAME)/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Liquid
	[ "$$(uci -q get luci.main.mediaurlbase)" = "/luci-static/liquid" ] && \
		uci -q delete luci.main.mediaurlbase
	uci commit luci
}
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
