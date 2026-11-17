# 充值接口契约草案（v0.1 · 待评审）

> 状态：**草案，未进契约 yaml**。评审通过后再按「一个 commit 只做一件事」并入 `reference/cosen-api-v1.openapi.yaml`（计划 v1.3.0）。
> 依据：第一切片范围确认（充值纳入）、前端 mock `src/mock/seed.ts` 的 `RECHARGE_TIERS`、DDL `cosen_member_balance_flow` / `cosen_member`、错误码规范 `docs/error-codes.md` v1.0.0。
> 关联红线：充值**只增加储值余额**，不产生兑换码、不产生券；券仍无兑换码字段与兑换接口。

## 1. 范围与边界

| 项 | 结论 |
|---|---|
| 纳入范围 | 小程序「会员储值」页：档位展示、创建充值单、支付状态查询 |
| 支付渠道 | 仅微信支付（第一切片）；储值余额不能用于充值自身 |
| 金额单位 | 一律 `bigint` **分**（`amountCent` / `bonusCent` / `totalCent`），前端展示时 ÷100 |
| 幂等 | 创建充值单必带 `Idempotency-Key`；微信回调按幂等成功返回 |
| Base 边界 | Base 4 张表**没有充值表**，`bitable/mapping.yaml` 的 `not_in_base` 已列 `cosen_member_balance_flow`；充值/账本为**系统主**（system），不同步 Base |
| 等级联动 | 累计实充（`cosen_member.recharge_total_cent`）达 2000 元升级深焙会员（现有前端文案）；是否在充值成功时同步重算等级，见 §8 待评审 |

## 2. 档位定义（真源：前端 mock）

前端 `src/mock/seed.ts`：

```ts
export const RECHARGE_TIERS = [
  { amount: 500,  bonus: 100, name: '醇香储值', note: '相当于 8.3 折' },
  { amount: 1000, bonus: 300, name: '深焙储值', note: '相当于 7.7 折', hot: true }
]
```

契约为服务端下发，前端只渲染，不硬编码：

| tierCode | 档位名 | 实充（分） | 赠送（分） | 到账（分） | 备注 |
|---|---|---|---|---|---|
| `TIER_500_100` | 醇香储值 | 50000 | 10000 | 60000 | 相当于 8.3 折 |
| `TIER_1000_300` | 深焙储值 | 100000 | 30000 | 130000 | 相当于 7.7 折，推荐（hot） |

- 档位需可配置（活动价、上下线），因此接口返回 `available` 与 `campaignId`；
- 档位不存在或已下架 → `40406`；档位金额/赠送不合法 → `40904`；活动已结束 → `40905`。

## 3. 建议接口（3 个客户端接口 + 1 个服务端回调）

统一响应信封沿用 `/app/**`：`{ code, msg, data, traceId }`；错误码语义见 §6。

### 3.1 `GET /app/recharge/tiers` 档位列表

- 认证：可选（未登录也可看档位；建议公开，避免登录前无法展示营销信息）。
- 入参：无。
- 响应 200：

```json
{
  "code": 200,
  "msg": "ok",
  "traceId": "c8f1e001",
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
- 服务端动作：校验会员/档位 → 生成 `rechargeNo`（建议 `RC` + 16 位、或与 `flow_no` 同发号器）→ 向微信下单 → 返回拉起参数。
- 响应 200：

```json
{
  "code": 200,
  "msg": "ok",
  "traceId": "c8f1e002",
  "data": {
    "rechargeNo": "RC20261118000001",
    "tierCode": "TIER_500_100",
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

- 幂等语义：同 `Idempotency-Key` + 同 payload 重复提交 → **HTTP 200 + 原充值单**（不新增单据，不回 `code 40925`，充值沿用 40925 语义但**建议**明确定义：重复创建返回同一 `rechargeNo`，`code` 仍 200）；同 key 不同 payload → `40007`。
- 微信下单失败 → `40922`（HTTP 502）；渠道维护 → `50303`（如需）。

### 3.3 `GET /app/recharges/{rechargeNo}` 充值状态查询

- 认证：必须，且只能查本人（非本人按「不存在」处理，防枚举 → `40406`? 见 §8 待评审，建议新增 40407 或复用 40406 语义前先评审）。
- 响应 200：

```json
{
  "code": 200,
  "msg": "ok",
  "traceId": "c8f1e003",
  "data": {
    "rechargeNo": "RC20261118000001",
    "status": "paid",
    "amountCent": 50000,
    "bonusCent": 10000,
    "totalCent": 60000,
    "paidAt": "2026-11-18T00:12:31+08:00",
    "flowNo": "BF20261118000001",
    "balanceAfterCent": 61200,
    "giftBalanceAfterCent": 11200
  }
}
```

- `status` 枚举：`pending`（待支付）/ `paid`（已到账）/ `closed`（超时关闭）/ `failed`（支付失败）。
- 前端轮询建议 1s/2s/3s 退避，最多 60s；也可由「支付成功页」主动查一次。

### 3.4 微信支付回调（服务端内部，不计入 /app 客户端接口）

- `POST /app/recharges/notify/wechat`：验签 → 按 `rechargeNo` 幂等落账。
- 首次成功：写 `balance_cent` / `gift_balance_cent` / `recharge_total_cent` + 1 条账本流水，`status=paid`，返回 HTTP 200。
- 重复回调：**HTTP 200 + `40926`**（幂等成功，与支付回调口径一致），不重复加钱。

## 4. 金额与账本（`cosen_member_balance_flow`）

一筆充值到账只有**一次余额变动**，因此只写**一条**流水（账本约定「每次变动有且只有一条」）：

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

会员表同步更新：

- `balance_cent += amountCent + bonusCent`；
- `gift_balance_cent += bonusCent`（其中赠送部分，仅展示/对账）；
- `recharge_total_cent += amountCent`（等级依据，只计本金不计赠送）；
- 建议 `version` 乐观锁 + `UPDATE ... SET version=version+1 WHERE id=? AND version=?`，失败退避重试，最终失败 → `40906` 并进对账告警。

> 备选：本金/赠送拆两条流水（`RECHARGE` + `REWARD`），但会破坏「一次余额变动一条流水」的对账口径；除非财务要求分列，默认不拆。

## 5. 幂等、并发与对账

- 创建：`Idempotency-Key` 唯一（Redis 或 `cosen_recharge_order` 唯一索引），24h 内同键同 payload 返回原单；
- 回调：微信 `out_trade_no` = `rechargeNo`，以 `recharge:{rechargeNo}` 作为账本幂等键，先查 `status=paid` 直接返回 40926；
- 并发：账本写入与会员余额更新同事务；`uk_idem_key` 冲突视为已处理；
- 对账：每日对账「微信订单流水 vs `cosen_recharge_order` vs `cosen_member_balance_flow`」，不平 → `50002` 并告警；差额更正走人工 `ADJUST` 流水，不改原流水。

### 5.1 建议新增表（草案，评审后再进 V3 DDL）

`cosen_recharge_order`：`id, recharge_no(uk), member_id, tier_code, campaign_id, amount_cent, bonus_cent, total_cent, pay_mode, status, wx_prepay_id, wx_transaction_id, idempotency_key(uk), paid_at, closed_at, flow_no, create_time, update_time`。

> 本草案不落 DDL；是否建表、字段与索引在评审时一并定。

## 6. 错误码（复用 error-codes.md v1.0.0，不新增语义）

| HTTP | code | 场景 | 触发接口 |
|---|---|---|---|
| 400 | 40001 | 缺少必填参数（`tierCode`） | 创建 |
| 400 | 40002 | 参数格式错误（JSON/字段类型） | 创建 |
| 400 | 40003 | 枚举非法（`payMode` 非 wechat） | 创建 |
| 400 | 40007 | 幂等键缺失或非法 | 创建 |
| 400 | 40904 | 充值金额或档位不合法 | 创建 |
| 401 | 40101/40104/40105/40106 | token 缺失/过期/类型错/已注销 | 创建、查询 |
| 404 | 40406 | 充值档位或活动不存在 | 创建、档位列表（活动态） |
| 409 | 40901 | 会员被停用 | 创建、查询 |
| 409 | 40905 | 充值活动已结束或不可用 | 创建 |
| 409 | 40906 | 储值扣减/加账失败（并发或乐观锁） | 回调落账（内部） |
| 502 | 40922 | 微信支付下单或回调验签失败 | 创建、回调 |
| 200 | 40926 | 重复支付回调（幂等成功，不算错误） | 回调 |
| 429 | 42904 | 通用接口限流（充值创建可配置） | 创建 |
| 500 | 50001 | 服务器内部错误 | 全部 |
| 500 | 50002 | 数据一致性错误（账本不平，需告警） | 回调落账、对账 |
| 503 | 50301 | 微信服务不可用 | 创建、回调 |
| 503 | 50302 | Redis/MySQL 不可用 | 全部 |

> 本草案**不新增错误码**。若评审要求「非本人充值单」独立语义，建议新增 `40407`（充值单不存在或非本人），避免用 40406（档位/活动）表达两种含义。

## 7. 与 Base 的边界

- Base 4 张表（分类/商品/订单/券）均无充值、储值、账本字段；`mapping.yaml` 的 `not_in_base` 已列 `cosen_member`、`cosen_member_balance_flow`、`cosen_order_item`；
- 充值档位若将来要运营在 Base 配，需**新增 Base 表**（如「5_储值档位」）并补 mapping，属于独立变更，不在本草案；
- 充值成功后**不同步 Base**；若运营需要看充值数据，走管理后台/RuoYi 报表，不反写 Base。

## 8. 待评审问题

1. 充值单是否建独立表 `cosen_recharge_order`，还是复用 `cosen_order`（建议独立表，order 语义是点单）；
2. 「非本人充值单」错误码：复用 40406 还是新增 40407；
3. 重复创建同 `Idempotency-Key` 返回同一单据时 `code` 用 200 还是 40925（建议 200，充值单不是订单重复下单）；
4. 充值成功是否触发会员等级自动升级（累计实充满 2000 → 深焙）；若触发，需定义升级流水/通知；
5. 是否需要充值退款（第一切片建议不做；如需，新增退款状态与 40923 语义扩展）；
6. 档位活动（`campaignId`）的配置来源：环境配置 / RuoYi 表 / Base 新表；
7. 微信回调路由归属：`/app/**` 契约文档是否收录服务端回调，还是只在后端设计文档中描述。

## 9. 落地顺序（评审通过后）

1. 契约：新增 3 个 operation + 2~3 个 schema（RechargeTier / RechargeOrder / WxPayParams），版本 v1.3.0；
2. DDL：V3 新增 `cosen_recharge_order`；
3. 后端：RuoYi 新增 `CosenRechargeService`（下单/回调/查询），复用 `CosenErrorCode` 与幂等键组件；
4. 前端：`src/pages/recharge` 从 mock 切到 `/app/recharge/**`，支付结果轮询；
5. Apifox：新增 3 接口与错误示例（40001/40002/40003/40007/40904/40905/40922/40926/50002/50301）；
6. 验收：mock 档位 500+100 / 1000+300 到账一致；重复回调只加一次钱；账本与余额对账为 0 差异。
