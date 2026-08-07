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
[license-badge]: https://img.shields.io/github/license/xylz0928/luci-theme-liquid?style=flat-square&a=1
[prs]: https://github.com/xylz0928/luci-theme-liquid/pulls
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[issues]: https://github.com/xylz0928/luci-theme-liquid/issues/new
[issues-badge]: https://img.shields.io/badge/Issues-welcome-brightgreen.svg?style=flat-square
[release]: https://github.com/xylz0928/luci-theme-liquid/releases
[release-badge]: https://img.shields.io/github/v/release/xylz0928/luci-theme-liquid?style=flat-square
[download]: https://github.com/xylz0928/luci-theme-liquid/releases
[download-badge]: https://img.shields.io/github/downloads/xylz0928/luci-theme-liquid/total?style=flat-square
[en-us-link]: /README_EN.md
[zh-cn-link]: /README.md
[official]: https://github.com/openwrt/openwrt
[immortalwrt]: https://github.com/immortalwrt/immortalwrt
[luci-mod]: https://github.com/xylz0928/luci-mod

<div align="center">
<p align="center"><img src="logo.svg" width="500"></p>

# 💧 luci-theme-liquid

**macOS 风格 Liquid Glass（液态玻璃）OpenWrt LuCI 主题**，适用于 **LuCI ≥ 23**（OpenWrt 23.05 / 24.10 / master）。

支持**亮色 / 暗色 / 跟随系统**三态切换、**5 套主题色**、可调玻璃模糊与透明度；登录页、侧栏、内容卡片、下拉、悬浮框全链路液态玻璃质感。

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
- **三态模式切换**：亮色 / 暗色 / 跟随系统，位于顶栏右侧（LuCI 原生刷新/轮询指示区旁），`localStorage` 持久化，页面加载即应用、无闪烁；锁屏页同样提供开关。
- **主题色切换**：5 套主题色（蓝色 / 玫红 / 橙黄 / 郁金香紫 / 黄绿），选中菜单、hover 滑块、按钮、Tab、logo 全链路联动。
- **左侧菜单**：默认全部折叠，点击一级菜单才展开其二级菜单；hover 追踪滑块 + 选中玻璃胶囊；移动端滑出菜单自动避让顶栏。
- **下拉控件**：所有下拉设置项为"保存并应用"式一体化渐变胶囊（主体 + 分隔箭头），点开后的选项列表保留玻璃设计；靠近视口底部自动向上弹出，不被页脚遮挡。
- **悬浮内容框（tooltip）**：磨砂玻璃底、portal 到页面顶层（永不被相邻卡片遮挡）、边缘自动避让、互斥防残留。
- **表格**：行内单元格等高（分割线对齐）；移动端按内容宽度排布 + 横向滚动（MAC / MTU 等长列不再重叠）。
- **接口 / 设备页**：接口图标统一 24px、强制不透明（连接状态由图标文件区分，不再半透误导）；GridSection 行内等高、操作按钮不换行。
- **锁屏（登录页）**：macOS 风格玻璃登录卡片 + Monterey 壁纸（亮/暗）+ 内联 SVG 水滴 logo（跟随主题色 + 玻璃高光）。
- **SVG 图标**：网络 / 接口状态图标取自 [xylz0928/luci-mod][luci-mod] `immortalwrt-24.10` 分支的 SVG 图标集；UI 元素图标（sun / moon / auto / refresh / lock / search / close / chevron）为内置 SVG。

## 更新日志

- **2026-08-07 · v0.2**：配置持久化（uci）+ Bing 每日壁纸 + 多项修复
  - **配置持久化（uci）**：亮/暗/自动模式、5 套主题色、Bing 开关统一存入 `uci /etc/config/liquid`，换客户端（浏览器/设备）仍保留；改动经 LuCI RPC 直接提交，立即生效、无"待应用"提示
  - **Bing 每日壁纸（锁屏）**：主题色前新增 Bing 开关按钮（字母 b logo）；启用后锁屏显示 Bing 当日壁纸（缓存于各设备 `/tmp/liquid/`）；无互联网或按钮关闭时自动回退默认壁纸（亮/暗各按模式）
  - **锁屏只读**：登录页仅本地预览，不写入配置
  - **uci 优先**：修复本地 localStorage 旧值覆盖 uci 新配置的问题，页面加载即应用路由器端配置
  - **接口页修复**：未加入防火墙区域的接口 head 色条由白色改为灰色（亮色浅灰 / 暗色近黑），暗色下接口名不再不可见
  - **CI**：GitHub Actions 双平台（x86 + MT798x）× 双格式（ipk / apk）自动构建发布
  - 版本号 0.2-r1

- **2026-08-07 · v0.1 首次发布**：全新 macOS 风格 Liquid Glass（液态玻璃）LuCI 主题，带来以下功能：
  - **液态玻璃设计语言**：侧栏、内容卡片、登录页、页脚统一 frosted-glass（模糊 + 高光 + 主题色光晕），暗色下玻璃更实、文字更清晰
  - **三态模式切换**：亮色 / 暗色 / 跟随系统，顶栏一键切换，`localStorage` 持久化、加载无闪烁
  - **主题色**：5 套主题色（蓝 / 玫红 / 橙黄 / 郁金香紫 / 黄绿），菜单、按钮、Tab、logo 全链路联动
  - **菜单**：默认全部折叠（点击一级菜单才展开二级）、hover 追踪滑块、选中玻璃胶囊、移动端滑出菜单
  - **下拉控件**：一体化渐变胶囊（主体 + 分隔箭头，同"保存并应用"），视口边缘自动向上弹出、不被页脚遮挡
  - **悬浮内容框（tooltip）**：磨砂玻璃底、顶层显示不被相邻卡片遮挡、边缘自动避让、互斥防残留
  - **表格**：行内单元格等高（分割线对齐）、移动端按内容宽度 + 横向滚动（长列不重叠）
  - **接口 / 设备页**：SVG 图标统一、连接状态由图标文件区分（不再半透误导）
  - **锁屏（登录页）**：macOS 风格玻璃登录卡片 + Monterey 壁纸 + 主题色水滴 logo
  - **兼容**：LuCI ≥ 23（OpenWrt 23.05 / 24.10 / master）

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

生成的 `bin/packages/<arch>/base/luci-theme-liquid-0.2-r<rel>.apk`（或 `.ipk`）可通过 `apk` / `opkg` 安装：

```sh
apk add --allow-untrusted luci-theme-liquid-0.2-r1.apk
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
│   ├── header.ut / footer.ut         # 页面骨架（含防闪烁模式脚本）
│   └── sysauth.ut                    # 登录页模板（blank_page + 居中登录框）
└── root/etc/uci-defaults/            # 安装时注册 luci.themes.Liquid
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

## License

Apache-2.0
