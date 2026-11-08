# 苔生 Mossy · 点单小程序

基于 `dcloudio/uni-preset-vue#vite-ts`（uni-app + Vue 3 + TypeScript）。设计参考两张稿：深林绿 / 鼠尾草绿的大圆角卡片与弧形竖排分类栏（稿 1），缺口价签、抹茶色条带与配料标签（稿 2）。所有数据均为 Mock，商品图用 CSS 绘制的饮品插画代替。

## 运行

```bash
npm install
npm run dev:mp-weixin     # 微信小程序，开发者工具导入 dist/dev/mp-weixin
npm run dev:h5            # 浏览器预览，建议打开手机模拟
npm run build:mp-weixin   # 生产构建 → dist/build/mp-weixin
```

在 `src/manifest.json` 的 `mp-weixin.appid` 填入自己的 AppID；没有的话在开发者工具里选「测试号」即可。

## 功能

- **广场**：问候卡 + 商家日常分享的两列瀑布流（筛选、下拉刷新、上滑加载往期、点赞），动态详情可直接点同款饮品。
- **点单**：左侧弧形竖排分类与商品列表联动滚动；「+」按默认规格快速加购，点卡片打开规格弹层；购物车条与购物车弹层；结算页自取 / 外送、自动选择最优礼品券、余额或微信支付（模拟）；下单后进入取餐号页，制作进度按时间推进。
- **会员储值**：充 500 送 100、充 1000 送 300，余额、累计赠送、会员等级实时更新，附储值记录。
- **礼品券**：由店长 / 门店 / 会员中心发放，券面写明发放人与原因；可使用、已使用、已过期三栏；支持输入商家兑换码领取（演示码 `MOSS2026`、`MATCHA88`）。
- 「我的」底部有「重置演示数据」，清空本地缓存恢复初始状态。

## 目录

```
src/
├─ pages/
│  ├─ index/index.vue      首页外壳：三个 tab 视图 + 悬浮胶囊底栏
│  ├─ post/                动态详情
│  ├─ checkout/            确认订单
│  ├─ order/               订单详情 / 取餐号
│  ├─ recharge/            会员储值
│  └─ coupons/             礼品券
├─ views/                  SquareView / MenuView / MineView（三个 tab 的内容）
├─ components/
│  ├─ DrinkArt.vue         CSS 饮品插画（tall 带盖杯 / rocks 切面杯 / mug 马克杯）
│  ├─ CoverArt.vue         动态封面（渐变 + 叠圆 / 插画 / 大字）
│  ├─ Notch.vue            缺口价签（稿 2 的内凹圆角标签）
│  ├─ ProductCard.vue      商品卡（稿 1）
│  ├─ ProductSheet.vue     规格选择弹层（稿 2）
│  ├─ CouponCard.vue       礼品券
│  └─ TabBar / NavBar / Sheet / Stepper / Icon / CartSheet
├─ mock/                   商品、动态、礼品券、订单、兑换码
├─ store/index.ts          reactive 全局状态 + 本地缓存（未引入 Pinia）
├─ utils/                  导航栏尺寸、格式化、SVG 图标
└─ uni.scss                设计变量（颜色、字体、阴影），自动注入每个 scss 样式块
```

## 实现说明

- **底栏**：没有用原生 tabBar，三个 tab 在 `pages/index` 内切换。这样才能做出参考稿的悬浮深绿胶囊，切换时也不闪烁。视图首次访问才渲染，之后保留滚动位置。
- **导航栏**：全部使用 `navigationStyle: custom`，按胶囊按钮位置计算高度（`utils/layout.ts`），标题左对齐避开胶囊。
- **图标**：线性 SVG 在运行时转成 base64 data URI，交给 `<image>` 显示，无需图标字体或图片资源。
- **替换真实数据**：改 `src/mock/*` 和 `src/store/index.ts` 中的 `placeOrder` / `recharge` / `redeemCode`，接入接口与 `uni.requestPayment` 即可；把 `DrinkArt` 换成 `<image>` 就能用真实商品图。

## 需要在微信开发者工具中确认

本项目已通过 `build:mp-weixin` 与 `build:h5` 编译，H5 版做过逐屏截图检查，但尚未在开发者工具 / 真机上运行。建议重点看：SVG base64 图标显示、分类栏英文竖排（`writing-mode`）、杯身 `clip-path`、iOS 底部安全区。
# Cosen_Miniprogram
# Cosen_Miniprogram
