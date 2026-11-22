# 小程序请求层（`src/api`）

契约来源：`reference/cosen-api-v1.openapi.yaml`（v1.4.0，19 接口），错误码口径见契约仓库 `docs/error-codes.md`。
已接**全部 19 个接口**：第一组 9（认证 4 + 会员 2 + 商品目录 3）+ 第二组 7（券 2 + 订单/支付 5）+ 充值 3。

本地开发默认仍是 **纯 mock 版**：`useMock = true`，页面继续读 `src/mock/*`，请求层不会被调用。
生产构建默认加载仓库内的 `.env.production`，连接线上真实 API；构建本身不要求本机后端（8080/8081）运行。

---

## 1. 目录结构

```
src/config/env.ts        运行环境开关：useMock（默认 true）、API_BASE_URL、LOGIN_PAGE
src/api/request.ts       统一请求封装：baseURL、token 注入、真实 HTTP 状态码 + body.code、
                         401 清 token 跳登录、业务码 → 文案/动作映射表（ERROR_RULES）
src/api/token.ts         token 存取（uni storage，key = cosen:member-token）
src/api/types.ts         契约 DTO（手写 TS interface，金额字段一律「分」）
src/api/money.ts         分 ↔ 元工具：centToYuan / yuanToCent / centText / centText2
src/api/auth.ts          POST /app/auth/login/wechat、/app/auth/login/mock、
                         /app/auth/phone/bind、/app/auth/logout
src/api/member.ts        GET /app/member/profile、GET /app/member/balance/flows
src/api/catalog.ts       GET /app/catalog/categories、/app/catalog/products、
                         /app/catalog/products/{code}（含 DTO → 页面模型适配）
src/api/coupon.ts        GET /app/coupons、/app/coupons/{couponNo}（含五态映射）
src/api/order.ts         POST /app/orders、GET /app/orders、/app/orders/{orderNo}、
                         pay、cancel（含 DTO → 页面模型与状态文案）
src/api/recharge.ts      GET /app/recharge/tiers、POST /app/recharges、
                         GET /app/recharges/{rechargeNo}（含充值独立幂等键前缀）
src/api/index.ts         统一出口
```

## 2. 如何切真实环境

环境变量（只有 `VITE_` 前缀会打进客户端）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `VITE_COSEN_USE_MOCK` | 缺省 = `true` | 只有显式 `false` / `0` / `off` 才切真实接口 |
| `VITE_COSEN_API_BASE_URL` | `http://127.0.0.1:8080` | 契约 `servers[0]`；后端换端口时覆盖 |

### 2.1 本地 mock / 真后端联调

不配置任何本机覆盖时，`npm run dev:h5` / `npm run dev:mp-weixin` 默认使用 mock。
需要直连本机后端时可建 `.env.local`（已被 `*.local` 忽略，不会提交）：

```bash
VITE_COSEN_USE_MOCK=false
# 契约端口是 8080；若后端另起在 8081，改这里
VITE_COSEN_API_BASE_URL=http://127.0.0.1:8080
```

H5 联调也可运行 `scripts/dev-real.sh start`，通过 Vite proxy 同源访问后端，避免 CORS。
`VITE_COSEN_API_BASE_URL` 不含 `/app` 前缀；显式空串表示同源访问 `/app/**`。
本地开发切回 mock：删掉 `.env.local`，或把 `VITE_COSEN_USE_MOCK` 改回 `true`；修改后需重启开发服务。

### 2.2 线上真实环境（已纳入仓库）

仓库根目录 `.env.production` 仅包含公开客户端配置：

```bash
VITE_COSEN_USE_MOCK=false
VITE_COSEN_API_BASE_URL=https://cosen.tablejoker.com
```

以下命令默认使用 production 模式，自动加载该配置，无需另建 `.env.production.local`：

```bash
npm run build:h5
npm run build:mp-weixin
```

如需在本地 H5 开发时连接线上环境，可显式使用相同模式：

```bash
npm run dev:h5 -- --mode production
```

**覆盖优先级（从高到低）**：命令行进程环境变量 → `.env.production.local` → `.env.production` → `.env.local` → `.env`。
开发模式对应 `.env.development.local` / `.env.development`，不会自动读取 `.env.production`。
原有 `.env.production.local` 可保留作为本机覆盖，但仍被 Git 忽略；不要将密钥或 Token 写入任何 `VITE_` 配置，它们会被打进客户端。

生产模式切回 mock 请显式覆盖，而不是仅删除 `.env.local`（生产配置优先级更高）：

```bash
VITE_COSEN_USE_MOCK=true npm run build:h5
VITE_COSEN_USE_MOCK=true npm run build:mp-weixin
```

注意：微信开发者工具里的 `http://127.0.0.1` 是开发者工具所在机器，不是手机；真机联调需换成局域网 IP 或域名，并在小程序后台配置 request 合法域名。线上 H5 跨域访问仍需后端允许 CORS，Vite 开发代理不随生产构建发布。

## 3. token 存在哪

- 存储：`uni.setStorageSync('cosen:member-token', token)`
  - H5 → localStorage；小程序 → wx storage；冷启动可恢复。
- 读取：`src/api/token.ts` 的 `getToken()`（带内存缓存）；`hasToken()` 判断登录态。
- 注入：`request.ts` 对非登录接口自动加 `Authorization: Bearer <token>`（契约 `bearerAuth`，UUID 不透明串，7 天有效）。
- 登录接口传 `auth: false`，不会带旧 token。
- 收到 40101/40104/40105/40106（动作 `relogin`）时：`clearToken()` → toast → `uni.reLaunch('/pages/login/index')`；3 秒内去重，避免并发请求连环跳转。
- `POST /app/auth/logout` 成功后清 token；失败保留（避免「注销失败却丢登录态」）。

## 4. 错误码 → 前端动作映射表

动作取值：`relogin`（清 token 跳登录）、`retry`（提示重试）、`refresh`（刷新资源）、`toast`（仅提示）、`contact`（联系门店）、`report`（提示并上报 traceId）、`hide`（隐藏入口）、`none`（无需处理）。
完整表在 `src/api/request.ts` 的 `ERROR_RULES`，与 `docs/error-codes.md`「前端处理」列一致。

### 4.1 参数 / 认证

| 业务码 | HTTP | 动作 | 前端文案 |
|---|---|---|---|
| 40001 | 400 | toast | 请补全必填信息 |
| 40002 | 400 | toast | 参数格式不正确 |
| 40003 | 400 | report | 参数取值不合法 |
| 40004 | 400 | refresh | 分页参数超出范围 |
| 40005 | 413 | toast | 内容过大，请精简后重试 |
| 40006 | 415 | report | 请求格式不支持 |
| 40007 | 400 | retry | 请求已失效，请重试 |
| 40101 | 401 | relogin | 请先登录 |
| 40102 | 401 | toast | 微信登录失败，请重试 |
| 40103 | 401 | toast | 手机号获取失败，请重新授权 |
| 40104 | 401 | relogin | 登录已过期，请重新登录 |
| 40105 | 401 | relogin | 登录信息已失效，请重新登录 |
| 40106 | 401 | relogin | 登录状态已失效，请重新登录 |
| 40107 | 400 | refresh | 验证码错误或已过期 |

### 4.2 权限 / 不存在

| 业务码 | HTTP | 动作 | 前端文案 |
|---|---|---|---|
| 40301 | 403 | report | 没有权限查看该内容 |
| 40302 | 403 | toast | 当前环境未开放演示登录 |
| 40303 | 403 | contact | 账号已被限制，请联系门店 |
| 40304 | 403 | hide | 该功能暂未开放 |
| 40401 | 404 | refresh | 商品不存在或已下架 |
| 40402 | 404 | refresh | 分类不存在 |
| 40403 | 404 | refresh | 券不存在或不属于你 |
| 40404 | 404 | refresh | 订单不存在 |
| 40405 | 404 | relogin | 会员信息不存在，请重新登录 |
| 40406 | 404 | refresh | 充值档位不存在 |
| 40407 | 404 | refresh | 充值单不存在 |

### 4.3 会员 / 券 / 商品 / 订单 / 支付

| 业务码 | HTTP | 动作 | 前端文案 |
|---|---|---|---|
| 40901 | 409 | contact | 会员已停用，请联系门店 |
| 40902 | 409 | contact | 手机号已绑定其他会员 |
| 40903 | 409 | toast | 余额不足，请充值或更换支付方式 |
| 40904 | 400 | toast | 充值金额或档位不合法 |
| 40905 | 409 | refresh | 充值活动已结束 |
| 40906 | 409 | retry | 储值扣减失败，请重试 |
| 40907 | 409 | refresh | 券状态已变化，请刷新 |
| 40908 | 409 | refresh | 券已过期 |
| 40909 | 409 | toast | 未达到券使用门槛 |
| 40910 | 409 | toast | 该券不适用于当前订单 |
| 40911 | 409 | refresh | 券已被核销，请刷新 |
| 40912 | 409 | retry | 券转赠失败，请重试 |
| 40913 | 409 | refresh | 商品已下架 |
| 40914 | 409 | refresh | 商品售罄或库存不足 |
| 40915 | 409 | retry | 库存更新冲突，请重试 |
| 40916 | 409 | refresh | 订单状态已变化，请刷新 |
| 40917 | 409 | refresh | 订单已支付 |
| 40918 | 409 | refresh | 订单已取消或已完成 |
| 40919 | 409 | refresh | 价格校验失败，请刷新 |
| 40920 | 409 | toast | 支付金额拆分不一致 |
| 40921 | 400 | toast | 支付方式不支持 |
| 40922 | 502 | retry | 微信支付失败，请重试 |
| 40923 | 409 | contact | 退款失败，请联系门店 |
| 40924 | 502 | retry | 取餐码生成失败，请重试 |
| 40925 | 200 | none | 重复下单（幂等成功，进入订单详情） |
| 40926 | 200 | none | 重复支付回调（幂等成功） |

### 4.4 限流 / 服务端

| 业务码 | HTTP | 动作 | 前端文案 |
|---|---|---|---|
| 42901 | 429 | toast | 操作太频繁，请稍后再试 |
| 42902 | 429 | toast | 下单太频繁，请稍后再试 |
| 42903 | 429 | toast | 验证码请求太频繁 |
| 42904 | 429 | toast | 操作太频繁，请稍后再试 |
| 50001 | 500 | retry | 服务开小差了，请稍后重试 |
| 50002 | 500 | report | 数据校验异常，请联系门店 |
| 50301 | 503 | retry | 微信服务暂不可用 |
| 50302 | 503 | retry | 服务暂不可用，请稍后重试 |
| 50303 | 503 | retry | 支付通道维护中 |
| 50304 | 503 | retry | 系统维护中 |

未知码按 HTTP 状态兜底：401 → relogin、403 → toast、404 → refresh、5xx → retry，其余 toast。
网络失败（`uni.request` fail）统一抛 `ApiError(code=0, action='retry')`。

### 4.5 调用方式

```ts
import {
  getMemberProfile, listProducts, toProduct, centText,
  listMyCoupons, toCoupon, createOrder, getOrder, payOrder, cancelOrder, genIdempotencyKey
} from '@/api'

const profile = await getMemberProfile()               // 已注入 token，data 已拆包
const page = await listProducts({ category: 'matcha' }) // { total, rows }
const products = page.rows.map((dto) => toProduct(dto, 'matcha'))
console.log(centText(profile.balanceCent ?? 0))        // 分 → 元展示

// 第二组：券 / 下单 / 支付
const coupons = (await listMyCoupons()).map(toCoupon)
const order = await createOrder({
  items: [{ productCode: 'm1', qty: 2 }],
  couponId: coupons[0]?.couponNo,   // 注意：是 couponNo，不是本地 id
  payMode: 'wechat',
  idempotencyKey: genIdempotencyKey()
})
const detail = await getOrder(order.orderNo)           // 详情自带 items
await payOrder(order.orderNo, { payMode: 'wechat' })  // balance / wechat；mixed 暂不开放
await cancelOrder(order.orderNo)
```

错误：`try/catch` 拿到的是 `ApiError`（`code` / `httpStatus` / `traceId` / `action` / `message`），
请求层默认已经 toast；页面想自己提示时传 `{ silent: true }`。

## 5. 契约偏差处理（本轮）

| 偏差 | 处理 | 代码位 |
|---|---|---|
| 外送：契约 `fulfillType` 仅 `pickup` | 结算页下线「外卖配送」与 4 元配送费，固定到店自取；保留 `TODO(delivery)` 注释 | `pages/checkout/index.vue` |
| 券：契约 5 态 `unused/used/expired/transferred/frozen` | 券页 Tab 3 → 5（可使用/已使用/已过期/已转赠/已冻结），文案、计数、空态、票根印章补齐 | `pages/coupons/index.vue`、`store/index.ts`、`components/CouponCard.vue`、`mock/seed.ts` |
| 商品角标：契约 `badge` 为 `array<string>` | 前端类型改数组；`normalizeBadges()` 兼容旧 mock 字符串；商品卡多个角标显示「首个 +N」 | `types/index.ts`、`utils/badge.ts`、`components/ProductCard.vue`、`mock/products.ts` |
| 组合支付 `mixed`（契约有、mock 无） | 本轮不做 UI；类型加 `PayMode`，结算页留 `TODO(mixed)` 注释 | `types/index.ts`、`pages/checkout/index.vue` |

## 6. 第二组：券 / 订单 / 支付（契约 v1.4.0）

### 6.1 模块与函数

| 模块 | 函数 | 契约 |
|---|---|---|
| `coupon.ts` | `listMyCoupons(status?)` | `GET /app/coupons`（status 五态过滤，缺省全部，上限 100） |
| `coupon.ts` | `getCoupon(couponNo)` | `GET /app/coupons/{couponNo}`（非本人/不存在统一 40403） |
| `order.ts` | `createOrder(input)` | `POST /app/orders`（body/Header 幂等键） |
| `order.ts` | `listMyOrders({pageNum,pageSize,orderStatus})` | `GET /app/orders` → `{total, rows}` |
| `order.ts` | `getOrder(orderNo)` | `GET /app/orders/{orderNo}`（items 随详情返回） |
| `order.ts` | `payOrder(orderNo,{payMode,...})` | `POST /app/orders/{orderNo}/pay` |
| `order.ts` | `cancelOrder(orderNo)` | `POST /app/orders/{orderNo}/cancel` |

适配：`toCoupon/toCoupons`、`toOrderView`（详情）、`toOrderListItem`（列表）、`orderStatusText/payModeText`。

### 6.2 下单幂等键（重点）

- `createOrder` 会同时带 `Idempotency-Key` Header 和 `body.idempotencyKey`，值相同（契约二选一，前后端任一侧读都能命中）。
- **同一次提交的重试必须复用同一个 key**：结算页 `pages/checkout` 用 `pendingIdempotencyKey` + payload 签名保存；
  - 购物车 / 券 / 支付方式 / 备注变化 → 签名变化 → 重新生成 key；
  - 请求失败（网络、5xx、409xx）保留 key，用户再点提交仍走幂等；
  - `40007`（同 key 不同 payload）→ 丢弃旧 key，下次重新生成；
  - 成功后清空 key。
- `40925` = 幂等重复下单：`request.ts` 已按成功放行并拆出 `data`，结算页按成功跳 `/pages/order/index?no=<orderNo>`，**不弹错误 toast**。
- `40926` = 重复支付回调：同样按成功放行。

### 6.3 券五态与错误码

- 真实券列表 `status` 原样映射 `unused/used/expired/transferred/frozen` → 页面 `Coupon.status`；
  券页 Tab 仍由 `store.couponState()` 统一派生（`unused` → `available`，并兼容 mock 的按有效期判过期）。
- `40403`（券不存在/非本人）：`request.ts` 对 `/app/coupons*` 路径不弹错，券页 catch 后按空包处理。
- `40101/40104/40105/40106`：请求层清 token → toast → `reLaunch('/pages/login/index')`。
- 兑换码仅 mock 演示：契约没有兑换码通道，真实模式券页隐藏兑换入口。

### 6.4 订单页（`pages/order/index`）

- 路由：
  - 无参数 → 订单列表（真实 `listMyOrders` / mock `state.orders`）；
  - `?no=<16 位订单号>` → 真实详情（`getOrder`，带 items）；
  - `?id=<本地 id>` → mock 详情（保持原演示行为）。
- 取消：`cancelOrder`；`40916`（paid/making/ready，状态不允许取消）文案「订单状态已变化，请刷新」，
  `40918`（completed，已完成/已取消）文案「订单已取消或已完成」，两者由 `ERROR_RULES` 区分；
  `cancelled` 重复取消是幂等成功。
- 支付：`payOrder` 先支持 `balance` / `wechat`；`mixed` 仍不做 UI，按钮层提示「组合支付暂未开放」并留 `TODO(mixed)`，
  `PayOrderReq.balancePayCent/wechatPayCent` 参数位已就绪（40920/40921 文案已在映射表）。
- 40917（订单已支付）、40903（余额不足）、40922（微信失败）等由请求层 toast，页面刷新详情。

### 6.5 结算页真实分支（`pages/checkout`）

- `useMock=false` 时：购物车 → `{productCode: item.productId, qty}`；券 → `couponNo`；`payMode` 用当前选择；备注原样。
- 成功后清购物车并跳 `/pages/order/index?no=<orderNo>`（40925 幂等重放也走这里）。
- 券列表在真实模式改为 `listMyCoupons`（与券页同源），mock 分支完全不变。
- mock 分支仍走 `placeOrder` 与 1200/700ms 演示动画。

## 7. 充值（契约 v1.4.0，3 接口）

### 7.1 模块与函数

| 函数 | 契约 | 说明 |
|---|---|---|
| `listRechargeTiers()` | `GET /app/recharge/tiers` | **公开无鉴权**，显式 `auth:false`，不带会员 token |
| `createRecharge({tierCode,payMode}, idempotencyKey?)` | `POST /app/recharges` | Header `Idempotency-Key` 必填；`payMode` 固定 `wechat` |
| `getRecharge(rechargeNo)` | `GET /app/recharges/{rechargeNo}` | 只能查本人；不存在/非本人 40407 |

适配：`toRechargeTier/toRechargeTiers`（分→元），`RechargeTierView` 带 `available/hot/note`。

### 7.2 充值幂等键（独立命名空间）

- 充值 key 由 `newRechargeIdempotencyKey()` 生成，前缀固定 **`cosen-recharge:`**，与下单 `genIdempotencyKey()` 分开，**不共用**同一个存储/变量。
- 充值页用 `pendingRechargeKey + pendingRechargeSignature`（签名 = `tierCode|wechat`）：
  - 同一次提交重试复用同一个 key；
  - 切换档位 → 签名变化 → 重新生成；
  - 成功后清空；`40007`（同 key 不同 payload）丢弃旧 key；
  - 其它错误（40905/40904/40003/40922/50301）保留 key，同档位重试仍幂等。
- Header 必填：请求只带 `Idempotency-Key` Header；body 只放契约定义的 `tierCode/payMode`（契约未定义 body 幂等字段）。
- 同 key 同 payload 重放返回 HTTP 200 + 原充值单（**不返回 40925**，40925 专属下单）。

### 7.3 pending 轮询策略

- 创建后 `status=paid`（dev mock 微信渠道常见）→ 直接成功态，用 `balanceAfterCent`（缺省回查 `getMemberProfile`）刷新余额。
- `status=pending` → 轮询 `getRecharge`：**1s / 2s / 3s 退避，之后每 3s**，最多 60s；
  - `paid` → 成功；`closed` → 「支付已关闭」；`failed` → `failMsg`（如 40922）；
  - 60s 仍未结束 → toast「支付结果确认中」，停止轮询；页面 `onUnload` 取消定时器。
- `TODO(wxpay)`：真实微信 pending 需先 `uni.requestPayment(order.wx)` 再轮询，本轮留好轮询框架。

### 7.4 档位展示与错误码

- 档位由服务端下发，前端只渲染不硬编码；`hot` 显示「更划算」；`note` 原样展示。
- `available=false`：**置灰、保留展示、不可选**（点击 toast「该档位活动已结束」），不隐藏（运营可能想展示活动结束态）。
- 错误码：`40905` 活动结束、`40904` 档位/金额非法、`40003` 支付方式非法（非 wechat）、`40007` 幂等键非法、`40406` 档位/活动不存在、`40407` 充值单不存在/非本人、`40901` 会员停用、`40922` 微信下单失败、`42904` 限流；均按 `ERROR_RULES` 文案提示。
- 充值成功触发服务端等级重算；页面成功后重新拉会员资料同步余额/等级。

## 8. mock / 真实分支约定

- `useMock` 默认 `true`：所有页面行为与之前一致，仍读 `src/mock/*`。
- 已接真实分支的页面：
  - `pages/login/index.vue`：mock 模式写演示 token；真实模式调 `loginByWechat` / `loginByMock`。
  - `views/MineView.vue`：`useMock=false` 时 `onMounted` 调 `getMemberProfile()` 覆盖昵称、手机号、余额、积分、等级；失败回退 mock。
  - `pages/coupons/index.vue`：真实模式 `listMyCoupons` + 五态 Tab；兑换码入口仅 mock。
  - `pages/checkout/index.vue`：真实模式 `createOrder`（幂等键 + 券 couponNo）；mock 分支不变。
  - `pages/order/index.vue`：真实模式列表/详情/支付/取消；mock 分支不变。
  - `pages/recharge/index.vue`：真实模式档位/创建/轮询；mock 分支（原演示动画、档位数据、购物车多档位）不变。
- 仍未接真实接口：MenuView 商品目录渲染与充值轮播、MineView 最近订单卡片（点「全部订单」已可看真实列表）。
- 不一次性把 MenuView 改成真实请求：后端可能没起，先保留 mock 分支，后续按页面逐个切。

## 9. 后续留位（本轮只写类型/注释，不接）

- 真实微信支付：充值 `pending` 时接 `uni.requestPayment(order.wx)`，再复用现有 1s/2s/3s 轮询。
- 充值记录列表：契约暂无充值单列表接口，充值页真实模式不展示「储值记录」。
- 券详情页 UI（`getCoupon` 已封装，页面暂未接入）。
- `mixed` 组合支付 UI（`PayOrderReq` 参数位已留，需补拆分输入与 40920/40921 处理）。
- 订单列表分页加载（当前列表页取第 1 页 20 条；`listMyOrders` 已支持 pageNum/pageSize）。

## 10. 本地联调（real 模式，H5）

macbook 仓库根目录：

```bash
scripts/dev-real.sh start     # 后台启动（nohup），日志 /tmp/cosen-h5-real.log，pid /tmp/cosen-h5-real.pid
scripts/dev-real.sh status    # pid / 5173 监听 / 首页状态码
scripts/dev-real.sh restart   # 改代码后重启用（env 只在启动时注入）
scripts/dev-real.sh stop      # 只停 H5 dev server，不碰 8080
```

等价命令：

```bash
VITE_COSEN_USE_MOCK=false VITE_COSEN_API_BASE_URL='' npm run dev:h5
```

- 地址：本机 `http://127.0.0.1:5173/`，tailnet `http://100.116.44.85:5173/`；
- `vite.config.ts` 的开发态配置：`host: 0.0.0.0`、`port: 5173`（strictPort）、
  `proxy: { '/app': { target: 'http://127.0.0.1:8080', changeOrigin: true } }`；
  生产构建不受影响。
- `VITE_COSEN_API_BASE_URL=''` 为 **显式空串 = 同源**：浏览器请求 `/app/**`，
  由 vite proxy 转到 `127.0.0.1:8080`，因此无 CORS，也不依赖 `100.116.44.85:8080`。
  未设置该变量时才回退契约地址 `http://127.0.0.1:8080`；填绝对地址则直连（需后端 CORS）。
- 登录：真实模式首次访问需要会员态的页面（我的/券/订单/充值）会 401 跳
  `/pages/login/index`，点「联调账号登录」（默认手机号 `13800000817`）即可；token 存
  `cosen:member-token`。微信小程序内可用「微信一键登录」。
- 三条自检：

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5173/
curl -s -X POST http://127.0.0.1:5173/app/auth/login/mock \
  -H 'Content-Type: application/json' -d '{"phone":"13800000817"}'
curl -s -o /dev/null -w '%{http_code}\n' http://100.116.44.85:5173/
```

- 切回 mock：`scripts/dev-real.sh stop`，然后普通 `npm run dev:h5`（默认 `useMock=true`）。

常见问题：

| 现象 | 处理 |
|---|---|
| 5173 启动失败/端口占用 | `lsof -tiTCP:5173 -sTCP:LISTEN \| xargs kill -9`（只清 5173，不动 8080） |
| 代理 502 / ECONNREFUSED | 后端 8080 没起；检查 `lsof -nP -iTCP:8080 -sTCP:LISTEN`。**联调期间不要 kill 8080** |
| 浏览器报 CORS | 不要给 `VITE_COSEN_API_BASE_URL` 填绝对地址（如 `http://100.116.44.85:8080`），保持空串走同源代理 |
| 页面数据仍是 mock | 确认启动命令带 `VITE_COSEN_USE_MOCK=false`；改 env 后需 restart；可在 devtools Network 看是否请求 `/app/**` |
| 改了 env 但不生效 | Vite 的环境变量在启动时注入，`scripts/dev-real.sh restart` |

## 11. 验收命令

```bash
npm run type-check   # vue-tsc --noEmit，基线 0 错误，本轮必须保持
npm run build:h5     # uni build
```
