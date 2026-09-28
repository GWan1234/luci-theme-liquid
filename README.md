<!-- markdownlint-configure-file {
  "MD013": {
    "code_blocks": false,
    "tables": false,
    "line_length":200
  },
  "MD033": false,
  "MD041": false
} -->

[license]: /LICENSE
[license-badge]: https://img.shields.io/github/license/zzsj0928/luci-theme-liquid?style=flat-square&a=1
[prs]: https://github.com/zzsj0928/luci-theme-liquid/pulls
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[issues]: https://github.com/zzsj0928/luci-theme-liquid/issues/new
[issues-badge]: https://img.shields.io/badge/Issues-welcome-brightgreen.svg?style=flat-square
[release]: https://github.com/zzsj0928/luci-theme-liquid/releases
[release-badge]: https://img.shields.io/github/v/release/zzsj0928/luci-theme-liquid?style=flat-square
[download]: https://github.com/zzsj0928/luci-theme-liquid/releases
[download-badge]: https://img.shields.io/github/downloads/zzsj0928/luci-theme-liquid/total?style=flat-square
[en-us-link]: /README_EN.md
[zh-cn-link]: /README.md
[official]: https://github.com/openwrt/openwrt
[immortalwrt]: https://github.com/immortalwrt/immortalwrt
[luci-mod]: https://github.com/xylz0928/luci-mod

<div align="center">
<p align="center"><img src="logo.svg" width="500"></p>

# 💧 luci-theme-liquid

**macOS 风格 Liquid Glass（液态玻璃）OpenWrt LuCI 主题**，适用于 **LuCI ≥ 23**（OpenWrt 23.05 / 24.10 / master）。

支持**亮色 / 暗色 / 跟随系统**三态切换、**5 套主题色 + 自定义颜色**、可调玻璃模糊与透明度；登录页、侧栏、内容卡片、下拉、悬浮框全链路液态玻璃质感。

[![license][license-badge]][license]
[![prs][prs-badge]][prs]
[![issues][issues-badge]][issues]
[![release][release-badge]][release]
[![download][download-badge]][download]

**简体中文** | [English][en-us-link]

[特性](#特性) •
[更新日志](#更新日志) •
[兼容性](#兼容性) •
[编译安装](#编译安装) •
[界面展示](#界面展示) •
[致谢](#致谢)

<img src="https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc.gif">

</div>

## 特性

- **液态玻璃设计语言**：侧栏、内容卡片、登录卡片、页脚统一 frosted-glass（模糊 + 高光 + 主题色光晕），暗色下玻璃更实、文字更清晰。
- **三态模式切换**：亮色 / 暗色 / 跟随系统，位于顶栏右侧（LuCI 原生刷新/轮询指示区旁），经 uci 持久化（换浏览器/设备仍保留），`localStorage` 仅作降级；页面加载即应用、无闪烁；锁屏页同样提供开关。
- **主题色切换**：5 套主题色（蓝色 / 玫红 / 橙黄 / 郁金香紫 / 黄绿），选中菜单、hover 滑块、按钮、Tab、logo 全链路联动；另支持**自定义主题色**——点击彩虹圆点输入 hex 颜色编码（`#RRGGBB`）即保存生效，非法值自动回退默认蓝，同样 uci 持久化。
- **左侧菜单**：默认全部折叠，点击一级菜单才展开其二级菜单；hover 追踪滑块 + 选中玻璃胶囊；移动端滑出菜单自动避让顶栏。
- **下拉控件**：所有下拉设置项为"保存并应用"式一体化渐变胶囊（主体 + 分隔箭头），点开后的选项列表保留玻璃设计；靠近视口底部自动向上弹出，不被页脚遮挡。
- **悬浮内容框（tooltip）**：磨砂玻璃底、portal 到页面顶层（永不被相邻卡片遮挡）、边缘自动避让、互斥防残留。
- **表格**：行内单元格等高（分割线对齐）；移动端按内容宽度排布 + 横向滚动（MAC / MTU 等长列不再重叠）。
- **接口 / 设备页**：接口图标统一 24px、强制不透明（连接状态由图标文件区分，不再半透误导）；GridSection 行内等高、操作按钮不换行；移动端接口小框左对齐、与其所在行卡片保持 4px 间隔。
- **移动端适配**：弹出窗口 95% 宽、嵌套卡片逐层向内缩进（展示更大操作区）；抽屉菜单点击空白处关闭、首屏直接收起无闪烁；下拉靠近视口底部自动向上弹出、不被页脚遮挡。
- **锁屏（登录页）**：macOS 风格玻璃登录卡片 + Monterey 壁纸（亮/暗）+ 可选 **Bing 每日壁纸**（每日自动抓取缓存）+ 内联 SVG 水滴 logo（跟随主题色 + 玻璃高光）。
- **SVG 图标**：网络 / 接口状态图标取自 [xylz0928/luci-mod][luci-mod] `immortalwrt-24.10` 分支的 SVG 图标集；UI 元素图标（sun / moon / auto / refresh / lock / search / close / chevron）为内置 SVG。

## 更新日志

- **2026-08-18 · v0.7**：移动端体验优化 + 多处体验优化
  - **移动端体验优化**
    - 滚动页面时浏览器工具栏 / 地址栏自动收缩，移动端获得更大视野
    - 底部横幅避让全面屏手势条
    - EasyTier 重启、刷新版本确认框在手机上居中显示
  - **多处体验优化**
    - 修复按钮描边不贴合圆角、边缘出现竖缝的问题（普通按钮 / 保存并应用 / 分割按钮）

> 📜 完整更新日志（v0.1 起全部版本）见 **[ChangeLogs.md](ChangeLogs.md)**。

## 兼容性

支持基于 [OpenWrt 官方][official] 与 [ImmortalWrt][immortalwrt] 的现代 LuCI 环境（LuCI ≥ 23，OpenWrt 23.05 / 24.10 / master）。

## 编译安装

本包使用 LuCI feed 的 `luci.mk` 打包规则（`include $(TOPDIR)/feeds/luci/luci.mk`），因此编译环境需先 `./scripts/feeds update -a && ./scripts/feeds install -a`（含 luci feed）。

把本目录放入 OpenWrt 源码树的 `package/luci-theme-liquid/`（或 `feeds/luci/themes/luci-theme-liquid/`），在 `.config` 中启用该包后编译：

```bash
cd openwrt/package
git clone https://github.com/xylz0928/luci-theme-liquid.git
make menuconfig   # 选择 LUCI → Themes → luci-theme-liquid
make -j1 V=s
```

或直接编译单个包：

```sh
# 在 .config 中启用（任选其一）
make menuconfig          # LuCI → Themes → luci-theme-liquid
# 或
echo 'CONFIG_PACKAGE_luci-theme-liquid=y' >> .config && make defconfig

make package/luci-theme-liquid/compile -j4 V=s
```

> 注意：`make package/<name>/compile` 只对已在 `.config` 中启用（`=y`/`=m`）的包真正执行构建，未启用时 make 会空转（`Entering/Leaving` 无任何动作），不要误判为成功。

生成的 `bin/packages/<arch>/base/luci-theme-liquid-0.3-r<rel>.apk`（或 `.ipk`）可通过 `apk` / `opkg` 安装：

```sh
apk add --allow-untrusted luci-theme-liquid-0.3-r1.apk
```

首次安装会自动注册主题（`luci.themes.Liquid=/luci-static/liquid`）；若 `luci.main.mediaurlbase` 尚未配置则自动设为该主题，否则请在 **System → Advanced → Theme** 中手动选择 **Liquid**。

### 目录结构

```
luci-theme-liquid/
├── Makefile                          # OpenWrt 包（luci feed 内/独立 package 目录均可编译）
├── logo.svg                          # 主题 logo（水滴 + Liquid）
├── htdocs/luci-static/liquid/        # 主题媒体资源（/luci-static/liquid/）
│   ├── cascade.css                   # 全部样式（变量 / 菜单 / tab / cbi / dashboard / 锁屏）
│   ├── main.js                       # 模式开关注入、下拉避让、tooltip portal 等
│   ├── logo.svg / logo.png           # 主题 logo
│   ├── img/                          # 锁屏壁纸（MontereyDark / MontereyLight）
│   ├── icons/                        # 网络状态 SVG 图标（来自 luci-mod immortalwrt-24.10）
│   └── svg/                          # UI 元素 SVG + dashboard 图标
├── htdocs/luci-static/resources/     # 共享资源（/luci-static/resources/）
│   ├── menu-liquid.js                # 左侧菜单 / tab 渲染（L.require('menu-liquid')）
│   └── view/liquid/sysauth.js        # 锁屏登录视图（ui.showModal 'login'）
├── ucode/template/themes/liquid/     # 主题 ucode 模板
│   ├── header.ut / footer.ut         # 页面骨架（uci 配置读取 / 防闪烁 / Bing 壁纸缓存）
│   └── sysauth.ut                    # 登录页模板（blank_page + 居中登录框）
└── root/
    ├── etc/uci-defaults/            # 安装时注册 luci.themes.Liquid
    └── usr/share/ucode/luci/controller/liquid.uc   # 主题配置保存端点（/admin/system/liquid/save_config）
```

## 界面展示

- 桌面端

![桌面端-锁屏-暗黑模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-lock-dark.png)
![桌面端-主界面-暗黑模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-mainpage-dark.png)
![桌面端-锁屏-明亮模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-lock-light.png)
![桌面端-主界面-明亮模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-mainpage-light.png)


- 移动端

![移动端-暗黑模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_mobile-dark.jpg)
![移动端-明亮模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_mobile-light.jpg)

## 致谢

- 壁纸：macOS Monterey（Bright/Dark），来自 [xylz0928/luci-mod][luci-mod] `Background/`。
- 网络状态 SVG 图标：来自 [xylz0928/luci-mod][luci-mod] `immortalwrt-24.10` 分支 `feeds/luci/modules/luci-base/htdocs/luci-static/resources/icons/`。
- dashboard 模块图标（router / internet / wireless / devices）：来自 OpenWrt 官方 [luci-mod-dashboard](https://github.com/openwrt/luci/tree/master/modules/luci-mod-dashboard)。
- 菜单渲染逻辑参考 [luci-theme-openwrt-2020](https://github.com/openwrt/luci/tree/master/themes/luci-theme-openwrt-2020)，锁屏视图参考 [luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap)（Apache-2.0）。

## 🍡 赏我一把 Token
**制作不易，感谢支持**
![赞赠](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/general/donate-zed.jpg)

## License

Apache-2.0
