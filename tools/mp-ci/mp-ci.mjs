#!/usr/bin/env node
/**
 * 小程序 CI 工具：构建 → 上传开发版 / 生成预览二维码
 *
 * 用法：
 *   node tools/mp-ci/mp-ci.mjs preview              # 构建 + 预览二维码
 *   node tools/mp-ci/mp-ci.mjs upload -v 0.1.0 -d "描述"
 *   node tools/mp-ci/mp-ci.mjs preview --no-build    # 复用已有 dist
 *
 * 实现优先级：
 *   1) 微信开发者工具 CLI（本机已登录即可，无需上传密钥）
 *   2) miniprogram-ci（需要 MP_PRIVATE_KEY_PATH 指向上传密钥 + 后台 IP 白名单）
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const PROJECT = resolve(ROOT, 'dist/build/mp-weixin')
const OUT_DIR = resolve(ROOT, 'dist')
const DEVTOOLS_CLI = process.env.MP_DEVTOOLS_CLI || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

const argv = process.argv.slice(2)
const mode = argv[0]
const flag = (name, short) => {
  const i = argv.findIndex((a) => a === name || (short && a === short))
  return i >= 0 ? argv[i + 1] : undefined
}
const has = (name) => argv.includes(name)

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} 退出码 ${r.status}`)
}

function build() {
  console.log('▶ 构建 mp-weixin …')
  sh('npm', ['run', 'build:mp-weixin'])
}

function appidOf() {
  const p = resolve(PROJECT, 'project.config.json')
  if (!existsSync(p)) return ''
  try {
    return JSON.parse(readFileSync(p, 'utf8')).appid || ''
  } catch {
    return ''
  }
}

function assertArtifact(file, what) {
  // 微信开发者工具 CLI 在「需要重新登录」等失败场景下退出码仍为 0，
  // 只能靠产物是否真实存在且非空来判断成功。
  if (!existsSync(file) || statSync(file).size === 0) {
    throw new Error(`${what} 未生成（CLI 可能未登录或失败）：${file}`)
  }
}

function ensureProjectOpen() {
  try {
    spawnSync(DEVTOOLS_CLI, ['open', '--project', PROJECT, '--lang', 'zh'], { stdio: 'ignore' })
  } catch {
    /* open 失败不致命，后续命令会给出真实错误 */
  }
}

function runDevtools() {
  if (!existsSync(DEVTOOLS_CLI)) return false
  mkdirSync(OUT_DIR, { recursive: true })
  ensureProjectOpen()
  const qr = resolve(OUT_DIR, 'mp-preview-qr.png')
  const info = resolve(OUT_DIR, 'mp-preview-info.json')
  try {
    if (mode === 'login') {
      const loginQr = resolve(OUT_DIR, 'mp-login-qr.png')
      console.log('▶ 生成开发者工具登录二维码（等待扫码，最长几分钟）…')
      sh(DEVTOOLS_CLI, ['login', '--qr-format', 'image', '--qr-output', loginQr,
                        '--result-output', resolve(OUT_DIR, 'mp-login-result.json'), '--lang', 'zh'])
      assertArtifact(loginQr, '登录二维码')
      console.log(`✅ 登录二维码：${loginQr}（用管理员微信扫码完成登录）`)
      return true
    }
    if (mode === 'preview') {
      console.log('▶ 通过微信开发者工具生成预览二维码 …')
      sh(DEVTOOLS_CLI, ['preview', '--project', PROJECT, '--qr-format', 'image', '--qr-output', qr, '--info-output', info, '--lang', 'zh'])
      assertArtifact(qr, '预览二维码')
      console.log(`✅ 预览二维码：${qr}`)
      return true
    }
    const version = flag('-v', '--version') || '0.0.1'
    const desc = flag('-d', '--desc') || `CI 上传 ${new Date().toISOString()}`
    console.log(`▶ 通过微信开发者工具上传开发版 v${version} …`)
    const upInfo = resolve(OUT_DIR, 'mp-upload-info.json')
    sh(DEVTOOLS_CLI, ['upload', '--project', PROJECT, '-v', version, '-d', desc, '--info-output', upInfo, '--lang', 'zh'])
    assertArtifact(upInfo, '上传结果 info')
    const infoText = readFileSync(upInfo, 'utf8')
    if (/"error"\s*:\s*\{/.test(infoText) || /需要重新登录/.test(infoText)) {
      throw new Error('上传返回错误（见 info-output）')
    }
    console.log(`✅ 已上传开发版 v${version}（${desc}）`)
    return true
  } catch (e) {
    console.warn(`⚠ 开发者工具 CLI 失败：${e.message}`)
    console.warn('  常见原因：未登录开发者工具 / 未在「设置→安全设置」开启服务端口 / 工具版本过旧')
    return false
  }
}

function runMiniprogramCi() {
  const keyPath = process.env.MP_PRIVATE_KEY_PATH
  const appid = process.env.MP_APPID || appidOf()
  if (!keyPath || !existsSync(keyPath) || !appid) return false
  const script = `
import ci from 'miniprogram-ci'
const project = new ci.Project({ appid: '${appid}', type: 'miniProgram', projectPath: '${PROJECT}', privateKeyPath: '${keyPath}' })
`
  console.log('▶ 通过 miniprogram-ci …')
  try {
    if (mode === 'preview') {
      execFileSync('node', ['--input-type=module', '-e', script + `
const r = await ci.preview({ project, desc: 'CI preview', setting: { es6: true, minify: true }, qrcodeFormat: 'image', qrcodeOutputDest: '${resolve(OUT_DIR, 'mp-preview-qr.png')}' })
console.log('✅ 预览二维码已生成')
`], { stdio: 'inherit', cwd: ROOT })
    } else {
      const version = flag('-v', '--version') || '0.0.1'
      const desc = flag('-d', '--desc') || 'CI upload'
      execFileSync('node', ['--input-type=module', '-e', script + `
await ci.upload({ project, version: '${version}', desc: '${desc}', setting: { es6: true, minify: true } })
console.log('✅ 已上传')
`], { stdio: 'inherit', cwd: ROOT })
    }
    return true
  } catch (e) {
    console.warn(`⚠ miniprogram-ci 失败：${e.message}`)
    return false
  }
}

if (!['preview', 'upload', 'login'].includes(mode)) {
  console.error('用法：node tools/mp-ci/mp-ci.mjs <preview|upload|login> [-v 版本] [-d 描述] [--no-build]')
  process.exit(2)
}
if (mode === 'login') {
  const ok = runDevtools()
  process.exit(ok ? 0 : 1)
}
if (!has('--no-build')) build()
if (!existsSync(PROJECT)) {
  console.error(`✗ 构建产物不存在：${PROJECT}`)
  process.exit(1)
}
console.log(`▶ 项目：${PROJECT}｜appid：${appidOf() || '(未配置)'}`)
const ok = runDevtools() || runMiniprogramCi()
if (!ok) {
  console.error('✗ 两条通道都不可用。请二选一：')
  console.error('  A. 打开微信开发者工具并登录，且「设置→安全设置」开启服务端口')
  console.error('  B. 后台「开发管理→开发设置→小程序代码上传」生成密钥，导出 MP_PRIVATE_KEY_PATH 并配置 IP 白名单')
  process.exit(1)
}
