# 可森 COSEN · 微信小程序

可森是一家日咖夜酒的社区咖啡店。白天喝咖啡，入夜后小酌，邻里随时可以坐下来聊聊。这个微信小程序用于浏览可森的店内动态、点单和查看会员权益。

## 界面设计

点单页顶部是可左右切换的会员储值卡，下方是 100rpx 弧形分类栏、错位叠放的饮品卡和悬浮底栏。奶油色、焦糖色与咖啡棕构成全局配色，咖啡豆和流动液滴图案延伸到广场与会员区。饮品插画用 CSS 绘制，咖啡泼洒图案用本地 SVG 绘制。

## 目前功能

- **广场**提供可森手记、今日推荐和店内动态，支持刷新、加载往期、点赞和点同款。
- **点单**支持按分类浏览、快速加购和选择规格。确认订单时可选自取或外送，并使用礼品券或会员余额。
- **会员储值**有充 500 送 100、充 1000 送 300 两档。可从点单页加入购物车，储值与饮品分别结算。
- **我的**集中展示近期订单、礼品券、会员储值与充值记录。演示兑换码为 `MOSS2026` 和 `MATCHA88`。

当前版本使用本地演示数据。菜单包含咖啡、抹茶、精酿、经典鸡尾酒和可森特调。门店资料、订单、储值与微信支付均用于演示。

## 本地运行

项目基于 uni-app、Vue 3 和 TypeScript。

```bash
npm ci
npm run dev:mp-weixin
```

将 `dist/dev/mp-weixin` 导入微信开发者工具。使用自己的小程序时，在 `src/manifest.json` 的 `mp-weixin.appid` 配置 AppID。

```bash
npm run dev:h5           # 浏览器预览
npm run type-check       # TypeScript 类型检查
npm run build:mp-weixin  # 输出到 dist/build/mp-weixin
npm run build:h5         # 输出到 dist/build/h5
```

## 项目结构

- `src/pages` 包含首页、动态详情、结算、订单、储值和礼品券页面。
- `src/views` 包含广场、点单与我的三个首页视图。
- `src/components` 包含商品卡、饮品插画、弹层和自定义底栏。
- `src/uni.scss` 定义全局配色、字体和阴影。`src/static/coffee-splash.svg` 存放咖啡泼洒图案。
- `src/mock` 提供演示内容。`src/store/index.ts` 管理状态和本地缓存。
