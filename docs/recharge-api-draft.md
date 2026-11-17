# 充值接口契约（v1.0 · 已评审 2026-11-18）

> 状态：**已评审 v1.0（2026-11-18）**，7 项决策全部按建议定稿（见 §8）。
> 落地：3 个客户端接口已进契约 `reference/cosen-api-v1.openapi.yaml` **v1.3.0**（tag `app/充值`）；微信回调**不进** `/app` 客户端契约，只在本文件描述。
> 依据：第一切片范围确认（充值纳入）、前端 mock `src/mock/seed.ts` 的 `RECHARGE_TIERS`、DDL `cosen_member_balance_flow` / `cosen_member` / `cosen_recharge_order`（V3）、错误码规范 `docs/error-codes.md`。
> 关联红线：充值**只增加储值余额**，不产生兑换码、不产生券；券仍无兑换码字段与兑换接口。

## 1. 范围与边界

| 项 | 结论 |
|---|---|
| 纳入范围 | 小程序「会员储值」页：档位展示、创建充值单、支付状态查询 |
| 支付渠道 | 仅微信支付（第一切片）；储值余额不能用于充值自身 |
| 金额单位 | 一律 `bigint` **分**（`amountCent` / `bonusCent` / `totalCent`），前端展示时 ÷100 |
| 幂等 | 创建充值单必带 `Idempotency-Key`；同 key 同 payload 返回 HTTP 200 + 原充值单（不用 40925）；微信回调幂等成功返回 40926 |
| 数据表 | **独立表 `cosen_recharge_order`**（V3 DDL），不复用 `cosen_order` |
| 等级联动 | 充值成功**触发会员等级重算**：累计实充只计本金，满 2000 元升级深焙 |
| 退款 | 第一切片**不做**退款 |
| 档位配置 | **环境配置 `cosen.recharge.tiers`**（活动/上下线随配置发布），远期再考虑 Base 第 5 张表 |
| Base 边界 | Base 4 张表**没有充值表**，`bitable/mapping.yaml` 的 `not_in_base` 已列 `cosen_member_balance_flow`；充值/账本为**系统主**（system），不同步 Base |

## 2. 档位定义（真源：前端 mock → 环境配置）

前端 `src/mock/seed.ts`：

```ts
export const RECHARGE_TIERS = [
  { amount: 500,  bonus: 100, name: '醇香储值', note: '相当于 8.3 折' },
  { amount: 1000, bonus: 300, name: '深焙储值', note: '相当于 7.7 折', hot: true }
]
```

契约由服务端下发（读取 `cosen.recharge.tiers`），前端只渲染不硬编码：

| tierCode | 档位名 | 实充（分） | 赠送（分） | 到账（分） | 备注 |
|---|---|---|---|---|---|
| `TIER_500_100` | 醇香储值 | 50000 | 10000 | 60000 | 相当于 8.3 折 |
| `TIER_1000_300` | 深焙储值 | 100000 | 30000 | 130000 | 相当于 7.7 折，推荐（hot） |

- 配置项示例（`application-bitable.yml` 同级或独立 profile，secrets 不入库）：

```yaml
cosen:
  recharge:
    tiers:
      - tier-code: TIER_500_100
        name: 醇香储值
        amount-cent: 50000
        bonus-cent: 10000
        note: 相当于 8.3 折
        hot: false
        campaign-id: RC202611
      - tier-code: TIER_1000_300
        name: 深焙储值
        amount-cent: 100000
        bonus-cent: 30000
        note: 相当于 7.7 折
        hot: true
        campaign-id: RC202611
```

- 档位不存在或已下架 → `40406`；档位金额/赠送不合法 → `40904`（HTTP 400）；活动已结束 → `40905`。

## 3. 接口（契约 v1.3.0 已落地的 3 个客户端接口）

统一响应信封沿用 `/app/**`：`{ code, msg, data, traceId }`；错误码语义见 §6。

### 3.1 `GET /app/recharge/tiers` 档位列表

- 认证：公开，无鉴权。
- 入参：无。
- 响应 200：

```json
{
  "code": 200,
  "msg": "ok",
  "traceId": "c8f1e101",
  "data": [
    {
      "tierCode": "TIER_500_100",
      "name": "醇香储值",
      "amountCent": 50000,
      "bonusCent": 10000,
      "totalCent": 60000,
      "note": "相当于 8.3 折",
      "hot": false,
      "campaignId": "RC202611",
      "available": true
    },
    {
      "tierCode": "TIER_1000_300",
      "name": "深焙储值",
      "amountCent": 100000,
      "bonusCent": 30000,
      "totalCent": 130000,
      "note": "相当于 7.7 折",
      "hot": true,
      "campaignId": "RC202611",
      "available": true
    }
  ]
}
```

### 3.2 `POST /app/recharges` 创建充值单

- 认证：必须（40101/40104/40105/40106）。
- Header：`Idempotency-Key: <uuid>`（必填，缺失/非法 → `40007`）。
- 请求体：

```json
{ "tierCode": "TIER_500_100", "payMode": "wechat" }
```

- `payMode` 第一切片固定 `wechat`；出现其它值 → `40003`（枚举非法）。
- 服务端动作：校验会员/档位 → 生成 `rechargeNo`（建议 `RC` + 14~20 位、与发号器同源）→ 向微信下单 → 返回拉起参数。
- 响应 200：

```json
{
  "code": 200,
  "msg": "ok",
  "traceId": "c8f1e102",
  "data": {
    "rechargeNo": "RC20261118000001",
    "tierCode": "TIER_500_100",
    "campaignId": "RC202611",
    "amountCent": 50000,
    "bonusCent": 10000,
    "totalCent": 60000,
    "payMode": "wechat",
    "status": "pending",
    "expireAt": "2026-11-18T00:20:00+08:00",
    "wx": {
      "prepayId": "wx201411101639507cbf6ffd8b07799511",
      "timeStamp": "1763398000",
      "nonceStr": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
      "package": "prepay_id=wx201411101639507cbf6ffd8b07799511",
      "signType": "RSA",
      "paySign": "oR9d8PuhnIc+YZ8cBHFCwfgpaK9gd7vaRvkYD7rthRAZ..."
    }
  }
}
```

- **幂等定稿**：同 `Idempotency-Key` + 同 payload 重复提交 → **HTTP 200 + 原充值单**（不新增单据、不使用 40925）；同 key 不同 payload → `40007`。
- 微信下单失败 → `40922`（HTTP 502）；渠道维护也归 `50301`（`50303` 预留，当前无接口触发）。

### 3.3 `GET /app/recharges/{rechargeNo}` 充值状态查询

- 认证：必须，且只能查本人。
- **「不存在 / 非本人」统一返回 `40407`**，防止充值单号枚举（不复用 40406）。
- 响应 200：

```json
{
  "code": 200,
  "msg": "ok",
  "traceId": "c8f1e103",
  "data": {
    "rechargeNo": "RC20261118000001",
    "tierCode": "TIER_500_100",
    "campaignId": "RC202611",
    "amountCent": 50000,
    "bonusCent": 10000,
    "totalCent": 60000,
    "payMode": "wechat",
    "status": "paid",
    "paidAt": "2026-11-18T00:12:31+08:00",
    "flowNo": "BF20261118000001",
    "balanceAfterCent": 61200,
    "giftBalanceAfterCent": 11200
  }
}
```

- `status` 枚举：`pending`（待支付）/ `paid`（已到账）/ `closed`（超时关闭）/ `failed`（支付失败）。
- `status=failed` 时额外返回 `failCode`（业务码，如 40922）与 `failMsg`（原因文案，≤128 字符）；其余状态两字段缺省（v1.4.0 契约）。
- 前端轮询建议 1s/2s/3s 退避，最多 60s；也可由「支付成功页」主动查一次。

### 3.4 微信支付回调（服务端内部，不进 /app 客户端契约）

- 路由（后端内部，不写入 OpenAPI 契约）：`POST /app/recharges/notify/wechat`（服务端对服务端，无会员 token，靠微信签名校验）。
- 验签 → 按 `rechargeNo` 幂等落账。
- 首次成功：写 `balance_cent` / `gift_balance_cent` / `recharge_total_cent` + 1 条账本流水，`status=paid`，触发等级重算，返回 HTTP 200。
- 重复回调：**HTTP 200 + `40926`**（幂等成功，与支付回调口径一致），不重复加钱。
- 本接口**不写入** `reference/cosen-api-v1.openapi.yaml`，避免客户端误用。

## 4. 金额与账本（`cosen_member_balance_flow`）

一笔充值到账只有**一次余额变动**，因此只写**一条**流水（账本约定「每次变动有且只有一条」）：

| 字段 | 取值 |
|---|---|
| `flow_no` | 发号器生成，响应 `flowNo` |
| `biz_type` | `RECHARGE` |
| `direction` | `1`（入账） |
| `amount_cent` | `amountCent + bonusCent`（本金+赠送，一次到账） |
| `balance_before_cent` / `balance_after_cent` | 变动前/后可用余额 |
| `related_type` | `RECHARGE` |
| `related_id` | `rechargeNo` |
| `idempotency_key` | `recharge:{rechargeNo}`（唯一索引 `uk_idem_key` 兜重复回调） |
| `remark` | `本金 50000 + 赠送 10000` |

会员表同步更新（同一事务）：

- `balance_cent += amountCent + bonusCent`；
- `gift_balance_cent += bonusCent`（其中赠送部分，仅展示/对账）；
- `recharge_total_cent += amountCent`（等级依据，只计本金不计赠送）；
- 乐观锁 `UPDATE ... SET version=version+1 WHERE id=? AND version=?`，失败退避重试，最终失败 → `40906` 并进对账告警；
- 落账成功后**触发等级重算**：`recharge_total_cent >= 200000` 且当前等级 < 深焙（`level=3`）时升级（只升不降），写一条 `ADJUST`/备注流水或审计日志（按实现）。

> 备选（未采纳）：本金/赠送拆两条流水（`RECHARGE` + `REWARD`）会破坏「一次余额变动一条流水」的对账口径；财务若要求分列再另行评审。

## 5. 幂等、并发与对账

- 创建：`Idempotency-Key` 唯一（`cosen_recharge_order.uk_idem_key`），同键同 payload 返回原单；同键不同 payload → `40007`；
- 回调：微信 `out_trade_no` = `rechargeNo`，以 `recharge:{rechargeNo}` 作为账本幂等键，先查 `status=paid` 直接返回 40926；
- 并发：账本写入与会员余额更新同事务；`uk_idem_key` 冲突视为已处理；
- 对账：每日对账「微信订单流水 vs `cosen_recharge_order` vs `cosen_member_balance_flow`」，不平 → `50002` 并告警；差额更正走人工 `ADJUST` 流水，不改原流水。

### 5.1 新增表 `cosen_recharge_order`（V3 DDL 已落地）

DDL：`cosen-schema/ddl/V3__cosen_recharge.sql`（oracle；macbook 隔离库已验证 V1+V2+V3 连跑幂等）。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint unsigned PK | 自增 |
| `recharge_no` | varchar(40) | 充值单号，`uk_recharge_no` |
| `member_id` | bigint unsigned | 会员 ID，`idx_member_time(member_id, create_time)` |
| `tier_code` | varchar(32) | 档位编码 |
| `campaign_id` | varchar(32) | 活动编码（环境配置） |
| `amount_cent` | bigint | 实充（分） |
| `bonus_cent` | bigint | 赠送（分） |
| `total_cent` | bigint | 到账合计（分） |
| `pay_mode` | varchar(16) | 第一切片固定 `wechat` |
| `status` | varchar(16) | `pending`/`paid`/`closed`/`failed`，`idx_status_time(status, create_time)` |
| `wx_prepay_id` | varchar(64) | 微信预支付 ID |
| `wx_transaction_id` | varchar(64) | 微信支付单号（回调写入） |
| `idempotency_key` | varchar(64) | 幂等键，`uk_idem_key` |
| `paid_at` | datetime | 到账时间 |
| `closed_at` | datetime | 关闭时间 |
| `flow_no` | varchar(40) | 对应账本流水号 |
| `create_time` / `update_time` | datetime | 审计时间 |

## 6. 错误码（复用 error-codes.md，仅新增 40407）

| HTTP | code | 场景 | 触发接口 |
|---|---|---|---|
| 400 | 40001 | 缺少必填参数（`tierCode`） | 创建 |
| 400 | 40002 | 参数格式错误（JSON/字段类型） | 创建 |
| 400 | 40003 | 枚举非法（`payMode` 非 wechat） | 创建 |
| 400 | 40007 | 幂等键缺失或非法 | 创建 |
| 400 | 40904 | 充值金额或档位不合法 | 创建 |
| 401 | 40101/40104/40105/40106 | token 缺失/过期/类型错/已注销 | 创建、查询 |
| 404 | 40406 | 充值档位或活动不存在 | 创建 |
| 404 | **40407（新增）** | 充值单不存在或非本人 | 查询 |
| 409 | 40901 | 会员被停用 | 创建、查询 |
| 409 | 40905 | 充值活动已结束或不可用 | 创建 |
| 409 | 40906 | 储值入账失败（并发或乐观锁） | **仅微信回调内部使用**（回调不进 /app 客户端契约）；客户端通过查询 `status=failed` + `failCode/failMsg` 感知 |
| 502 | 40922 | 微信支付下单或回调验签失败 | 创建、回调 |
| 200 | 40926 | 重复支付回调（幂等成功，不算错误） | 回调 |
| 429 | 42904 | 通用接口限流（充值创建可配置） | 创建 |
| 500 | 50001 | 服务器内部错误 | 全部 |
| 500 | 50002 | 数据一致性错误（账本不平，需告警） | 创建、对账 |
| 503 | 50301 | 微信服务不可用 | 创建、回调 |
| 503 | 50302 | Redis/MySQL 不可用 | 全部 |

> 充值接口**仅新增 40407**，其余全部复用现网错误码；40407 已写入 `docs/error-codes.md` §3.4 与 §5.5。
> `40906` 仅回调内部使用（v1.4.0 已从客户端契约移除）；`50303`（支付渠道维护中）预留、无挂点，充值渠道维护归 `50301`。

## 7. 与 Base 的边界

- Base 4 张表（分类/商品/订单/券）均无充值、储值、账本字段；`mapping.yaml` 的 `not_in_base` 已列 `cosen_member`、`cosen_member_balance_flow`、`cosen_order_item`；
- **档位/活动配置先放环境配置 `cosen.recharge.tiers`**，运营改配置需发版；远期若需运营自助维护，再评估 Base 第 5 张表（「5_储值档位」），届时补 mapping，不属于本次变更；
- 充值成功后**不同步 Base**；运营视角的充值数据走管理后台/RuoYi 报表，不反写 Base。

## 8. 评审定稿决策（2026-11-18）

| # | 问题 | 定稿结论 |
|---|---|---|
| 1 | 充值单是否独立建表 | **独立表 `cosen_recharge_order`**，不复用 `cosen_order`（V3 DDL） |
| 2 | 非本人充值单错误码 | **新增 `40407`**（充值单不存在或非本人），不复用 40406 |
| 3 | 重复创建返回码 | **HTTP 200 + 原充值单**，不用 40925 |
| 4 | 等级自动升级 | **触发重算**：累计实充只计本金，满 2000 元 → 深焙（`level=3`），只升不降 |
| 5 | 第一切片是否支持退款 | **不做**退款；后续如需另立需求并扩展 40923 语义 |
| 6 | 档位/活动配置来源 | **先环境配置 `cosen.recharge.tiers`**；远期再考虑 Base 第 5 张表 |
| 7 | 微信回调是否进 `/app` 契约 | **不进**；仅本文件描述后端内部路由与幂等口径 |

## 9. 落地顺序

1. 契约：v1.3.0 新增 3 个 operation（`listRechargeTiers` / `createRecharge` / `getRechargeByNo`）、`RechargeTier`/`RechargeOrder`/`WxPayParams` 三个 schema、`rechargeNotFound`(40407) 等示例（**本次已提交**）；
2. DDL：V3 `cosen_recharge_order`（**本次已提交**，oracle 侧，隔离库验收）；
3. 错误码文档：§3.4 补 40407、§5.5 充值收口（**本次已提交**）；
4. 后端：`CosenRechargeService`（下单/回调/查询/等级重算），复用 `CosenErrorCode` 与幂等键组件；
5. 前端：`src/pages/recharge` 从 mock 切到 `/app/recharge/**`，补支付结果轮询；
6. Apifox：新增 3 接口与错误示例（40001/40002/40003/40007/40904/40905/40906/40406/40407/42904/50002/50301）；
7. 验收：500+100 / 1000+300 到账一致；重复回调只加一次钱；账本余额对账 0 差异；累计实充满 2000 自动升级深焙。
