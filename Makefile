include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-liquid
PKG_VERSION:=0.1
PKG_RELEASE:=55

PKG_MAINTAINER:=然后七年 <69092025+zzsj0928@users.noreply.github.com>
PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=Liquid glass theme for LuCI (>= 23)
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+luci-base

# 汉化/子包版本与主包保持同步
PKG_PO_VERSION:=$(PKG_VERSION)-r$(PKG_RELEASE)

# csstidy 会破坏 @media 块（只保留首条规则，其余泄漏到块外无条件生效），
# 导致移动端断点样式全部失效；本主题关闭 CSS 压缩，样式原样打包。
CONFIG_LUCI_CSSTIDY:=

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

# 版本迭代：改 PKG_RELEASE（r 值）时，同步更新
# ucode/template/themes/liquid/VERSION（模板用它做 foot 显示与 ?v= 缓存破坏）。
include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
