include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-liquid
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=然后七年 <69092025+zzsj0928@users.noreply.github.com>
PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=Liquid glass theme for LuCI (>= 23)
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+luci-base

# 汉化/子包版本与主包保持同步
PKG_PO_VERSION:=$(PKG_VERSION)-r$(PKG_RELEASE)

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
