# 小程序 CI（预览二维码 / 上传开发版）

## 前置

任选一条通道：

**A. 微信开发者工具（推荐，本机已装）**
1. 打开「微信开发者工具」并用管理员微信扫码登录；
2. 「设置 → 安全设置」勾选 **服务端口**；
3. 本机路径默认 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`（可用 `MP_DEVTOOLS_CLI` 覆盖）。

**B. miniprogram-ci（无界面/服务器）**
1. 小程序后台「开发管理 → 开发设置 → 小程序代码上传」生成密钥，下载 `private.<appid>.key`；
2. 配 IP 白名单；导出环境变量：`MP_APPID=wxed1bd110520d4cfc`、`MP_PRIVATE_KEY_PATH=/path/private.key`；
3. `npm i -D miniprogram-ci`。

## 用法

```bash
node tools/mp-ci/mp-ci.mjs preview            # 构建 + 生成预览二维码 → dist/mp-preview-qr.png
node tools/mp-ci/mp-ci.mjs upload -v 0.1.0 -d "首版联调"
node tools/mp-ci/mp-ci.mjs preview --no-build # 复用已有构建
```

产物：`dist/mp-preview-qr.png`（预览码，微信扫码打开体验版/开发版）、`dist/mp-preview-info.json`。

## 说明

- 构建命令：`npm run build:mp-weixin`（uni-app）→ `dist/build/mp-weixin`；
- `upload` 上传后成为「开发版」，需在小程序后台「版本管理」里设为体验版才能被非开发者扫码；
- 二维码有时效（预览码约 25 分钟），过期重跑即可。
