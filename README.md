# luci-theme-liquid

macOS 风格 **liquid glass（液态玻璃）** OpenWrt LuCI 主题，适用于 **LuCI ≥ 23**（OpenWrt 23.05 / 24.10 / master）。

## 特性

- **黑白及自动模式**：亮色 / 暗色 / 跟随系统 三态开关，位于顶部菜单栏右侧、LuCI 原生刷新/轮询指示区（`#indicators`）左边；选择持久化到 `localStorage`（`liquid-theme-mode`），页面加载时通过 `<html data-darkmode>` 提前应用，避免闪烁。
- **锁屏（登录页）**：macOS 风格锁屏 —— 居中玻璃登录卡片 + Monterey 壁纸（暗色 `MontereyDark.jpg` / 亮色 `MontereyLight.jpg`）。
- **左侧菜单 liquid glass 化**：菜单主界面、悬停高亮、当前选中高亮均为玻璃质感（模糊 + 高光 + 主题色光晕）。
- **右侧内容面板 liquid glass 化**：
  - 子页面 tab 按钮化（`#tabmenu` → 玻璃药丸按钮，选中项主题色渐变）；
  - 模块卡片化（dashboard `.Dashboard .dashboard-bg`、`status overview` 的 `.cbi-section`、cbi 表单 `.cbi-map` 均为玻璃卡片）；
  - 插件名 + 插件描述合并卡片（对第三方应用面板常见类 `.app-item / .app-card / .app-box / .app-entry` 提供玻璃卡片样式）。
- **SVG 图标**：网络/接口状态图标取自 [xylz0928/luci-mod](https://github.com/xylz0928/luci-mod) `immortalwrt-24.10` 分支的 SVG 图标集（含 `loading.svg`）；UI 元素图标（sun / moon / auto / refresh / lock / search / close / chevron / logo / spinner）为内置 SVG。

## 目录结构

```
luci-theme-liquid/
├── Makefile                          # OpenWrt 包（luci feed 内/独立 package 目录均可编译）
├── htdocs/luci-static/liquid/        # 主题媒体资源（/luci-static/liquid/）
│   ├── cascade.css                   # 全部样式（变量 / 菜单 / tab / cbi / dashboard / 锁屏）
│   ├── main.js                       # 模式开关注入与切换
│   ├── logo.svg / logo.png           # 主题 logo
│   ├── img/                          # 锁屏壁纸（MontereyDark / MontereyLight）
│   ├── icons/                        # 网络状态 SVG 图标（来自 luci-mod immortalwrt-24.10）
│   └── svg/                          # UI 元素 SVG + dashboard 图标
├── htdocs/luci-static/resources/     # 共享资源（/luci-static/resources/）
│   ├── menu-liquid.js                # 左侧菜单 / tab 渲染（L.require('menu-liquid')）
│   └── view/liquid/sysauth.js        # 锁屏登录视图（ui.showModal 'login'）
├── ucode/template/themes/liquid/     # 主题 ucode 模板
│   ├── header.ut / footer.ut         # 页面骨架（含防闪烁模式脚本）
│   └── sysauth.ut                    # 登录页模板（blank_page + 居中登录框）
└── root/etc/uci-defaults/            # 安装时注册 luci.themes.Liquid
```

## 编译安装

本包使用 LuCI feed 的 `luci.mk` 打包规则（`include $(TOPDIR)/feeds/luci/luci.mk`），因此编译环境需先 `./scripts/feeds update -a && ./scripts/feeds install -a`（含 luci feed）。

把本目录放入 OpenWrt 源码树的 `package/luci-theme-liquid/`（或 `feeds/luci/themes/luci-theme-liquid/`），在 `.config` 中启用该包后编译：

```sh
# 在 .config 中启用（任选其一）
make menuconfig          # LuCI → Themes → luci-theme-liquid
# 或
echo 'CONFIG_PACKAGE_luci-theme-liquid=y' >> .config && make defconfig

make package/luci-theme-liquid/compile -j4 V=s
```

> 注意：`make package/<name>/compile` 只对已在 `.config` 中启用（`=y`/`=m`）的包真正执行构建，未启用时 make 会空转（`Entering/Leaving` 无任何动作），不要误判为成功。

生成的 `bin/packages/<arch>/base/luci-theme-liquid-1.0-r1.apk` 可通过 `opkg`/`apk` 安装：

```sh
apk add --allow-untrusted luci-theme-liquid-1.0-r1.apk
```

首次安装会自动注册主题（`luci.themes.Liquid=/luci-static/liquid`）；若 `luci.main.mediaurlbase` 尚未配置则自动设为该主题，否则请在 **System → Advanced → Theme** 中手动选择 **Liquid**。

## 模式切换

- **亮 / 暗**：强制使用对应配色。
- **自动**：跟随操作系统 `prefers-color-scheme`，系统切换时实时跟随。
- 锁屏（登录页）右上角同样提供开关。

## 致谢

- 壁纸：macOS Monterey（Bright/Dark），来自 [xylz0928/luci-mod](https://github.com/xylz0928/luci-mod) `Background/`。
- 网络状态 SVG 图标：来自 [xylz0928/luci-mod](https://github.com/xylz0928/luci-mod) `immortalwrt-24.10` 分支 `feeds/luci/modules/luci-base/htdocs/luci-static/resources/icons/`。
- dashboard 模块图标（router / internet / wireless / devices）：来自 OpenWrt 官方 [luci-mod-dashboard](https://github.com/openwrt/luci/tree/master/modules/luci-mod-dashboard)。
- 菜单渲染逻辑参考 [luci-theme-openwrt-2020](https://github.com/openwrt/luci/tree/master/themes/luci-theme-openwrt-2020)，锁屏视图参考 [luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap)（Apache-2.0）。

## License

Apache-2.0
