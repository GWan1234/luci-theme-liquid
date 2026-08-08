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
<p align="center"><img src="logo.svg" width="300"></p>

# 💧 luci-theme-liquid

**macOS-style Liquid Glass OpenWrt LuCI theme**, for **LuCI ≥ 23** (OpenWrt 23.05 / 24.10 / master).

Supports **light / dark / auto** modes, **5 accent colors** and adjustable blur & transparency; frosted glass design across the login page, sidebar, content cards, dropdowns and tooltips.

[![license][license-badge]][license]
[![prs][prs-badge]][prs]
[![issues][issues-badge]][issues]
[![release][release-badge]][release]
[![download][download-badge]][download]

**English** | [简体中文][zh-cn-link]

[Features](#features) •
[Changelog](#changelog) •
[Compatibility](#compatibility) •
[Building & Installation](#building--installation) •
[Screenshots](#screenshots) •
[Credits](#credits)

<img src="https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc.gif">
</div>

## Features

- **Liquid glass design language**: sidebar, content cards, login card and footer share a frosted-glass look (blur + highlight + theme-colored glow); the dark mode glass is more solid for readable text.
- **Three-way mode switch**: light / dark / auto (follow system), located at the top-right of the top bar (next to LuCI's native refresh/poll indicators), persisted via `localStorage`, applied before paint with no flash; the lock screen offers the same switch.
- **Accent colors**: 5 themes (blue / magenta / amber / tulip purple / yellow-green) driving the selected menu, hover slider, buttons, tabs and logo in one linked system.
- **Sidebar menu**: all top-level menus collapsed by default — click a level-1 menu to expand its own submenu; hover-tracking slider + selected glass capsule; the mobile slide-out menu avoids the top bar.
- **Dropdown controls**: every dropdown setting renders as a "Save & Apply"-style gradient capsule (body + divider + arrow); the opened option list keeps the glass design; near the viewport bottom the list flips upward so it is never clipped by the footer.
- **Tooltips**: frosted glass background, portaled to the page top-level (never hidden behind a neighbouring card), auto-avoid viewport edges, mutual exclusion against stale popups.
- **Tables**: equal-height cells per row (dividers align); on mobile, tables lay out at content width with horizontal scrolling (long columns like MAC / MTU no longer overlap).
- **Interfaces / Devices pages**: uniform 24px interface icons, forced opaque (link state is told by the icon file, not translucency); GridSection rows keep equal heights; action buttons never wrap.
- **Lock screen (login)**: macOS-style frosted login card + Monterey wallpaper (light/dark) + inline SVG waterdrop logo (follows the accent color with a glass highlight).
- **SVG icons**: network / interface status icons taken from [xylz0928/luci-mod][luci-mod] `immortalwrt-24.10`; UI element icons (sun / moon / auto / refresh / lock / search / close / chevron) are built-in SVGs.

## Changelog

- **2026-08-08 · v0.3**: custom accent color + color-switch polish + mobile / dark-mode improvements
  - **Custom accent color**: beyond the 5 presets — click the rainbow dot to drop a hex input (`#RRGGBB`); leaving the field saves and applies instantly; invalid values fall back to default blue (custom mode stays enabled); persisted via uci across clients
  - **Color switch**: pill fixed at 35px; a selected custom dot shows its color inside with a rainbow ring for instant recognition; the Bing wallpaper button gets a square outline hugging its icon and a single white ring when active
  - **Mobile**: no first-load menu flash (desktop entry animation disabled so the drawer starts closed and usable immediately); footer height trimmed
  - **Dark mode**: mode-switch icons (external svg) inverted to light so they stay visible on dark backgrounds
  - **Fixes**: custom-color persistence (controller whitelist accepts `accent=custom` / `accent_custom`), login-page color-switch position, pill height

- **2026-08-08 · v0.2-r52**: mobile UX & dropdown improvements
  - **Mobile interfaces page**: ifacebox aligned 4px from its row card's left edge for a cleaner look
  - **Mobile nested-card insets**: modal at 95% width, each nested layer steps in 2px, giving a larger usable area
  - **Mobile menu**: tapping outside closes the menu
  - **Desktop modal / nested cards**: improved display (modal at 80% width, nested layers width-constrained to prevent overflow)
  - **Dropdowns**: single-select & multi-select interaction and display polish

- **2026-08-07 · v0.2**: persistent config (uci) + Bing daily wallpaper + fixes
  - **Persistent config (uci)**: light/dark/auto mode, the 5 accent colors and the Bing switch are stored in `uci /etc/config/liquid`, so the settings follow the router across clients (browsers / devices); changes are committed through the theme's own ucode endpoint and take effect immediately with no "pending apply" entries or save prompts.
  - **Bing daily wallpaper (lock screen)**: a Bing toggle button (letter-b logo) sits before the five accent colors; when enabled, the lock screen shows Bing's picture of the day (cached per device in `/tmp/liquid/`); when offline or disabled it falls back to the default wallpaper (per mode).
  - **Lock screen read-only**: the login page only previews locally and never writes configuration.
  - **uci wins**: fixed stale localStorage overriding the uci config — every reload applies the router-wide config.
  - **Interfaces page fix**: the head bar of interfaces not assigned to any firewall zone is now gray (light: light gray / dark: near-black) so the interface name stays readable in dark mode.
  - **CI**: GitHub Actions build & release on two platforms (x86 + MT798x) × two formats (ipk / apk).
  - Version bumped to 0.2-r1.

- **2026-08-07 · v0.1 (initial release)**: a brand-new macOS-style Liquid Glass LuCI theme
  - **Liquid glass design language**: frosted glass (blur + highlight + theme glow) across sidebar, content cards, login page and footer
  - **Three-way mode**: light / dark / auto from the top bar, persisted, no flash on load
  - **Accent colors**: 5 themes driving menus, buttons, tabs and logo
  - **Menu**: collapsed by default, hover-tracking slider, selected glass capsule, mobile slide-out menu
  - **Dropdowns**: gradient capsule (body + divider + arrow, same as "Save & Apply"), auto-flip at viewport edges
  - **Tooltips**: frosted glass, top-level display, edge avoidance
  - **Tables**: equal-height rows, horizontal scroll on mobile (no long-column overlap)
  - **Interfaces / Devices**: uniform SVG icons, link state told by the icon file
  - **Lock screen**: macOS-style frosted login card + Monterey wallpaper + accent-colored waterdrop logo
  - **Compatibility**: LuCI ≥ 23 (OpenWrt 23.05 / 24.10 / master)

## Compatibility

Targets modern LuCI environments based on [OpenWrt][official] and [ImmortalWrt][immortalwrt] (LuCI ≥ 23, OpenWrt 23.05 / 24.10 / master).

## Building & Installation

This package uses LuCI's `luci.mk` packaging (`include $(TOPDIR)/feeds/luci/luci.mk`), so the build tree needs `./scripts/feeds update -a && ./scripts/feeds install -a` (includes the luci feed).

Put this directory into `package/luci-theme-liquid/` (or `feeds/luci/themes/luci-theme-liquid/`) of the OpenWrt source tree, enable the package in `.config`, then build:

```bash
cd openwrt/package
git clone https://github.com/xylz0928/luci-theme-liquid.git
make menuconfig   # choose LUCI → Themes → luci-theme-liquid
make -j1 V=s
```

Or build only this package:

```sh
# enable it in .config (either way)
make menuconfig          # LuCI → Themes → luci-theme-liquid
# or
echo 'CONFIG_PACKAGE_luci-theme-liquid=y' >> .config && make defconfig

make package/luci-theme-liquid/compile -j4 V=s
```

> Note: `make package/<name>/compile` only really builds packages enabled (`=y`/`=m`) in `.config`; otherwise make no-ops (just prints `Entering/Leaving`), which is not a successful build.

The produced `bin/packages/<arch>/base/luci-theme-liquid-0.2-r<rel>.apk` (or `.ipk`) can be installed with `apk` / `opkg`:

```sh
apk add --allow-untrusted luci-theme-liquid-0.2-r13.apk
```

On first install the theme is registered automatically (`luci.themes.Liquid=/luci-static/liquid`); if `luci.main.mediaurlbase` is not set it is set to the theme, otherwise pick **Liquid** manually at **System → Advanced → Theme**.

### Directory layout

```
luci-theme-liquid/
├── Makefile                          # OpenWrt package (works inside luci feed or a standalone package dir)
├── logo.svg                          # theme logo (waterdrop + Liquid)
├── htdocs/luci-static/liquid/        # theme assets (/luci-static/liquid/)
│   ├── cascade.css                   # all styles (vars / menu / tab / cbi / dashboard / lock screen)
│   ├── main.js                       # mode switch, dropdown flip, tooltip portal, config saving
│   ├── logo.svg / logo.png           # theme logo
│   ├── img/                          # lock screen wallpapers (MontereyDark / MontereyLight)
│   ├── icons/                        # network status SVG icons (from luci-mod immortalwrt-24.10)
│   └── svg/                          # UI element SVGs + dashboard icons
├── htdocs/luci-static/resources/     # shared resources (/luci-static/resources/)
│   ├── menu-liquid.js                # sidebar menu / tab rendering (L.require('menu-liquid'))
│   └── view/liquid/sysauth.js        # lock screen login view (ui.showModal 'login')
├── root/usr/share/ucode/luci/        # ucode controller (config save endpoint)
│   └── controller/liquid.uc
├── root/usr/share/luci/menu.d/       # dispatcher route registration
│   └── liquid.json
├── ucode/template/themes/liquid/     # theme ucode templates
│   ├── header.ut / footer.ut         # page skeleton (incl. anti-flash mode script)
│   └── sysauth.ut                    # login template (blank_page + centered login box)
└── root/etc/uci-defaults/            # registers luci.themes.Liquid on install
```

## Screenshots

- 桌面端

![桌面端-锁屏-暗黑模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-lock-dark.png)
![桌面端-主界面-暗黑模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-mainpage-dark.png)
![桌面端-锁屏-明亮模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-lock-light.png)
![桌面端-主界面-明亮模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_pc-mainpage-light.png)


- 移动端

![移动端-暗黑模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_mobile-dark.jpg)
![移动端-明亮模式](https://raw.githubusercontent.com/zzsj0928/ReadmeContents/master/liquid/luci-theme-liquid_mobile-light.jpg)

## Credits

- Wallpapers: macOS Monterey (Bright/Dark), from [xylz0928/luci-mod][luci-mod] `Background/`.
- Network status SVG icons: from [xylz0928/luci-mod][luci-mod] `immortalwrt-24.10` branch `feeds/luci/modules/luci-base/htdocs/luci-static/resources/icons/`.
- dashboard module icons (router / internet / wireless / devices): from official OpenWrt [luci-mod-dashboard](https://github.com/openwrt/luci/tree/master/modules/luci-mod-dashboard).
- Menu rendering logic references [luci-theme-openwrt-2020](https://github.com/openwrt/luci/tree/master/themes/luci-theme-openwrt-2020), lock screen view references [luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap) (Apache-2.0).

## License

Apache-2.0
