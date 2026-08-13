include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-liquid
PKG_VERSION:=0.5
PKG_RELEASE:=1

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

# 版本迭代：改 PKG_RELEASE（r 值）时无需再手动同步 VERSION 文件。
# Build/Prepare 阶段用 $(VERSION) 动态写入 PKG_BUILD_DIR 中的
# VERSION 文件（覆盖仓库内静态占位），随后 luci.mk 默认 install
# 将其复制进包 —— 与 Makefile 的 PKG_VERSION/PKG_RELEASE 永远一致。
# （header.ut/footer.ut 用它做 foot 显示与 ?v= 缓存破坏）
define Build/Prepare/luci-theme-liquid
	$(call Build/Prepare/Default)
	echo '$(VERSION)' > $(PKG_BUILD_DIR)/ucode/template/themes/liquid/VERSION
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
