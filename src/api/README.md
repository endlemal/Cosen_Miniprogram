# 小程序请求层（`src/api`）

契约来源：`reference/cosen-api-v1.openapi.yaml`（v1.3.0，19 接口），错误码口径见契约仓库 `docs/error-codes.md`。
本轮只接**第一组 9 个接口**（认证 4 + 会员 2 + 商品目录 3），其余接口只留位。

当前仓库默认仍是 **纯 mock 版**：`useMock = true`，页面继续读 `src/mock/*`，请求层不会被调用。
后端（8080/8081）没起时也能正常跑 `npm run build:h5`。

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
src/api/index.ts         统一出口
```

## 2. 如何切真实环境

环境变量（只有 `VITE_` 前缀会打进客户端）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `VITE_COSEN_USE_MOCK` | 缺省 = `true` | 只有显式 `false` / `0` / `off` 才切真实接口 |
| `VITE_COSEN_API_BASE_URL` | `http://127.0.0.1:8080` | 契约 `servers[0]`；后端换端口时覆盖 |

推荐本地建 `.env.local`（已被 `*.local` 忽略，不会提交）：

```bash
VITE_COSEN_USE_MOCK=false
# 契约端口是 8080；若后端另起在 8081，改这里
VITE_COSEN_API_BASE_URL=http://127.0.0.1:8080
```

然后照常用 `npm run dev:h5` / `npm run build:h5` / `npm run dev:mp-weixin`。
注意：微信开发者工具里的 `http://127.0.0.1` 是开发者工具所在机器，不是手机；真机联调需换成局域网 IP 或域名，并在小程序后台配置 request 合法域名。

切回 mock：删掉 `.env.local`，或把 `VITE_COSEN_USE_MOCK` 改回 `true`。

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
import { getMemberProfile, listProducts, toProduct, centText } from '@/api'

const profile = await getMemberProfile()               // 已注入 token，data 已拆包
const page = await listProducts({ category: 'matcha' }) // { total, rows }
const products = page.rows.map((dto) => toProduct(dto, 'matcha'))
console.log(centText(profile.balanceCent ?? 0))        // 分 → 元展示
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

## 6. mock / 真实分支约定

- `useMock` 默认 `true`：所有页面行为与之前一致，仍读 `src/mock/*`。
- 已接真实分支的页面：
  - `pages/login/index.vue`：mock 模式写演示 token；真实模式调 `loginByWechat` / `loginByMock`。
  - `views/MineView.vue`：`useMock=false` 时 `onMounted` 调 `getMemberProfile()` 覆盖昵称、手机号、余额、积分、等级；失败回退 mock。
  - 券背包 / 订单 / 充值：接口不在第一组，**本轮不接**，页面继续 mock。
- 不一次性改 MenuView / checkout 的数据源：后端可能没起，先保留 mock 分支，后续按页面逐个切。
- 新增页面 `/pages/login/index` 只作为 401 的落地页，不影响现有 tab 流程。

## 7. 后续留位（本轮只写类型/注释，不接）

- 券：`GET /app/coupons`、`GET /app/coupons/{couponNo}`。
- 订单：`POST /app/orders`、`GET /app/orders`、`GET /app/orders/{orderNo}`、`pay`、`cancel`；
  下单需 `Idempotency-Key`，工具已备 `genIdempotencyKey()`；`40925/40926` 已按幂等成功放行。
- 充值三接口（`docs/recharge-api-draft.md`）：`GET /app/recharge/tiers`、`POST /app/recharges`、
  `GET /app/recharges/{rechargeNo}`；错误码 40407/40904–40906/42904 已在映射表内。

## 8. 验收命令

```bash
npm run type-check   # vue-tsc --noEmit，基线 0 错误，本轮必须保持
npm run build:h5     # uni build
```
