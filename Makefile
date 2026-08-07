#
# Copyright (C) 2026 然后七年 <69092025+zzsj0928@users.noreply.github.com>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-liquid
PKG_VERSION:=1.0
PKG_RELEASE:=1

LUCI_TITLE:=Liquid glass theme for LuCI (>= 23)
LUCI_DEPENDS:=+luci-base
LUCI_DESCRIPTION:=A macOS-style liquid glass theme with light/dark/auto mode, Monterey lock screen and glassified menu/dashboard/cbi.

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=然后七年 <69092025+zzsj0928@users.noreply.github.com>

define Package/luci-theme-liquid/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Liquid
	[ "$$(uci -q get luci.main.mediaurlbase)" = "/luci-static/liquid" ] && \
		uci -q delete luci.main.mediaurlbase
	uci commit luci
}
exit 0
endef

# 构建方式一：作为 luci feed 主题（feeds/luci/themes/luci-theme-liquid/）——
# 使用 feed 共享的 luci.mk 打包规则（htdocs->/www、ucode->/usr/share/ucode/luci、root->/）。
# 构建方式二：作为独立包放入 OpenWrt 源码 package/ 目录——使用自带安装规则。
ifneq ($(wildcard $(TOPDIR)/feeds/luci/luci.mk),)
include $(TOPDIR)/feeds/luci/luci.mk
else
include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=Themes
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
  PKGARCH:=all
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/www/luci-static/liquid
	$(CP) $(CURDIR)/htdocs/luci-static/liquid/* $(1)/www/luci-static/liquid/
	$(INSTALL_DIR) $(1)/www/luci-static/resources
	$(CP) $(CURDIR)/htdocs/luci-static/resources $(1)/www/luci-static/
	$(INSTALL_DIR) $(1)/usr/share/ucode/luci/template/themes/liquid
	$(CP) $(CURDIR)/ucode/template/themes/liquid/* $(1)/usr/share/ucode/luci/template/themes/liquid/
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(CP) $(CURDIR)/root/etc/uci-defaults/* $(1)/etc/uci-defaults/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
endif

# call BuildPackage - OpenWrt buildroot signature
